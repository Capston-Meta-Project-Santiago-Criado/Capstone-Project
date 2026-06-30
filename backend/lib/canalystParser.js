const XLSX = require("xlsx");

const FY_RE = /^FY\d{4}$/;
const Q_RE  = /^Q[1-4]-\d{4}$/;

// Multiple fallback labels for core P&L items (ordered by preference)
const PL_LABELS = {
  revenue:    ["Net Revenue", "Total Revenue, mm", "Net Sales", "Total Net Sales, mm"],
  cogs:       ["COGS", "Total Cost of Sales, mm", "Cost of sales"],
  grossProfit:["Gross Profit"],
  sga:        ["SG&A", "Selling, general and administrative expenses"],
  ebit:       ["EBIT", "Total Operating Income, mm", "Income (Loss) from Operations"],
  da:         ["Add back: D&A", "Depreciation and Amortization, mm"],
  sbc:        ["Add back: SBC", "SBC expense"],
  ebitda:     ["EBITDA", "Adjusted EBITDA (No Adjustments)"],
  intExp:     ["Interest expense"],
  intInc:     ["Interest income"],
  other:      ["Other items"],
  ebt:        ["EBT", "Income (Loss) before Income Taxes"],
  curTax:     ["Current tax"],
  defTax:     ["Deferred tax", "Deferred tax provision"],
  netIncome:  ["Net Income to Common Shareholders", "Net Income Attributable to Deckers Outdoor Corporation", "Net Income (Loss)"],
  nonGaap:    ["Non-GAAP Adjustments"],
  adjNI:      ["Adjusted Net Income"],
  eps:        ["Earnings Per Share - WAD", "Earnings Per Share - WAD, $"],
  shares:     ["Shares Outstanding - WAD", "Shares Outstanding - WAD, mm shares"],
  cfoBefore:  ["CFO before WC", "Operating Cash Flow before WC"],
  netCFO:     ["Net CFO", "Operating Cash Flow after WC"],
};

// Sub-section header patterns (variants across different Canalyst models)
const CFO_HEADERS  = new Set(["CFO", "Operating Activities", "Cash flows from operating activities"]);
const CFOWC_HEADERS = new Set(["CFO before WC", "Operating cash flow before working capital", "CFO Before Working Capital"]);
const CFI_HEADERS  = new Set(["CFI", "Investing Activities", "Cash flows from investing activities"]);
const CFF_HEADERS  = new Set(["CFF", "Financing Activities", "Cash flows from financing activities"]);
const NET_CFO_LABELS = new Set(["Net CFO", "Net cash provided by operating activities", "Cash flow from operations"]);
const NET_CFI_LABELS = new Set(["Net CFI", "Net cash used in investing activities", "Cash flow from investing"]);
const NET_CFF_LABELS = new Set(["Net CFF", "Net cash provided by (used in) financing activities", "Cash flow from financing"]);
const CF_END_LABELS  = new Set(["CF Check", "Model Checks", "Check"]);

function getCellVal(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = ws[addr];
  if (!cell) return null;
  return cell.v ?? null;
}

function findRowIdx(labelMap, candidates) {
  for (const label of candidates) {
    if (labelMap[label] != null) return labelMap[label];
  }
  return null;
}

// Like findRowIdx, but matches label keys by regex (earliest matching row wins).
function findRowIdxRe(labelMap, re) {
  let best = null;
  for (const [label, idx] of Object.entries(labelMap)) {
    if (re.test(label) && (best == null || idx < best)) best = idx;
  }
  return best;
}

const numDiff = (a, b) => (a != null && b != null) ? a - b : null;

// The standardized "Income Statement - As Reported" section — present in every
// Canalyst model with consistent GAAP line ordering, though the exact label
// wording is company-specific. Returns its line items as ordered { rowIdx, label }.
function getISRows(ws, labelMap) {
  const start = labelMap["Income Statement - As Reported"];
  if (start == null) return [];
  const rows = [];
  for (let r = start + 1; r < start + 45; r++) {
    const label = getCellVal(ws, r, 0);
    if (label == null || typeof label !== "string") continue;
    if (/^(IS Check|Adjusted Numbers|Revised Income Statement)/i.test(label)) break;
    rows.push({ rowIdx: r, label });
  }
  return rows;
}

