const express = require("express");
const multer = require("multer");
const Anthropic = require("@anthropic-ai/sdk");
const { PrismaClient } = require("../generated/prisma");
const { parseCanalyst } = require("../lib/canalystParser");
const { buildClubReference } = require("../lib/clubPitchLibrary");

const router = express.Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const prisma = new PrismaClient();

const MODEL = (process.env.ANTHROPIC_MODEL || "claude-haiku-4-5").trim();

const requireUser = (req, res) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to save AI chats." });
    return null;
  }
  return userId;
};

const safeNum = (value) => {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const compactSeries = (values = []) => values.map(safeNum).filter((value) => value != null);

const pct = (numerator, denominator) => {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
};

const cagr = (values) => {
  const clean = compactSeries(values);
  if (clean.length < 2 || clean[0] <= 0 || clean[clean.length - 1] <= 0) return null;
  return Number(((Math.pow(clean[clean.length - 1] / clean[0], 1 / (clean.length - 1)) - 1) * 100).toFixed(1));
};

const avg = (values) => {
  const clean = compactSeries(values);
  if (!clean.length) return null;
  return Number((clean.reduce((sum, value) => sum + value, 0) / clean.length).toFixed(1));
};

const latest = (values = []) => {
  for (let i = values.length - 1; i >= 0; i--) {
    const value = safeNum(values[i]);
    if (value != null) return value;
  }
  return null;
};

const findSubtotal = (items, patterns) => {
  for (const pattern of patterns) {
    const found = items.find((item) => pattern.test(item.tcmLabel ?? item.label ?? ""));
    if (found) return found;
  }
  return null;
};

const summarizeParsedModel = (parsed) => {
  const revenue = parsed.plData.revenue?.annual ?? [];
  const grossProfit = parsed.plData.grossProfit?.annual ?? [];
  const ebit = parsed.plData.ebit?.annual ?? [];
  const ebitda = parsed.plData.ebitda?.annual ?? [];
  const netIncome = parsed.plData.netIncome?.annual ?? [];
  const eps = parsed.plData.eps?.annual ?? [];
  const shares = parsed.plData.shares?.annual ?? [];
  const cfo = findSubtotal(parsed.cfData.cfo, [/^CFO$/i, /operating cash flow/i, /net cash provided by operating/i]);
  const capex = parsed.cfData.cfi.find((item) => /capex|capital expenditures|purchase.*property|plant|equipment/i.test(item.label ?? ""));
  const totalAssets = findSubtotal([...parsed.bsData.currAssets, ...parsed.bsData.noncurrAssets], [/total assets/i]);
  const totalLiabilities = findSubtotal([...parsed.bsData.currLiab, ...parsed.bsData.noncurrLiab], [/total liabilities/i, /total liab/i]);

  const latestRevenue = latest(revenue);
  const latestGrossProfit = latest(grossProfit);
  const latestEbit = latest(ebit);
  const latestEbitda = latest(ebitda);
  const latestNetIncome = latest(netIncome);
  const latestCfo = latest(cfo?.annual);
  const latestCapex = latest(capex?.annual);
  const latestAssets = latest(totalAssets?.annual);
  const latestLiabilities = latest(totalLiabilities?.annual);

  return {
    companyName: parsed.companyName,
    ticker: parsed.ticker,
    currency: parsed.currency,
    fiscalYearEnd: parsed.fiscalYearEnd,
    annualPeriods: parsed.annualPeriods,
    financials: {
      revenue: compactSeries(revenue),
      grossProfit: compactSeries(grossProfit),
      ebit: compactSeries(ebit),
      ebitda: compactSeries(ebitda),
      netIncome: compactSeries(netIncome),
      eps: compactSeries(eps),
      shares: compactSeries(shares),
      cfo: compactSeries(cfo?.annual),
      capex: compactSeries(capex?.annual),
    },
    metrics: {
      revenueCagrPct: cagr(revenue),
      avgGrossMarginPct: avg(grossProfit.map((value, i) => pct(value, revenue[i]))),
      avgEbitMarginPct: avg(ebit.map((value, i) => pct(value, revenue[i]))),
      avgEbitdaMarginPct: avg(ebitda.map((value, i) => pct(value, revenue[i]))),
      latestRevenue,
      latestGrossMarginPct: pct(latestGrossProfit, latestRevenue),
      latestEbitMarginPct: pct(latestEbit, latestRevenue),
      latestEbitdaMarginPct: pct(latestEbitda, latestRevenue),
      latestNetIncomeMarginPct: pct(latestNetIncome, latestRevenue),
      latestCfoConversionPct: pct(latestCfo, latestNetIncome),
      latestCapexPctRevenue: pct(Math.abs(latestCapex ?? 0), latestRevenue),
      latestLiabilitiesPctAssets: pct(latestLiabilities, latestAssets),
    },
    availableSections: {
      pAndL: Object.keys(parsed.plData).filter((key) => compactSeries(parsed.plData[key]?.annual).length > 0),
      cfoItems: parsed.cfData.cfo.length,
      cfiItems: parsed.cfData.cfi.length,
      cffItems: parsed.cfData.cff.length,
      bsItems: Object.values(parsed.bsData).reduce((sum, section) => sum + section.length, 0),
    },
  };
};

const buildModelingGuidance = (summary) => {
  const financials = summary.financials ?? {};
  const metrics = summary.metrics ?? {};
  const sections = summary.availableSections ?? {};
  const has = (key, count = 2) => (financials[key]?.length ?? 0) >= count;
  const focusOptions = [];
  const dataQualityFlags = [];

  if (has("revenue")) {
    focusOptions.push("Revenue build first: segment, volume/price, bookings, same-store, units, ARR, or other operating KPI bridge before valuation.");
  } else {
    dataQualityFlags.push("Revenue history is missing or too sparse, so the first task may be historical mapping rather than valuation.");
  }

  if (has("grossProfit")) {
    focusOptions.push("Gross profit build: revenue less COGS with gross margin bridge and mix assumptions.");
  } else {
    dataQualityFlags.push("Gross profit is missing, making gross margin and contribution economics hard to underwrite.");
  }

  if (has("ebitda") || has("ebit")) {
    focusOptions.push("EBIT/EBITDA build: operating expense schedule, margin bridge, add-backs, and normalized profitability.");
  } else {
    dataQualityFlags.push("EBIT/EBITDA history is missing, so a DCF may be premature until operating profit is reconstructed.");
  }

  if (has("cfo") || has("capex")) {
    focusOptions.push("Cash-flow bridge: CFO, capex, working capital, and FCF conversion before terminal value work.");
  } else {
    dataQualityFlags.push("Cash-flow support is limited, so free cash flow conversion should be diligenced before relying on DCF output.");
  }

  if ((sections.bsItems ?? 0) > 0) {
    focusOptions.push("Balance sheet / working capital schedule: net debt, leverage, working capital, or invested capital support where relevant.");
  }

  if (metrics.revenueCagrPct != null && Math.abs(metrics.revenueCagrPct) > 20) {
    focusOptions.push("Growth cohort or guidance bridge: explain the high revenue CAGR before extending a forecast.");
  }

  if (metrics.latestCfoConversionPct != null && (metrics.latestCfoConversionPct < 30 || metrics.latestCfoConversionPct > 150)) {
    focusOptions.push("Cash conversion diagnostic: reconcile CFO volatility, working capital swings, and one-time items.");
  }

  return {
    focusOptions,
    dataQualityFlags,
    instruction:
      "Pick the modeling workstream that best unlocks the next analyst step. It can be a build or schedule, not just a valuation method.",
  };
};

const getPeerContext = async (ticker) => {
  const company = await prisma.company.findUnique({
    where: { ticker },
    include: { industry: { include: { sector: true } } },
  });

  if (!company?.industryId) {
    return {
      uploadedCompany: company
        ? { ticker: company.ticker, name: company.name, industry: null, sector: null }
        : { ticker, name: null, industry: null, sector: null },
      databasePeerCandidates: [],
    };
  }

  const peers = await prisma.company.findMany({
    where: {
      ticker: { not: company.ticker },
      OR: [
        { industryId: company.industryId },
        { industry: { sectorId: company.industry?.sectorId } },
      ],
    },
    include: { industry: { include: { sector: true } } },
    orderBy: [{ industryId: "asc" }, { daily_price: "desc" }],
    take: 12,
  });

  return {
    uploadedCompany: {
      ticker: company.ticker,
      name: company.name,
      industry: company.industry?.name ?? null,
      sector: company.industry?.sector?.name ?? null,
    },
    databasePeerCandidates: peers.map((peer) => ({
      id: peer.id,
      ticker: peer.ticker,
      name: peer.name,
      industry: peer.industry?.name ?? null,
      sector: peer.industry?.sector?.name ?? null,
      latestPrice: peer.daily_price,
      dailyChangePct: peer.daily_price_change,
    })),
  };
};

const comparableCompanySchema = {
  type: "object",
  properties: {
    companyId: { type: "number" },
    ticker: { type: "string" },
    name: { type: "string" },
    rationale: { type: "string" },
    confidence: { type: "string" },
  },
  required: ["ticker", "name", "rationale", "confidence"],
};

const reviewSchema = {
  type: "object",
  properties: {
    recommendedValuation: {
      type: "string",
      description:
        "A concise recommended modeling approach. This may be a revenue build, gross profit build, EBIT/EBITDA build, cash-flow bridge, working capital schedule, comps screen, DCF, SOTP, LBO screen, or historical data repair depending on the evidence.",
    },
    confidence: { type: "string" },
    reasoning: { type: "array", items: { type: "string" } },
    suggestedDrivers: { type: "array", items: { type: "string" } },
    comparableCompanies: { type: "array", items: comparableCompanySchema },
    modelBuildPlan: { type: "array", items: { type: "string" } },
    assumptionsToSensitize: { type: "array", items: { type: "string" } },
    spreadsheetChecks: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    diligenceQuestions: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
  },
  required: [
    "recommendedValuation",
    "confidence",
    "reasoning",
    "suggestedDrivers",
    "comparableCompanies",
    "modelBuildPlan",
    "assumptionsToSensitize",
    "spreadsheetChecks",
    "risks",
    "diligenceQuestions",
    "nextSteps",
  ],
};

const extractReview = (response) => {
  const toolUse = response.content.find((part) => part.type === "tool_use" && part.name === "return_tcm_review");
  if (toolUse?.input) return toolUse.input;

  const text = response.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("AI response did not include a review");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI response did not include structured review data");
  return JSON.parse(match[0]);
};

const cleanStringArray = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const normalizeReview = async (review) => {
  const comparableCompanies = Array.isArray(review.comparableCompanies)
    ? review.comparableCompanies
        .map((company) => ({
          companyId: Number.isFinite(Number(company.companyId)) ? Number(company.companyId) : null,
          ticker: typeof company.ticker === "string" ? company.ticker.trim().toUpperCase() : "",
          name: typeof company.name === "string" ? company.name.trim() : "",
          rationale: typeof company.rationale === "string" ? company.rationale.trim() : "",
          confidence: typeof company.confidence === "string" ? company.confidence.trim() : "",
        }))
        .filter((company) => company.ticker || company.name)
    : [];

  const tickers = comparableCompanies.map((company) => company.ticker).filter(Boolean);
  const matchedCompanies = tickers.length
    ? await prisma.company.findMany({
        where: { ticker: { in: tickers } },
        select: { id: true, ticker: true, name: true },
      })
    : [];
  const byTicker = Object.fromEntries(matchedCompanies.map((company) => [company.ticker, company]));

  return {
    ...review,
    reasoning: cleanStringArray(review.reasoning),
    suggestedDrivers: cleanStringArray(review.suggestedDrivers),
    modelBuildPlan: cleanStringArray(review.modelBuildPlan),
    assumptionsToSensitize: cleanStringArray(review.assumptionsToSensitize),
    spreadsheetChecks: cleanStringArray(review.spreadsheetChecks),
    risks: cleanStringArray(review.risks),
    diligenceQuestions: cleanStringArray(review.diligenceQuestions),
    nextSteps: cleanStringArray(review.nextSteps),
    comparableCompanies: comparableCompanies.map((company) => {
      const match = byTicker[company.ticker];
      return {
        ...company,
        companyId: company.companyId ?? match?.id ?? null,
        name: company.name || match?.name || company.ticker,
      };
    }),
  };
};

const saveReviewChat = async ({ userId, review, summary, peerContext, fileName }) => {
  const title = `${summary.companyName || summary.ticker || "TCM"} AI Model Review`;
  const metadata = {
    type: "tcm-review",
    fileName,
    model: MODEL,
    peerCandidateCount: peerContext.databasePeerCandidates?.length ?? 0,
    annualPeriods: summary.annualPeriods,
  };

  const rows = await prisma.$queryRaw`
    INSERT INTO "AiChat" ("title", "companyName", "ticker", "review", "metadata", "userId")
    VALUES (
      ${title},
      ${summary.companyName ?? null},
      ${summary.ticker ?? null},
      CAST(${JSON.stringify(review)} AS JSONB),
      CAST(${JSON.stringify(metadata)} AS JSONB),
      ${userId}
    )
    RETURNING "id", "created_at"
  `;

  return rows[0] ?? null;
};

const mapChatRow = async (row) => ({
  id: row.id,
  title: row.title,
  companyName: row.companyName,
  ticker: row.ticker,
  review: await normalizeReview(row.review),
  metadata: row.metadata,
  created_at: row.created_at,
});

router.get("/chats", async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const rows = await prisma.$queryRaw`
      SELECT "id", "title", "companyName", "ticker", "review", "metadata", "created_at"
      FROM "AiChat"
      WHERE "userId" = ${userId}
      ORDER BY "created_at" DESC
      LIMIT 50
    `;

    res.json(await Promise.all(rows.map(mapChatRow)));
  } catch (err) {
    next(err);
  }
});

