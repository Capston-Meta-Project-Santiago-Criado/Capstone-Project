// Coverage validation for a parsed Canalyst model.
//
// Heterogeneous Canalyst models keep surfacing edge cases (different label
// conventions, classified vs unclassified balance sheets, IFRS vs GAAP, etc.).
// This module is the safety net: it inspects a `parsed` object and reports
// "whole-section-missing" extraction failures as **criticals** and softer gaps as
// **warnings**. It is used in two places:
//   1. The test suite asserts there are zero criticals for every example model.
//   2. generateTcmExcel merges these messages into its runtime `warnings`, so a
//      problematic upload is flagged (X-TCM-Warnings) instead of silently
//      producing a half-empty workbook.
//
// Criticals are reserved for things that mean extraction *broke* (a section we
// expect for essentially every company came back empty). Legitimately-absent
// line items (e.g. a bank with no COGS, a company with no SBC) are warnings.

const hasVals = (arr) => Array.isArray(arr) && arr.some((v) => v != null);
const metricHasData = (m) => !!m && (hasVals(m.annual) || hasVals(m.quarterly));
const itemsHaveData = (items) =>
  Array.isArray(items) && items.some((it) => hasVals(it.annual) || hasVals(it.quarterly));
const anyLabel = (items, rx) =>
  Array.isArray(items) && items.some((it) => rx.test(it.label || it.tcmLabel || ""));

function validateParsed(parsed) {
  const issues = [];
  const add = (severity, section, message) => issues.push({ severity, section, message });

  const {
    annualPeriods = [],
    quarterlyDates = [],
    plData = {},
    cfData = {},
    bsData = {},
  } = parsed || {};

  // ── Periods ──────────────────────────────────────────────────────────────
  if (annualPeriods.length === 0) {
    add("critical", "Periods", "No historical annual periods were selected.");
  } else if (annualPeriods.length < 3) {
    add("warning", "Periods", `Only ${annualPeriods.length} annual period(s) selected.`);
  }
  if (quarterlyDates.length === 0) {
    add("warning", "Periods", "No historical quarterly periods were selected.");
  }

  // ── P&L ──────────────────────────────────────────────────────────────────
  if (!metricHasData(plData.revenue)) {
    add("critical", "P&L", "Revenue is empty — income-statement extraction likely failed.");
  }
  for (const [key, label] of [["cogs", "COGS"], ["sga", "SG&A"], ["ebt", "EBT"]]) {
    if (!metricHasData(plData[key])) add("warning", "P&L", `${label} is empty.`);
  }

  // ── Cash Flow ────────────────────────────────────────────────────────────
  const cfoOk = itemsHaveData(cfData.cfo);
  const cfiOk = itemsHaveData(cfData.cfi);
  const cffOk = itemsHaveData(cfData.cff);
  if (!cfoOk && !cfiOk && !cffOk) {
    add("critical", "Cash Flow", "No CFO/CFI/CFF items extracted — cash-flow section not found.");
  } else {
    if (!cfoOk) add("warning", "Cash Flow", "No operating (CFO) items extracted.");
    if (!cfiOk) add("warning", "Cash Flow", "No investing (CFI) items extracted.");
    if (!cffOk) add("warning", "Cash Flow", "No financing (CFF) items extracted.");
  }

  // ── Balance Sheet ────────────────────────────────────────────────────────
  const assets = [...(bsData.currAssets || []), ...(bsData.noncurrAssets || [])];
  const liabs = [...(bsData.currLiab || []), ...(bsData.noncurrLiab || [])];
  const equity = bsData.equity || [];

  if (!itemsHaveData(assets)) {
    add("critical", "Balance Sheet", "No asset lines extracted.");
  } else if (!anyLabel(assets, /total assets/i)) {
    add("warning", "Balance Sheet", "No 'Total Assets' line found.");
  }
  if (!itemsHaveData(liabs)) {
    add("critical", "Balance Sheet", "No liability lines extracted.");
  }
  if (!itemsHaveData(equity)) {
    add("critical", "Balance Sheet", "No equity lines extracted.");
  } else if (!anyLabel(equity, /total\s+(s(hare|tock)holders|equity|se)\b/i)) {
    add("warning", "Balance Sheet", "No 'Total Equity' line found.");
  }

  const criticals = issues.filter((i) => i.severity === "critical");
  const warnings = issues.filter((i) => i.severity === "warning");
  return { ok: criticals.length === 0, issues, criticals, warnings };
}

module.exports = { validateParsed };
