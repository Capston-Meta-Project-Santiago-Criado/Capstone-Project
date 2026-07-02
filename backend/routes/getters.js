const prisma = require("../lib/prisma");

const express = require("express");
const app = express();
app.use(express.json());
const router = express.Router({ mergeParams: true });
require("dotenv").config();

const { isMarketOpen, lastMarketClose, dailyChangePct } = require("../lib/utils");

const finnhub = require("finnhub");
const finnhubClient = new finnhub.DefaultApi(process.env.finnhubKey);

const POLYGON_KEY = process.env.POLYGON_KEY;
const QUOTE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes during market hours
const quoteCache = new Map(); // ticker -> { data, fetchedAt }

// A DB price is current when it was captured at/after the most recent market
// close — anything older is a previous session's quote and must be refreshed.
const isDbPriceCurrent = (company) =>
  company?.daily_price > 0 &&
  company.lastUpdate &&
  new Date(company.lastUpdate) >= lastMarketClose();

const dbRowToQuote = (company) => {
  const prevClose = company.daily_price_change !== 0
    ? company.daily_price / (1 + company.daily_price_change / 100)
    : company.daily_price;
  return {
    symbol: company.ticker,
    regularMarketPrice: company.daily_price,
    regularMarketPreviousClose: parseFloat(prevClose.toFixed(4)),
    averageAnalystRating: null,
  };
};

// Fetch snapshots for multiple tickers in one Polygon API call
const fetchPolygonSnapshots = async (tickers) => {
  const joined = tickers.join(",");
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${joined}&apiKey=${POLYGON_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.warn(`Polygon snapshots: HTTP ${resp.status} — ${text.slice(0, 120)}`);
    return {};
  }
  const json = await resp.json();
  if (!Array.isArray(json.tickers)) return {};
  return Object.fromEntries(
    json.tickers.map((t) => [
      t.ticker,
      {
        symbol: t.ticker,
        regularMarketPrice: t.day?.c ?? t.lastTrade?.p ?? 0,
        regularMarketPreviousClose: t.prevDay?.c ?? 0,
        todaysChangePerc: t.todaysChangePerc ?? 0,
        averageAnalystRating: null,
      },
    ])
  );
};

const getPolygonQuote = async (ticker) => {
  const cached = quoteCache.get(ticker);
  if (cached && (!isMarketOpen() || Date.now() - cached.fetchedAt < QUOTE_CACHE_TTL)) {
    return cached.data;
  }
  try {
    const snapshots = await fetchPolygonSnapshots([ticker]);
    const result = snapshots[ticker] ?? { symbol: ticker, regularMarketPrice: 0, regularMarketPreviousClose: 0 };
    quoteCache.set(ticker, { data: result, fetchedAt: Date.now() });
    return result;
  } catch {
    return { symbol: ticker, regularMarketPrice: 0, regularMarketPreviousClose: 0 };
  }
};

const { updateAllCompanies } = require("../populators/tickers");

//constants
const QUERY_AMOUNT = 3; // number of companies to show in search results

