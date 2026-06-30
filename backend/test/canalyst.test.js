// End-to-end regression tests for the Canalyst → TCM pipeline.
//
// Every .xlsx in /examples that is a real Canalyst model (has a "Model" sheet) is
// run through parse → validate → generate, asserting that no model fails to
// generate or loses a whole section of data. Drop a new model into /examples and
// it is automatically covered.
//
// Run: `npm test`  (from backend/), or `node --test test/`.
//
// Note: /examples is not committed (proprietary Canalyst data), so when the
// fixtures are absent the suite skips rather than failing — commit a fixture or
// two if you want this enforced in CI.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");

const { parseCanalyst } = require("../lib/canalystParser");
const { generateTcmExcel } = require("../lib/tcmGenerator");
const { validateParsed } = require("../lib/validateParsed");

const EXAMPLES_DIR = path.join(__dirname, "..", "..", "examples");

// Discover example files that are actually Canalyst models (a "Model" sheet).
// Excludes generated TCM outputs (e.g. example-DECK.xlsx) and temp lock files.
function canalystModels() {
  if (!fs.existsSync(EXAMPLES_DIR)) return [];
  return fs
    .readdirSync(EXAMPLES_DIR)
    .filter((f) => f.endsWith(".xlsx") && !f.startsWith("~$"))
    .filter((f) => {
      try {
        const wb = XLSX.read(fs.readFileSync(path.join(EXAMPLES_DIR, f)), {
          type: "buffer",
          bookSheets: true,
        });
        return wb.SheetNames.includes("Model");
      } catch {
        return false;
      }
    });
}

const models = canalystModels();
const fmt = (issues) => issues.map((i) => `${i.section}: ${i.message}`).join("\n  ");

test("example Canalyst models are present", { skip: models.length === 0 && "no example .xlsx fixtures present (examples/ not committed)" }, () => {
  assert.ok(models.length > 0, `No Canalyst models found in ${EXAMPLES_DIR}`);
});

for (const file of models) {
  test(`generates without failure or missing sections: ${file}`, async () => {
    const buf = fs.readFileSync(path.join(EXAMPLES_DIR, file));

    // 1. Parsing must not throw.
    let parsed;
    assert.doesNotThrow(() => {
      parsed = parseCanalyst(buf);
    }, `parseCanalyst threw for ${file}`);

    // 2. No critical coverage gaps (whole P&L / CF / BS section missing).
    const cov = validateParsed(parsed);
    assert.strictEqual(
      cov.criticals.length,
      0,
      `Critical coverage gaps in ${file}:\n  ${fmt(cov.criticals)}`,
    );

    // 3. Generation succeeds and produces a non-trivial workbook.
    const { buffer, warnings } = await generateTcmExcel(parsed);
    const size = buffer.byteLength ?? buffer.length;
    assert.ok(size > 5000, `Output workbook for ${file} is empty/too small (${size} bytes)`);

    // 4. No numeric-consistency failures (BS doesn't balance / IS-NI ≠ CF-NI).
    const inconsistencies = warnings.filter((w) => /imbalance|mismatch/i.test(w));
    assert.strictEqual(
      inconsistencies.length,
      0,
      `Numeric-consistency warnings in ${file}:\n  ${inconsistencies.join("\n  ")}`,
    );

    // 5. No "CRITICAL —" warning leaked into the generated output.
    const criticalWarnings = warnings.filter((w) => /^CRITICAL —/.test(w));
    assert.strictEqual(
      criticalWarnings.length,
      0,
      `Critical warnings emitted for ${file}:\n  ${criticalWarnings.join("\n  ")}`,
    );

    // 6. Output shape: a visible Historicals sheet, and no leftover Source tab.
    const out = new ExcelJS.Workbook();
    await out.xlsx.load(buffer);
    const names = out.worksheets.map((w) => w.name);
    assert.ok(names.includes("Historicals"), `Missing 'Historicals' sheet in ${file}`);
    assert.ok(!names.includes("Source"), `Unexpected 'Source' sheet in ${file}`);
  });
}
