const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const express = require("express");
const ExcelJS = require("exceljs");
const router = express.Router({ mergeParams: true });
const finnhub = require("finnhub");
const finnhubClient = new finnhub.DefaultApi(process.env.finnhubKey);

const C = {
  titleBg: "FF0F172A", titleFg: "FFFFFFFF",
  fyeBg:   "FF000000", fyeFg:   "FFFFFFFF",
  yearBg:  "FF1E293B", yearFg:  "FFFFFFFF",
  secIsBg: "FF1E3A5F", secBsBg: "FF1A3A2F", secCfBg: "FF3A2A1A",
  secFg:   "FFFFFFFF",
  rowA:    "FFFFFFFF", rowB:    "FFF8FAFC",
  labelFg: "FF1E293B", numFg:   "FF1E293B",
  negFg:   "FFDC2626",
  border:  "FFD1D5DB",
};

const thin = (color) => ({ style: "thin", color: { argb: color } });
const borderBottom = (color) => ({ bottom: thin(color) });

const style = (cell, opts = {}) => {
  if (opts.bg) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.bg } };
  cell.font = {
    bold: !!opts.bold,
    italic: !!opts.italic,
    size: opts.size || 10,
    color: { argb: opts.fg || C.labelFg },
    name: "Calibri",
  };
  cell.alignment = { horizontal: opts.align || "left", vertical: "middle", indent: opts.indent || 0 };
  if (opts.borderBottom) cell.border = borderBottom(C.border);
};

const toM = (v) => {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return null;
  return parseFloat((n / 1_000_000).toFixed(1));
};

const NUM_FMT = '"$"#,##0.0_);("$"#,##0.0);"-"';

router.put("/generate-model-tcm/:id", async (req, res) => {
  const numYears  = Math.min(parseInt(req.body.years) || 5, 8);
  const companyId = parseInt(req.params.id);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return res.status(404).json({ error: "Company not found" });

  finnhubClient.financialsReported({ symbol: company.ticker, freq: "annual" }, async (error, data) => {
    if (error || !data?.data?.length) {
      return res.status(500).json({ error: "Could not fetch financials from Finnhub" });
    }

    const reports = data.data.slice(0, numYears).reverse(); // oldest → newest
    const years = reports.map((r) => r.year ?? r.period?.slice(0, 4) ?? "—");
    const numCols = years.length;
    const totalCols = numCols + 1;

    const wb = new ExcelJS.Workbook();
    wb.creator = "AlphaEdge";
    wb.created = new Date();

    const ws = wb.addWorksheet("Historicals", {
      views: [{ state: "frozen", xSplit: 1, ySplit: 4 }],
      properties: { tabColor: { argb: "FF10B981" } },
    });

    ws.getColumn(1).width = 44;
    for (let j = 2; j <= totalCols; j++) ws.getColumn(j).width = 14;

    // Row 1: title
    ws.mergeCells(1, 1, 1, totalCols);
    const r1 = ws.getCell(1, 1);
    r1.value = `${company.name}  (${company.ticker})  —  Historicals`;
    style(r1, { bg: C.titleBg, fg: C.titleFg, bold: true, size: 13, indent: 1 });
    ws.getRow(1).height = 26;

    // Row 2: units
    ws.mergeCells(2, 1, 2, totalCols);
    const r2 = ws.getCell(2, 1);
    r2.value = "($ in millions)";
    style(r2, { bg: C.titleBg, fg: "FF94A3B8", italic: true, size: 10, indent: 1 });
    ws.getRow(2).height = 16;

    // Row 3: year headers
    ws.getCell(3, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.yearBg } };
    for (let j = 0; j < numCols; j++) {
      const cell = ws.getCell(3, j + 2);
      cell.value = String(years[j]);
      style(cell, { bg: C.yearBg, fg: C.yearFg, bold: true, size: 10, align: "right" });
    }
    ws.getRow(3).height = 20;

    let row = 4;

    const writeSection = (stmtKey, secBg, secLabel, rptObjects) => {
      // Section header
      ws.mergeCells(row, 1, row, totalCols);
      const secCell = ws.getCell(row, 1);
      secCell.value = secLabel;
      style(secCell, { bg: secBg, fg: C.secFg, bold: true, size: 11, indent: 1 });
      ws.getRow(row).height = 20;
      row++;

      // Collect unique line items in Finnhub's order
      const seen = new Set();
      const items = [];
      for (const rpt of rptObjects) {
        for (const item of rpt?.[stmtKey] || []) {
          if (!seen.has(item.concept)) {
            seen.add(item.concept);
            items.push({ concept: item.concept, label: item.label });
          }
        }
      }

      const getVal = (rptIdx, concept) => {
        const found = (rptObjects[rptIdx]?.[stmtKey] || []).find((x) => x.concept === concept);
        return found?.value ?? null;
      };

      let altRow = false;
      for (const item of items) {
        const rowBg = altRow ? C.rowB : C.rowA;
        altRow = !altRow;

        const labelCell = ws.getCell(row, 1);
        labelCell.value = item.label;
        style(labelCell, { bg: rowBg, fg: C.labelFg, size: 10, indent: 1, borderBottom: true });

        for (let j = 0; j < numCols; j++) {
          const valM = toM(getVal(j, item.concept));
          const cell = ws.getCell(row, j + 2);
          cell.value = valM;
          cell.numFmt = NUM_FMT;
          style(cell, { bg: rowBg, fg: valM != null && valM < 0 ? C.negFg : C.numFg, size: 10, align: "right", borderBottom: true });
        }
        ws.getRow(row).height = 17;
        row++;
      }

      // Spacer
      ws.mergeCells(row, 1, row, totalCols);
      ws.getCell(row, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.titleBg } };
      ws.getRow(row).height = 6;
      row++;
    };

    const rptObjects = reports.map((r) => r.report);
    writeSection("ic", C.secIsBg, "INCOME STATEMENT",    rptObjects);
    writeSection("bs", C.secBsBg, "BALANCE SHEET",        rptObjects);
    writeSection("cf", C.secCfBg, "CASH FLOW STATEMENT",  rptObjects);

    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=historicals-${company.ticker}.xlsx`);
    res.send(buffer);
  });
});

module.exports = router;
