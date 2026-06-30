import PortfolioCard from "./PortfolioCard";
import { BASE_URL } from "../lib/utils";
import { useEffect, useState } from "react";
import { getCached, cachedFetch } from "../lib/apiCache";

const CACHE_KEY = "home:public-portfolios";
const CACHE_TTL = 5 * 60_000; // 5 minutes

const PublicPortfolios = () => {
  const [portfolios, setPortfolios] = useState(() => getCached(CACHE_KEY));

  useEffect(() => {
    cachedFetch(
      CACHE_KEY,
      async () => {
        const res = await fetch(`${BASE_URL}/recommendations/curated-portfolios/public`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("failed");
        return res.json();
      },
      CACHE_TTL
    )
      .then(setPortfolios)
      .catch(() => {});
  }, []);

  if (portfolios === null) {
    return (
      <div className="w-full px-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#0f0f14] border border-white/8 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-white/8 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2 mb-4" />
              <div className="h-3 bg-white/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => (
          <PortfolioCard
            key={portfolio.id}
            name={portfolio.name}
            id={portfolio.id}
            companies={portfolio.companiesIds}
            description={portfolio.description}
            canDelete={false}
            creator={portfolio.user.username}
          />
        ))}
      </div>
    </div>
  );
};

export default PublicPortfolios;
