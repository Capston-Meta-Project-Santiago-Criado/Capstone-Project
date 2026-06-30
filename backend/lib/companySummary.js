// AI business-summary generation.
//
// Two generators, both reusing the Anthropic pattern from routes/ai.js:
//   - generateCompanySummary: a per-company business + revenue-breakdown summary,
//     grounded in the most recent 10-K via the web_fetch server tool when available,
//     falling back to the model's general knowledge otherwise.
//   - generatePortfolioRollup: one portfolio-level rollup built from the holdings
//     (no web_fetch); cheap.
//
// Callers (routes/ai.js) handle the cache check + persistence. `coalesce` dedupes
// concurrent first-view generations for the same id within this process.

const Anthropic = require("@anthropic-ai/sdk");

const MODEL = (process.env.ANTHROPIC_MODEL || "claude-haiku-4-5").trim();

const summaryTool = {
  name: "return_company_summary",
  description: "Return a structured business summary with an approximate revenue breakdown.",
  input_schema: {
    type: "object",
    properties: {
      overview: {
        type: "string",
        description: "2-4 sentence plain-English description of what the company does and how it makes money.",
      },
      segments: {
        type: "array",
        description: "Revenue breakdown by reportable segment / product line / geography. Percentages are approximate and should roughly sum to 100.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            revenuePct: { type: "number", description: "Approximate % of total revenue (0-100)." },
            note: { type: "string", description: "Optional one-line note about the segment." },
          },
          required: ["name", "revenuePct"],
        },
      },
      sourceNote: { type: "string", description: "Brief note on what the breakdown is based on (e.g. 'FY24 10-K segment disclosures')." },
    },
    required: ["overview", "segments"],
  },
};

const rollupTool = {
  name: "return_portfolio_rollup",
  description: "Return a structured rollup of the portfolio's composition.",
  input_schema: {
    type: "object",
    properties: {
      overview: { type: "string", description: "2-4 sentences on the portfolio's overall character and what it is concentrated in." },
      themes: { type: "array", items: { type: "string" }, description: "3-5 cross-cutting themes or shared drivers across the holdings." },
      exposures: {
        type: "array",
        description: "Key sector / end-market / factor exposures.",
        items: {
          type: "object",
          properties: { label: { type: "string" }, note: { type: "string" } },
          required: ["label"],
        },
      },
    },
    required: ["overview"],
  },
};

const cleanStr = (v) => (typeof v === "string" ? v.trim() : "");
const cleanStrArr = (arr) =>
  Array.isArray(arr) ? arr.map(cleanStr).filter(Boolean) : [];

const extractTool = (response, name) => {
  const block = response?.content?.find((p) => p.type === "tool_use" && p.name === name);
  return block?.input || null;
};

const normalizeSummary = (out) => ({
  overview: cleanStr(out.overview),
  segments: (Array.isArray(out.segments) ? out.segments : [])
    .map((s) => ({
      name: cleanStr(s.name),
      revenuePct:
        s.revenuePct != null && Number.isFinite(Number(s.revenuePct))
          ? Math.max(0, Math.min(100, Math.round(Number(s.revenuePct) * 10) / 10))
          : null,
      note: cleanStr(s.note),
    }))
    .filter((s) => s.name),
  sourceNote: cleanStr(out.sourceNote),
});

