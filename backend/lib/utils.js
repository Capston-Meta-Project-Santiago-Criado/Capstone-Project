const prisma = require("./prisma");
const finnhub = require("finnhub");
const finnhubClient = new finnhub.DefaultApi(process.env.finnhubKey);

const getFinnhubQuote = (ticker) =>
  new Promise((resolve, reject) => {
    finnhubClient.quote(ticker, (error, data) => {
      if (error) return reject(error);
      resolve({
        symbol: ticker,
        regularMarketPrice: data.c,
        regularMarketPreviousClose: data.pc,
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

// Daily % change derived from the same price points we store, so it stays
// consistent with daily_price. Providers' own "change percent" fields are
// measured against a different reference price and must not be trusted here.
const dailyChangePct = (price, prevClose) =>
  prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

// Returns true only during NYSE trading hours: Mon–Fri 9:30 AM–4:00 PM US Eastern
const isMarketOpen = () => {
  const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = etNow.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const mins = etNow.getHours() * 60 + etNow.getMinutes();
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
};

// Absolute timestamp of the most recent NYSE close (4:00 PM ET, skipping weekends).
// A stored price is only "current" if it was written at or after this moment.
const lastMarketClose = () => {
  const now = new Date();
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const offsetMs = now.getTime() - etNow.getTime(); // ET wall clock → absolute time
  const close = new Date(etNow);
  close.setHours(16, 0, 0, 0);
  if (etNow < close) close.setDate(close.getDate() - 1);
  while (close.getDay() === 0 || close.getDay() === 6) close.setDate(close.getDate() - 1);
  return new Date(close.getTime() + offsetMs);
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

const MAX_BETWEEN_TIME_PRICE = 1000 * 60 * 90; // 1.5 hr update cycle, don't want to get ip banned from yfinance -> no batch call for yfinance js unfortunately

//used mostly for recommendations
let isUpdatingCompanies = false; // every /curated hit fires this; never run two loops at once

const updateAllCompanies = async () => {
  // Don't refresh prices outside market hours — they won't change
  if (!isMarketOpen()) return;
  if (isUpdatingCompanies) return;

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
  isUpdatingCompanies = true;
  try {
    const allCompanies = await prisma.company.findMany();
    const onlyTickers = allCompanies.map((value) => value.ticker);
    const firstDate = formatDate(getBeforeDate(""));
    const secondDate = formatDate(new Date());
    for (let ticker of onlyTickers) {
      // The full sweep takes hours; once the market closes, stop rather than
      // keep stamping companies with an old day's quote at midnight.
      if (!isMarketOpen()) break;
      await wait(350);
      try {
        const quote = await getFinnhubQuote(ticker);
        const dividendData = await getFinnhubDividends(ticker, firstDate, secondDate);
        await prisma.company.update({
          where: { ticker },
          data: {
            daily_price: quote.regularMarketPrice,
            daily_price_change: dailyChangePct(
              quote.regularMarketPrice,
              quote.regularMarketPreviousClose
            ),
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
  } finally {
    isUpdatingCompanies = false;
  }
};

module.exports = { formatDate, getBeforeDate, updateAllCompanies, wait, isMarketOpen, lastMarketClose, dailyChangePct };
