const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const express = require("express");

const { BadParams, DoesNotExist } = require("./middleware/CustomErrors");
const { getBeforeDate } = require("../lib/utils");
const { fetchHistorical, toDateStr } = require("../lib/yahooCache");

const getCandles = async (ticker, from, to) => {
  try {
    const result = await fetchHistorical(ticker, from, to);
    if (!result?.length) return null;
    const valid = result.filter((q) => q.close != null).map((q) => ({ close: q.close }));
    return valid.length >= 2 ? valid : null;
  } catch {
    return null;
  }
};

const getCandlesWithDates = async (ticker, from, to) => {
  try {
    const result = await fetchHistorical(ticker, from, to);
    if (!result?.length) return null;
    const valid = result
      .filter((q) => q.close != null && q.date != null)
      .map((q) => ({ date: toDateStr(q.date), close: q.close }));
    return valid.length >= 2 ? valid : null;
  } catch {
    return null;
  }
};

const app = express();
app.use(express.json());
const router = express.Router({ mergeParams: true });
require("dotenv").config();

const BAD_PARAMS = "portfolio id is likely incorrect";
const DOES_NOT_EXIST = "portfolio doesn't exist";
// make new portfolio
router.post("/", async (req, res) => {
  const userId = req.session.userId;
  const { name, description, isPublic } = req.body;
  const publicStatus = JSON.parse(isPublic);
  const newPortfolio = await prisma.portfolio.create({
    data: {
      name,
      description,
      companiesIds: [],
      userId,
      isPublic: publicStatus,
    },
  });
  res.json(newPortfolio);
});

router.get("/", async (req, res) => {
  const userId = req.session.userId;
  const allPortfolios = await prisma.portfolio.findMany({
    where: {
      userId,
    },
  });
  if (allPortfolios == null) {
    res.json([]);
  }
  res.status(200).json(allPortfolios);
});

router.get("/model-exists/:id", async (req, res) => {
  const portfolioId = parseInt(req.params.id);
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });
  res.json(portfolio.model);
});

router.delete("/:id", async (req, res, next) => {
  const portfolioId = parseInt(req.params.id);
  const portfolio = await prisma.portfolio.delete({
    where: {
      id: portfolioId,
    },
  });
  if (portfolio == null) {
    next(new BadParams(BAD_PARAMS));
  }
  res.json(portfolio);
});

// delete company from portfolio
router.delete("/:id/:companyId", async (req, res, next) => {
  const portfolioId = parseInt(req.params.id);
  const companyId = parseInt(req.params.companyId);
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });
  if (portfolio == null) {
    next(new DoesNotExist(BAD_PARAMS));
  }
  const array = portfolio.companiesIds.filter((val) => val !== companyId);
  const updatedPortfolio = await prisma.portfolio.update({
    where: { id: portfolioId },
    data: {
      companiesIds: array,
    },
  });

  res.json(updatedPortfolio);
});

router.get("/basic/:id", async (req, res, next) => {
  const portfolioId = parseInt(req.params.id);
  const userId = req.session.userId;
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });
  if (portfolio == null) {
    next(new DoesNotExist(DOES_NOT_EXIST));
  }
  if (userId !== portfolio.userId && portfolio.isPublic !== true) {
    res
      .status(401)
      .json({ message: "you do not have permission to access this portfolio" });
  }
  res.json(portfolio);
});

// add company to portfolio -

router.put("/add/:id/:companyId", async (req, res, next) => {
  const userId = req.session.userId;
  const portfolioId = parseInt(req.params.id);
  const companyId = parseInt(req.params.companyId);
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });

  if (portfolio == null) {
    next(new BadParams("not a real portfolio id"));
  }

  if (portfolio.companiesIds.includes(companyId)) {
    next(new BadParams("id is already in portfolio"));
    return;
  }
  if (userId !== portfolio.userId) {
    res
      .status(401)
      .json({ message: "you do not have permission to change this portfolio" });
  }

  const newPortfolio = await prisma.portfolio.update({
    where: { id: portfolioId },
    data: {
      companiesIds: { push: companyId },
      companiesStocks: { push: 1 },
    },
  });
  res.status(200).json(newPortfolio);
});

router.put("/update/:id", async (req, res) => {
  const portfolioId = parseInt(req.params.id);
  const { companyStocks } = req.body;
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });
  if (portfolio == null) {
    next(new BadParams("not a real portfolio id"));
  }
  const newPortfolio = await prisma.portfolio.update({
    where: { id: portfolioId },
    data: {
      companiesStocks: companyStocks,
    },
  });
  res.json(newPortfolio);
});

//add to multiple portfolio:

router.put("/addMany/:companyId", async (req, res, next) => {
  const companyId = parseInt(req.params.companyId);
  const possibleIds = req.body.ids;

  if (companyId == null) {
    next(BadParams("companyids specified, or other bad param issue"));
  }

  const ids = possibleIds.map((val) => parseInt(val));

  for (let portfolioId of ids) {
    const portfolio = await prisma.portfolio.findUnique({
      where: {
        id: portfolioId,
      },
    });
    if (portfolio.companiesIds.includes(companyId)) {
      continue;
    }
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        companiesIds: { push: companyId },
        companiesStocks: { push: 1 },
      },
    });
  }
  res.status(200).json({ message: "added" });
});

