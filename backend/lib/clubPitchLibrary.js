// Club pitch reference library.
//
// Distilled summaries ("cards") of the club's own prior pitches, used as
// few-shot reference so AI model reviews match the club's house style,
// modeling approach, and framing. These are the club's own analysis, not the
// raw Canalyst models or full writeups (those stay out of git). Add new cards
// to CLUB_PITCHES and they automatically flow into the review prompt.

const HOUSE_STYLE = [
  "Every pitch frames three scenarios: Bear, Base, and Bull (always all three).",
  "Models are forward, return-driven: scenario cases -> probability/weighting -> IRR or MOIC over a 2-3 year hold, with an exit-multiple valuation. Not just historicals.",
  "Revenue is built bottom-up from operational drivers (e.g. units x per-unit x revenue/unit, organic vs M&A, vessel-level day-rate builds), by segment where relevant.",
  "Views are framed against consensus / the Street (delta-to-consensus).",
  "Comparable companies are optional - include them only when the thesis genuinely uses them.",
];

const CLUB_PITCHES = [
  {
    company: "Carriage Services",
    ticker: "CSV",
    sector: "Deathcare - funeral homes & cemeteries (small cap)",
    pitchType: "Long",
    analysts: ["William Kim", "Emilie Su", "Oliver Ho", "Mira Schubert"],
    thesis:
      "Post-overextension deleveraging story re-pivoting to disciplined M&A and centralized pricing under new CEO Quezada; fragmented, high-barrier industry with structural consolidation runway.",
    businessModel:
      "Three segments: Funeral (57% rev / 73% EBITDA, 39% margin; homes x contracts/home x rev/contract), Cemetery (31% / 45%, 45% margin; cemeteries x lots x rev/lot, preneed-led), Financial (9% / 24%, 82% margin; preneed trust earnings & insurance commission).",
    modelingApproach:
      "Forward scenario return model. Segment-level operational driver builds. Revenue bridged organic vs M&A. Bear/Base/Bull with a probability tree -> probability-weighted IRR. Exit-multiple valuation (entrance/exit EV/EBITDA & P/E, Dec-27 exit). Framed delta-to-consensus throughout.",
    thesisPoints: [
      "TP1 - M&A: fragmented market (80-90% independent, ~25%+ owner turnover in 5Y), acquire at ~8x EBITDA / 30% margins -> multiple arb + cost-out to ~40% funeral margins.",
      "TP2 - Pricing: Quezada centralization/standardization drives LSD funeral & HSD cemetery pricing (13% FY25 preneed cemetery growth).",
    ],
    cases: {
      bear: "30% of FCF to M&A, ~2% M&A revenue growth",
      base: "60% of FCF to M&A, ~3% M&A revenue growth, 19% IRR",
      bull: "90% of FCF to M&A, ~5% M&A revenue growth",
      note: "~21% probability-weighted IRR",
    },
    keyDrivers: [
      "Organic segment pricing (LSD funeral / HSD cemetery)",
      "M&A pace & entry multiple",
      "EBITDA margin (~30-31%)",
      "Deleveraging (3.5-4.0x target)",
      "Exit multiple",
      "Cremation-rate headwind",
    ],
    comps:
      "SCI (primary public comp; scale/centralization premium vs CSV). Private peers: Park Lawn, Foundation Partners, Milestone, NorthStar, Rollings, Pinnacle.",
    keyRisks: [
      "4 consecutive years of funeral revenue decline (cremation displacement)",
      "Less-accretive M&A if peers bid up prices",
      "Back-loaded, acquisition-funded deleveraging - net debt flat FY25-26",
    ],
  },
  {
    company: "Tidewater",
    ticker: "TDW",
    sector: "Industrials - offshore support vessels (OSV)",
    pitchType: "Long",
    analysts: [
      "Ralitsa Hovanessian",
      "Liam Tenenbaum",
      "Jane Rubenstein",
      "George Ma",
      "Lorenzo Lizzeri",
    ],
    thesis:
      "Street conflated near-term day-rate softness with a structural cycle peak. Tightest supply in 30 years (orderbook ~3% of fleet, no newbuilds; newbuild economics need ~$30k/day vs ~$22k realized) drives day rates from $22k toward $26k, FY26E EBITDA $712M / FY27E $880M, re-rating from ~5x to 6-7x NTM EV/EBITDA.",
    businessModel:
      "World's largest OSV operator, ~230 vessels across all major basins. Conventional Services ~70% rev (PSVs, crew boats, AHTS); Harsh Environment ~30% (polar-code/winterized - North Sea, Barents, Greenland). 68% high-spec DP2-class; avg fleet age ~12y vs 14-15y industry. ~55% of revenue now production support (vs drilling).",
    modelingApproach:
      "Vessel-level revenue build (active vessels x operating days x utilization x day rate, by class/region) feeding EBITDA; NAV cross-check (replacement cost per vessel less age discount, less net debt / FDSO). Bear/Base/Bull on day rate x utilization. Target IRR / MOIC over 2-3Y with exit-multiple re-rate. Heavy primary research: expert calls, regulatory/industry analysis, regressions (Brent vs TDW; day-rate-vs-utilization elasticity), management-guidance credibility analysis.",
    thesisPoints: [
      "TP1 - Supply: near-monopoly on high-spec OSV supply; zero orderbook + aging/scrapped fleet + closed secondary market -> utilization up -> TDW captures nearly all rate recovery (no supply response before 2029).",
      "TP2 - Mix shift: ~55% revenue now production support; Wilson Sons accelerates this + Brazil CNPE regulatory moat (28 Brazilian-built PSVs cover ~80% of Petrobras vessel-days) -> revenue base increasingly independent of drilling cycles.",
      "TP3 - Capital returns: fleet high-grading lifts margins; refinancing 10.375% 2028 notes removes covenant overhang -> unlocks $350M buyback (~8% of shares).",
    ],
    cases: {
      bear: "Slower day-rate inflection / oil weakness; NAV floor ~$105/share",
      base: "$24.3k/day FY26, $712M FY26 EBITDA, PT $137, 31.2% IRR, 1.62x MOIC, re-rate 5x -> 6-7x",
      bull: "$26k/day FY27, $880M EBITDA on faster utilization/day-rate inflection",
      note: "Cases driven by day rate x utilization scenarios",
    },
    keyDrivers: [
      "Day-rate inflection ($22k -> $26k)",
      "Marketed utilization (76% -> 79%)",
      "Orderbook/supply (no newbuilds, scrapping)",
      "High-spec (DP2) fleet share",
      "Wilson Sons margin lift (58% GM)",
      "Refinancing & $350M buyback",
      "Global deepwater capex (~$79B 2026-27)",
    ],
    comps:
      "Re-rating vs offshore drillers TDW serves (Noble, Transocean, Seadrill at 7-9x NTM EV/EBITDA vs TDW ~5x). OSV peers: DOF Group, SEACOR Marine.",
    keyRisks: [
      "Oil price below ~$55/bbl",
      "Wilson Sons CADE/antitrust delay",
      "Energy-transition / renewables scaling",
      "Brazil geopolitical tension",
    ],
  },
  {
    company: "ACV Auctions",
    ticker: "ACVA",
    sector: "Online dealer-to-dealer (D2D) wholesale auto auction marketplace",
    pitchType: "Long",
    analysts: ["Noah Altschuler", "Abhi Bansal", "Santiago Criado", "Katherine Lee", "Matthew Ottenbreit"],
    thesis:
      "Asymmetric trough-on-trough setup. Market prices ACVA as a perpetual digital-D2D share loser to OPENLANE, but '25 share loss was S&M timing not structural. Off-lease supply is recovering off a cyclical trough, take rate/RPU is expanding, yet ACVA trades at an all-time-low ~0.86x FY26E EV/Sales vs OPENLANE's 1.2-1.9x range.",
    businessModel:
      "Pure-play digital D2D wholesale auto auction (20-min auctions; 800+ VCI inspectors; $10B FY24 GMV). Three revenue lines: Auction & Assurance ~58% (variable buyer fees + fixed seller fees, Go Green assurance, ACV Guarantee ~19% of volume), Marketplace Services ~37% (Transport ~85%, ACV Capital floorplan financing ~15%), SaaS & Data ~5% (True360, ClearCar, ACV MAX).",
    modelingApproach:
      "Marketplace build: GMV x take rate, with RPU decomposed across auction/transport/capital/data (FY25 RPU ~$916 vs auction & assurance $518). Attach-rate driven (ACV Capital 20% -> 30%+ at >95% GM). Operating leverage: Adj. EBIT margin 4.3% ('25) -> ~26% at exit. Topline delta-vs-consensus, EV/Sales re-rate (0.86x toward OPENLANE 1.2-1.9x). Bear/Base/Bull. Primary research: hiring-posting scrapes, expert calls, quarterly share-decomposition framework.",
    thesisPoints: [
      "TP1 - Share: market overstates OPENLANE's S&M-driven (inorganic) growth vs ACV's organic; ACV cut S&M intensity in the volume trough and is now investing in inspectors -> '25 share loss is timing, not structural disadvantage.",
      "TP2 - Cyclical recovery: off-lease supply +40% to wholesale in '26 (lease originations recovering off the 2022 ~2.1M trough); stabilizing prices mechanically lift the implied take rate (buyer fees are variable vs vehicle value) - a dynamic consensus fails to model.",
      "TP3 - Credit attach: ACV Capital (20% attach, >95% GM) mispriced by credit fears; Tricolor was fraud not credit deterioration; 30-90 day collateralized floorplan loans are repriceable and run off fast. Warehouse facility raised $125M -> $200M signals counterparty confidence.",
    ],
    cases: {
      bear: "OPENLANE share loss persists / take-rate ceiling / tariff-driven new-vehicle demand shock repeats the lease-supply trough",
      base: "Off-lease supply recovery + take-rate/RPU expansion + Adj. EBIT margin 4.3% -> ~26%, topline above consensus, EV/Sales re-rate from ~0.86x toward OPENLANE's range",
      bull: "Faster supply recovery + ACV Capital attach acceleration to 30%+ + full multiple re-rate",
    },
    keyDrivers: [
      "Digital penetration of wholesale (~20-25% -> ~32% by 2028)",
      "Share vs OPENLANE (D2D)",
      "Off-lease supply recovery (lease-origination lag)",
      "Implied take rate (vehicle-price recovery)",
      "ACV Capital attach rate & RPU (>95% GM)",
      "Operating leverage (Adj. EBIT margin)",
      "EV/Sales multiple re-rate",
    ],
    comps:
      "OPENLANE (primary digital-D2D comp, historical 1.2-1.9x EV/Sales). Manheim (~40% physical incumbent), ADESA (now Carvana-owned).",
    keyRisks: [
      "Competitive share loss to OPENLANE (US digital D2D +20% in Q4'25)",
      "Take-rate ceiling as fees approach physical-auction economics",
      "Tariffs suppressing new-vehicle sales -> lagged off-lease supply shock",
    ],
  },
  {
    company: "SANUWAVE Health",
    ticker: "SNWV",
    sector: "MedTech - advanced wound care (micro-cap)",
    pitchType: "Long",
    analysts: ["Jay Crowther", "Marina Peng", "Aydin Turgut", "Alexander Cheng"],
    thesis:
      "Best-in-class novel ultrasound wound therapy (UltraMIST), FDA-approved and CMS-reimbursed, mispriced as a thinly-traded micro-cap down ~60% in 6 months on a tax restatement, broad wound-care CMS-cut uncertainty, and a Q3 miss - while the underlying business has superior clinical/hospital economics and new distribution (Healogics GPO) unlocking thousands of sites of care.",
    businessModel:
      "Razor-and-blade MedTech: UltraMIST system ($35k) + single-use applicators ($100/treatment), ~78% blended gross margin; UltraMIST is ~95% of revenue. Non-contact, non-thermal ultrasound delivered via saline mist - complementary to (not a replacement for) NPWT; competes against skin substitutes/grafts as standard of care.",
    modelingApproach:
      "Razor-and-blade unit build: system placements x consumables/treatments per system x ASP. ~19% UltraMIST unit-system growth, ~2% ASP/consumables growth, gross-margin + operating-leverage expansion. TAM-penetration framing (~$76B TAM, <0.2% penetrated). Base case: 12x fwd EPS on $7.15 EPS at 2030 exit -> PT $85.80, 4.2x MOIC, 35.3% 4Y IRR. Bear/Base/Bull.",
    thesisPoints: [
      "TP1 - Product & economics: 72% greater healing rate vs standard of care; ~$4,500/treatment vs ~$14,300 skin substitutes; 140+ patents to 2038; large evidence base; ~$76B TAM at <0.2% penetration.",
      "TP2 - Distribution & reimbursement: Healogics iSupply GPO (600+ hospitals) + rebuilt salesforce expand go-to-market; UltraMIST sits in its own code (CPT97610, ~$400/procedure) - insulated from the 80-90% CMS cuts hitting skin substitutes (actually saw a small +$2-4 bump).",
    ],
    cases: {
      bear: "CPT97610 reimbursement gets cut and/or Healogics partnership fails to convert to volume",
      base: "12x fwd EPS on $7.15 EPS at 2030 exit -> PT $85.80, 4.2x MOIC, 35.3% 4Y IRR (19% unit growth, 2% ASP)",
      bull: "Faster penetration and TAM expansion into additional wound indications",
    },
    keyDrivers: [
      "UltraMIST system placement growth (~19%)",
      "Consumable/applicator attach per system & ASP",
      "Gross margin (~78%) + operating leverage",
      "CMS reimbursement (CPT97610 stability)",
      "Healogics / distribution-channel ramp",
      "TAM penetration (<0.2% today)",
    ],
    comps:
      "None - novel category. Framed against standard-of-care (skin substitutes/grafts) on cost/efficacy; NPWT is complementary, not a comp.",
    keyRisks: [
      "CMS reimbursement cuts reaching CPT97610",
      "Healogics partnership fails to materially boost volumes / falls through",
      "Thin micro-cap liquidity amplifies drawdowns",
    ],
  },
];

