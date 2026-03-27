const { isMarketOpen } = require("./utils");

const seriesCache = new Map();  // ticker -> { fullSeries, fetchedAt }
const inFlight = new Map();     // ticker -> Promise (deduplicates concurrent fetches)
const CACHE_TTL = 60 * 60 * 1000;

const toDateStr = (d) => (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

const fetchFullSeries = (ticker) => {
  const cached = seriesCache.get(ticker);
  if (cached && (!isMarketOpen() || Date.now() - cached.fetchedAt < CACHE_TTL)) {
    return Promise.resolve(cached.fullSeries);
  }

  // If a fetch for this ticker is already in-flight, reuse it
  if (inFlight.has(ticker)) return inFlight.get(ticker);

  const promise = (async () => {
    try {
      const apiKey = process.env.POLYGON_KEY;
      const from = toDateStr(new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000));
      const to = toDateStr(new Date());
      const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=2000&apiKey=${apiKey}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const text = await resp.text();
        console.warn(`Polygon: HTTP ${resp.status} for ${ticker} — ${text.slice(0, 120)}`);
        return null;
      }
      const json = await resp.json();

      if (json.status === "ERROR" || !Array.isArray(json.results)) {
        console.warn(`Polygon: no data for ${ticker} —`, json.error ?? json.message ?? "unknown");
        return null;
      }

      const series = json.results.map((v) => ({
        date: new Date(v.t),
        open: v.o,
        high: v.h,
        low: v.l,
        close: v.c,
        volume: v.v,
      }));

      seriesCache.set(ticker, { fullSeries: series, fetchedAt: Date.now() });
      return series;
    } catch (err) {
      console.warn(`Polygon fetch failed for ${ticker}:`, err?.message);
      return null;
    } finally {
      inFlight.delete(ticker);
    }
  })();

  inFlight.set(ticker, promise);
  return promise;
};

/**
 * Returns daily OHLCV data for ticker between from and to.
 * Concurrent-safe: simultaneous requests for the same ticker share one fetch.
 */
const fetchHistorical = async (ticker, from, to) => {
  const fullSeries = await fetchFullSeries(ticker);
  if (!fullSeries) return null;
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const filtered = fullSeries.filter((d) => d.date.getTime() >= fromMs && d.date.getTime() <= toMs);
  return filtered.length >= 2 ? filtered : null;
};

module.exports = { fetchHistorical, toDateStr };
