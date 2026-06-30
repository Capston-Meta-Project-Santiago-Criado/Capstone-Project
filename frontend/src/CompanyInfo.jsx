import { BASE_URL } from "./lib/utils";
import { cachedFetch } from "./lib/apiCache";
import { useState, useEffect } from "react";
import TradingViewWidget from "./components/TradingViewWidget";
import NewsList from "./components/NewsList";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Building2, ChevronDown, ChevronUp, FileSpreadsheet, Loader2, Newspaper, Plus, RefreshCw, Sparkles } from "lucide-react";
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

const AiBusinessSummary = ({ companyId }) => {
  const [state, setState] = useState({ status: "loading", summary: null, error: "" });

  const load = (revalidate = false) => {
    setState((s) => ({ status: s.summary ? s.status : "loading", summary: s.summary, error: "" }));
    cachedFetch(
      `ai-summary:${companyId}`,
      async () => {
        const res = await fetch(`${BASE_URL}/ai/company-summary/${companyId}`, { credentials: "include" });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || "Could not load summary");
        }
        return res.json();
      },
      24 * 60 * 60 * 1000,
      revalidate ? { revalidate: true } : {},
    )
      .then((data) => setState({ status: "done", summary: data?.summary || null, error: "" }))
      .catch((err) => setState((s) => ({ status: "error", summary: s.summary, error: err.message || "Could not load summary" })));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const summary = state.summary;
  const sourceLabel =
    summary?.source === "10-K"
      ? `From 10-K${summary.filedDate ? ` (filed ${new Date(summary.filedDate).toLocaleDateString()})` : ""}`
      : summary
        ? "From general knowledge"
        : "";

  return (
    <section className="mt-6 bg-[#0f0f14] border border-white/8 rounded-xl p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">AI Business Summary</h2>
        </div>
        {sourceLabel && <span className="text-[11px] uppercase tracking-wider text-gray-600">{sourceLabel}</span>}
      </div>

      {state.status === "loading" && !summary && (
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <p className="text-sm">Analyzing the latest 10-K… this can take a few seconds the first time.</p>
        </div>
      )}

      {state.status === "error" && !summary && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-400">{state.error || "Could not generate a summary."}</p>
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/8 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {summary && (
        <div>
          <p className="text-sm text-gray-300 leading-relaxed">{summary.overview}</p>
          {Array.isArray(summary.segments) && summary.segments.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mb-2">Revenue breakdown</p>
              <ul className="space-y-1.5">
                {summary.segments.map((s, i) => (
                  <li key={`${s.name}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-gray-300">
                      {s.name}
                      {s.note ? <span className="text-gray-500"> — {s.note}</span> : null}
                    </span>
                    {s.revenuePct != null && <span className="font-mono text-emerald-400 shrink-0">{s.revenuePct}%</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.sourceNote && <p className="mt-3 text-[11px] text-gray-600">{summary.sourceNote}</p>}
        </div>
      )}
    </section>
  );
};

const CompanyInfo = () => {
  const [info, setInfo] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [newsStatus, setNewsStatus] = useState("idle");
  const [newsError, setNewsError] = useState("");
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

  const fetchCompanyNews = async (signal) => {
    setNewsStatus("loading");
    setNewsError("");
    try {
      const response = await fetch(`${BASE_URL}/getters/news/${selectedId}`, {
        credentials: "include",
        signal,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Could not load news" }));
        throw new Error(err.error ?? err.message ?? "Could not load news");
      }
      const news = await response.json();
      setNewsData(Array.isArray(news) ? news : []);
      setNewsStatus("done");
    } catch (err) {
      if (err.name === "AbortError") return;
      setNewsData([]);
      setNewsError(err.message || "Could not load news");
      setNewsStatus("error");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const getAll = async () => {
      setInfo(null);
      setStockData(null);
      setLogoUrl(null);
      setNewsData(null);
      setNewsStatus("loading");
      setNewsError("");

      try {
        const response = await fetch(`${BASE_URL}/getters/companyById/${selectedId}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not load company");
        const data = await response.json();
        if (cancelled) return;
        setInfo(data);
        fetchCompanyNews(controller.signal);

        const [stockRes, logoRes] = await Promise.all([
          fetch(`${BASE_URL}/getters/stats/${data.ticker}`, { credentials: "include", signal: controller.signal }),
          fetch(`${BASE_URL}/getters/logo/${data.ticker}`, { credentials: "include", signal: controller.signal }),
        ]);

        if (stockRes.ok) {
          const stock = await stockRes.json();
          if (!cancelled) setStockData(stock);
        }

        if (logoRes.ok) {
          const logo = await logoRes.json();
          if (!cancelled) setLogoUrl(logo.logo);
        }

        if (!cancelled) addToHistory();
      } catch (err) {
        if (err.name === "AbortError") return;
        setNewsData([]);
        setNewsStatus("error");
        setNewsError("Could not load company news.");
      }
    };
    getAll();
    return () => {
      cancelled = true;
      controller.abort();
    };
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

  const previousClose = stockData?.regularMarketPreviousClose ?? null;
  const rawPriceChange =
    stockData && previousClose != null
      ? stockData.regularMarketPrice - previousClose
      : null;
  const priceChange = Number.isFinite(rawPriceChange) ? rawPriceChange : null;
  const lastUpdated = info?.lastUpdate
    ? new Date(info.lastUpdate).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
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

      {/* AI business summary */}
      {info && <AiBusinessSummary companyId={info.id} />}

      {info && (
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <section className="bg-[#0f0f14] border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">Company Overview</h2>
              </div>
              {info.description && (
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors duration-200"
                  onClick={() => setIsDetailRevealed((v) => !v)}
                >
                  {isDetailRevealed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {isDetailRevealed ? "Less" : "More"}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {info.description
                ? isDetailRevealed
                  ? info.description
                  : `${info.description.slice(0, 420)}${info.description.length > 420 ? "..." : ""}`
                : "No company description is available yet."}
            </p>
          </section>

          <aside className="bg-[#0f0f14] border border-white/8 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <p className="text-sm font-bold text-white">Snapshot</p>
              <p className="text-xs text-gray-500 mt-0.5">Profile and quote context</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/8">
              {[
                ["Sector", info.industry?.sector?.name ?? "Unknown"],
                ["Industry", info.industry?.name ?? "Unknown"],
                ["Previous Close", previousClose != null ? `$${previousClose.toFixed(2)}` : "N/A"],
                ["Day Move", priceChange != null && dailyChangePct != null ? `${priceChange >= 0 ? "+" : ""}$${priceChange.toFixed(2)} (${dailyChangePct}%)` : "N/A"],
                ["Ticker", info.ticker],
                ["Updated", lastUpdated ?? "N/A"],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#0f0f14] p-4 min-h-20">
                  <p className="text-[11px] uppercase tracking-wider text-gray-600">{label}</p>
                  <p className="text-sm font-semibold text-gray-200 mt-1 break-words">{value}</p>
                </div>
              ))}
            </div>
            {!isGuest && (
              <div className="p-4 border-t border-white/8">
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Modeling</p>
                </div>
                <ExcelTools companyId={info.id} />
              </div>
            )}
          </aside>
        </div>
      )}

      {/* News */}
      {newsStatus === "loading" && (
        <section className="mt-10 bg-[#0f0f14] border border-white/8 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-300 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Loading company news</h2>
              <p className="text-sm text-gray-500 mt-1">Checking cached articles first, then refreshing if needed.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="rounded-xl border border-white/8 bg-black/20 overflow-hidden">
                <div className="aspect-video bg-white/6 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded bg-white/8 animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-white/8 animate-pulse" />
                  <div className="h-2 w-20 rounded bg-emerald-500/20 animate-pulse mt-4" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
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
      {newsStatus === "error" && (
        <section className="mt-10 bg-[#0f0f14] border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">News could not load</h2>
                <p className="text-sm text-gray-500 mt-1">{newsError || "Try again in a moment."}</p>
              </div>
            </div>
            <button
              onClick={() => fetchCompanyNews()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/8 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </section>
      )}
      {newsStatus === "done" && newsData != null && newsData.length === 0 && (
        <section className="mt-10 bg-[#0f0f14] border border-white/8 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">No recent news found</h2>
              <p className="text-sm text-gray-500 mt-1">The chart, snapshot, and modeling tools are still available for this company.</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default CompanyInfo;