// First IS row whose label matches `re` (skipping any matching `exclude`).
function matchISRow(isRows, re, exclude) {
  for (const { rowIdx, label } of isRows) {
    if (exclude && exclude.test(label)) continue;
    if (re.test(label)) return rowIdx;
  }
  return null;
}

// Build a label→rowIdx map within a row range (first occurrence within range wins)
function buildLocalMap(ws, startRow, endRow) {
  const map = {};
  for (let r = startRow; r <= endRow; r++) {
    const label = getCellVal(ws, r, 0);
    if (label && typeof label === "string" && !map[label]) {
      map[label] = r;
    }
  }
  return map;
}

function extractValues(ws, rowIdx, selectedAnnual, selectedQuarterly) {
  if (rowIdx == null) {
    return {
      annual:    selectedAnnual.map(() => null),
      quarterly: selectedQuarterly.map(() => null),
    };
  }
  return {
    annual:    selectedAnnual.map(col => getCellVal(ws, rowIdx, col.colIdx)),
    quarterly: selectedQuarterly.map(col => getCellVal(ws, rowIdx, col.colIdx)),
  };
}

// Parse the Canalyst 'Model' sheet from a buffer
function parseCanalyst(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellFormula: false, cellDates: true });
  if (!wb.Sheets["Model"]) {
    throw new Error('Uploaded file does not appear to be a Canalyst model — no "Model" sheet found.');
  }
  const ws = wb.Sheets["Model"];

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:BM1400");
  const maxRow = range.e.r + 1;
  const maxCol = range.e.c + 1;

  // --- Metadata (rows 1–3) ---
  const companyName = getCellVal(ws, 0, 0) ?? "Unknown Company";
  const tickerFull  = getCellVal(ws, 1, 0) ?? "UNK";
  const ticker      = String(tickerFull).split(" ")[0];
  const currency    = getCellVal(ws, 2, 0) ?? "USD";

  // --- Period columns from row 5 (index 4) ---
  const annualCols   = [];
  const quarterlyCols = [];
  for (let c = 2; c <= maxCol; c++) {
    const label = getCellVal(ws, 4, c);
    if (!label || typeof label !== "string") continue;
    const dateVal = getCellVal(ws, 3, c);  // row 4 (index 3) has period end dates
    if (FY_RE.test(label)) annualCols.push({ label, colIdx: c, date: dateVal });
    else if (Q_RE.test(label)) quarterlyCols.push({ label, colIdx: c, date: dateVal });
  }

  // --- Global label→rowIdx map (first occurrence) ---
  const labelMap = {};
  for (let r = 0; r < maxRow; r++) {
    const label = getCellVal(ws, r, 0);
    if (label && typeof label === "string" && !labelMap[label]) {
      labelMap[label] = r;
    }
  }

  // --- Income statement anchor (As-Reported) ---
  // Anchor on the standardized "Income Statement - As Reported" section. Its
  // revenue line also drives historical-period selection below: Canalyst leaves
  // the As-Reported statements blank for future/estimate periods, so a populated
  // As-Reported revenue cell is the most reliable "this is an actual" signal —
  // far more robust than comparing the fiscal-year-end date to today, which
  // wrongly admits the current-year forecast at/after the fiscal-year boundary.
  const isRows  = getISRows(ws, labelMap);
  const isMatch = (re, exclude) => matchISRow(isRows, re, exclude);
  const reportedRevRow = isMatch(/^(net sales|net revenue|revenues?|total revenue|total net sales)/i, /cost|consensus|guidance|growth|organic/i);

  // --- Select historical (actual) periods ---
  const today = new Date();
  const hasActualMarker = (c) => {
    const cell = ws[XLSX.utils.encode_cell({ r: 1, c })];
    return cell != null && typeof cell.v === "string" && /restated/i.test(cell.v);
  };
  const isActual = (col) => {
    // Primary: As-Reported revenue is populated (blank for estimate periods).
    if (reportedRevRow != null) return getCellVal(ws, reportedRevRow, col.colIdx) != null;
    // Fallback (model has no As-Reported section): fiscal period has ended, or
    // Canalyst tagged the column as reported in row 2.
    return (col.date instanceof Date && col.date <= today) || hasActualMarker(col.colIdx);
  };

  const historicalAnnual = annualCols.filter(isActual);
  const selectedAnnual = historicalAnnual.slice(-6);  // 6 most recent FY

  const historicalQuarterly = quarterlyCols.filter(isActual);
  const selectedQuarterly = historicalQuarterly.slice(-28);  // 28 most recent quarters

  const extract = (rowIdx) => extractValues(ws, rowIdx, selectedAnnual, selectedQuarterly);
  const hasData = (d) => d.annual.some(v => v != null) || d.quarterly.some(v => v != null);

  // --- P&L data ---
  // isRows / isMatch / reportedRevRow were computed above (period selection).
  const revRow   = reportedRevRow ?? findRowIdx(labelMap, PL_LABELS.revenue);
  const cogsRow  = isMatch(/^(cogs|cost of (sales|revenue|goods))/i) ?? findRowIdx(labelMap, PL_LABELS.cogs);
  const gpRow    = isMatch(/^gross profit/i) ?? findRowIdx(labelMap, PL_LABELS.grossProfit);
  const opIncRow = isMatch(/^(operating (income|loss)|income \(loss\) from operations|(income|loss) from operations|total operating income)/i) ?? findRowIdx(labelMap, PL_LABELS.ebit);
  const intIncRow= isMatch(/^interest income/i) ?? findRowIdx(labelMap, PL_LABELS.intInc);
  const intExpRow= isMatch(/^interest expense/i) ?? findRowIdx(labelMap, PL_LABELS.intExp);
  const otherRow = isMatch(/^other\b/i, /comprehensive/i) ?? findRowIdx(labelMap, PL_LABELS.other);
  const ebtRow   = isMatch(/before (the )?(provision for |benefit from )?income tax|before income tax|pre-?tax income/i) ?? findRowIdx(labelMap, PL_LABELS.ebt);
  const curTaxRow= isMatch(/^current (income )?tax/i) ?? findRowIdx(labelMap, PL_LABELS.curTax);
  const defTaxRow= isMatch(/^deferred (income )?tax/i) ?? findRowIdx(labelMap, PL_LABELS.defTax);
  // Single combined income-tax line. Tolerate inserted parentheticals such as
  // "Provision for (benefit from) income tax" and "Income tax (provision) benefit".
  const incTaxRow= isMatch(/(provision for|benefit from).*income tax|income tax(es)? ?\(?(expense|provision|benefit)|^(total )?income tax(es)?$/i);
  const niRow    = isMatch(/^net (income|loss) attributable to/i, /non-?controlling|nci|minority/i)
                ?? isMatch(/^net (income|loss)( \(loss\))?$/i)
                ?? findRowIdx(labelMap, PL_LABELS.netIncome);

  // D&A and SBC add-backs (for EBITDA): summary line first, then the As-Reported
  // IS / D&A-SBC breakdown via case-insensitive matching.
  const daRow  = findRowIdx(labelMap, PL_LABELS.da)
              ?? isMatch(/^(reported )?depreciation and amortization/i)
              ?? findRowIdxRe(labelMap, /^depreciation and amortization(, mm)?$/i);
  const sbcRow = findRowIdx(labelMap, PL_LABELS.sbc)
              ?? findRowIdxRe(labelMap, /^total sbc(, mm)?$/i)
              ?? isMatch(/^stock-?based compensation/i);

  const epsRow = findRowIdx(labelMap, PL_LABELS.eps)
              ?? findRowIdxRe(labelMap, /^(gaap )?(diluted )?earnings per share - wad\b/i)
              ?? findRowIdxRe(labelMap, /^diluted eps\b/i);
  const sharesRow = findRowIdx(labelMap, PL_LABELS.shares)
              ?? findRowIdxRe(labelMap, /^shares outstanding - wad\b/i);

  const revData   = extract(revRow);
  const cogsData  = extract(cogsRow);
  const gpData    = extract(gpRow);
  const opIncData = extract(opIncRow);

  // SG&A (single TCM line) = Gross Profit − Operating Income. This collapses any
  // number of company-specific opex lines (S&M, O&S, R&D, G&A, impairments, …)
  // into one figure and keeps the derived EBIT (= GP − SG&A) equal to reported
  // operating income for every company.
  const sgaData = {
    annual:    gpData.annual.map((v, i)    => numDiff(v, opIncData.annual[i])),
    quarterly: gpData.quarterly.map((v, i) => numDiff(v, opIncData.quarterly[i])),
  };

  let curTaxData = extract(curTaxRow);
  let defTaxData = extract(defTaxRow);
  // If the model reports only a single income-tax line (no current/deferred
  // split), route the total through Current tax so that Income Tax = curtax +
  // deftax stays correct and Net Income (= EBT − Income Tax) isn't overstated.
  if (!hasData(curTaxData) && !hasData(defTaxData) && incTaxRow != null) {
    curTaxData = extract(incTaxRow);
    defTaxData = extract(null);
  }

  // Non-GAAP adjustment = Non-GAAP NI − GAAP NI when no explicit adjustment line.
  let nonGaapData;
  const nonGaapAdjRow = labelMap["Non-GAAP Adjustments"];
  if (nonGaapAdjRow != null) {
    nonGaapData = extract(nonGaapAdjRow);
  } else {
    const ngNIRow = findRowIdx(labelMap, ["Non-GAAP Net Income to Common Shareholders", "Non-GAAP Net Income", "Non-GAAP Net (Loss) Income", "Adjusted Net Income"]);
    if (ngNIRow != null && niRow != null) {
      const ngNI = extract(ngNIRow), gNI = extract(niRow);
      nonGaapData = {
        annual:    ngNI.annual.map((v, i)    => numDiff(v, gNI.annual[i])),
        quarterly: ngNI.quarterly.map((v, i) => numDiff(v, gNI.quarterly[i])),
      };
    } else {
      nonGaapData = extract(null);
    }
  }

  const plData = {
    revenue:   revData,
    cogs:      cogsData,
    sga:       sgaData,
    da:        extract(daRow),
    sbc:       extract(sbcRow),
    intExp:    extract(intExpRow),
    intInc:    extract(intIncRow),
    other:     extract(otherRow),
    ebt:       extract(ebtRow),
    curTax:    curTaxData,
    defTax:    defTaxData,
    nonGaap:   nonGaapData,
    eps:       extract(epsRow),
    shares:    extract(sharesRow),
    cfoBefore: extract(findRowIdx(labelMap, PL_LABELS.cfoBefore)),
    netCFO:    extract(findRowIdx(labelMap, PL_LABELS.netCFO)),
  };

  // NWC = Net CFO - CFO before WC
  const cfoBefore = plData.cfoBefore.annual;
  const netCFO    = plData.netCFO.annual;
  const cfoBefore_q = plData.cfoBefore.quarterly;
  const netCFO_q    = plData.netCFO.quarterly;
  plData.nwc = {
    annual:    netCFO.map((v, i)    => (v != null && cfoBefore[i] != null)    ? v - cfoBefore[i]    : null),
    quarterly: netCFO_q.map((v, i) => (v != null && cfoBefore_q[i] != null) ? v - cfoBefore_q[i] : null),
  };

  // --- CF section ---
  // Canalyst has a detailed "Cash Flow Statement" section; find it via labelMap
  // and scan forward until "CF Check"
  const cfSectionStart = labelMap["Cash Flow Statement"] ?? labelMap["Cash Flow Statement - As Reported"];
  const cfSectionEnd   = labelMap["CF Check"] ?? (cfSectionStart != null ? cfSectionStart + 100 : null);

  const cfData = { cfo: [], wc: [], cfi: [], cff: [], other: [] };

  if (cfSectionStart != null && cfSectionEnd != null) {
    // Dynamic CF extraction — takes ALL rows with values within each sub-section.
    // Sub-section boundaries are detected by header labels; individual items are accepted
    // regardless of their label (no hardcoded item whitelist).
    let subSec = null;
    for (let r = cfSectionStart + 1; r <= cfSectionEnd; r++) {
      const label = getCellVal(ws, r, 0);
      if (!label || typeof label !== "string") continue;

      // Sub-section header sentinels
      if (CFO_HEADERS.has(label))  { subSec = "cfo"; continue; }
      if (CFOWC_HEADERS.has(label)) { subSec = "wc";  continue; }
      if (CFI_HEADERS.has(label))  { subSec = "cfi"; continue; }
      if (CFF_HEADERS.has(label))  { subSec = "cff"; continue; }

      // Sub-section subtotals
      if (NET_CFO_LABELS.has(label)) {
        cfData.cfo.push({ label, tcmLabel: "CFO", isSubtotal: true, ...extract(r) });
        subSec = null;
        continue;
      }
      if (NET_CFI_LABELS.has(label)) {
        cfData.cfi.push({ label, tcmLabel: "Net CFI", isSubtotal: true, ...extract(r) });
        continue;
      }
      if (NET_CFF_LABELS.has(label)) {
        cfData.cff.push({ label, tcmLabel: "Net CFF", isSubtotal: true, ...extract(r) });
        subSec = null;
        continue;
      }
      if (CF_END_LABELS.has(label)) break;

      if (!subSec) continue;

      // Accept any line item that has at least one non-null value
      const values = extract(r);
      const hasData = values.annual.some(v => v != null) || values.quarterly.some(v => v != null);
      if (!hasData) continue;

      const item = { label, tcmLabel: label, ...values };
      if      (subSec === "cfo") cfData.cfo.push(item);
      else if (subSec === "wc")  cfData.wc.push(item);
      else if (subSec === "cfi") cfData.cfi.push(item);
      else if (subSec === "cff") cfData.cff.push(item);
    }

    // FX, Net Change, Beginning/Ending cash, supplemental — find in section range explicitly
    const cfLocalMap = buildLocalMap(ws, cfSectionStart, cfSectionEnd);
    const otherLabels = [
      { can: "FX",                       tcm: "FX",                       isSub: false },
      { can: "Net Change in Cash Balance", tcm: "Net Change in Cash Balance", isSub: true },
      { can: "Beginning Cash Balance",   tcm: "Beginning Cash Balance",    isSub: false },
      { can: "Ending Cash Balance",      tcm: "Ending Cash Balance",       isSub: false },
      { can: "Cash paid for interest",   tcm: "Cash paid for interest",    isSub: false },
      { can: "Cash paid for income taxes, net of refunds", tcm: "Cash paid for income taxes, net of refunds", isSub: false },
    ];
    for (const { can, tcm, isSub } of otherLabels) {
      const rowIdx = cfLocalMap[can];
      if (rowIdx == null) continue;
      cfData.other.push({ label: can, tcmLabel: tcm, isSubtotal: isSub, ...extract(rowIdx) });
    }
  }

  // --- BS section (structured by sub-section) ---
  const bsSectionStart = labelMap["Balance Sheet"] ?? labelMap["Balance Sheet - As Reported"];
  const bsSectionEnd   = labelMap["BS Check"] ?? (bsSectionStart != null ? bsSectionStart + 60 : null);

  const bsData = {
    currAssets:    [],
    noncurrAssets: [],
    currLiab:      [],
    noncurrLiab:   [],
    equity:        [],
  };

  // BS sub-section header patterns. A *classified* BS (e.g. DECK) splits assets
  // and liabilities into Current / Non-Current; an *unclassified* BS (homebuilders,
  // banks, REITs — e.g. Lennar) has only plain "Assets" / "Liabilities" / "Equity"
  // headers (or none). The walker handles both: it defaults to capturing assets at
  // the top, recognises the plain headers, and advances on the Total Assets /
  // Total Liabilities anchor lines that every balance sheet has.
  const BS_CURR_ASSET    = /^Current Assets/i;
  const BS_NONCURR_ASSET = /^(Non-?Current Assets|Long-?term Assets|Fixed Assets)/i;
  const BS_ASSET_HDR     = /^Assets$/i;
  const BS_CURR_LIAB     = /^Current Liabilities/i;
  const BS_NONCURR_LIAB  = /^(Non-?Current Liabilities|Long-?[Tt]erm Liabilities)/i;
  const BS_LIAB_HDR      = /^Liabilities$/i;
  const BS_EQUITY        = /^((Share|Stock)holders'?\s*(Equity|equity)|Total Equity$|Equity$)/i;
  const BS_END           = /^(BS Check|Model Checks?|Check|Balance Sheet Check)/i;
  const BS_SUBTOTAL_PAT  = /^(Total |Subtotal |Net )/i;
  const BS_TOTAL_ASSETS  = /^Total Assets\b/i;
  const BS_TOTAL_LIAB    = /^Total Liabilit/i;

  if (bsSectionStart != null && bsSectionEnd != null) {
    // phase: assets → liab → equity. Buckets default to non-current so an
    // unclassified BS still captures every line; "Current …" headers refine them.
    let phase = "assets";
    let assetBucket = "noncurrAssets";
    let liabBucket  = "noncurrLiab";
    const bucketFor = () => phase === "assets" ? assetBucket
                          : phase === "liab"   ? liabBucket
                          : "equity";

    for (let r = bsSectionStart + 1; r <= bsSectionEnd; r++) {
      const label = getCellVal(ws, r, 0);
      if (!label || typeof label !== "string") continue;
      if (BS_END.test(label)) break;

      // Section-header rows (not data) — set phase / refine the current bucket.
      // Guard with !BS_SUBTOTAL_PAT so "Total Current Assets" isn't treated as a header.
      if (!BS_SUBTOTAL_PAT.test(label)) {
        if (BS_CURR_ASSET.test(label))    { phase = "assets"; assetBucket = "currAssets";    continue; }
        if (BS_NONCURR_ASSET.test(label)) { phase = "assets"; assetBucket = "noncurrAssets"; continue; }
        if (BS_ASSET_HDR.test(label))     { phase = "assets";                                continue; }
        if (BS_CURR_LIAB.test(label))     { phase = "liab";   liabBucket  = "currLiab";      continue; }
        if (BS_NONCURR_LIAB.test(label))  { phase = "liab";   liabBucket  = "noncurrLiab";   continue; }
        if (BS_LIAB_HDR.test(label))      { phase = "liab";                                  continue; }
        if (BS_EQUITY.test(label))        { phase = "equity";                                continue; }
      }

      const isSubtotal = BS_SUBTOTAL_PAT.test(label);
      const values = extract(r);
      const hasData = values.annual.some(v => v != null) || values.quarterly.some(v => v != null);
      if (!hasData && !isSubtotal) continue;

      bsData[bucketFor()].push({ label, tcmLabel: label, isSubtotal, ...values });

      // Advance phase on the grand-total anchors, so an unclassified BS segments
      // correctly even with no "Liabilities"/"Equity" header. "Total Assets" ends
      // assets; "Total Liabilities" ends liabilities (but NOT "Total Liabilities & SE").
      if (phase === "assets" && BS_TOTAL_ASSETS.test(label)) {
        phase = "liab";
      } else if (phase === "liab" && BS_TOTAL_LIAB.test(label)
                 && !/(equity|&\s*SE|and equity|\bS\.?E\.?\b)/i.test(label)) {
        phase = "equity";
      }
    }
  }

  // --- Fiscal year end string ---
  const fiscalYearEnd = formatFYE(selectedAnnual);

  return {
    companyName,
    ticker,
    currency,
    fiscalYearEnd,
    annualPeriods:   selectedAnnual.map(c => c.label),
    annualDates:     selectedAnnual.map(c => c.date),
    quarterlyDates:  selectedQuarterly.map(c => c.date),
    plData,
    cfData,
    bsData,
  };
}

function toJsDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    // Excel serial → JS Date (Excel epoch is Jan 1 1900; JS epoch is Jan 1 1970)
    // Subtract 25569 (days between epochs) accounting for Excel's erroneous leap year bug
    return new Date(Math.round((v - 25569) * 86400 * 1000));
  }
  return null;
}

function formatFYE(annualCols) {
  if (!annualCols.length) return "";
  const lastDate = toJsDate(annualCols[annualCols.length - 1].date);
  if (!lastDate || isNaN(lastDate.getTime())) return "";
  // Only emit "Month Day" if the day is valid (e.g., avoid "June 31")
  const month = lastDate.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const day   = lastDate.getUTCDate();
  return `${month} ${day}`;
}

module.exports = { parseCanalyst };
