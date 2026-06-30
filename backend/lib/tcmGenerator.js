const ExcelJS = require("exceljs");
const { validateParsed } = require("./validateParsed");

// ── Column layout ─────────────────────────────────────────────────────────────
const COL_MARKER = 1;
const COL_MAIN   = 2;
const COL_SUB    = 3;
const COL_DERIV  = 4;
const COL_OVER   = 5;
const ANN_COLS   = [6, 7, 8, 9, 10, 11];
const QTR_COLS   = Array.from({ length: 28 }, (_, i) => 15 + i);
const TOTAL_COLS = 42;

// ── Colors ────────────────────────────────────────────────────────────────────
const BLACK  = "FF000000";
const WHITE  = "FFFFFFFF";
const BLUE   = "FF0000FF";
const YELLOW = "FFFFFF00";

// ── Number formats ────────────────────────────────────────────────────────────
const NUM_FMT = '#,##0.0_);(#,##0.0);"-"_)';
const PCT_FMT = '0.0%_);(0.0%)';
const YR_FMT  = '####_)';
const DT_FMT  = 'm/d/yy';

// Currency code → display symbol. Falls back to the raw code (e.g. "EUR" → "€",
// but an unmapped "PLN" → "PLN") so non-US models are labelled correctly rather
// than hardcoded to "$".
const CURRENCY_SYMBOLS = {
  USD: "$", CAD: "$", AUD: "$", NZD: "$", HKD: "$", SGD: "$", MXN: "$",
  EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", RMB: "¥",
  CHF: "CHF", SEK: "kr", NOK: "kr", DKK: "kr",
  KRW: "₩", INR: "₹", BRL: "R$", ZAR: "R", TWD: "NT$", ILS: "₪",
};
function currencySymbol(code) {
  if (!code) return "$";
  const c = String(code).trim().toUpperCase();
  return CURRENCY_SYMBOLS[c] || c;
}
// Build the subtotal/total currency number format for a given symbol.
const curFmtFor = (sym) => `"${sym}"#,##0.0_);("${sym}"#,##0.0);"-"_)`;

