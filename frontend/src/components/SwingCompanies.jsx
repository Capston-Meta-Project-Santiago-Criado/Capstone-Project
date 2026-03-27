const MODE_DAY = "Day";
const MODE_WEEK = "Week";
const MODE_MONTH = "Month";
const MODE_YEAR = "Year";

const SwingCompanies = ({
  companiesStockData,
  companiesData,
  setHistoricalMode,
  sortedSwings,
  historicalMode,
  portfolioData,
}) => {
  const companiesStocks = portfolioData?.companiesStocks ?? [];
  const companiesIds = portfolioData?.companiesIds ?? [];

  // Build ranked rows depending on mode
  let rows = [];

  if (historicalMode === MODE_DAY) {
    // Use live stock data — no dependency on sortedSwings API
    if (companiesData && companiesStockData && companiesStockData.length > 0) {
      rows = companiesData
        .map((company, ind) => {
          const stockInfo = companiesStockData[ind];
          if (!stockInfo) return null;
          const price = stockInfo.price ?? 0;
          const dayStart = stockInfo.dayStart ?? price;
          const pct = dayStart > 0 ? ((price - dayStart) / dayStart) * 100 : 0;
          const sharesIdx = companiesIds.indexOf(company.id);
          const shares = sharesIdx >= 0 ? (companiesStocks[sharesIdx] ?? 1) : 1;
          const pnl = (price - dayStart) * shares;
          return { id: company.id, name: company.name, ticker: company.ticker, pct, pnl, shares };
        })
        .filter(Boolean)
        .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    }
  } else {
    // Use historical swings from API
    if (sortedSwings && companiesData) {
      rows = sortedSwings
        .map((value) => {
          const comp = companiesData.find((c) => c.id === value.id);
          if (!comp || value.firstVal == null || value.finalVal == null) return null;
          const sharesIdx = companiesIds.indexOf(value.id);
          const shares = sharesIdx >= 0 ? (companiesStocks[sharesIdx] ?? 1) : 1;
          const pnl = (value.finalVal.close - value.firstVal.close) * shares;
          return {
            id: value.id,
            name: comp.name,
            ticker: comp.ticker,
            pct: value.percentChange,
            pnl,
            shares,
            fromPrice: value.firstVal.close,
            toPrice: value.finalVal.close,
          };
        })
        .filter(Boolean);
    }
  }

  const isLoading =
    historicalMode === MODE_DAY
      ? !companiesData || !companiesStockData
      : sortedSwings == null || !companiesData;

  return (
    <div className="flex flex-col bg-[#0f0f14] border border-white/8 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
        <h3 className="font-bold text-lg text-white flex-1">Largest Swings</h3>
        <select
          value={historicalMode}
          onChange={(e) => setHistoricalMode(e.target.value)}
          className="text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value={MODE_DAY}>Day</option>
          <option value={MODE_WEEK}>Week</option>
          <option value={MODE_MONTH}>Month</option>
          <option value={MODE_YEAR}>Year</option>
        </select>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 px-4 py-2 border-b border-white/6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span className="w-6 text-center">#</span>
        <span>Company</span>
        <span className="text-right w-20">Change</span>
        <span className="text-right w-24">P&L</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y divide-white/5 max-h-72 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-10 w-full">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="flex items-center justify-center py-10">
            <p className="text-gray-500 text-sm">No data available for this period</p>
          </div>
        )}
        {!isLoading &&
          rows.map((row, i) => {
            const isUp = row.pct >= 0;
            const pnlUp = row.pnl >= 0;
            return (
              <div
                key={row.id}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 items-center px-4 py-3 hover:bg-white/3 transition-colors"
              >
                <span className="w-6 text-center text-xs font-bold text-gray-600">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{row.name}</p>
                  <p className="text-xs text-gray-500">{row.ticker} · {row.shares} shares</p>
                </div>
                <div className={`text-right w-20 text-sm font-bold font-mono ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                  {isUp ? "+" : ""}{row.pct.toFixed(2)}%
                </div>
                <div className={`text-right w-24 text-sm font-mono ${pnlUp ? "text-emerald-400" : "text-red-400"}`}>
                  {pnlUp ? "+$" : "-$"}{Math.abs(row.pnl).toFixed(2)}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default SwingCompanies;
