import LineChart from "./predictiontools/LineChart";
import { useState, useEffect } from "react";
import { BASE_URL } from "../lib/utils";
import { UserInfo } from "../context/UserContext";
import { socket } from "../socket";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "./ui/popover";

const TIME_FRAMES = [
  { label: "1W", value: "Week" },
  { label: "1M", value: "Month" },
  { label: "3M", value: "3Months" },
  { label: "1Y", value: "Year" },
];

const NewModelButton = ({ getModel }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 text-xs font-semibold transition-all duration-200 whitespace-nowrap w-full text-left"
        onClick={(e) => e.stopPropagation()}
      >
        Train New Model
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-64 bg-[#0f0f14] border border-white/10 shadow-2xl p-4" side="left">
      <div className="grid gap-3">
        <div>
          <h4 className="font-semibold text-white text-sm">Train New Model</h4>
          <p className="text-xs text-gray-400 mt-1">
            All previous model data will be lost. Training takes ~15 minutes — you'll get an inbox notification when done.
          </p>
        </div>
        <PopoverClose asChild>
          <button
            className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              getModel(true);
            }}
          >
            Confirm & Train
          </button>
        </PopoverClose>
      </div>
    </PopoverContent>
  </Popover>
);

const PredictionTools = ({ portfolioData, companiesData, companiesStockData, portfolioValue }) => {
  const { isGuest } = UserInfo();
  const [predictionData, setPredictionData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [predictionsClicked, setPredictionsClicked] = useState(false);
  const [predictedBalance, setPredictedBalance] = useState(null);
  const [isModelExists, setIsModelExists] = useState(false);
  const [isCachedPredictionsClicked, setIsCachedPredictionsClicked] = useState(false);
  const [predictedShifts, setPredictedShifts] = useState([]);
  const [noEarningsUpcoming, setNoEarningsUpcoming] = useState(false);
  const [timeFrame, setTimeFrame] = useState("Month");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null); // null | { pct, epoch, total }

  const getModelExists = async () => {
    const response = await fetch(`${BASE_URL}/portfolios/model-exists/${portfolioData.id}`, {
      method: "GET",
      credentials: "include",
    });
    const modelExists = await response.json();
    setIsModelExists(modelExists);
  };

  const fetchHistory = async (tf) => {
    setIsHistoryLoading(true);
    setHistoricalData(null);
    try {
      const response = await fetch(`${BASE_URL}/portfolios/history/${portfolioData.id}/${tf}`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data.length > 0 ? data : null);
      }
    } catch {
      setHistoricalData(null);
    }
    setIsHistoryLoading(false);
  };

  const getPredictedShifts = async () => {
    const response = await fetch(`${BASE_URL}/models/earningsdata/${portfolioData.id}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (data != null && data.length !== 0) {
      setPredictedShifts(data.map((value) => ({
        date: value.UpcomingEarnings[0],
        name: value.name,
        description: "earnings release",
      })));
      return;
    }
    setNoEarningsUpcoming(true);
  };

  async function getModel(isNewModel) {
    if (!isNewModel) {
      setIsCachedPredictionsClicked(true);
    } else {
      setPredictionsClicked(true);
    }
    const response = await fetch(`${BASE_URL}/models/${portfolioData.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPrice: portfolioValue, newModel: isNewModel }),
    });
    const data = await response.json();
    // Training kicked off in background — keep spinner, user gets inbox notification when done
    if (data.training) return;
    setIsModelExists(true);
    const base = Array.isArray(data) ? data : (data.base ?? []);
    setPredictionData(base);
    setPredictedBalance(base.length > 0 ? base[base.length - 1].price.toFixed(2) : null);
    setIsCachedPredictionsClicked(false);
    setPredictionsClicked(false);
  }

  // Seed training state from DB (in case user navigated away and came back)
  useEffect(() => {
    if (portfolioData?.isTraining) {
      setTrainingProgress({ pct: 0, epoch: 0, total: 10 });
      setPredictionsClicked(true);
    }
  }, [portfolioData?.id]);

  // Socket listeners for live training progress
  useEffect(() => {
    const onStart = ({ portfolioId }) => {
      if (portfolioId !== portfolioData?.id) return;
      setTrainingProgress({ pct: 0, epoch: 0, total: 10 });
      setPredictionsClicked(true);
    };
    const onProgress = ({ portfolioId, epoch, totalEpochs, pct }) => {
      if (portfolioId !== portfolioData?.id) return;
      setTrainingProgress({ pct, epoch, total: totalEpochs });
    };
    const onDone = ({ portfolioId }) => {
      if (portfolioId !== portfolioData?.id) return;
      setTrainingProgress(null);
      setPredictionsClicked(false);
      setIsModelExists(true);
    };
    const onError = ({ portfolioId }) => {
      if (portfolioId !== portfolioData?.id) return;
      setTrainingProgress(null);
      setPredictionsClicked(false);
    };
    socket.on("training:start", onStart);
    socket.on("training:progress", onProgress);
    socket.on("training:done", onDone);
    socket.on("training:error", onError);
    return () => {
      socket.off("training:start", onStart);
      socket.off("training:progress", onProgress);
      socket.off("training:done", onDone);
      socket.off("training:error", onError);
    };
  }, [portfolioData?.id]);

  useEffect(() => {
    setPredictionData(null);
    setPredictedBalance(null);
    getModelExists();
  }, [portfolioValue]);

  useEffect(() => {
    if (portfolioData?.id && companiesData?.length > 0) {
      fetchHistory(timeFrame);
    }
  }, [portfolioData?.id, timeFrame, companiesData?.length]);

  // Compute portfolio stats from available data
  const stats = (() => {
    if (!companiesData || !companiesStockData || !portfolioData) return null;
    const sectorMap = {};
    const holdings = [];
    // Compute per-company values with correctly-ordered shares first, then derive total
    const entries = companiesData.map((company, i) => {
      const price = companiesStockData[i]?.price ?? 0;
      const idxInPortfolio = portfolioData.companiesIds?.indexOf(company.id) ?? -1;
      const shares = idxInPortfolio >= 0 ? (portfolioData.companiesStocks?.[idxInPortfolio] ?? 1) : 1;
      return { company, value: price * shares };
    });
    const totalVal = entries.reduce((sum, e) => sum + e.value, 0);
    entries.forEach(({ company, value }) => {
      sectorMap[company.sector] = (sectorMap[company.sector] ?? 0) + value;
      holdings.push({ ticker: company.ticker, value, pct: totalVal > 0 ? (value / totalVal) * 100 : 0 });
    });
    const sectors = Object.entries(sectorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, value]) => ({ name, pct: totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) : "0.0" }));
    const topHoldings = holdings.sort((a, b) => b.value - a.value).slice(0, 3);
    return { sectors, topHoldings };
  })();

  const hasCompanies = companiesData != null && companiesData.length > 0;

  return (
    <div className="bg-[#0f0f14] border border-white/8 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase mb-0.5">AI</p>
          <h2 className="text-lg font-bold text-white">Analysis Tool</h2>
        </div>
        {/* Time frame selector */}
        {hasCompanies && (
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {TIME_FRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeFrame(tf.value)}
                className={`px-2.5 py-1! text-xs font-semibold rounded-md transition-all duration-150 border-0 ${
                  timeFrame === tf.value
                    ? "bg-white/15 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasCompanies ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500 text-sm">Add companies to use the analysis tool</p>
        </div>
      ) : (
        <div className="flex flex-row flex-1 min-h-0">
          {/* Left controls panel */}
          <div className="flex flex-col gap-3 p-4 border-r border-white/8 w-44 shrink-0 overflow-y-auto">

            {/* Forecast controls */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">Forecast</p>
              {isModelExists && (
                <button
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 text-xs font-semibold transition-all duration-200 text-left w-full"
                  onClick={() => getModel(false)}
                >
                  Run Predictions
                </button>
              )}
              {predictionData != null && !noEarningsUpcoming && (
                <button
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 text-xs font-semibold transition-all duration-200 text-left w-full"
                  onClick={getPredictedShifts}
                >
                  Predict Shifts
                </button>
              )}
              {noEarningsUpcoming && (
                <p className="text-xs text-gray-500">No shift data available</p>
              )}
              {!predictionsClicked && !isGuest && <NewModelButton getModel={getModel} />}
              {predictionsClicked && (
                <div className="flex flex-col gap-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-xs text-amber-400 font-semibold">Training…</p>
                  </div>
                  {trainingProgress ? (
                    <>
                      <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${trainingProgress.pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Epoch {trainingProgress.epoch}/{trainingProgress.total} · {trainingProgress.pct}%
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 text-center leading-tight">Starting up…</p>
                  )}
                  <p className="text-xs text-gray-600 text-center">You'll get an inbox notification when done.</p>
                </div>
              )}
              {isCachedPredictionsClicked && (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400 text-center">Fetching…</p>
                </div>
              )}
            </div>

            {/* Balance + prediction */}
            <div className="pt-3 border-t border-white/8">
              <p className="text-xs text-gray-500 uppercase font-mono tracking-wider mb-1">Balance</p>
              <p className="text-base font-bold text-white">${parseFloat(portfolioValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              {predictedBalance != null && (() => {
                const diff = predictedBalance - portfolioValue;
                const pct = ((diff / portfolioValue) * 100).toFixed(2);
                const up = diff > 0;
                return (
                  <>
                    <p className="text-xs text-gray-500 uppercase font-mono tracking-wider mt-3 mb-0.5">30-Day Forecast</p>
                    <p className={`text-sm font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                      ${parseFloat(predictedBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
                      {up ? "+" : ""}{pct}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1.5">S&P ≈ 0.67%/mo</p>
                  </>
                );
              })()}
            </div>

            {/* Portfolio stats */}
            {stats && (
              <>
                {/* Top holdings */}
                <div className="pt-3 border-t border-white/8">
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider mb-2">Top Holdings</p>
                  <div className="flex flex-col gap-1.5">
                    {stats.topHoldings.map((h) => (
                      <div key={h.ticker}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-300 font-mono">{h.ticker}</span>
                          <span className="text-xs text-gray-400">{h.pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1 bg-white/8 rounded-full mt-0.5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/60 rounded-full"
                            style={{ width: `${Math.min(h.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sector breakdown */}
                {stats.sectors.length > 0 && (
                  <div className="pt-3 border-t border-white/8">
                    <p className="text-xs text-gray-500 uppercase font-mono tracking-wider mb-2">Sectors</p>
                    <div className="flex flex-col gap-1.5">
                      {stats.sectors.map((s) => (
                        <div key={s.name}>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-300 truncate max-w-20" title={s.name}>{s.name}</span>
                            <span className="text-xs text-gray-400">{s.pct}%</span>
                          </div>
                          <div className="h-1 bg-white/8 rounded-full mt-0.5 overflow-hidden">
                            <div
                              className="h-full bg-blue-500/60 rounded-full"
                              style={{ width: `${Math.min(parseFloat(s.pct), 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chart area */}
          <div className="flex-1 p-4 bg-[#0a0a0f] relative" style={{ minHeight: "520px" }}>
            {isHistoryLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 text-xs">Loading history…</p>
                </div>
              </div>
            )}
            <LineChart
              portfolioName={portfolioData.name}
              historicalData={historicalData}
              predictionData={predictionData}
              predictedShifts={predictedShifts}
              isLoading={isHistoryLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionTools;
