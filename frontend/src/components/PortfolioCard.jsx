import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "./ui/popover";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../lib/utils";
import { useParams } from "react-router-dom";

export const DeleteButton = ({ deleteCard, isCard }) => {
  const { id } = useParams();

  const deletePortfolio = async () => {
    await fetch(`${BASE_URL}/portfolios/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
  };

  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-900/50 hover:border-red-500/40 transition-all duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          Delete
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 bg-[#0f0f14] border border-white/10 m-2" side="top">
        <div className="grid gap-3">
          <h2 className="font-semibold text-white text-center text-sm">Delete Portfolio?</h2>
          <p className="text-xs text-gray-400 text-center">All data will be permanently lost.</p>
          <PopoverClose asChild>
            <button
              className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors duration-200"
              onClick={async (e) => {
                e.stopPropagation();
                if (isCard) {
                  deleteCard(e);
                } else {
                  await deletePortfolio();
                  navigate("/portfolios");
                }
              }}
            >
              Confirm Delete
            </button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const PortfolioCard = ({ id, name, description, setPortfolios, canDelete, creator }) => {
  const navigate = useNavigate();
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/portfolios/performance/${id}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPerformance(data.dailyChange); })
      .catch(() => {});
  }, [id]);

  const deleteCard = async () => {
    await fetch(`${BASE_URL}/portfolios/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setPortfolios((self) => self.filter((val) => val.id !== id));
  };

  return (
    <div
      className="w-full bg-[#0f0f14] border border-white/8 rounded-xl p-5 cursor-pointer hover:border-white/15 hover:bg-[#12121a] transition-all duration-200"
      onClick={() => navigate(`/portfolios/${id}`)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white truncate">{name}</h2>
          {description && (
            <p className="text-sm text-gray-400 mt-1 truncate">{description}</p>
          )}
          {creator && (
            <p className="text-xs text-gray-500 mt-2">
              by <span className="text-gray-300 font-medium">{creator}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {performance !== null && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                performance >= 0
                  ? "bg-emerald-900/40 text-emerald-400 border-emerald-500/30"
                  : "bg-red-900/40 text-red-400 border-red-500/30"
              }`}
            >
              {performance >= 0 ? "▲ +" : "▼ "}
              {performance}% today
            </span>
          )}
          {canDelete && <DeleteButton deleteCard={deleteCard} isCard={true} />}
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
