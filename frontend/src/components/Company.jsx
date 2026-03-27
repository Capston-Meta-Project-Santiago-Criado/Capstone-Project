import { useNavigate } from "react-router-dom";
import { UserInfo } from "../context/UserContext";
import cn from "classnames";

const MODE_FIT = "fit";

const Company = ({ companyFacts, mode }) => {
  const { setSelectedId } = UserInfo();
  const navigate = useNavigate();

  const isPositive = companyFacts.dailyChange >= 0;

  const handleView = () => {
    navigate(`/CompanyInfo/${companyFacts.id}`);
    setSelectedId(companyFacts.id);
  };

  return (
    <div
      onClick={handleView}
      className={cn(
        "relative flex flex-col justify-between rounded-xl cursor-pointer",
        "transition-all duration-300 ease-in-out p-4",
        "border hover:scale-105 hover:-translate-y-1",
        {
          // home page cards
          "w-52 h-36 mb-4 mr-3 bg-[#0f0f14]": mode !== MODE_FIT,
          "border-emerald-500/25 hover:border-emerald-400/60 hover:shadow-[0_4px_24px_rgba(52,211,153,0.15)]":
            mode !== MODE_FIT && isPositive,
          "border-red-500/25 hover:border-red-400/60 hover:shadow-[0_4px_24px_rgba(239,68,68,0.15)]":
            mode !== MODE_FIT && !isPositive,
          // portfolio fit cards
          "w-44 h-28 mb-2 mr-2 bg-[#0f0f14]": mode === MODE_FIT,
          "border-emerald-500/20 hover:border-emerald-400/50": mode === MODE_FIT && isPositive,
          "border-red-500/20 hover:border-red-400/50": mode === MODE_FIT && !isPositive,
        }
      )}
    >
      {/* top row: ticker badge + direction arrow */}
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-mono font-bold tracking-wider text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
          {companyFacts.ticker}
        </span>
        <span
          className={cn("text-xs font-bold", {
            "text-emerald-400": isPositive,
            "text-red-400": !isPositive,
          })}
        >
          {isPositive ? "▲" : "▼"}
        </span>
      </div>

      {/* company name */}
      <p
        className={cn("font-semibold text-white leading-tight truncate", {
          "text-sm": mode === MODE_FIT,
          "text-[15px]": mode !== MODE_FIT,
        })}
      >
        {companyFacts.name}
      </p>

      {/* price + change */}
      <div className="flex items-end justify-between">
        <span
          className={cn("font-bold text-white", {
            "text-lg": mode !== MODE_FIT,
            "text-base": mode === MODE_FIT,
          })}
        >
          ${companyFacts.daily}
        </span>
        <span
          className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", {
            "bg-emerald-900/50 text-emerald-400": isPositive,
            "bg-red-900/50 text-red-400": !isPositive,
          })}
        >
          {isPositive ? "+" : ""}
          {companyFacts.dailyChange}%
        </span>
      </div>
    </div>
  );
};

export default Company;
