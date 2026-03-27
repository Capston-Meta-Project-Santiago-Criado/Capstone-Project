const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const finnhub = require("finnhub");
const finnhubClient = new finnhub.DefaultApi(process.env.finnhubKey);

const getFinnhubQuote = (ticker) =>
  new Promise((resolve, reject) => {
    finnhubClient.quote(ticker, (error, data) => {
      if (error) return reject(error);
      resolve({
        symbol: ticker,
        regularMarketPrice: data.c,
        regularMarketChangePercent: data.dp,
      });
    });
  });

const getFinnhubDividends = (ticker, from, to) =>
  new Promise((resolve) => {
    finnhubClient.stockDividends(ticker, from, to, (error, data) => {
      if (error || !data || data.length === 0) return resolve(null);
      resolve({
        dates: data.map((d) => new Date(d.date)),
        amounts: data.map((d) => d.amount),
      });
    });
  });

const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Returns true only during NYSE trading hours: Mon–Fri 9:30 AM–4:00 PM US Eastern
const isMarketOpen = () => {
  const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = etNow.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const mins = etNow.getHours() * 60 + etNow.getMinutes();
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
};

// constants for getBefore Date
const MODE_DAY = "Day";
const MODE_WEEK = "Week";
const MODE_MONTH = "Month";
const THREE_MONTH = "3Months";

const formatDate = (dateObj) => {
  const formattedDate = `${dateObj.getFullYear()}-${String(
    dateObj.getMonth() + 1
  ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
  return formattedDate;
};
//helper functions below

const getBeforeDate = (timeFrame) => {
  const today = new Date();
  let prevDate = new Date(today);
  if (timeFrame === MODE_DAY) {
    prevDate.setDate(prevDate.getDate() - 2);
  } else if (timeFrame === MODE_WEEK) {
    prevDate.setDate(prevDate.getDate() - 7);
  } else if (timeFrame === MODE_MONTH) {
    prevDate.setMonth(prevDate.getMonth() - 1);
  } else if (timeFrame === THREE_MONTH) {
    prevDate.setMonth(prevDate.getMonth() - 3);
  } else {
    prevDate.setFullYear(prevDate.getFullYear() - 1);
  }
  return prevDate;
};

const BATCH_SIZE = 100;
const MAX_BETWEEN_TIME_PRICE = 1000 * 60 * 90; // 1.5 hr update cycle, don't want to get ip banned from yfinance -> no batch call for yfinance js unfortunately

//used mostly for recommendations
const updateAllCompanies = async () => {
  // Don't refresh prices outside market hours — they won't change
  if (!isMarketOpen()) return;

  const mostRecent = await prisma.company.findFirst({
    orderBy: {
      lastUpdate: "desc",
    },
  });
  const currentTime = new Date();
  if (
    Math.abs(mostRecent.lastUpdate.getTime() - currentTime.getTime()) <
    MAX_BETWEEN_TIME_PRICE
  ) {
    return;
  }
  const allCompanies = await prisma.company.findMany();
  const onlyTickers = allCompanies.map((value) => value.ticker);
  let currentInd = 0;
  while (true) {
    // to prevent yfinance crash
    batchSplit = onlyTickers.slice(currentInd, currentInd + BATCH_SIZE);
    if (batchSplit.length == 0) {
      break;
    }
    const firstDate = formatDate(getBeforeDate(""));
    const secondDate = formatDate(new Date());
    for (let ticker of batchSplit) {
      await wait(350);
      try {
        const quote = await getFinnhubQuote(ticker);
        const dividendData = await getFinnhubDividends(ticker, firstDate, secondDate);
        await prisma.company.update({
          where: { ticker },
          data: {
            daily_price: quote.regularMarketPrice,
            daily_price_change: quote.regularMarketChangePercent,
            lastUpdate: new Date(),
            ...(dividendData && {
              dividends: dividendData.amounts,
              dividendsDates: dividendData.dates,
            }),
          },
        });
      } catch (err) {
        continue;
      }
    }
    currentInd += BATCH_SIZE;
  }
};

module.exports = { formatDate, getBeforeDate, updateAllCompanies, wait, isMarketOpen };