router.get("/search/:query", async (req, res) => {
  const query = req.params.query;
  const searchResults = await prisma.company.findMany({
    where: {
      OR: [
        {
          name: { contains: query, mode: "insensitive" },
        },
        {
          ticker: { contains: query, mode: "insensitive" },
        },
      ],
    },
    orderBy: { id: "asc" },
    take: QUERY_AMOUNT,
  });
  if (searchResults.length < 3) {
    const portfolioResults = await prisma.portfolio.findMany({
      where: {
        isPublic: true,
        OR: [
          {
            name: { contains: query, mode: "insensitive" },
          },
          {
            user: {
              username: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      take: 3,
    });
    for (let result of portfolioResults) {
      if (searchResults.length < 3) {
        searchResults.push(result);
      }
    }
  }
  res.json(searchResults);
});

router.get("/checker/:companyTick", async (req, res) => {
  const ticker = req.params.companyTick;
  const companyInfo = await prisma.company.findFirst({
    where: {
      ticker,
    },
  });
  res.json(companyInfo);
});

// get many companies info!
router.get("/manycompanies", async (req, res) => {
  try {
    const raw = req.query.tickers ?? req.query["tickers[]"];
    if (!raw) return res.json([]);
    const tickerArr = Array.isArray(raw) ? raw : [raw];

    const companies = await prisma.company.findMany({
      where: { ticker: { in: tickerArr } },
    });
    const byTicker = Object.fromEntries(companies.map((c) => [c.ticker, c]));

    // When markets are closed serve from DB — skip Polygon if every price
    // was captured at/after the latest close
    if (!isMarketOpen()) {
      const prices = tickerArr.map((ticker) => {
        const c = byTicker[ticker];
        return isDbPriceCurrent(c) ? dbRowToQuote(c) : null;
      });
      if (prices.every(Boolean)) return res.json(prices);
    }

    // Markets open (or DB stale): batch Polygon call for all tickers at once
    const snapshots = await fetchPolygonSnapshots(tickerArr);
    const prices = tickerArr.map((ticker) => {
      let result = snapshots[ticker];
      if (!result || !(result.regularMarketPrice > 0)) {
        // Polygon had nothing — a stale DB price beats showing 0.00
        const c = byTicker[ticker];
        result = c?.daily_price > 0
          ? dbRowToQuote(c)
          : { symbol: ticker, regularMarketPrice: 0, regularMarketPreviousClose: 0 };
      }
      quoteCache.set(ticker, { data: result, fetchedAt: Date.now() });
      return result;
    });
    // Write back to DB so the next request (or after restart) skips Polygon.
    // Only genuine Polygon results — DB fallbacks must keep their old lastUpdate.
    Promise.all(
      Object.values(snapshots)
        .filter((p) => p.regularMarketPrice > 0)
        .map((p) =>
          prisma.company.updateMany({
            where: { ticker: p.symbol },
            data: { daily_price: p.regularMarketPrice, daily_price_change: dailyChangePct(p.regularMarketPrice, p.regularMarketPreviousClose), lastUpdate: new Date() },
          })
        )
    ).catch(() => {});
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get stock data for a single company
// Priority: 1) fresh DB cache  2) live Yahoo Finance  3) stale DB cache  4) zeros
const DB_PRICE_TTL = 90 * 60 * 1000; // 90 minutes, matching updateAllCompanies cycle
router.get("/stats/:companyTick", async (req, res) => {
  try {
    const ticker = req.params.companyTick.toUpperCase();

    const company = await prisma.company.findFirst({ where: { ticker } });

    // Fresh DB cache — use it without hitting any external API.
    // Market open: fresh means updated within the last 90 minutes.
    // Market closed: fresh means captured at/after the most recent close.
    if (company && company.daily_price > 0 && company.lastUpdate) {
      const age = Date.now() - new Date(company.lastUpdate).getTime();
      const isFresh = isMarketOpen() ? age < DB_PRICE_TTL : isDbPriceCurrent(company);
      if (isFresh) {
        return res.status(200).json(dbRowToQuote(company));
      }
    }

    // DB is missing or stale — fetch live from Polygon and write back to DB
    const live = await getPolygonQuote(ticker);
    if (live.regularMarketPrice > 0) {
      prisma.company.updateMany({
        where: { ticker },
        data: {
          daily_price: live.regularMarketPrice,
          daily_price_change: dailyChangePct(live.regularMarketPrice, live.regularMarketPreviousClose),
          lastUpdate: new Date(),
        },
      }).catch(() => {});
      return res.status(200).json(live);
    }

    // Fall back to stale DB data rather than returning nothing
    if (company && company.daily_price > 0) {
      return res.status(200).json(dbRowToQuote(company));
    }

    // Nothing available
    res.status(200).json({ symbol: ticker, regularMarketPrice: 0, regularMarketPreviousClose: 0, averageAnalystRating: null });
  } catch (err) {
    res.status(200).json({ symbol: req.params.companyTick, regularMarketPrice: 0, regularMarketPreviousClose: 0, averageAnalystRating: null });
  }
});

// getting companies by ID!
router.get("/companyById/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  res.json(
    await prisma.company.findUnique({
      where: {
        id,
      },
      include: {
        industry: {
          select: {
            name: true,
            sector: { select: { name: true } },
          },
        },
      },
    }),
  );
});

// get company documents ID!
router.get("/documents/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  res.json(
    await prisma.document.findMany({
      where: {
        companyId: id,
      },
      orderBy: {
        filed_date: "desc",
      },
    }),
  );
});

// get company news data!
const finnhubCompanyNews = (ticker, from, to) =>
  new Promise((resolve, reject) =>
    finnhubClient.companyNews(ticker, from, to, (err, data) => (err ? reject(err) : resolve(data ?? [])))
  );

router.get("/news/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Return cached articles if they were refreshed within the last 5 hours
    let currentArticles = await prisma.article.findMany({
      where: { companyId: id },
      orderBy: [{ publishDate: "desc" }, { created_at: "desc" }],
      take: 12,
    });
    if (currentArticles.length > 0) {
      const newestCacheTime = Math.max(...currentArticles.map((a) => new Date(a.created_at).getTime()));
      if (Date.now() - newestCacheTime < 5 * 60 * 60 * 1000) {
        return res.status(200).json(currentArticles);
      }
    }

    // Fetch from Finnhub (last 90 days)
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    let articles;
    try {
      articles = await finnhubCompanyNews(company.ticker, from, to);
    } catch (err) {
      if (currentArticles.length > 0) return res.status(200).json(currentArticles);
      return res.status(502).json({ error: err.message || "Could not fetch news" });
    }

    // Upsert in parallel — Prisma queues these on the shared pool
    await Promise.all(
      articles
        .filter((article) => article.url && article.headline)
        .map((article) => {
          const fields = {
            source: article.source ?? "",
            title: article.headline,
            summary: article.summary ?? "",
            publishDate: article.datetime ? new Date(article.datetime * 1000) : new Date(),
            language: "en",
            images: article.image ? [article.image] : [],
            companyId: id,
          };
          return prisma.article.upsert({
            where: { link: article.url },
            update: fields,
            create: { link: article.url, ...fields },
          });
        })
    );

    currentArticles = await prisma.article.findMany({
      where: { companyId: id },
      orderBy: [{ publishDate: "desc" }, { created_at: "desc" }],
      take: 12,
    });
    res.status(200).json(currentArticles);
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not load news" });
  }
});
// get company logo from Finnhub profile
router.get("/logo/:ticker", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const profile = await new Promise((resolve, reject) => {
      finnhubClient.companyProfile2({ symbol: ticker }, (error, data) => {
        if (error) return reject(error);
        resolve(data);
      });
    });
    res.json({ logo: profile.logo || null });
  } catch {
    res.json({ logo: null });
  }
});

module.exports = router;
