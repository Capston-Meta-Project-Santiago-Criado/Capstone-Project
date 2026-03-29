import { useNavigate } from "react-router-dom";
import { UserInfo } from "../context/UserContext";
import { Bell, BellOff, ArrowRight } from "lucide-react";

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const InboxList = () => {
  const { notifications } = UserInfo();
  const navigate = useNavigate();

  // Loading state
  if (notifications === null) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-gray-400" />
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0f0f14] border border-white/8 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-white/8 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-gray-400" />
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <BellOff className="w-10 h-10 text-gray-600" />
          <p className="text-gray-400 font-medium">No notifications yet</p>
          <p className="text-gray-600 text-sm text-center max-w-xs">
            You'll be notified here when your portfolio model finishes training.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Inbox</h1>
        <span className="ml-1 text-xs font-semibold text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          {notifications.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => navigate("/" + notif.url)}
            className="group bg-[#0f0f14] border border-white/8 rounded-xl px-5 py-4 cursor-pointer hover:border-emerald-500/30 hover:bg-[#12121a] transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-sm text-gray-200 leading-relaxed">{notif.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 shrink-0 mt-0.5 transition-colors duration-200" />
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-5">{timeAgo(notif.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InboxList;
