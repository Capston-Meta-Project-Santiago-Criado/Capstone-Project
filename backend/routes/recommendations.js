const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const express = require("express");
const app = express();
app.use(express.json());
const router = express.Router({ mergeParams: true });
require("dotenv").config();
const { updateAllCompanies } = require("../lib/utils");

// constants
const PORTFOLIO_PREFORMANCE = 0.6; // how much price affects portfolios, matters much more than companies
const PUBLIC_PORTFOLIOS_NUMBER = 9; // number of public portfolios to show
const LOWER_THAN_CHANGE = 0.05; // point at which weights no longer lower
const INIT_IND_REWARD = 0.2; // initial reward given to industry when they are clicked on by user for first time
const INIT_SECT_REWARD = 0.1; // same as above but for sector
const INDUSTRY_REWARD = 1; // reward given for interest selection at signup
const LAMBDA = 0.1; // constant factor
const DECAY_FACTOR = 1.5; // decay factor for increase / decrease of weights
const HISTORY_FACTOR = 0.5; // initial implication of history. goes .5, .25, .125, depend on recency of history
const NUMBER_RECOMMENDED = 8; // # of recommended companies
const DIVIDENDS_BASE = 1.05; // base number to be multiplied bt dividends in the last 2 years

// Server-side cache: key -> { data, fetchedAt }
const curatedCache = new Map();
const CURATED_TTL = 5 * 60 * 1000; // 5 minutes

/* get all public portfolios, sort by top X_number - get best recommended by performance
your interest, here performance will be weighted more than before!
*/
router.get("/curated-portfolios/public", async (req, res) => {
  if (req.session.isGuest == true) {
    const GUEST_KEY = "guest";
    const guestCached = curatedCache.get(GUEST_KEY);
    if (guestCached && Date.now() - guestCached.fetchedAt < CURATED_TTL) {
      return res.json(guestCached.data);
    }
    const data = await prisma.portfolio.findMany({
      where: { isPublic: true },
      include: { user: { select: { username: true } } },
      orderBy: { id: "asc" },
      take: PUBLIC_PORTFOLIOS_NUMBER,
    });
    curatedCache.set(GUEST_KEY, { data, fetchedAt: Date.now() });
    return res.json(data);
  }

  const userId = req.session.userId;

  // Serve from cache if fresh
  const cached = curatedCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CURATED_TTL) {
    return res.json(cached.data);
  }

  const [user, allPortfolios] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.portfolio.findMany({
      where: { isPublic: true },
      include: { user: { select: { username: true } } },
    }),
  ]);

  // Collect all unique company IDs across every portfolio — one query instead of N
  const allCompanyIds = [...new Set(allPortfolios.flatMap((p) => p.companiesIds))];
  const allCompanies = allCompanyIds.length
    ? await prisma.company.findMany({
        where: { id: { in: allCompanyIds } },
        include: { industry: { select: { id: true, sector: { select: { id: true } } } } },
      })
    : [];
  const companyById = Object.fromEntries(allCompanies.map((c) => [c.id, c]));

  const portfolioScores = {};
  for (const portfolio of allPortfolios) {
    const companies = portfolio.companiesIds.map((id) => companyById[id]).filter(Boolean);
    const sum = companies.reduce((acc, c) => acc + scoreValue(c, user, PORTFOLIO_PREFORMANCE), 0);
    portfolioScores[portfolio.id] = companies.length > 1 ? sum / (companies.length - 1) : sum;
  }

  const recommendedPortfolios = allPortfolios
    .sort((a, b) => portfolioScores[b.id] - portfolioScores[a.id])
    .slice(0, PUBLIC_PORTFOLIOS_NUMBER);

  curatedCache.set(userId, { data: recommendedPortfolios, fetchedAt: Date.now() });
  res.json(recommendedPortfolios);
});

// return scoresDictionary.
const scoreValue = (company, user, preformaceFactor) => {
  let totalCompanyWeight = 0;
  totalCompanyWeight += user.industryWeights[company.industryId];
  totalCompanyWeight += user.sectorWeights[company.industry.sector.id];
  totalCompanyWeight += preformaceFactor * company.daily_price_change;
  // search history incorporation doesnt make sense for a portfolio search, so not factored in here.
  return totalCompanyWeight;
};

