import PortfolioCard from "./PortfolioCard";
import { BASE_URL } from "../lib/utils";
import { useEffect, useState } from "react";

// Module-level cache survives route changes — navigating away and back is instant
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

const PublicPortfolios = () => {
  const [portfolios, setPortfolios] = useState(_cache); // show cached immediately if available

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/recommendations/curated-portfolios/public`,
          { method: "GET", credentials: "include" }
        );
        if (!response.ok) return;
        const data = await response.json();
        _cache = data;
        _cacheTime = Date.now();
        setPortfolios(data);
      } catch {}
    };

    const isStale = Date.now() - _cacheTime > CACHE_TTL;
    if (isStale) {
      // No fresh cache — fetch and show spinner until done
      fetchPortfolios();
    } else {
      // Cache is fresh — show it immediately, still refresh silently in background
      setPortfolios(_cache);
      fetchPortfolios();
    }
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
