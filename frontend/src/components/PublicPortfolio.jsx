import PortfolioCard from "./PortfolioCard";
import { BASE_URL } from "../lib/utils";
import { useEffect, useState } from "react";

const PublicPortfolios = () => {
  const [PublicPortfolios, setPublicPortfolios] = useState(null);

  const getPublicPortfolios = async () => {
    const response = await fetch(
      `${BASE_URL}/recommendations/curated-portfolios/public`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (response.ok) {
      const data = await response.json();
      setPublicPortfolios(data);
    }
  };

  useEffect(() => {
    getPublicPortfolios();
  }, []);

  return (
    <div className="w-full px-8 pb-10">
      {PublicPortfolios == null ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PublicPortfolios.map((portfolio) => (
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
      )}
    </div>
  );
};

export default PublicPortfolios;