router.get("/chats/:id", async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const chatId = parseInt(req.params.id);
    const rows = await prisma.$queryRaw`
      SELECT "id", "title", "companyName", "ticker", "review", "metadata", "created_at"
      FROM "AiChat"
      WHERE "id" = ${chatId} AND "userId" = ${userId}
      LIMIT 1
    `;

    if (!rows.length) return res.status(404).json({ error: "AI chat not found." });
    res.json(await mapChatRow(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.delete("/chats/:id", async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const chatId = parseInt(req.params.id);
    await prisma.$executeRaw`
      DELETE FROM "AiChat"
      WHERE "id" = ${chatId} AND "userId" = ${userId}
    `;
    res.json({ message: "deleted" });
  } catch (err) {
    next(err);
  }
});

router.post("/tcm-review", upload.single("canalystFile"), async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    if (!req.file) return res.status(400).json({ error: "No file uploaded. Include the file as multipart field 'canalystFile'." });
    if (!req.file.originalname.endsWith(".xlsx")) return res.status(400).json({ error: "File must be a .xlsx Excel file." });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "ANTHROPIC_API_KEY is not configured." });

    const parsed = parseCanalyst(req.file.buffer);
    const summary = summarizeParsedModel(parsed);
    const modelingGuidance = buildModelingGuidance(summary);
    const peerContext = await getPeerContext(summary.ticker);
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.45,
      system: [
        {
          type: "text",
          text: [
        "You are an investment banking modeling assistant reviewing parsed historical financials.",
        "Do not give buy, sell, hold, or price-target advice.",
        "Do not invent unavailable facts. If a metric is missing, say the data is not available.",
        "The recommendedValuation field is really the recommended modeling approach. It does not have to be a valuation method.",
        "Consider a broad analyst toolkit: revenue build, segment/KPI build, gross profit build, COGS schedule, EBIT/EBITDA bridge, operating expense schedule, cash-flow bridge, working capital schedule, capex schedule, guidance bridge, cohort/unit economics build, trading comps screen, transaction comps screen, DCF, sum-of-the-parts, LBO screen, or historical data repair.",
        "Do not default to DCF with trading comps. Recommend DCF only when revenue, profitability, and cash-flow support are sufficient to forecast FCF with some confidence.",
        "If key margin or cash-flow lines are missing, prefer the build that fixes the missing driver before valuation.",
        "If the business looks asset-heavy, cyclical, financial, subscription-based, marketplace-like, retail, or multi-segment, tailor the workstream instead of using generic DCF language.",
        "Give practical next steps an analyst can use after a TCM Historicals workbook is generated.",
        "For comparableCompanies, prefer provided databasePeerCandidates when they make sense and include companyId when available from the candidate data. You may add obvious public comps from general market knowledge, but label confidence lower when not provided.",
        "For modelBuildPlan, include 3-5 concrete workbook tabs or outputs. Match them to the recommended approach, such as Revenue Build, Segment/KPI Build, Gross Profit Bridge, Opex Schedule, EBITDA Bridge, Working Capital, Capex, FCF Bridge, Guidance Bridge, Comps Screen, DCF, or Sensitivity.",
        "Make the recommendation specific and varied. Avoid the exact phrase 'DCF with Trading Comps cross-check' unless the facts strongly support it.",
        "For nextSteps, write 3-5 action-oriented steps, not generic commentary.",
        "For diligenceQuestions, include 3-5 questions an analyst should answer before relying on the model.",
        "For assumptionsToSensitize, include 3-5 specific assumptions.",
        "Club house style: every pitch frames three scenarios - Bear, Base, and Bull. Reflect this in assumptionsToSensitize and scenario guidance; comparable companies are optional.",
        "A library of the club's own prior pitches follows. Match the club's house style and modeling approach, and reference a relevant prior pitch by name when the company under review is analogous.",
        "Use the return_tcm_review tool to provide the final structured review.",
          ].join(" "),
        },
        {
          type: "text",
          text: buildClubReference(),
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "return_tcm_review",
          description: "Return the TCM modeling review in a structured format.",
          input_schema: reviewSchema,
        },
      ],
      tool_choice: { type: "tool", name: "return_tcm_review" },
      messages: [
        {
          role: "user",
          content: [
            "Review this parsed TCM historical model summary and recommend next modeling steps.",
            "The original example Canalyst-style workbooks may include tabs like Exec Comp, Guidance, Summary Page, and company-specific support tabs, while the generated TCM workbook currently creates Historicals.",
            "Use the financial summary, modeling guidance, and peer context below.",
            JSON.stringify({ summary, modelingGuidance, peerContext }),
          ].join("\n"),
        },
      ],
    });

    const review = await normalizeReview({ ...extractReview(response), companyName: summary.companyName, ticker: summary.ticker });
    const savedChat = await saveReviewChat({
      userId,
      review,
      summary,
      peerContext,
      fileName: req.file.originalname,
    });

    res.json({ ...review, chatId: savedChat?.id ?? null, savedAt: savedChat?.created_at ?? null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