function safeDiv(a, b) {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

function cl(n) {
  let r = "";
  while (n > 0) { const m = (n - 1) % 26; r = String.fromCharCode(65 + m) + r; n = Math.floor((n - 1) / 26); }
  return r;
}

// ── Main generator ────────────────────────────────────────────────────────────
async function generateTcmExcel(parsed) {
  const {
    companyName, ticker, fiscalYearEnd, currency,
    annualPeriods, quarterlyDates,
    plData, cfData, bsData,
  } = parsed;

  const curSym = currencySymbol(currency);
  const CUR_FMT = curFmtFor(curSym);

  const pad = (arr, len, fill = null) => {
    const a = arr ? [...arr] : [];
    while (a.length < len) a.unshift(fill);
    return a.slice(-len);
  };
  const a = (k) => pad(plData[k]?.annual,    6);
  const q = (k) => pad(plData[k]?.quarterly, 28);

  // Raw P&L arrays (inlined as Historicals inputs + used for pre-flight validation)
  const revA = a("revenue");    const revQ = q("revenue");
  const cogA = a("cogs");       const cogQ = q("cogs");
  const sgaA = a("sga");        const sgaQ = q("sga");
  const daA  = a("da");         const daQ  = q("da");
  const sbcA = a("sbc");        const sbcQ = q("sbc");
  const intExpA = a("intExp");  const intExpQ = q("intExp");
  const intIncA = a("intInc");  const intIncQ = q("intInc");
  const otherA  = a("other");   const otherQ  = q("other");
  const ebtA    = a("ebt");     const ebtQ    = q("ebt");
  const curTaxA = a("curTax");  const curTaxQ = q("curTax");
  const defTaxA = a("defTax");  const defTaxQ = q("defTax");
  const nonGaapA = a("nonGaap"); const nonGaapQ = q("nonGaap");
  const epsA    = a("eps");     const epsQ    = q("eps");
  const sharesA = a("shares");  const sharesQ = q("shares");
  const nwcA    = pad(plData.nwc?.annual,    6);
  const nwcQ    = pad(plData.nwc?.quarterly, 28);

  // Pre-compute income tax + tax rate (forward-ref avoidance)
  const inctaxA = curTaxA.map((v, i) => (v ?? 0) + (defTaxA[i] ?? 0));
  const inctaxQ = curTaxQ.map((v, i) => (v ?? 0) + (defTaxQ[i] ?? 0));
  const taxRateA = ebtA.map((v, i) => safeDiv(inctaxA[i], v));
  const taxRateQ = ebtQ.map((v, i) => safeDiv(inctaxQ[i], v));

  // ── BS / CF item look-ups (needed for pre-flight validation + row tracking) ──
  const totalAssetsItem = bsData.noncurrAssets.find(it => /total assets/i.test(it.label));
  const totalLiabItem   = bsData.noncurrLiab.find(it => /total liab/i.test(it.label));
  const totalSEItem     = bsData.equity.find(it =>
    /total\s+(s(hare|tock)holders|equity|se)\b/i.test(it.label) && !/liab/i.test(it.label));
  const totalLSEItem    = bsData.equity.find(it =>
    /total liab/i.test(it.label) && /equity|se\b/i.test(it.label));
  const cfNetIncItem    = cfData.cfo.find(it => /net income/i.test(it.label));

  // ── Pre-flight cross-validation ──────────────────────────────────────────────
  const warnings   = [];
  const bsBadCols  = new Set();
  const niBadCols  = new Set();

  // Coverage check — surface "whole-section-missing" extraction failures up front
  // so a problematic model is flagged (X-TCM-Warnings), never silently half-empty.
  for (const issue of validateParsed(parsed).issues) {
    warnings.push(issue.severity === "critical"
      ? `CRITICAL — ${issue.section}: ${issue.message}`
      : `${issue.section}: ${issue.message}`);
  }

  // BS balance check. Prefer the universal identity Total Assets == Total
  // Liabilities & SE (the reported grand-total line) — robust to NCI being
  // reported outside "Total SE" (e.g. Lennar). Fall back to Assets ≈ Liab + SE
  // only when there is no grand-total line.
  const bsCheck = ( taItem, rhsVals, rhsLabel) => {
    const ta = pad(taItem.annual, 6);
    const rhs = pad(rhsVals, 6);
    for (let i = 0; i < 6; i++) {
      if (ta[i] != null && rhs[i] != null) {
        const diff = Math.abs(ta[i] - rhs[i]);
        if (diff > 1 && diff / Math.abs(ta[i] || 1) > 0.005) {
          bsBadCols.add(i);
          warnings.push(`BS imbalance in ${annualPeriods[i]}: Assets=${ta[i].toFixed(1)}, ${rhsLabel}=${rhs[i].toFixed(1)} (Δ=${diff.toFixed(1)})`);
        }
      }
    }
  };
  if (totalAssetsItem && totalLSEItem) {
    bsCheck(totalAssetsItem, totalLSEItem.annual, "Liab+Equity");
  } else if (totalAssetsItem && totalLiabItem && totalSEItem) {
    const tl = pad(totalLiabItem.annual, 6);
    const se = pad(totalSEItem.annual, 6);
    bsCheck(totalAssetsItem, tl.map((v, i) => (v != null && se[i] != null) ? v + se[i] : null), "L+E");
  }

  // IS-CF: Net Income from IS formula ≈ Net Income reported in CF
  if (cfNetIncItem) {
    const isNIVals = ebtA.map((v, i) => (v != null) ? v - inctaxA[i] : null);
    const cfNIVals = pad(cfNetIncItem.annual, 6);
    for (let i = 0; i < 6; i++) {
      const isNI = isNIVals[i];
      const cfNI = cfNIVals[i];
      if (isNI != null && cfNI != null) {
        const diff = Math.abs(isNI - cfNI);
        if (diff > 1 && diff / Math.abs(isNI || 1) > 0.01) {
          niBadCols.add(i);
          warnings.push(`IS-CF NI mismatch in ${annualPeriods[i]}: IS NI=${isNI.toFixed(1)}, CF NI=${cfNI.toFixed(1)} (Δ=${diff.toFixed(1)})`);
        }
      }
    }
  }

  // ── Workbook ──────────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "AlphaEdge";
  wb.created = new Date();

  // ── Input values ─────────────────────────────────────────────────────────────
  // Raw Canalyst values are pasted directly into the Historicals input cells as
  // hardcoded (blue) inputs — there is NO separate Source sheet. The wrappers below
  // return value arrays; dataRow writes them as plain numbers, and the derived
  // formulas (YoY, margins, subtotals) reference those Historicals cells by row.
  const PL_VALS = {
    rev:     { ann: revA,     qtr: revQ },
    cogs:    { ann: cogA,     qtr: cogQ },
    sga:     { ann: sgaA,     qtr: sgaQ },
    da:      { ann: daA,      qtr: daQ  },
    sbc:     { ann: sbcA,     qtr: sbcQ },
    intexp:  { ann: intExpA,  qtr: intExpQ },
    intinc:  { ann: intIncA,  qtr: intIncQ },
    other:   { ann: otherA,   qtr: otherQ  },
    ebt:     { ann: ebtA,     qtr: ebtQ  },
    curtax:  { ann: curTaxA,  qtr: curTaxQ },
    deftax:  { ann: defTaxA,  qtr: defTaxQ },
    nongaap: { ann: nonGaapA, qtr: nonGaapQ },
    eps:     { ann: epsA,     qtr: epsQ  },
    shares:  { ann: sharesA,  qtr: sharesQ },
    nwc:     { ann: nwcA,     qtr: nwcQ  },
  };

  const sA  = (key) => PL_VALS[key].ann;
  const sQ  = (key) => PL_VALS[key].qtr;
  const cfA = (it)  => pad(it && it.annual,    6);
  const cfQ = (it)  => pad(it && it.quarterly, 28);
  const bsA = (it)  => pad(it && it.annual,    6);
  const bsQ = (it)  => pad(it && it.quarterly, 28);

  // ── Historicals worksheet ─────────────────────────────────────────────────────
  const ws = wb.addWorksheet("Historicals", {
    views: [{ state: "frozen", xSplit: 5, ySplit: 0, showGridLines: false }],
  });

  // Uniform row height across the whole sheet — no per-row customization.
  ws.properties.defaultRowHeight = 15;

  // Cols A–D: narrow indent steps (labels overflow rightward into the wide col E).
  ws.getColumn(1).width  = 1.5;
  ws.getColumn(2).width  = 1.5;
  ws.getColumn(3).width  = 1.5;
  ws.getColumn(4).width  = 1.5;
  // Col E: wide label-overflow / spacer column (~300px) so long line items display
  // in full before bumping into the values column. No fill, no borders.
  ws.getColumn(5).width  = 42;
  ANN_COLS.forEach(c => { ws.getColumn(c).width = 10.5; });
  ws.getColumn(12).width = 1.83;
  ws.getColumn(13).width = 9.83;
  ws.getColumn(14).width = 1.83;
  QTR_COLS.forEach(c => { ws.getColumn(c).width = 10.5; });

  let row = 1;
  const rw = {};

  // ── Border helpers ────────────────────────────────────────────────────────────
  let _lastMainInfo     = null;
  let _needsTopBorder   = false;

  function sc(cell, opts = {}) {
    if (opts.bg !== undefined) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.bg } };
    }
    cell.font = {
      bold: !!opts.bold, italic: !!opts.italic,
      size: 11, color: { argb: opts.fg ?? BLACK }, name: "Calibri",
    };
    cell.alignment = { horizontal: opts.align ?? "left", vertical: "middle", wrapText: false };
  }

  function addSide(cell, side) {
    const b = cell.border ? { ...cell.border } : {};
    b[side] = { style: "thin", color: { argb: BLACK } };
    cell.border = b;
  }

  // Horizontal borders only, and only under the numeric columns — never under the
  // label/indent columns (B–E), so line items like SG&A don't look underlined.
  // No vertical borders are ever applied.
  function borderAll(rowNum, side) {
    for (const c of ANN_COLS)  addSide(ws.getCell(rowNum, c), side);
    for (const c of QTR_COLS)  addSide(ws.getCell(rowNum, c), side);
  }

  // ── Row writers ───────────────────────────────────────────────────────────────
  function secHeader(label) {
    _lastMainInfo  = null;
    _needsTopBorder = false;

    // Black band from column B to the right edge of the data; column A (the "x"
    // marker column) stays white.
    for (let c = COL_MAIN; c <= TOTAL_COLS; c++) {
      ws.getCell(row, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLACK } };
    }
    const mk = ws.getCell(row, COL_MARKER);
    mk.value = "x";
    sc(mk, { fg: BLACK, bold: true });
    const lc = ws.getCell(row, COL_MAIN);
    lc.value = label;
    sc(lc, { bg: BLACK, fg: WHITE, bold: true });
    row++;
  }

  function periodHeaders() {
    const fyeCell = ws.getCell(row, ANN_COLS[0]);
    fyeCell.value = fiscalYearEnd ? `FYE ${fiscalYearEnd},` : "FYE";
    sc(fyeCell, { bold: true, align: "center" });
    const qhdCell = ws.getCell(row, QTR_COLS[0]);
    qhdCell.value = "3 Months Ended,";
    sc(qhdCell, { bold: true, align: "center" });
    // Center the labels across their full column blocks (years / quarters).
    ws.mergeCells(row, ANN_COLS[0], row, ANN_COLS[ANN_COLS.length - 1]);
    ws.mergeCells(row, QTR_COLS[0], row, QTR_COLS[QTR_COLS.length - 1]);
    borderAll(row, "bottom");
    row++;

    ANN_COLS.forEach((c, i) => {
      const cell = ws.getCell(row, c);
      const period = annualPeriods[i];
      cell.value = period ? parseInt(period.replace("FY", ""), 10) : null;
      if (cell.value != null) cell.numFmt = YR_FMT;
      sc(cell, { bold: true, align: "center" });
    });
    QTR_COLS.forEach((c, i) => {
      const cell = ws.getCell(row, c);
      const d = quarterlyDates[i];
      if (d) {
        cell.value = d instanceof Date ? d : new Date(d);
        cell.numFmt = DT_FMT;
      }
      sc(cell, { bold: true, align: "center" });
    });
    borderAll(row, "top");
    borderAll(row, "bottom");
    row++;
    _needsTopBorder = true;
  }

  function blank() {
    // Full-height blank spacer row (uniform default height) — never a thin sliver.
    row++;
  }

  function writeDataCell(cell, v, fmt, fontOpts, addTop) {
    if (typeof v === "string" && v.startsWith("=")) {
      cell.value = { formula: v };
      cell.numFmt = fmt;
    } else if (v != null) {
      cell.value = v;
      cell.numFmt = fmt;
    } else {
      cell.value = null;
    }
    sc(cell, fontOpts);
    if (addTop) addSide(cell, "top");
  }

  function dataRow(labelCol, label, annVals, qtrVals, opts = {}) {
    const { valueStyle = "input", isPct = false, fgOverride = null } = opts;
    const isSubtotal = valueStyle === "subtotal";
    const isDerived  = valueStyle === "derived";

    const needsTop = _needsTopBorder;
    if (_needsTopBorder) _needsTopBorder = false;

    // Single shared border line, not double-bracketed: every subtotal/total row
    // gets only a thin TOP border (which sits on the same gridline as the
    // row-above's bottom border) and never a bottom border. Also top-border the
    // first data row after period headers (sandwich).
    const addTop = needsTop || isSubtotal;

    const labelCell = ws.getCell(row, labelCol);
    labelCell.value = label;
    sc(labelCell, { bold: isSubtotal, italic: isDerived, fg: fgOverride ?? BLACK });

    const numFg = fgOverride ?? (isSubtotal ? BLACK : isDerived ? BLACK : BLUE);
    const fmt   = isPct ? PCT_FMT : (isSubtotal ? CUR_FMT : NUM_FMT);
    const fOpts = { fg: numFg, bold: isSubtotal, italic: isDerived, align: "right" };

    ANN_COLS.forEach((c, i) => writeDataCell(ws.getCell(row, c), annVals[i], fmt, fOpts, addTop));
    QTR_COLS.forEach((c, i) => writeDataCell(ws.getCell(row, c), qtrVals[i], fmt, fOpts, addTop));

    if (isSubtotal) {
      // Give the row immediately above the subtotal a thin bottom border (same
      // gridline as this row's top border → one shared line).
      if (_lastMainInfo) { borderAll(_lastMainInfo.rowNum, "bottom"); _lastMainInfo = null; }
    } else {
      _lastMainInfo = { rowNum: row, labelCol };
    }

    row++;
  }

  const main  = (l, aV, qV, o = {}) => dataRow(COL_MAIN,  l, aV, qV, { valueStyle: "input",    ...o });
  const sub   = (l, aV, qV, o = {}) => dataRow(COL_SUB,   l, aV, qV, { valueStyle: "subtotal",  ...o });
  const pct   = (l, aV, qV, o = {}) => dataRow(COL_DERIV, l, aV, qV, { valueStyle: "derived", isPct: true, ...o });
  const pct3  = (l, aV, qV, o = {}) => dataRow(COL_SUB,   l, aV, qV, { valueStyle: "derived", isPct: true, ...o });

  function mainR(key, l, aV, qV, o = {}) { rw[key] = row; main(l, aV, qV, o); }
  function subR (key, l, aV, qV, o = {}) { rw[key] = row; sub(l,  aV, qV, o); }

  // ── Formula generators ────────────────────────────────────────────────────────
  const yoyA    = (r)      => ANN_COLS.map((c, i) => i === 0 ? null : `=IFERROR(${cl(c)}${r}/${cl(ANN_COLS[i-1])}${r}-1,"")`);
  const yoyQ    = (r)      => QTR_COLS.map((c, i) => i < 4  ? null : `=IFERROR(${cl(c)}${r}/${cl(QTR_COLS[i-4])}${r}-1,"")`);
  const cagr2A  = (r)      => ANN_COLS.map((c, i) => i < 2  ? null : `=IFERROR((${cl(c)}${r}/${cl(ANN_COLS[i-2])}${r})^0.5-1,"")`);
  const mgnA    = (nR, dR) => ANN_COLS.map(c => `=IFERROR(${cl(c)}${nR}/${cl(c)}${dR},"")`);
  const mgnQ    = (nR, dR) => QTR_COLS.map(c => `=IFERROR(${cl(c)}${nR}/${cl(c)}${dR},"")`);
  const incrA   = (nR, dR) => ANN_COLS.map((c, i) => i === 0 ? null :
    `=IFERROR((${cl(c)}${nR}-${cl(ANN_COLS[i-1])}${nR})/(${cl(c)}${dR}-${cl(ANN_COLS[i-1])}${dR}),"")`);
  const diffA   = (rA, rB) => ANN_COLS.map(c => `=${cl(c)}${rA}-${cl(c)}${rB}`);
  const diffQ   = (rA, rB) => QTR_COLS.map(c => `=${cl(c)}${rA}-${cl(c)}${rB}`);
  const sum3A   = (rA, rB, rC) => ANN_COLS.map(c => `=${cl(c)}${rA}+${cl(c)}${rB}+${cl(c)}${rC}`);
  const sum3Q   = (rA, rB, rC) => QTR_COLS.map(c => `=${cl(c)}${rA}+${cl(c)}${rB}+${cl(c)}${rC}`);
  const sumRngA = (r1, r2) => ANN_COLS.map(c => `=SUM(${cl(c)}${r1}:${cl(c)}${r2})`);
  const sumRngQ = (r1, r2) => QTR_COLS.map(c => `=SUM(${cl(c)}${r1}:${cl(c)}${r2})`);

  // ── Title rows ────────────────────────────────────────────────────────────────
  // Bold black text on white (NOT a black fill — that styling is reserved for
  // section divider rows). No underline.
  const titleCell = ws.getCell(row, COL_MAIN);
  titleCell.value = `${companyName} (${ticker}), Historicals`;
  sc(titleCell, { fg: BLACK, bold: true });
  row++;

  ws.getCell(row, COL_MAIN).value = `(${curSym} in millions)`;
  sc(ws.getCell(row, COL_MAIN), { italic: true, fg: "FF595959" });
  row++;

  // ══════════════════════════════════════════════════════════════════════════════
  // P&L
  // ══════════════════════════════════════════════════════════════════════════════
  secHeader("Profit & Loss");
  periodHeaders();

  mainR("rev",  "Revenue", sA("rev"),  sQ("rev"));
  pct3("% growth",  yoyA(rw.rev), yoyQ(rw.rev));
  pct3("% 2Y CAGR", cagr2A(rw.rev), Array(28).fill(null));
  blank();

  mainR("cogs", "COGS", sA("cogs"), sQ("cogs"));
  subR("gp", "Gross Profit", diffA(rw.rev, rw.cogs), diffQ(rw.rev, rw.cogs));
  pct("% margin",             mgnA(rw.gp, rw.rev),  mgnQ(rw.gp, rw.rev));
  pct("% incremental margin", incrA(rw.gp, rw.rev), Array(28).fill(null));
  pct("% growth",             yoyA(rw.gp),           yoyQ(rw.gp));
  blank();

  mainR("sga", "SG&A", sA("sga"), sQ("sga"));
  subR("ebit", "EBIT", diffA(rw.gp, rw.sga), diffQ(rw.gp, rw.sga));
  pct("% margin", mgnA(rw.ebit, rw.rev), mgnQ(rw.ebit, rw.rev));
  pct("% growth", yoyA(rw.ebit),          yoyQ(rw.ebit));
  blank();

  mainR("da",  "(+) D&A", sA("da"),  sQ("da"));
  mainR("sbc", "(+) SBC", sA("sbc"), sQ("sbc"));
  subR("ebitda", "EBITDA", sum3A(rw.ebit, rw.da, rw.sbc), sum3Q(rw.ebit, rw.da, rw.sbc));
  pct("% margin", mgnA(rw.ebitda, rw.rev), mgnQ(rw.ebitda, rw.rev));
  pct("% growth", yoyA(rw.ebitda),          yoyQ(rw.ebitda));
  blank();

  mainR("intexp", "Interest expense",  sA("intexp"), sQ("intexp"));
  mainR("intinc", "Interest (income)", sA("intinc"), sQ("intinc"));
  mainR("other",  "Other items",       sA("other"),  sQ("other"));
  mainR("ebt",    "EBT",               sA("ebt"),    sQ("ebt"));
  pct("% tax rate", taxRateA, taxRateQ);  // static: forward-ref avoidance
  blank();

  mainR("curtax", "Current tax",  sA("curtax"), sQ("curtax"));
  mainR("deftax", "Deferred tax", sA("deftax"), sQ("deftax"));
  subR("inctax", "Income Tax Expense",
    ANN_COLS.map(c => `=${cl(c)}${rw.curtax}+${cl(c)}${rw.deftax}`),
    QTR_COLS.map(c => `=${cl(c)}${rw.curtax}+${cl(c)}${rw.deftax}`)
  );
  subR("ni", `Net Income to ${ticker}`,
    ANN_COLS.map(c => `=${cl(c)}${rw.ebt}-${cl(c)}${rw.inctax}`),
    QTR_COLS.map(c => `=${cl(c)}${rw.ebt}-${cl(c)}${rw.inctax}`)
  );
  pct("% margin", mgnA(rw.ni, rw.rev), mgnQ(rw.ni, rw.rev));
  pct("% growth", yoyA(rw.ni),          yoyQ(rw.ni));
  blank();

  mainR("nongaap", "Non-GAAP Adjustments", sA("nongaap"), sQ("nongaap"));
  subR("adjni", "Adj. Net Income",
    ANN_COLS.map(c => `=${cl(c)}${rw.ni}+${cl(c)}${rw.nongaap}`),
    QTR_COLS.map(c => `=${cl(c)}${rw.ni}+${cl(c)}${rw.nongaap}`)
  );
  pct("% margin", mgnA(rw.adjni, rw.rev), mgnQ(rw.adjni, rw.rev));
  pct("% growth", yoyA(rw.adjni),          yoyQ(rw.adjni));
  blank();

  main("EPS - WAD",               sA("eps"),    sQ("eps"));
  main("Shares Outstanding - WAD", sA("shares"), sQ("shares"));

  blank();

  // ══════════════════════════════════════════════════════════════════════════════
  // CASH FLOW
  // ══════════════════════════════════════════════════════════════════════════════
  secHeader("Cash Flow Statement");
  periodHeaders();

  const cfoLineItems = cfData.cfo.filter(it => !it.isSubtotal);
  let cfoFirstRow = null, cfoLastRow = null;
  for (const it of cfoLineItems) {
    if (cfoFirstRow === null) cfoFirstRow = row;
    const isNI = it === cfNetIncItem;
    if (isNI) rw.cfNI = row;
    main(it.tcmLabel, cfA(it), cfQ(it));
    cfoLastRow = row - 1;
  }
  // NWC
  if (cfoFirstRow === null) { cfoFirstRow = row; cfoLastRow = row; }
  main("NWC", sA("nwc"), sQ("nwc"));
  cfoLastRow = row - 1;

  const cfoSub = cfData.cfo.find(it => it.isSubtotal);
  if (cfoFirstRow !== null && cfoLastRow !== null) {
    rw.cfo = row;
    sub("CFO", sumRngA(cfoFirstRow, cfoLastRow), sumRngQ(cfoFirstRow, cfoLastRow));
  } else if (cfoSub) {
    rw.cfo = row;
    sub("CFO", cfA(cfoSub), cfQ(cfoSub));
  }
  if (rw.cfo) {
    pct("% margin", mgnA(rw.cfo, rw.rev), mgnQ(rw.cfo, rw.rev));
    pct("% growth", yoyA(rw.cfo),          yoyQ(rw.cfo));
  }
  blank();

  let wcFirstRow = null, wcLastRow = null;
  for (const it of cfData.wc) {
    if (wcFirstRow === null) wcFirstRow = row;
    main(it.tcmLabel, cfA(it), cfQ(it));
    wcLastRow = row - 1;
  }
  rw.nwcSub = row;
  if (wcFirstRow !== null) {
    sub("Net Working Capital", sumRngA(wcFirstRow, wcLastRow), sumRngQ(wcFirstRow, wcLastRow));
  } else {
    sub("Net Working Capital", sA("nwc"), sQ("nwc"));
  }
  pct("% margin", mgnA(rw.nwcSub, rw.rev), mgnQ(rw.nwcSub, rw.rev));
  pct("% growth", yoyA(rw.nwcSub),          yoyQ(rw.nwcSub));
  blank();

  const cfiLineItems = cfData.cfi.filter(it => !it.isSubtotal);
  let cfiFirstRow = null, cfiLastRow = null;
  for (const it of cfiLineItems) {
    if (cfiFirstRow === null) cfiFirstRow = row;
    main(it.tcmLabel, cfA(it), cfQ(it));
    cfiLastRow = row - 1;
  }
  const cfiSub = cfData.cfi.find(it => it.isSubtotal);
  if (cfiFirstRow !== null && cfiLastRow !== null) {
    sub("Net CFI", sumRngA(cfiFirstRow, cfiLastRow), sumRngQ(cfiFirstRow, cfiLastRow));
  } else if (cfiSub) {
    sub("Net CFI", cfA(cfiSub), cfQ(cfiSub));
  }
  blank();

  const cffLineItems = cfData.cff.filter(it => !it.isSubtotal);
  let cffFirstRow = null, cffLastRow = null;
  for (const it of cffLineItems) {
    if (cffFirstRow === null) cffFirstRow = row;
    main(it.tcmLabel, cfA(it), cfQ(it));
    cffLastRow = row - 1;
  }
  const cffSub = cfData.cff.find(it => it.isSubtotal);
  if (cffFirstRow !== null && cffLastRow !== null) {
    sub("Net CFF", sumRngA(cffFirstRow, cffLastRow), sumRngQ(cffFirstRow, cffLastRow));
  } else if (cffSub) {
    sub("Net CFF", cfA(cffSub), cfQ(cffSub));
  }
  blank();

  const fx      = cfData.other.find(it => it.label === "FX");
  const netChg  = cfData.other.find(it => it.label === "Net Change in Cash Balance");
  const begCash = cfData.other.find(it => it.label === "Beginning Cash Balance");
  const endCash = cfData.other.find(it => it.label === "Ending Cash Balance");
  const intPaid = cfData.other.find(it => it.label === "Cash paid for interest");
  const taxPaid = cfData.other.find(it => it.label === "Cash paid for income taxes, net of refunds");

  if (fx)      main("FX", cfA(fx), cfQ(fx));
  if (netChg)  sub("Net Change in Cash Balance", cfA(netChg), cfQ(netChg));
  blank();
  if (begCash) main("Beginning Cash Balance", cfA(begCash), cfQ(begCash));
  if (endCash) { rw.endCash = row; main("Ending Cash Balance", cfA(endCash), cfQ(endCash)); }
  blank();
  if (intPaid) main("Cash paid for interest", cfA(intPaid), cfQ(intPaid));
  if (taxPaid) main("Cash paid for income taxes, net of refunds", cfA(taxPaid), cfQ(taxPaid));

  blank();

  // ══════════════════════════════════════════════════════════════════════════════
  // BALANCE SHEET
  // ══════════════════════════════════════════════════════════════════════════════
  secHeader("Balance Sheet");
  periodHeaders();

  function bsBlock(items, subtotalKey, subtotalLabel) {
    const lineItems = items.filter(it => !it.isSubtotal);
    const subItem   = items.find(it => it.isSubtotal);
    let firstRow = null, lastRow = null;
    for (const it of lineItems) {
      if (firstRow === null) firstRow = row;
      main(it.tcmLabel, bsA(it), bsQ(it));
      lastRow = row - 1;
    }
    if (firstRow !== null && lastRow !== null) {
      if (subtotalKey) rw[subtotalKey] = row;
      sub(subtotalLabel, sumRngA(firstRow, lastRow), sumRngQ(firstRow, lastRow));
    } else if (subItem) {
      if (subtotalKey) rw[subtotalKey] = row;
      sub(subtotalLabel, bsA(subItem), bsQ(subItem));
    }
  }

  bsBlock(bsData.currAssets, "currAssets", "Current Assets");
  blank();

  const ncaLineItems = bsData.noncurrAssets.filter(it =>
    !/total assets/i.test(it.label) && !it.isSubtotal);
  let ncaFirst = null, ncaLast = null;
  for (const it of ncaLineItems) {
    if (ncaFirst === null) ncaFirst = row;
    main(it.tcmLabel, bsA(it), bsQ(it));
    ncaLast = row - 1;
  }
  if (totalAssetsItem) {
    rw.totalAssets = row;
    sub("Total Assets", bsA(totalAssetsItem), bsQ(totalAssetsItem));
  }
  blank();

  bsBlock(bsData.currLiab, "currLiab", "Current Liabilities");
  blank();

  const ncLiabLines = bsData.noncurrLiab.filter(it =>
    !/total liab/i.test(it.label) && !it.isSubtotal);
  for (const it of ncLiabLines) {
    main(it.tcmLabel, bsA(it), bsQ(it));
  }
  if (totalLiabItem) {
    rw.totalLiab = row;
    sub("Total Liabilities", bsA(totalLiabItem), bsQ(totalLiabItem));
  }
  blank();

  const equityLines = bsData.equity.filter(it => it !== totalSEItem && it !== totalLSEItem && !it.isSubtotal);
  let eqFirst = null, eqLast = null;
  for (const it of equityLines) {
    if (eqFirst === null) eqFirst = row;
    main(it.tcmLabel, bsA(it), bsQ(it));
    eqLast = row - 1;
  }
  if (totalSEItem) {
    rw.totalSE = row;
    if (eqFirst !== null) {
      sub("Total Equity", sumRngA(eqFirst, eqLast), sumRngQ(eqFirst, eqLast));
    } else {
      sub("Total Equity", bsA(totalSEItem), bsQ(totalSEItem));
    }
  }
  blank();
  if (totalLSEItem) {
    rw.totalLSE = row;
    main("Total Liabilities & SE", bsA(totalLSEItem), bsQ(totalLSEItem));
  }

  blank();

  // ══════════════════════════════════════════════════════════════════════════════
  // BALANCE CHECKS
  // ══════════════════════════════════════════════════════════════════════════════
  secHeader("Balance Checks");
  periodHeaders();

  if (rw.totalAssets && rw.totalLSE) {
    // Universal identity: Total Assets − Total Liabilities & SE (handles NCI).
    const chkA = ANN_COLS.map(c => `=IFERROR(${cl(c)}${rw.totalAssets}-${cl(c)}${rw.totalLSE},"")`);
    const chkQ = QTR_COLS.map(c => `=IFERROR(${cl(c)}${rw.totalAssets}-${cl(c)}${rw.totalLSE},"")`);
    main("BS: Assets − (Liab + Equity) — should be 0", chkA, chkQ);
  } else if (rw.totalAssets && rw.totalLiab && rw.totalSE) {
    const chkA = ANN_COLS.map(c =>
      `=IFERROR(${cl(c)}${rw.totalAssets}-(${cl(c)}${rw.totalLiab}+${cl(c)}${rw.totalSE}),"")`);
    const chkQ = QTR_COLS.map(c =>
      `=IFERROR(${cl(c)}${rw.totalAssets}-(${cl(c)}${rw.totalLiab}+${cl(c)}${rw.totalSE}),"")`);
    main("BS: Assets − (Liab + Equity) — should be 0", chkA, chkQ);
  }

  if (rw.ni && rw.cfNI) {
    const chkA = ANN_COLS.map(c => `=IFERROR(${cl(c)}${rw.ni}-${cl(c)}${rw.cfNI},"")`);
    const chkQ = QTR_COLS.map(c => `=IFERROR(${cl(c)}${rw.ni}-${cl(c)}${rw.cfNI},"")`);
    main("IS-CF: NI check (IS − CF NI) — should be 0", chkA, chkQ);
  }

  // ── Apply yellow highlights to mismatch cells ────────────────────────────────
  for (const colIdx of bsBadCols) {
    const col = ANN_COLS[colIdx];
    const yellow = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
    if (rw.totalAssets) ws.getCell(rw.totalAssets, col).fill = yellow;
    if (rw.totalLiab)   ws.getCell(rw.totalLiab,   col).fill = yellow;
    if (rw.totalSE)     ws.getCell(rw.totalSE,     col).fill = yellow;
  }
  for (const colIdx of niBadCols) {
    const col = ANN_COLS[colIdx];
    const yellow = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
    if (rw.ni)    ws.getCell(rw.ni,    col).fill = yellow;
    if (rw.cfNI)  ws.getCell(rw.cfNI,  col).fill = yellow;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return { buffer, warnings };
}

module.exports = { generateTcmExcel };