// portfolio historical value time series
router.get("/history/:id/:timeFrame", async (req, res) => {
  const portfolioId = parseInt(req.params.id);
  const timeFrame = req.params.timeFrame;
  try {
    const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!portfolio) return res.status(404).json({ error: "not found" });

    const companies = await prisma.company.findMany({
      where: { id: { in: portfolio.companiesIds } },
    });
    if (companies.length === 0) return res.json([]);

    const from = getBeforeDate(timeFrame);
    const to = new Date();

    const allSeries = await Promise.all(
      companies.map(async (company) => {
        const idx = portfolio.companiesIds.indexOf(company.id);
        const shares = portfolio.companiesStocks[idx] || 1;
        const candles = await getCandlesWithDates(company.ticker, from, to);
        return candles ? { candles, shares } : null;
      })
    );

    const validSeries = allSeries.filter(Boolean);
    if (validSeries.length === 0) return res.json([]);

    const minLen = Math.min(...validSeries.map((s) => s.candles.length));
    const result = [];
    for (let i = 0; i < minLen; i++) {
      let value = 0;
      let date = null;
      for (const series of validSeries) {
        const candleIdx = series.candles.length - minLen + i;
        value += series.candles[candleIdx].close * series.shares;
        if (date == null) date = series.candles[candleIdx].date;
      }
      result.push({ date, value: parseFloat(value.toFixed(2)) });
    }

    // Append today's point using daily_price so the chart end matches the live portfolio value
    const todayStr = toDateStr(new Date());
    if (result.length === 0 || result[result.length - 1].date !== todayStr) {
      let todayValue = 0;
      for (const company of companies) {
        if (!company.daily_price) continue;
        const idx = portfolio.companiesIds.indexOf(company.id);
        const shares = portfolio.companiesStocks[idx] || 1;
        todayValue += company.daily_price * shares;
      }
      if (todayValue > 0) {
        result.push({ date: todayStr, value: parseFloat(todayValue.toFixed(2)) });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// x largest swings in portfolio, req period can be: "Day", "Week", "Month", "Year"
router.get("/swings/:portfolioId/:timeFrame", async (req, res, next) => {
  const timeFrame = req.params.timeFrame;
  let retArray = [];
  const portfolioId = parseInt(req.params.portfolioId);
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });
  if (portfolio == null) {
    next(new BadParams("portfolio does not exist"));
  }
  const todayString = new Date();
  const earlierString = getBeforeDate(timeFrame);
  const companies = await prisma.company.findMany({ where: { id: { in: portfolio.companiesIds } } });

  retArray = (await Promise.all(
    companies.map(async (company) => {
      const result = await getCandles(company.ticker, earlierString, todayString);
      if (!result) return null;
      const firstVal = result[0];
      const finalVal = result[result.length - 1];
      return {
        id: company.id,
        firstVal,
        finalVal,
        percentChange: firstVal != null && finalVal != null
          ? ((finalVal.close - firstVal.close) / firstVal.close) * 100
          : 0,
      };
    })
  )).filter(Boolean);

  retArray.sort((a, b) => compareByPercentChange(a, b));
  res.json(retArray);
});

// make public / private a portfolio:
router.post("/make/public/:id", async (req, res) => {
  const portfolioId = parseInt(req.params.id);

  const currentPort = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });

  allPortfolios = await prisma.portfolio.update({
    where: {
      id: portfolioId,
    },
    data: {
      isPublic: !currentPort.isPublic,
    },
  });
  res.json(allPortfolios);
});

// figure out what should be shown to the user!

router.get("/permissions/user/:id", async (req, res) => {
  const portfolioid = parseInt(req.params.id);
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioid,
    },
  });
  if (portfolio == null) {
    return res.json({ owner: null });
  }
  if (req.session.userId === portfolio.userId) {
    res.json({ owner: true, public: portfolio.isPublic });
    return;
  }
  res.json({ owner: false, public: portfolio.isPublic });
});

router.get("/getNotes/:id", async (req, res, next) => {
  const portfolioId = parseInt(req.params.id);
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });
  if (portfolio == null) {
    next(new BadParams("no portfolio with such Id"));
  }
  res.json(portfolio.notesDoc);
});

router.post("/setNotes/:id", async (req, res, next) => {
  const userId = req.session.userId;
  const portfolioId = parseInt(req.params.id);
  const portfolioCheck = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });

  if (portfolioCheck.userId !== userId) {
    next(new BadParams("you do not have permission to change these notes"));
  }
  const newDoc = req.body.html;

  const portfolio = await prisma.portfolio.update({
    where: {
      id: portfolioId,
    },
    data: {
      notesDoc: newDoc,
    },
  });

  if (portfolio == null) {
    next(new BadParams("no portfolio with such Id"));
  }
  res.json(portfolio.notesDoc);
});

// daily performance for a portfolio
router.get("/performance/:id", async (req, res) => {
  const portfolioId = parseInt(req.params.id);
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });
    if (!portfolio) return res.status(404).json({ error: "not found" });

    const companies = await prisma.company.findMany({
      where: { id: { in: portfolio.companiesIds } },
    });

    let totalValue = 0;
    let totalPrevValue = 0;
    for (const company of companies) {
      const idx = portfolio.companiesIds.indexOf(company.id);
      const shares = portfolio.companiesStocks[idx] || 1;
      if (company.daily_price > 0) {
        const prevClose = company.daily_price_change !== 0
          ? company.daily_price / (1 + company.daily_price_change / 100)
          : company.daily_price;
        totalValue += company.daily_price * shares;
        totalPrevValue += prevClose * shares;
      }
    }

    const dailyChange =
      totalPrevValue > 0
        ? parseFloat(((totalValue - totalPrevValue) / totalPrevValue * 100).toFixed(2))
        : 0;

    res.json({ totalValue: totalValue.toFixed(2), dailyChange });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

app.use((err, req, res, next) => {
  if (err instanceof BadParams || err instanceof DoesNotExist) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

const compareByPercentChange = (a, b) => {
  if (Math.abs(a.percentChange) > Math.abs(b.percentChange)) {
    return -1;
  } else {
    return 1;
  }
};
