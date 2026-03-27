const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const express = require("express");
const app = express();
app.use(express.json());
const router = express.Router({ mergeParams: true });
const yahooFinance = require("yahoo-finance2").default;
const { updateAllCompanies, wait } = require("../lib/utils");

router.get("/tickers", async (req, res) => {
  response = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": "Santi Criado (santiagocriado@meta.com)" },
  });
  const data = await response.json();
  for (const key of Object.keys(data)) {
    const value = data[key];
    const company = await prisma.company.findFirst({
      where: { cik_number: parseInt(value.cik_str) },
    });
    if (company === null) {
      await prisma.company.create({
        data: {
          cik_number: parseInt(value.cik_str),
          ticker: value.ticker,
          name: value.title,
          daily_price: 0,
        },
      });
    }
  }

  res.status(200).json({ message: "got all the way here" });
});

const FORM_TYPE = { tenk: "10-K", eightk: "8-K", tenq: "10-Q" };

router.post("/companyfill", async (req, res) => {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { documents: true } } },
  });

  // Only process companies that have no documents yet
  const toFill = companies.filter((c) => c._count.documents === 0);
  console.log(`Document fill: ${toFill.length} companies need documents (${companies.length - toFill.length} already done)`);

  const BATCH_CONCURRENT = 5; // 5 parallel SEC requests stays well within their 10 req/s limit
  let done = 0;
  for (let i = 0; i < toFill.length; i += BATCH_CONCURRENT) {
    const batch = toFill.slice(i, i + BATCH_CONCURRENT);
    await Promise.all(batch.map(companyFillHelper));
    done += batch.length;
    console.log(`Documents: ${done}/${toFill.length} companies processed (${((done / toFill.length) * 100).toFixed(1)}%)`);
    await wait(300); // brief pause between batches
  }

  res.status(200).json({ message: `Successfully populated ${done} companies` });
});

// populate company information!!!
router.post("/companyfill/:cik_number", async (req, res) => {
  const cik = parseInt(req.params.cik_number);
  const paddedCik = cik.toString().padStart(10, "0");
  const company = await prisma.company.findUnique({
    where: { cik_number: cik },
  });
  if (company === null) {
    return res.status(400).json({
      error: "company not yet in databse, or not registered on the SEC",
    });
  }
  const response = await fetch(
    `https://data.sec.gov/submissions/CIK${paddedCik}.json`,
    {
      headers: { "User-Agent": "Santi Criado (santiagocriado@meta.com)" },
    }
  );
  const data = await response.json();
  const filings = data.filings.recent;
  const length = data.filings.recent.accessionNumber.length;
  for (let i = 0; i < length; i++) {
    if (
      filings.form[i] === FORM_TYPE.tenk ||
      filings.form[i] === FORM_TYPE.eightk ||
      filings.form[i] === FORM_TYPE.tenq
    ) {
      const newDocument = await prisma.document.create({
        data: {
          type: filings.form[i],
          url: `https://www.sec.gov/Archives/edgar/data/${cik}/${filings.accessionNumber[
            i
          ].replaceAll("-", "")}/${filings.primaryDocument[i]}`,
          filed_date: new Date(filings.filingDate[i]),
          companyId: company.id,
        },
      });
    }
  }
  res.status(200).json({ message: "got all the way here" });
});

const companyFillHelper = async (company) => {
  if (company == null || company._count.documents > 0) return;
  const cik = company.cik_number;
  const paddedCik = cik.toString().padStart(10, "0");
  try {
    const response = await fetch(
      `https://data.sec.gov/submissions/CIK${paddedCik}.json`,
      { headers: { "User-Agent": "Santi Criado (santiagocriado@meta.com)" } }
    );
    if (!response.ok) return;
    const data = await response.json();
    const filings = data.filings.recent;
    const length = filings.accessionNumber.length;

    const docs = [];
    for (let i = 0; i < length; i++) {
      if (
        filings.form[i] === FORM_TYPE.tenk ||
        filings.form[i] === FORM_TYPE.eightk ||
        filings.form[i] === FORM_TYPE.tenq
      ) {
        docs.push({
          type: filings.form[i],
          url: `https://www.sec.gov/Archives/edgar/data/${cik}/${filings.accessionNumber[i].replaceAll("-", "")}/${filings.primaryDocument[i]}`,
          filed_date: new Date(filings.filingDate[i]),
          companyId: company.id,
        });
      }
    }

    if (docs.length > 0) {
      // skipDuplicates prevents errors if this company is re-processed
      await prisma.document.createMany({ data: docs, skipDuplicates: true });
    }
  } catch (err) {
    console.error(`Failed to fill ${company.ticker}:`, err?.message);
  }
};

// assign sector and industry denominations to database
router.post("/industry-sector-desc-fill", async (req, res) => {
  const companies = await prisma.company.findMany();
  let ind = 0;
  for (let company of companies) {
    let companyInfo;
    try {
      companyInfo = await yahooFinance.quoteSummary(company.ticker, {
        modules: ["assetProfile"],
      });
    } catch (err) {
      continue;
    }
    // check existing
    if (companyInfo.assetProfile.sector == null) {
      continue;
    }
    const existing = await prisma.sector.findUnique({
      where: {
        name: companyInfo.assetProfile.sector,
      },
    });
    if (existing == null) {
      const newSector = await prisma.sector.create({
        data: {
          name: companyInfo.assetProfile.sector,
        },
      });
      // sector does not exist, so it is therefore impossible that corresponding industies yet exist, so no need to check
      const newIndustry = await prisma.industry.create({
        data: {
          name: companyInfo.assetProfile.industry,
          sectorId: newSector.id,
        },
      });
      await updateCompany(
        company,
        newIndustry.id,
        companyInfo.assetProfile.longBusinessSummary
      );
    } else {
      // sector already exists, so the industry could already exist.
      const existingIndustry = await prisma.industry.findUnique({
        where: {
          name: companyInfo.assetProfile.industry,
        },
      });
      if (existingIndustry == null) {
        const newIndustry = await prisma.industry.create({
          data: {
            name: companyInfo.assetProfile.industry,
            sectorId: existing.id,
          },
        });
        await updateCompany(
          company,
          newIndustry.id,
          companyInfo.assetProfile.longBusinessSummary
        );
      } else {
        await updateCompany(
          company,
          existingIndustry.id,
          companyInfo.assetProfile.longBusinessSummary
        );
      }
    }
    ind++;
    await wait(40);
  }
  res.json({ message: "done" });
});

// batch calls for companies, used for TC 1:

router.post("/", async (req, res) => {
  await updateAllCompanies();
  res.json({ message: "prices updated" });
});

// helper functions below

const updateCompany = async (company, industryId, description) => {
  await prisma.company.update({
    where: {
      id: company.id,
    },
    data: {
      industryId,
      description,
    },
  });
};

module.exports = { router, updateAllCompanies };
