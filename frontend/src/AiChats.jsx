import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, ChevronLeft, ChevronRight, Copy, ExternalLink, FileText, MessageSquareText, Trash2, X } from "lucide-react";
import { BASE_URL } from "./lib/utils";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const hasItems = (items) => Array.isArray(items) && items.some((item) => String(item ?? "").trim() !== "");

const cleanItems = (items) => (Array.isArray(items) ? items.filter((item) => String(item ?? "").trim() !== "") : []);

const sectionLines = (label, items) => {
  const values = cleanItems(items);
  if (!values.length) return "";
  return `${label}:\n${values.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
};

const Section = ({ title, items, wide = false }) => {
  const values = cleanItems(items);
  if (values.length === 0) return null;

  return (
    <section className={`rounded-lg border border-white/8 bg-black/20 p-6 ${wide ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">{title}</h3>
      </div>
      <ol className="space-y-3">
        {values.map((item, index) => (
          <li key={`${title}-${item}-${index}`} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
            <span className="mt-0.5 text-xs font-mono text-emerald-400">{index + 1}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

const CompactMeta = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="text-xs text-gray-300 mt-1">{value}</p>
    </div>
  );
};

const AiChats = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selected = useMemo(
    () => chats.find((chat) => chat.id === selectedId) ?? null,
    [chats, selectedId]
  );

  const populatedSections = selected?.review
    ? [
        hasItems(selected.review.reasoning) && "Reasoning",
        hasItems(selected.review.suggestedDrivers) && "Drivers",
        hasItems(selected.review.modelBuildPlan) && "Build Plan",
        hasItems(selected.review.assumptionsToSensitize) && "Sensitivities",
        hasItems(selected.review.spreadsheetChecks) && "Checks",
        hasItems(selected.review.risks) && "Risks",
        hasItems(selected.review.diligenceQuestions) && "Diligence",
        hasItems(selected.review.nextSteps) && "Next Steps",
      ].filter(Boolean)
    : [];

  const fetchChats = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${BASE_URL}/ai/chats`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Could not load AI chats" }));
        throw new Error(err.error ?? "Could not load AI chats");
      }
      const data = await response.json();
      setChats(data);
      setSelectedId((current) => (data.some((chat) => chat.id === current) ? current : null));
    } catch (err) {
      setError(err.message || "Could not load AI chats");
    }
    setIsLoading(false);
  };

  const deleteChat = async (id) => {
    await fetch(`${BASE_URL}/ai/chats/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setChats((items) => {
      const next = items.filter((item) => item.id !== id);
      if (selectedId === id) setSelectedId(null);
      return next;
    });
  };

  const buildContinuePrompt = (chat) => {
    if (!chat?.review) return "";
    const review = chat.review;
    const comps = Array.isArray(review.comparableCompanies)
      ? review.comparableCompanies
          .map((company) => `${company.ticker || "N/A"} - ${company.name || "Unknown"}: ${company.rationale || "No rationale saved"}`)
          .join("\n")
      : "";

    return [
      `I am working on a TCM / investment banking model review for ${chat.companyName || chat.title}${chat.ticker ? ` (${chat.ticker})` : ""}.`,
      `Recommended modeling approach: ${review.recommendedValuation || "Not specified"}`,
      review.confidence ? `Confidence: ${review.confidence}` : "",
      comps ? `Comparable companies:\n${comps}` : "",
      sectionLines("Reasoning", review.reasoning),
      sectionLines("Key drivers", review.suggestedDrivers),
      sectionLines("Model build plan", review.modelBuildPlan),
      sectionLines("Assumptions to sensitize", review.assumptionsToSensitize),
      sectionLines("Spreadsheet checks", review.spreadsheetChecks),
      sectionLines("Risks", review.risks),
      sectionLines("Diligence questions", review.diligenceQuestions),
      sectionLines("Next steps", review.nextSteps),
      "Please continue from this context and help me refine the model, comps, assumptions, and next action list.",
    ].filter(Boolean).join("\n\n");
  };

  const copyContinuePrompt = async () => {
    if (!selected) return;
    const prompt = buildContinuePrompt(selected);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus("Context copied");
      setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Copy failed");
      setTimeout(() => setCopyStatus(""), 1800);
    }
  };

  const continueIn = async (target) => {
    await copyContinuePrompt();
    const urls = {
      chatgpt: "https://chatgpt.com/",
      claude: "https://claude.ai/new",
      gemini: "https://gemini.google.com/app",
      grok: "https://grok.com/",
    };
    window.open(urls[target] ?? urls.chatgpt, "_blank", "noopener,noreferrer");
  };

  const openComparableCompany = async (company) => {
    if (company.companyId) {
      navigate(`/CompanyInfo/${company.companyId}`);
      return;
    }
    if (!company.ticker) return;
    try {
      const response = await fetch(`${BASE_URL}/getters/checker/${encodeURIComponent(company.ticker)}`, {
        credentials: "include",
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.id) navigate(`/CompanyInfo/${data.id}`);
    } catch {
      return;
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen px-6 pb-12">
      <div className="pt-8 pb-6 border-b border-white/8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase mb-1">Workspace</p>
            <h1 className="text-3xl font-bold text-white">AI Model Reviews</h1>
            <p className="text-gray-400 text-sm mt-2">Saved TCM review outputs, comps, and modeling steps by user.</p>
          </div>
          <button
            onClick={() => navigate("/canalyst")}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 text-sm font-semibold"
          >
            New Review
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {chats.length === 0 ? (
        <div className="mt-10 border border-white/8 bg-[#0f0f14] rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-200 font-semibold">No saved reviews yet</p>
              <p className="text-sm text-gray-500 mt-1">Generate an AI Model Review from the TCM Generator to save one here.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/canalyst")}
            className="mt-6 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
          >
            Open TCM Generator
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-5 mt-6 ${sidebarOpen ? "xl:grid-cols-[360px_1fr]" : "xl:grid-cols-[44px_1fr]"}`}>
          <aside className="border border-white/8 bg-[#0f0f14] rounded-xl overflow-hidden self-start">
            <div className="px-3 py-3 border-b border-white/8 flex items-center justify-between gap-2">
              {sidebarOpen && (
                <>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Saved Reviews</p>
                  <span className="text-xs text-gray-500">{chats.length}</span>
                </>
              )}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="ml-auto p-1 rounded hover:bg-white/8 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                title={sidebarOpen ? "Collapse panel" : "Expand panel"}
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {sidebarOpen && <div className="max-h-[calc(100vh-190px)] overflow-y-auto">
              {chats.map((chat) => {
                const active = selected?.id === chat.id;
                const review = chat.review ?? {};
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedId(chat.id)}
                    className={`w-full text-left p-4 border-b border-white/8 transition-colors ${
                      active ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{chat.companyName || chat.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(chat.created_at)}</p>
                      </div>
                      {chat.ticker && (
                        <span className="shrink-0 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5">
                          {chat.ticker}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 line-clamp-2">
                      {review.recommendedValuation || "Saved AI model review"}
                    </p>
                  </button>
                );
              })}
            </div>}
          </aside>

          {!selected ? (
            <section className="border border-white/8 bg-[#0f0f14] rounded-xl min-h-[520px] flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mx-auto h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <MessageSquareText className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mt-4">Select a saved review</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Choose a review from the left to inspect comps, modeling steps, sensitivities, and export context to ChatGPT or Claude.
                </p>
                <button
                  onClick={() => navigate("/canalyst")}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 text-sm font-semibold"
                >
                  New Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          ) : (
            <section className="border border-white/8 bg-[#0f0f14] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/8">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-mono uppercase tracking-wider text-emerald-400">Saved Review</p>
                      {selected.ticker && (
                        <span className="text-xs font-mono text-gray-300 bg-white/6 border border-white/10 rounded px-2 py-0.5">
                          {selected.ticker}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-2 truncate">{selected.companyName || selected.title}</h2>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(selected.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => setSelectedId(null)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/8 text-xs font-semibold"
                    >
                      <X className="w-3.5 h-3.5" />
                      Hide
                    </button>
                    <button
                      onClick={copyContinuePrompt}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/8 text-xs font-semibold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copyStatus || "Copy Context"}
                    </button>
                    <button
                      onClick={() => continueIn("chatgpt")}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      ChatGPT
                    </button>
                    <button
                      onClick={() => continueIn("claude")}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Claude
                    </button>
                    <button
                      onClick={() => continueIn("gemini")}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 text-xs font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Gemini
                    </button>
                    <button
                      onClick={() => continueIn("grok")}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 text-xs font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Grok
                    </button>
                    <button
                      onClick={() => deleteChat(selected.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 mt-5">
                  <div className="rounded-lg bg-black/20 border border-white/8 p-4">
                    <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Recommended Approach</p>
                    <p className="text-base font-semibold text-white mt-2">{selected.review.recommendedValuation}</p>
                    {selected.review.confidence && (
                      <p className="text-xs text-gray-500 mt-2">Confidence: {selected.review.confidence}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-black/20 border border-white/8 p-4 grid grid-cols-2 md:grid-cols-1 gap-3">
                    <CompactMeta label="Source" value={selected.metadata?.fileName} />
                    <CompactMeta label="Sections" value={populatedSections.join(", ")} />
                  </div>
                </div>
              </div>

              <div className="p-6 grid gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Section title="Why This Model" items={selected.review.reasoning} />
                  <Section title="Suggested Modeling Steps" items={selected.review.modelBuildPlan} />
                  <Section title="Key Drivers" items={selected.review.suggestedDrivers} />
                  <Section title="Sensitivities" items={selected.review.assumptionsToSensitize} />
                  <Section title="Spreadsheet Checks" items={selected.review.spreadsheetChecks} />
                  <Section title="Risks" items={selected.review.risks} />
                  <Section title="Diligence Questions" items={selected.review.diligenceQuestions} />
                  <Section title="Next Steps" items={selected.review.nextSteps} wide />
                </div>

                {Array.isArray(selected.review.comparableCompanies) && selected.review.comparableCompanies.length > 0 && (
                  <section className="pt-6 border-t border-white/8">
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500">Comparable Companies</h3>
                      </div>
                      <p className="text-xs text-gray-600">Click a matched company to open its profile.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {selected.review.comparableCompanies.map((company, index) => {
                        const clickable = Boolean(company.companyId || company.ticker);
                        const content = (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{company.name || company.ticker}</p>
                                <p className="text-xs font-mono text-emerald-400 mt-1">{company.ticker}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {company.confidence && <span className="text-[11px] text-gray-500">{company.confidence}</span>}
                                {clickable && <ArrowUpRight className="w-4 h-4 text-gray-500" />}
                              </div>
                            </div>
                            {company.rationale && (
                              <p className="text-xs text-gray-400 leading-relaxed mt-3">{company.rationale}</p>
                            )}
                          </>
                        );

                        return clickable ? (
                          <button
                            key={`${company.ticker}-${index}`}
                            onClick={() => openComparableCompany(company)}
                            className="text-left rounded-lg border border-white/8 bg-black/20 p-5 hover:bg-white/5 hover:border-emerald-500/25 transition-colors"
                          >
                            {content}
                          </button>
                        ) : (
                          <div key={`${company.ticker}-${index}`} className="rounded-lg border border-white/8 bg-black/20 p-5">
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
};

export default AiChats;