const formatCard = (p) => {
  const lines = [
    `--- Pitch: ${p.company} (${p.ticker}) - ${p.pitchType} ---`,
    `Sector: ${p.sector}`,
    `Thesis: ${p.thesis}`,
    `Business model: ${p.businessModel}`,
    `Modeling approach: ${p.modelingApproach}`,
  ];
  if (p.thesisPoints?.length) lines.push(`Thesis points: ${p.thesisPoints.join(" ")}`);
  if (p.cases) {
    const c = p.cases;
    const parts = [];
    if (c.bear) parts.push(`Bear: ${c.bear}`);
    if (c.base) parts.push(`Base: ${c.base}`);
    if (c.bull) parts.push(`Bull: ${c.bull}`);
    if (c.note) parts.push(`(${c.note})`);
    lines.push(`Cases: ${parts.join(" | ")}`);
  }
  if (p.keyDrivers?.length) lines.push(`Key drivers: ${p.keyDrivers.join("; ")}`);
  if (p.comps) lines.push(`Comps: ${p.comps}`);
  if (p.keyRisks?.length) lines.push(`Key risks: ${p.keyRisks.join("; ")}`);
  return lines.join("\n");
};

// Build the reference text injected into the review system prompt. Stable
// across requests (no per-request data) so it is safe to prompt-cache.
const buildClubReference = () => {
  return [
    "CLUB PITCH REFERENCE LIBRARY",
    "Below are the club's own prior pitches. Use them to match the club's house style, modeling approach, and framing. When the company under review is analogous to one of these, reference it by name (e.g. \"like the CSV pitch, the club used a segment-level driver build\").",
    "",
    "House style:",
    ...HOUSE_STYLE.map((r) => `- ${r}`),
    "",
    ...CLUB_PITCHES.map(formatCard),
  ].join("\n");
};

module.exports = { CLUB_PITCHES, HOUSE_STYLE, buildClubReference };
