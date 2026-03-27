const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const express = require("express");
const app = express();
app.use(express.json());
const router = express.Router({ mergeParams: true });
require("dotenv").config();

const { isMarketOpen } = require("../lib/utils");
const fetch = require("node-fetch");

const POLYGON_KEY = process.env.POLYGON_KEY;
const QUOTE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes during market hours
const quoteCache = new Map(); // ticker -> { data, fetchedAt }

// Fetch snapshots for multiple tickers in one Polygon API call
const fetchPolygonSnapshots = async (tickers) => {
  const joined = tickers.join(",");
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${joined}&apiKey=${POLYGON_KEY}`;
  const resp = await fetch(url);
  const json = await resp.json();
  if (!Array.isArray(json.tickers)) return {};
  return Object.fromEntries(
    json.tickers.map((t) => [
      t.ticker,
      {
        symbol: t.ticker,
        regularMarketPrice: t.day?.c ?? t.lastTrade?.p ?? 0,
        regularMarketPreviousClose: t.prevDay?.c ?? 0,
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

const { FinlightApi } = require("finlight-client");
const newsApiToken = process.env.news;
const client = new FinlightApi({ apiKey: newsApiToken });
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
        OR: [
          {
            name: { contains: query, mode: "insensitive" },
            isPublic: true,
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

    // When markets are closed serve from DB — no point hitting Yahoo Finance
    if (!isMarketOpen()) {
      const companies = await prisma.company.findMany({
        where: { ticker: { in: tickerArr } },
      });
      const byTicker = Object.fromEntries(companies.map((c) => [c.ticker, c]));
      const prices = tickerArr.map((ticker) => {
        const c = byTicker[ticker];
        if (c && c.daily_price > 0) {
          const prevClose = c.daily_price_change !== 0
            ? c.daily_price / (1 + c.daily_price_change / 100)
            : c.daily_price;
          return {
            symbol: ticker,
            regularMarketPrice: c.daily_price,
            regularMarketPreviousClose: parseFloat(prevClose.toFixed(4)),
            averageAnalystRating: null,
          };
        }
        // DB has no price — fall through to Yahoo below
        return null;
      });

      // If all tickers resolved from DB, return immediately
      if (prices.every(Boolean)) return res.json(prices);
    }

    // Markets open (or DB missing data): fetch all quotes concurrently
    // Batch snapshot: one Polygon call for all tickers at once
    const snapshots = await fetchPolygonSnapshots(tickerArr);
    const prices = tickerArr.map((ticker) => {
      const result = snapshots[ticker] ?? { symbol: ticker, regularMarketPrice: 0, regularMarketPreviousClose: 0 };
      quoteCache.set(ticker, { data: result, fetchedAt: Date.now() });
      return result;
    });
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

    // Fresh DB cache — use it without hitting any external API
    // When markets are closed, DB price is always valid (prices won't change)
    if (company && company.daily_price > 0 && company.lastUpdate) {
      const age = Date.now() - new Date(company.lastUpdate).getTime();
      if (!isMarketOpen() || age < DB_PRICE_TTL) {
        const prevClose = company.daily_price_change !== 0
          ? company.daily_price / (1 + company.daily_price_change / 100)
          : company.daily_price;
        return res.status(200).json({
          symbol: ticker,
          regularMarketPrice: company.daily_price,
          regularMarketPreviousClose: parseFloat(prevClose.toFixed(4)),
          averageAnalystRating: null,
        });
      }
    }

    // Try live Yahoo Finance
    const live = await getPolygonQuote(ticker);
    if (live.regularMarketPrice > 0) {
      return res.status(200).json(live);
    }

    // Fall back to stale DB data rather than returning nothing
    if (company && company.daily_price > 0) {
      const prevClose = company.daily_price_change !== 0
        ? company.daily_price / (1 + company.daily_price_change / 100)
        : company.daily_price;
      return res.status(200).json({
        symbol: ticker,
        regularMarketPrice: company.daily_price,
        regularMarketPreviousClose: parseFloat(prevClose.toFixed(4)),
        averageAnalystRating: null,
      });
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
router.get("/news/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  const company = await prisma.company.findUnique({
    where: {
      id,
    },
  });

  if (company == null) {
    res.status(404).json({
      message: "company is not in database / is not pubically traded",
    });
  }
  const companyName = company.name;

  let currentArticles = await prisma.article.findMany({
    where: { companyId: id },
    orderBy: { created_at: "desc" },
  });
  if (currentArticles.length !== 0) {
    if (currentArticles[0].created_at - Date.now() < 18000000) {
      // 5 hour update cycle
      res.status(200).json(currentArticles);
      return;
    }
  }
  // we have not updated news articles in over 5 hours ( I only get 166 api calls a day, so we cache results)
  const response = await client.articles.getBasicArticles({
    query: companyName,
  });
  for (let article of response.articles) {
    await prisma.article.upsert({
      // upsert to avoid repeated articles on updates
      where: {
        link: article.link,
      },
      update: {},
      create: {
        link: article.link,
        source: article.source,
        title: article.title,
        summary: article.summary,
        publishDate: new Date(article.publishDate),
        language: article.language,
        images: article.images,
        companyId: company.id,
      },
    });
  }

  currentArticles = await prisma.article.findMany({
    where: { companyId: id },
    orderBy: { created_at: "desc" },
  });

  res.status(200).json(currentArticles);
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
