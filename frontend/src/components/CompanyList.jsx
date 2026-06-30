import Company from "./Company";
import { useState, useEffect } from "react";
import { BASE_URL, toPercentage } from "../lib/utils";
import { getCached, cachedFetch } from "../lib/apiCache";

const CACHE_KEY = "home:companies";
const CACHE_TTL = 5 * 60_000; // 5 minutes

async function fetchHomeCompanies() {
  const res = await fetch(`${BASE_URL}/recommendations/curated`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("curated failed");
  const companies = await res.json();

  const tickers = companies.map((c) => c.ticker);
  const query   = tickers.map((t) => `tickers[]=${encodeURIComponent(t)}`).join("&");
  const pRes    = await fetch(`${BASE_URL}/getters/manycompanies?${query}`, {
    method: "GET",
    credentials: "include",
  });
  if (!pRes.ok) throw new Error("prices failed");
  const prices = await pRes.json();

  return { companies, prices };
}

const CompanyList = () => {
  // Seed state from cache immediately — no spinner flash on return visits
  const [data, setData] = useState(() => getCached(CACHE_KEY));

  useEffect(() => {
    cachedFetch(CACHE_KEY, fetchHomeCompanies, CACHE_TTL)
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center w-full py-16">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-wrap px-8 justify-start gap-3 w-full max-w-5xl">
      {data.companies.map((company, i) => {
        const price = data.prices[i];
        if (!price || price.regularMarketPrice == null) return null;
        return (
          <Company
            key={company.id}
            companyFacts={{
              name:        company.name,
              ticker:      company.ticker,
              daily:       price.regularMarketPrice.toFixed(2),
              dailyChange: toPercentage(price.regularMarketPrice, price.regularMarketPreviousClose),
              id:          company.id,
            }}
          />
        );
      })}
    </div>
  );
};

export default CompanyList;
