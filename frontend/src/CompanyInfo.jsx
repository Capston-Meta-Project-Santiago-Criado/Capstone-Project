import { BASE_URL } from "./lib/utils";
import { useState, useEffect } from "react";
import TradingViewWidget from "./components/TradingViewWidget";
import NewsList from "./components/NewsList";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { UserInfo } from "./context/UserContext";
import ExcelTools from "./components/ExcelTools";
import cn from "classnames";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "./components/ui/popover";

const AddToPortfolio = ({ companyId }) => {
  const [portfolios, setPortfolios] = useState(null);
  const [portfoliosToAddToo, setPortfoliosToAddToo] = useState([]);
  const navigate = useNavigate();

  const AddToPortfolios = async () => {
    await fetch(`${BASE_URL}/portfolios/addMany/${companyId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: portfoliosToAddToo }),
    });
  };

  const getPortfolios = async () => {
    try {
      const response = await fetch(`${BASE_URL}/portfolios/`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
        setPortfoliosToAddToo([]);
      }
    } catch {
      return;
    }
  };

  useEffect(() => {
    getPortfolios();
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={getPortfolios}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 text-sm font-semibold transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add to Portfolio
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 bg-[#0f0f14] border border-white/10 shadow-2xl"
        side="bottom"
      >
        <div className="grid gap-3">
          <div>
            <h4 className="font-semibold text-white text-sm">Add to Portfolio</h4>
            <p className="text-gray-400 text-xs mt-0.5">Select portfolios below</p>
          </div>
          <div className="grid gap-1.5 max-h-48 overflow-auto">
            {portfolios != null &&
              portfolios.map((value) => {
                if (value.companiesIds.includes(companyId)) return null;
                const isSelected = portfoliosToAddToo.includes(value.id);
                return (
                  <div
                    key={value.id}
                    onClick={() =>
                      setPortfoliosToAddToo((self) =>
                        self.includes(value.id)
                          ? self.filter((id) => id !== value.id)
                          : [...self, value.id]
                      )
                    }
                    className={cn(
                      "text-sm px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 font-medium border",
                      {
                        "bg-emerald-900/40 text-emerald-400 border-emerald-500/30": isSelected,
                        "bg-white/5 text-gray-300 border-white/8 hover:bg-white/8 hover:text-white": !isSelected,
                      }
                    )}
                  >
                    {value.name}
                  </div>
                );
              })}
            {portfolios != null && portfolios.filter(v => !v.companiesIds.includes(companyId)).length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">
                Already in all portfolios
              </p>
            )}
          </div>
          {portfolios == null && (
            <button
              onClick={() => navigate("/portfolios")}
              className="w-full py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-sm font-semibold hover:bg-emerald-500/25 transition-all duration-200"
            >
              Create a Portfolio
            </button>
          )}
          {portfoliosToAddToo.length > 0 && (
            <PopoverClose asChild>
              <button
                onClick={AddToPortfolios}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors duration-200"
              >
                Add to {portfoliosToAddToo.length} portfolio{portfoliosToAddToo.length > 1 ? "s" : ""}
              </button>
            </PopoverClose>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CompanyInfo = () => {
  const [info, setInfo] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const { selectedId } = useParams();
  const [isDetailRevealed, setIsDetailRevealed] = useState(false);
  const { isGuest } = UserInfo();

  const addToHistory = async () => {
    if (isGuest) return;
    await fetch(`${BASE_URL}/recommendations/companyhist/${selectedId}`, {
      method: "PUT",
      credentials: "include",
    });
  };

  useEffect(() => {
    const getAll = async () => {
      const response = await fetch(`${BASE_URL}/getters/companyById/${selectedId}`, {
        credentials: "include",
      });
      const data = await response.json();
      setInfo(data);

      const [stockRes, logoRes, newsRes] = await Promise.all([
        fetch(`${BASE_URL}/getters/stats/${data.ticker}`, { credentials: "include" }),
        fetch(`${BASE_URL}/getters/logo/${data.ticker}`, { credentials: "include" }),
        fetch(`${BASE_URL}/getters/news/${selectedId}`, { credentials: "include" }),
      ]);

      const stock = await stockRes.json();
      setStockData(stock);

      const logo = await logoRes.json();
      setLogoUrl(logo.logo);

      const news = await newsRes.json();
      setNewsData(news);
      addToHistory();
    };
    getAll();
  }, [selectedId]);

  const isPositive =
    stockData &&
    stockData.regularMarketPrice >= stockData.regularMarketPreviousClose;

  const dailyChangePct =
    stockData && stockData.regularMarketPreviousClose > 0
      ? (
          ((stockData.regularMarketPrice - stockData.regularMarketPreviousClose) /
            stockData.regularMarketPreviousClose) *
          100
        ).toFixed(2)
      : null;

  return (
    <main className="w-full min-h-screen px-6 pb-12">
      {/* Header */}
      <div className="flex items-start gap-5 pt-8 pb-6 border-b border-white/8">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={info?.name}
            className="w-14 h-14 rounded-xl bg-white p-1 object-contain shrink-0 mt-1"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-white truncate">
              {info ? info.name : "—"}
            </h1>
            {info && (
              <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-1 rounded">
                {info.ticker}
              </span>
            )}
          </div>
          {stockData && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold text-white">
                ${stockData.regularMarketPrice?.toFixed(2)}
              </span>
              {dailyChangePct && (
                <span
                  className={cn("text-sm font-semibold px-2 py-0.5 rounded", {
                    "bg-emerald-900/50 text-emerald-400": isPositive,
                    "bg-red-900/50 text-red-400": !isPositive,
                  })}
                >
                  {isPositive ? "▲ +" : "▼ "}
                  {dailyChangePct}%
                </span>
              )}
              {stockData.averageAnalystRating && (
                <span
                  className={cn("text-xs font-semibold px-2 py-1 rounded border", {
                    "bg-emerald-900/30 text-emerald-400 border-emerald-500/20":
                      stockData.averageAnalystRating.includes("Buy"),
                    "bg-red-900/30 text-red-400 border-red-500/20":
                      !stockData.averageAnalystRating.includes("Buy"),
                  })}
                >
                  Analyst: {stockData.averageAnalystRating}
                </span>
              )}
            </div>
          )}
        </div>
        {!isGuest && info && (
          <div className="shrink-0 flex items-center gap-2 mt-1">
            <AddToPortfolio companyId={info.id} />
          </div>
        )}
      </div>

      {/* Chart */}
      {info && <div className="mt-6"><TradingViewWidget key={info.ticker} info={info} /></div>}

      {/* Description */}
      {info?.description && (
        <div className="mt-6">
          <button
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-200 mb-3"
            onClick={() => setIsDetailRevealed((v) => !v)}
          >
            {isDetailRevealed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isDetailRevealed ? "Hide" : "Show"} Company Overview
          </button>
          {isDetailRevealed && (
            <div className="bg-[#0f0f14] border border-white/8 rounded-xl p-5 text-gray-300 text-sm leading-relaxed">
              {info.description}
            </div>
          )}
        </div>
      )}

      {/* Excel Tools */}
      {!isGuest && info && (
        <div className="mt-4">
          <ExcelTools companyId={info.id} />
        </div>
      )}

      {/* News */}
      {newsData != null && newsData.length > 0 && (
        <div className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase mb-1">
              Latest
            </p>
            <h2 className="text-2xl font-bold text-white">Company News</h2>
            <div className="mt-2 w-12 h-0.5 bg-emerald-400/60 rounded-full" />
          </div>
          <NewsList newsData={newsData} />
        </div>
      )}
    </main>
  );
};

export default CompanyInfo;
