import { useState, useEffect } from "react";
import { BASE_URL } from "./lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import PortfolioCompanies from "./components/PortfolioCompanies";
import SwingCompanies from "./components/SwingCompanies";
import cn from "classnames";
import { EDITOR_PERMS } from "./lib/constants";
import PredictionTools from "./components/PredictionTools";
import TextEditor from "./components/TextEditor";
import { DeleteButton } from "./components/PortfolioCard";
import Stocks from "./components/Stocks";

const MODE_DAY = "Day";
const VIEWER_PERMS = "viewer";

const PortfolioInfo = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [companyIds, setCompanyIds] = useState([]);
  const [companiesData, setCompaniesData] = useState([]);
  const [companiesStockData, setCompaniesStockData] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [historicalMode, setHistoricalMode] = useState(MODE_DAY);
  const [sortedSwings, setSortedSwings] = useState(null);
  const [isLoadTried, setIsLoadTried] = useState(false);
  const { id } = useParams();
  const [isPublic, setPublicButton] = useState(null);
  const [viewerPermissions, setViewerPermissions] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [dailyChange, setDailyChange] = useState(null);
  const navigate = useNavigate();

  const getUserPermissions = async () => {
    const response = await fetch(`${BASE_URL}/portfolios/permissions/user/${id}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (data.owner == null) {
      setIsLoadTried(true);
      return false;
    }
    if (data.owner === true) {
      setViewerPermissions(EDITOR_PERMS);
      return true;
    }
    if (data.public === true) {
      setViewerPermissions(VIEWER_PERMS);
      return true;
    }
  };

  const handlePublic = async () => {
    setPublicButton((prev) => !prev);
    await fetch(`${BASE_URL}/portfolios/make/public/${id}`, {
      method: "POST",
      credentials: "include",
    });
  };

  const getSwingData = async () => {
    const response = await fetch(`${BASE_URL}/portfolios/swings/${id}/${historicalMode}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    setSortedSwings(data);
  };

  useEffect(() => {
    getSwingData();
  }, [historicalMode, id]);

  const getPortfolioData = async () => {
    const response = await fetch(`${BASE_URL}/portfolios/basic/${id}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    setPortfolioData(data);
    setPublicButton(data.isPublic);
    if (companyIds.length === 0 || !sameValues(data.companiesIds, companyIds)) {
      setCompanyIds(data.companiesIds);
      await getCompaniesData(data.companiesIds, data.companiesStocks);
    }
  };

  const sameValues = (arr1, arr2) => {
    for (let val of arr1) { if (!arr2.includes(val)) return false; }
    for (let val of arr2) { if (!arr1.includes(val)) return false; }
    return true;
  };

  const handleDelete = async (companyId) => {
    await fetch(`${BASE_URL}/portfolios/${id}/${companyId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setSortedSwings((self) => self.filter((cid) => cid.id !== companyId));
    setCompanyIds((self) => self.filter((cid) => cid !== companyId));
    let i = 0;
    setCompaniesData((self) =>
      self.filter((value, ind) => {
        if (value.id === companyId) { i = ind; return false; }
        return true;
      })
    );
    setCompaniesStockData((self) => self.filter((_, ind) => ind !== i));
  };

  const getCompaniesData = async (companiesIds, companiesStocks) => {
    const newArray = [];
    if (companiesIds) {
      const response = await fetch(`${BASE_URL}/company`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: companiesIds }),
      });
      if (response.ok) {
        const data = await response.json();
        for (let val of data) {
          newArray.push({
            id: val.id,
            name: val.name,
            ticker: val.ticker,
            industry: val.industry.name,
            sector: val.industry.sector.name,
          });
        }
      }
    }
    setCompaniesData(newArray);
    const prices = [];
    let i = 0;
    let sum = 0;
    for (const company of newArray) {
      const stockResponse = await fetch(`${BASE_URL}/getters/stats/${company.ticker}`, {
        method: "GET",
        credentials: "include",
      });
      const stockData = await stockResponse.json();
      prices.push({ price: stockData.regularMarketPrice, dayStart: stockData.regularMarketPreviousClose });
      sum += stockData.regularMarketPrice * companiesStocks[i];
      i++;
    }
    setPortfolioValue(sum.toFixed(2));
    let prevSum = 0;
    for (let j = 0; j < prices.length; j++) {
      prevSum += prices[j].dayStart * (companiesStocks[j] || 1);
    }
    setDailyChange(prevSum > 0 ? parseFloat(((sum - prevSum) / prevSum * 100).toFixed(2)) : 0);
    setCompaniesStockData(prices);
  };

  useEffect(() => {
    const getAllInfo = async () => {
      setCompaniesData(null);
      const response = await getUserPermissions();
      if (response === false) return;
      await getPortfolioData();
      setIsLoadTried(true);
    };
    getAllInfo();
  }, [id]);

  if (viewerPermissions == null && isLoadTried) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen gap-4">
        <p className="text-gray-400 text-lg font-medium">Nothing for you here</p>
        <button
          onClick={() => navigate("/home")}
          className="px-5 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 text-sm font-semibold transition-all duration-200"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (portfolioData == null) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen px-6 pb-12">
      {/* Header */}
      <div className="pt-8 pb-6 border-b border-white/8">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="text-3xl font-bold text-white">{portfolioData.name}</h3>
          {dailyChange !== null && (
            <span className={cn("text-sm font-bold px-3 py-1 rounded-lg border", {
              "bg-emerald-900/40 text-emerald-400 border-emerald-500/30": dailyChange >= 0,
              "bg-red-900/40 text-red-400 border-red-500/30": dailyChange < 0,
            })}>
              {dailyChange >= 0 ? "▲ +" : "▼ "}{dailyChange}% today
            </span>
          )}
          {viewerPermissions === EDITOR_PERMS && isPublic !== null && (
            <button
              onClick={handlePublic}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200",
                {
                  "bg-red-900/30 text-red-400 border-red-500/20 hover:bg-red-900/50": isPublic === true,
                  "bg-emerald-900/30 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/50": isPublic === false,
                }
              )}
            >
              {isPublic ? "Make Private" : "Make Public"}
            </button>
          )}
          {viewerPermissions === EDITOR_PERMS && (
            <div className="ml-auto">
              <DeleteButton isCard={false} />
            </div>
          )}
        </div>
        {portfolioData.description && (
          <p className="text-gray-400 text-sm mt-2">{portfolioData.description}</p>
        )}
      </div>

      {/* Top row: Companies + Swings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <PortfolioCompanies
          handleDelete={handleDelete}
          companiesStockData={companiesStockData}
          companiesData={companiesData}
          isEditingMode={isEditingMode}
          setIsEditingMode={setIsEditingMode}
          permission={viewerPermissions}
        />
        <SwingCompanies
          companiesStockData={companiesStockData}
          companiesData={companiesData}
          setHistoricalMode={setHistoricalMode}
          sortedSwings={sortedSwings}
          historicalMode={historicalMode}
          portfolioData={portfolioData}
        />
      </div>

      {/* Analysis Tool — full width row */}
      <div className="mt-5">
        <PredictionTools
          portfolioData={portfolioData}
          companiesData={companiesData}
          companiesStockData={companiesStockData}
          portfolioValue={portfolioValue}
        />
      </div>

      {/* Stocks */}
      <div className="mt-5">
        <Stocks
          companiesData={companiesData}
          companiesStockData={companiesStockData}
          portfolioData={portfolioData}
          portfolioValue={portfolioValue}
          setPortfolioValue={setPortfolioValue}
          perms={viewerPermissions}
        />
      </div>

      {/* Text Editor */}
      <div className="mt-5">
        <TextEditor id={id} viewerPermissions={viewerPermissions} />
      </div>
    </main>
  );
};

export default PortfolioInfo;
