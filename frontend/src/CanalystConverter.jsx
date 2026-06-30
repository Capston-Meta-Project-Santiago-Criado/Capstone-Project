import { useState, useRef } from "react";
import { BASE_URL } from "./lib/utils";
import { UserInfo } from "./context/UserContext";

const CanalystConverter = () => {
  const { isGuest, isLoggedIn } = UserInfo();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [aiStatus, setAiStatus] = useState("idle"); // idle | loading | done | error
  const [aiReview, setAiReview] = useState(null);
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const [aiLoadingStep, setAiLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  const aiLoadingMessages = [
    "Parsing historicals",
    "Choosing modeling focus",
    "Finding useful comps",
    "Drafting modeling steps",
  ];

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".xlsx")) {
      setErrorMsg("Please select a .xlsx file.");
      setFile(null);
      return;
    }
    setFile(f);
    setErrorMsg("");
    setStatus("idle");
    setAiReview(null);
    setAiErrorMsg("");
    setAiStatus("idle");
    setAiLoadingStep(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".xlsx")) {
      setErrorMsg("Please drop a .xlsx file.");
      return;
    }
    setFile(f);
    setErrorMsg("");
    setStatus("idle");
    setAiReview(null);
    setAiErrorMsg("");
    setAiStatus("idle");
    setAiLoadingStep(0);
  };

  const handleConvert = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");

    try {
      const form = new FormData();
      form.append("canalystFile", file);

      const response = await fetch(`${BASE_URL}/excel/canalyst-to-tcm`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error ?? `Error ${response.status}`);
      }

      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `tcm-${file.name.replace(/\.xlsx$/i, "")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message || "Conversion failed");
      setStatus("error");
    }
  };

  const handleAiReview = async () => {
    if (!file) return;
    setAiStatus("loading");
    setAiErrorMsg("");
    setAiLoadingStep(0);

    const loadingTimer = setInterval(() => {
      setAiLoadingStep((step) => Math.min(step + 1, aiLoadingMessages.length - 1));
    }, 1800);

    try {
      const form = new FormData();
      form.append("canalystFile", file);

      const response = await fetch(`${BASE_URL}/ai/tcm-review`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "AI review failed" }));
        throw new Error(err.error ?? `Error ${response.status}`);
      }

      const data = await response.json();
      setAiReview(data);
      setAiStatus("done");
    } catch (err) {
      setAiErrorMsg(err.message || "AI review failed");
      setAiStatus("error");
    } finally {
      clearInterval(loadingTimer);
    }
  };

  const renderAiList = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, 5).map((item, index) => (
          <li key={`${item}-${index}`} className="text-xs text-gray-400 leading-relaxed">
            <span className="text-emerald-400 font-semibold">{index + 1}.</span>{" "}
            {item}
          </li>
        ))}
      </ul>
    );
  };

  const renderComps = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <div className="mt-2 grid gap-2">
        {items.slice(0, 6).map((item, index) => (
          <div key={`${item.ticker}-${index}`} className="rounded-lg border border-white/8 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-mono font-semibold text-emerald-400">{item.ticker}</p>
              {item.confidence && <p className="text-[11px] text-gray-500">{item.confidence}</p>}
            </div>
            <p className="text-xs font-semibold text-gray-300 mt-0.5">{item.name}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.rationale}</p>
          </div>
        ))}
      </div>
    );
  };

  if (isGuest && !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-3">Sign in to use the TCM Generator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          TCM Generator
        </h1>
        <p className="text-gray-400 text-sm">
          Upload a Canalyst model to generate a TCM Historical Excel file in the club format.
          Get Canalyst models at{" "}
          <a
            href="https://research.alpha-sense.com/canalyst/models"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
          >
            research.alpha-sense.com/canalyst/models
          </a>
          .
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-14 cursor-pointer transition-all duration-200 ${
          file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/15 bg-white/3 hover:border-emerald-500/40 hover:bg-white/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFile}
        />
        <div className="text-3xl">📊</div>
        {file ? (
          <>
            <p className="text-sm font-semibold text-emerald-400">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-300">
              Drop a Canalyst .xlsx file here, or click to browse
            </p>
            <p className="text-xs text-gray-500">Maximum 50 MB</p>
          </>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {errorMsg}
        </p>
      )}

      {/* Success */}
      {status === "done" && (
        <p className="mt-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
          ✓ Download started. Check your Downloads folder.
        </p>
      )}

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={!file || status === "uploading"}
        className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          !file || status === "uploading"
            ? "bg-white/6 text-gray-500 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-500 text-white"
        }`}
      >
        {status === "uploading" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating… (this may take 10–20 seconds)
          </span>
        ) : (
          "Generate & Download TCM"
        )}
      </button>

      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-gray-300 font-semibold text-sm">AI Model Review</p>
            <p className="text-xs text-gray-500 mt-1">
              Get suggested modeling focus, key drivers, and modeling checks from the uploaded historicals.
            </p>
          </div>
          <button
            onClick={handleAiReview}
            disabled={!file || aiStatus === "loading"}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              !file || aiStatus === "loading"
                ? "bg-white/6 text-gray-500 cursor-not-allowed"
                : "bg-blue-600/80 hover:bg-blue-500 text-white"
            }`}
          >
            {aiStatus === "loading" ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Thinking…
              </span>
            ) : (
              "Generate Review"
            )}
          </button>
        </div>

        {aiErrorMsg && (
          <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {aiErrorMsg}
          </p>
        )}

        {aiStatus === "loading" && (
          <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {/* Pulsing "thinking" symbol */}
                <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/40" />
                  <span className="text-sm leading-none">🧠</span>
                </span>
                <p className="text-xs font-semibold text-blue-300 flex items-center gap-1">
                  {aiLoadingMessages[aiLoadingStep]}
                  {/* Animated bouncing dots */}
                  <span className="inline-flex items-end gap-0.5 ml-0.5">
                    <span className="h-1 w-1 rounded-full bg-blue-300 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1 w-1 rounded-full bg-blue-300 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1 w-1 rounded-full bg-blue-300 animate-bounce" />
                  </span>
                </p>
              </div>
              <p className="text-[11px] text-gray-500 shrink-0">Usually 10-20 seconds</p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-700"
                style={{ width: `${25 + aiLoadingStep * 22}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              The AI is reading the uploaded model summary, selecting comps, and building a practical analyst checklist.
            </p>
          </div>
        )}

        {aiReview && (
          <div className="mt-4 grid gap-4">
            <div className="rounded-lg bg-black/20 border border-white/8 p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Recommended Approach</p>
              <p className="text-sm font-semibold text-white mt-1">{aiReview.recommendedValuation}</p>
              {aiReview.confidence && (
                <p className="text-xs text-gray-500 mt-1">Confidence: {aiReview.confidence}</p>
              )}
              {aiReview.chatId && (
                <p className="text-xs text-emerald-400 mt-2">Saved to AI Chats.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Reasoning</p>
                {renderAiList(aiReview.reasoning)}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Key Drivers</p>
                {renderAiList(aiReview.suggestedDrivers)}
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Comparable Companies</p>
                {renderComps(aiReview.comparableCompanies)}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Model Build Plan</p>
                {renderAiList(aiReview.modelBuildPlan)}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Sensitivities</p>
                {renderAiList(aiReview.assumptionsToSensitize)}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Checks</p>
                {renderAiList(aiReview.spreadsheetChecks)}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Diligence Questions</p>
                {renderAiList(aiReview.diligenceQuestions)}
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Next Steps</p>
                {renderAiList(aiReview.nextSteps)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="mt-8 rounded-xl border border-white/8 bg-white/3 p-5 text-xs text-gray-400 space-y-1.5">
        <p className="text-gray-300 font-semibold text-sm mb-2">What gets generated</p>
        <p>• <span className="text-gray-300">Profit &amp; Loss</span> — Revenue, Gross Profit, EBIT, EBITDA, Net Income, EPS with growth &amp; margin rows</p>
        <p>• <span className="text-gray-300">Cash Flow Statement</span> — Full as-reported CFO / CFI / CFF detail with NWC breakdown</p>
        <p>• <span className="text-gray-300">Balance Sheet</span> — Complete assets, liabilities, and equity as reported</p>
        <p className="mt-2 text-gray-500">Values are in $ millions. Annual (6 years) + quarterly (28 quarters) where available.</p>
      </div>
    </div>
  );
};

export default CanalystConverter;