// user has seen company so we add to search_history. if already in search history,
// it returns to the beginning of the array. Also updated all weight vectors accordingly
router.put("/companyhist/:companyId", async (req, res) => {
  const id = parseInt(req.params.companyId);
  const userId = req.session.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  let history = user.search_history;
  history = history.filter((currentid) => parseInt(currentid) !== parseInt(id));
  history.unshift(parseInt(id));
  const company = await prisma.company.findUnique({
    where: {
      id,
    },
    include: {
      industry: {
        select: {
          id: true,
          sector: { select: { id: true } },
        },
      },
    },
  });
  let newIndWeights = user.industryWeights;
  if (newIndWeights[company.industryId] == 0) {
    newIndWeights[company.industryId] = INIT_IND_REWARD;
  } else {
    newIndWeights[company.industryId] =
      newIndWeights[company.industryId] +
      Math.pow(LAMBDA, newIndWeights[company.industryId]) * INDUSTRY_REWARD;
  }
  let newSectorWeights = user.sectorWeights;
  if (newIndWeights[company.industry.sector.id] == 0) {
    newIndWeights[company.industry.sector.id] = INIT_SECT_REWARD;
  } else {
    newIndWeights[company.industryId] =
      newIndWeights[company.industryId] +
      Math.pow(LAMBDA, newIndWeights[company.industryId]) * INDUSTRY_REWARD;
  }
  // all other sectors who weren't clicked on get lowered, proportional to how large their weights are (we want larger weights to go down faster! )
  newIndWeights = newIndWeights.map((value, ind) => {
    if (ind === company.industryId || value <= LOWER_THAN_CHANGE) {
      return value;
    } else {
      return value - Math.pow(LAMBDA, DECAY_FACTOR) * value;
    }
  });
  newSectorWeights = newSectorWeights.map((value, ind) => {
    if (ind === company.industry.sector.id || value <= LOWER_THAN_CHANGE) {
      return value;
    } else {
      return value - Math.pow(LAMBDA, DECAY_FACTOR) * value;
    }
  });
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      search_history: history,
      sectorWeights: newSectorWeights,
      industryWeights: newIndWeights,
    },
  });
  res.json({ message: `history updated with id ${id}` });
});

/* 
Algorithim as Stand, very similar for portfolio with *slight* differences:
  New User:
      - User Inputs Interest, Weight array initialized for both Sectors and Industries. 
 
  Iteration:

    User Interaction: - code located at /companyhist/:companyId endpoint in company.js 

      -  On user interaction with app, each time user clicks on a profile, 
      that companies' sector / industry have weight's increased slightly. This increase 
      slows down depending on how much the user has clicked on the profile, so can be 
      thought of as logorithmic growth. 
      - at the same, industries / sectors that are not clicked have their weights reduced, 
      to allow for changing preferences!. 
      - The user also has that company brought to the front of their search history, increasing 
      it's likelyhood of being recommended
      -  *note*, company search history matters less as time goes on. the most recent company gets 
      .85 "points" to its score, next .85^2, next .85^3, etc. 

  Other Factors: 

      - Stocks preforming better (based on percentage) are also given additional score depending on 
      how well they are preforming. However, it is costly to get realtime data each time the explore 
      page is queried, so instead this percentage is only updated every 20 minutes. -- see post populators/ for details. 
      - this matters more for portfolios than for companies, and is factored more into that particular version. 

  Score Detail: 
    - Companies are each given a utility score based on the above criteria and top eight per user are recommended. 

  TODO in later iterations: 
  - give additional attention to companies with high page interaction "clicks" of the entire userbase 
*/

// specific algorithim for company recommendations list. the portfolio algorithim is in the portfolios file.

router.get("/curated", async (req, res) => {
  if (req.session.isGuest == true) {
    res.json(
      await prisma.company.findMany({
        include: {
          industry: {
            select: {
              id: true,
              sector: { select: { id: true } },
            },
          },
        },
        orderBy: {
          id: "asc",
        },
        take: NUMBER_RECOMMENDED,
      })
    );
    return;
  }
  updateAllCompanies();
  const userId = req.session.userId;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (Math.abs(user.lastCached - Date.now()) < 5 * 60 * 1000) {
    const cachedCompanies = await prisma.company.findMany({
      where: {
        id: {
          in: user.cachedExplore,
        },
      },
      include: {
        industry: {
          select: {
            id: true,
            sector: { select: { id: true } },
          },
        },
      },
    });
    res.json(cachedCompanies);
    return;
  }
  const allCompanies = await prisma.company.findMany({
    include: {
      industry: {
        select: {
          id: true,
          sector: { select: { id: true } },
        },
      },
    },
  });

  const validCompanies = allCompanies.filter(
    (c) => c.industryId !== null && c.industry !== null && c.daily_price > 1 // dont recomend penny stocks...
  );
  const scoresDictionary = {};
  for (let company of validCompanies) {
    let totalCompanyWeight = 0;
    totalCompanyWeight += user.industryWeights[company.industryId];
    totalCompanyWeight += user.sectorWeights[company.industry.sector.id];
    totalCompanyWeight += company.daily_price_change * 0.01; // change to percentage
    if (user.search_history.includes(company.id)) {
      const indexOf = user.search_history.indexOf(company.id);
      totalCompanyWeight += Math.pow(HISTORY_FACTOR, indexOf);
    }
    /* if check how long the company has returned dividends. Several sources
    suggest that companies consistently returning dividends are higher preforming / "secure"
    stocks. 
    */
    if (company.dividends) {
      totalCompanyWeight +=
        Math.pow(DIVIDENDS_BASE, company.dividends.length) * 0.25; // preference towards bigger / smaller companies
    }

    scoresDictionary[company.id] = totalCompanyWeight;
  }
  const bestCompanies = validCompanies
    .sort((a, b) => scoresDictionary[b.id] - scoresDictionary[a.id])
    .slice(0, NUMBER_RECOMMENDED);
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      cachedExplore: bestCompanies.map((value) => value.id),
      lastCached: new Date(),
    },
  });
  res.json(bestCompanies);
});

module.exports = router;