// Generate the per-company summary. `tenK` is the most-recent 10-K Document row
// ({ url, filed_date }) or null.
async function generateCompanySummary(company, tenK) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const baseSystem =
    "You are an equity research analyst. Write a concise, accurate business summary of the company, " +
    "focusing especially on its REVENUE BREAKDOWN by reportable segment, product line, or geography, " +
    "with approximate percentages of total revenue. Do not give buy/sell/hold or price-target advice. " +
    "When you have the breakdown, call the return_company_summary tool.";

  // Attempt 1 — ground in the most recent 10-K via the web_fetch server tool.
  if (tenK?.url) {
    try {
      const resp = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0.3,
        betas: ["web-fetch-2025-09-10"],
        system: baseSystem,
        tools: [
          { type: "web_fetch_20250910", name: "web_fetch", max_uses: 3, max_content_tokens: 60000 },
          summaryTool,
        ],
        messages: [
          {
            role: "user",
            content:
              `Company: ${company.name} (${company.ticker}).\n` +
              `Fetch this most-recent 10-K and base the revenue breakdown on its segment disclosures ` +
              `(the segment footnote / Item 7 MD&A): ${tenK.url}\n` +
              `Then call return_company_summary with the segment percentages.`,
          },
        ],
      });
      const out = extractTool(resp, "return_company_summary");
      if (out && Array.isArray(out.segments) && out.segments.length) {
        return {
          ...normalizeSummary(out),
          source: "10-K",
          filingUrl: tenK.url,
          filedDate: tenK.filed_date ? new Date(tenK.filed_date).toISOString() : null,
        };
      }
    } catch (_) {
      // web_fetch unavailable / SEC blocked / extraction failed -> general knowledge
    }
  }

  // Attempt 2 — general knowledge fallback.
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.3,
    system: baseSystem + " No filing is available, so use your general knowledge and clearly treat the percentages as approximate.",
    tools: [summaryTool],
    tool_choice: { type: "tool", name: "return_company_summary" },
    messages: [
      {
        role: "user",
        content:
          `Company: ${company.name} (${company.ticker})` +
          (company.description ? `. Reference description: ${String(company.description).slice(0, 1500)}` : "") +
          `.\nGive a concise business summary and an approximate revenue breakdown by segment / product / geography.`,
      },
    ],
  });
  const out = extractTool(resp, "return_company_summary");
  if (!out) throw new Error("Model did not return a company summary");
  return { ...normalizeSummary(out), source: "general-knowledge" };
}

// Generate one portfolio-level rollup. `companies` = the member company rows
// (with optional industry + cached aiSummary). No web_fetch.
async function generatePortfolioRollup(portfolio, companies) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const holdings = (companies || [])
    .map((c) => {
      const sector = c.industry?.sector?.name || c.industry?.name || "";
      const overview = c.aiSummary?.overview ? ` — ${String(c.aiSummary.overview).slice(0, 240)}` : "";
      return `- ${c.name} (${c.ticker})${sector ? ` [${sector}]` : ""}${overview}`;
    })
    .join("\n");

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    temperature: 0.3,
    system:
      "You are an equity research analyst. Summarize the overall composition and exposures of this portfolio of holdings. " +
      "Do not give buy/sell/hold or price-target advice. Call return_portfolio_rollup.",
    tools: [rollupTool],
    tool_choice: { type: "tool", name: "return_portfolio_rollup" },
    messages: [
      {
        role: "user",
        content:
          `Portfolio: ${portfolio.name}.\nHoldings:\n${holdings || "(no companies)"}\n\n` +
          `Summarize the portfolio's composition, shared themes, and key sector / end-market exposures.`,
      },
    ],
  });
  const out = extractTool(resp, "return_portfolio_rollup");
  if (!out) throw new Error("Model did not return a portfolio rollup");
  return {
    overview: cleanStr(out.overview),
    themes: cleanStrArr(out.themes),
    exposures: (Array.isArray(out.exposures) ? out.exposures : [])
      .map((e) => ({ label: cleanStr(e.label), note: cleanStr(e.note) }))
      .filter((e) => e.label),
    source: "holdings",
  };
}

// Coalesce concurrent generations for the same key (single-process dedupe).
const _inflight = new Map();
function coalesce(key, fn) {
  if (_inflight.has(key)) return _inflight.get(key);
  const p = Promise.resolve()
    .then(fn)
    .finally(() => _inflight.delete(key));
  _inflight.set(key, p);
  return p;
}

module.exports = { generateCompanySummary, generatePortfolioRollup, coalesce };
