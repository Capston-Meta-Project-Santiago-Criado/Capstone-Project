import Company from "./Company";
import { useState, useEffect } from "react";

import { BASE_URL, toPercentage } from "../lib/utils";
import { UserInfo } from "../context/UserContext";

const PLACEHOLDER = "-";

const CompanyList = () => {
  const [exploreCompanies, setExploreCompanies] = useState([]);
  const [exploreCompaniesPrices, setExploreCompaniesPrices] = useState([
    PLACEHOLDER,
    PLACEHOLDER,
    PLACEHOLDER,
    PLACEHOLDER,
    PLACEHOLDER,
    PLACEHOLDER,
    PLACEHOLDER,
    PLACEHOLDER,
  ]);
  const fetchExplore = async () => {
    const response = await fetch(`${BASE_URL}/recommendations/curated`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setExploreCompanies(data);
    const tickers = data.map((value) => value.ticker);
    const query = tickers
      .map((t) => `tickers[]=${encodeURIComponent(t)}`)
      .join("&");
    const stockResponse = await fetch(
      `${BASE_URL}/getters/manycompanies?${query}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!stockResponse.ok) return;
    const stockData = await stockResponse.json();
    setExploreCompaniesPrices(stockData);
  };

  useEffect(() => {
    fetchExplore();
  }, []);

  if (exploreCompaniesPrices[0] === PLACEHOLDER) {
    return (
      <div className="flex items-center justify-center w-full py-16">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-wrap px-8 justify-start gap-3 w-full max-w-5xl">
      {exploreCompanies.map((value, ind) => {
        if (exploreCompaniesPrices[ind] == null) {
          return;
        }
        if (exploreCompaniesPrices[ind] != PLACEHOLDER) {
          return (
            <Company
              key={value.id}
              companyFacts={{
                name: value.name,
                ticker: value.ticker,
                daily:
                  exploreCompaniesPrices[ind].regularMarketPrice.toFixed(2),
                dailyChange: toPercentage(
                  exploreCompaniesPrices[ind].regularMarketPrice,
                  exploreCompaniesPrices[ind].regularMarketPreviousClose
                ),
                id: value.id,
              }}
            />
          );
        }
      })}
    </div>
  );
};

export default CompanyList;
