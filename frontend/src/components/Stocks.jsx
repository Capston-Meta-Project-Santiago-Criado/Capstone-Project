import { useState, useEffect } from "react";
import { BASE_URL } from "../lib/utils";
import { EDITOR_PERMS } from "../lib/constants";
import { Save } from "lucide-react";

const Stocks = ({
  companiesData,
  companiesStockData,
  portfolioData,
  portfolioValue,
  setPortfolioValue,
  perms,
}) => {
  const [shares, setShares] = useState([]);
  const [inputVals, setInputVals] = useState([]);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const canEdit = perms === EDITOR_PERMS;

  useEffect(() => {
    if (!companiesData || !portfolioData) return;
    // companiesStocks is ordered by companiesIds; reorder to match companiesData order
    const s = companiesData.map((company) => {
      const idx = portfolioData.companiesIds?.indexOf(company.id) ?? -1;
      return idx >= 0 ? (portfolioData.companiesStocks[idx] ?? 1) : 1;
    });
    setShares(s);
    setInputVals(s.map(String));
  }, [companiesData, portfolioData]);

  const commitShares = (ind, newVal) => {
    const clamped = Math.max(1, Math.round(newVal) || 1);
    const oldShares = shares[ind] ?? 1;
    setShares((prev) => {
      const next = [...prev];
      next[ind] = clamped;
      return next;
    });
    setInputVals((prev) => {
      const next = [...prev];
      next[ind] = String(clamped);
      return next;
    });
    if (companiesStockData) {
      const price = companiesStockData[ind]?.price ?? 0;
      setPortfolioValue((prev) =>
        (parseFloat(prev) - price * oldShares + price * clamped).toFixed(2)
      );
    }
    setIsSaved(false);
  };

  const saveStocks = async () => {
    setIsSaving(true);
    await fetch(`${BASE_URL}/portfolios/update/${portfolioData.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyStocks: shares }),
    });
    setIsSaving(false);
    setIsSaved(true);
  };

  const loading = !companiesData || !companiesStockData || !portfolioData || shares.length === 0;

  return (
    <div className="bg-[#0f0f14] border border-white/8 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg text-white">Holdings</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Total value:{" "}
            <span className="text-emerald-400 font-bold">${portfolioValue}</span>
          </p>
        </div>
        {canEdit && !isSaved && (
          <button
            onClick={saveStocks}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors duration-200"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        )}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-2 border-b border-white/6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>Company</span>
        <span className="text-right">Price</span>
        <span className="text-center w-28">Shares</span>
        <span className="text-right w-24">Value</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y divide-white/5 max-h-105 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && companiesData.map((company, ind) => {
          const stockInfo = companiesStockData[ind];
          const price = stockInfo?.price ?? 0;
          const qty = shares[ind] ?? 1;
          const totalVal = (price * qty).toFixed(2);
          const dayStart = stockInfo?.dayStart ?? price;
          const pct = dayStart > 0 ? ((price - dayStart) / dayStart * 100) : 0;
          const isUp = pct >= 0;

          return (
            <div
              key={company.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-4 py-3 hover:bg-white/3 transition-colors"
            >
              {/* Company name + ticker */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{company.name}</p>
                <p className="text-xs text-gray-500">{company.ticker}</p>
              </div>

              {/* Price + daily change */}
              <div className="text-right">
                <p className="text-sm font-mono text-white">${price.toFixed(2)}</p>
                <p className={`text-xs font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                  {isUp ? "+" : ""}{pct.toFixed(2)}%
                </p>
              </div>

              {/* Shares stepper */}
              <div className="flex items-center gap-1 w-28">
                {canEdit ? (
                  <>
                    <button
                      onClick={() => commitShares(ind, qty - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-white/8 hover:bg-white/15 text-gray-300 transition-colors text-base leading-none p-0 border-0"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={inputVals[ind] ?? qty}
                      onChange={(e) => {
                        setInputVals((prev) => {
                          const next = [...prev];
                          next[ind] = e.target.value;
                          return next;
                        });
                      }}
                      onBlur={(e) => commitShares(ind, parseInt(e.target.value))}
                      className="w-14 text-center text-sm text-white bg-white/8 border border-white/15 rounded py-0.5 focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => commitShares(ind, qty + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-white/8 hover:bg-white/15 text-gray-300 transition-colors text-base leading-none p-0 border-0"
                    >
                      +
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-gray-300 text-center w-full">{qty} shares</span>
                )}
              </div>

              {/* Total value */}
              <div className="text-right w-24">
                <p className="text-sm font-mono text-emerald-400">${totalVal}</p>
                <p className="text-xs text-gray-500">{company.sector}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stocks;
