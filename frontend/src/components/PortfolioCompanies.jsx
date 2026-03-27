import { Pencil, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import cn from "classnames";
import { toPercentage } from "../lib/utils";
import { EDITOR_PERMS } from "../lib/constants";

const PortfolioCompanies = ({
  companiesStockData,
  handleDelete,
  companiesData,
  isEditingMode,
  setIsEditingMode,
  permission,
}) => {
  const navigate = useNavigate();
  const handleClick = (id) => {
    navigate(`/CompanyInfo/${id}`);
  };

  return (
    <div className="bg-[#0f0f14] border border-white/8 rounded-xl w-full overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
        <h3 className="font-bold text-lg text-white flex-1">Portfolio Companies</h3>
        {permission === EDITOR_PERMS &&
          companiesData != null &&
          companiesData.length !== 0 && (
            <button
              onClick={() => setIsEditingMode((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200",
                {
                  "bg-emerald-900/40 text-emerald-400 border-emerald-500/30": isEditingMode,
                  "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/8": !isEditingMode,
                }
              )}
            >
              <Pencil className="w-3 h-3" />
              {isEditingMode ? "Done" : "Edit"}
            </button>
          )}
      </div>
      <div className="flex flex-col gap-1 p-3 max-h-80 overflow-auto">
        {companiesStockData == null && (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {companiesStockData != null && companiesStockData.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">No companies yet</p>
        )}
        {companiesStockData != null &&
          companiesStockData.length !== 0 &&
          companiesData != null &&
          companiesData.map((value, ind) => {
            if (value == null || companiesStockData[ind] == null) return null;
            const percentChange = toPercentage(
              companiesStockData[ind].price,
              companiesStockData[ind].dayStart
            );
            const isPositive = percentChange >= 0;

            return (
              <div key={value.id} className="flex items-center gap-2">
                <div
                  onClick={() => handleClick(value.id)}
                  className={cn(
                    "flex-1 flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all duration-200",
                    {
                      "bg-emerald-900/20 border-emerald-500/20 hover:bg-emerald-900/30": isPositive,
                      "bg-red-900/20 border-red-500/20 hover:bg-red-900/30": !isPositive,
                    }
                  )}
                >
                  <span className="font-semibold text-white text-sm truncate max-w-[55%]">
                    {value.name}
                    <span className="text-gray-400 font-normal ml-1.5 text-xs">({value.ticker})</span>
                  </span>
                  <span className={cn("text-sm font-bold", {
                    "text-emerald-400": isPositive,
                    "text-red-400": !isPositive,
                  })}>
                    ${companiesStockData[ind].price.toFixed(2)}
                    <span className="text-xs ml-1.5 opacity-80">
                      {isPositive ? "+" : ""}{percentChange}%
                    </span>
                  </span>
                </div>
                {isEditingMode && (
                  <button
                    onClick={() => handleDelete(value.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default PortfolioCompanies;
