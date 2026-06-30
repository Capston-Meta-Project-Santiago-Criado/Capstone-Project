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
  {
    company: "Match Group",
    ticker: "MTCH",
    sector: "Internet - online dating apps",
    pitchType: "Short",
    analysts: ["Tiffany Kim", "David Ji", "Helen Liu", "Brian Karle", "Joyce Liu"],
    thesis:
      "Short: structural industry headwinds, core revenue driver Tinder cannot grow engagement, and Hinge cannot offset Tinder's decline - leaving a low-growth platform with limited upside. Market already prices it as a slow-growth cash-flow platform dependent on Hinge while waiting for Tinder to stabilize.",
    businessModel:
      "20+ dating apps but >75% of revenue from Tinder + Hinge. Tinder (largest/highest-grossing, casual/young), Hinge (serious, fastest-growing, international), Evergreen & Emerging (Match, Meetic, OkCupid, POF + niche), MG Asia (Pairs, Azar). Monetized via subscriptions + a-la-carte features + ads; ~50% of global dating-app revenue.",
    modelingApproach:
      "Short framed as payers x revenue-per-payer (RPP) by app, engagement/MAU decline, and a take-price ceiling, with Hinge-offset and mix-margin analysis (Tinder ~55% adj. EBITDA margin vs Hinge ~36%; intl migration = ~19pp margin contraction). Delta-to-consensus (consensus Hinge $1B by 2027 viewed as too optimistic). Bear/Base/Bull.",
    thesisPoints: [
      "TP1 - Structural headwinds: Gen Z views swipe dating as cringe/low-status; inverse network economics (noise, ghosting, fatigue) degrade the experience as platforms scale; social media substitutes the meet-people function.",
      "TP2 - Tinder structurally broken: negative gender-ratio flywheel (women leave first), RPP +5% but payers -8% in Q4'25 -> price lever exhausted ($9.99 -> $24.99 Plus, $49.99 Platinum), product 'enshittification'.",
      "TP3 - Hinge can't offset: it's 'designed to be deleted' (not a top-of-funnel like Tinder, which sources ~half of Hinge users); RPP already ~$32.96 (capped); intl expansion is cannibalistic and margin-dilutive.",
    ],
    cases: {
      bear: "Short risk: Tinder turnaround under new CEO (ex-Zillow Rascoff) reaccelerates engagement",
      base: "Flat ~2026 revenue, slow-growth Hinge-dependent platform, limited upside",
      bull: "Accelerating category decline + Hinge fails to offset Tinder",
    },
    keyDrivers: [
      "Tinder payers & RPP (engagement)",
      "Hinge growth & margin mix (~36% vs Tinder ~55%)",
      "Industry engagement (Gen Z aversion)",
      "International expansion economics (cannibalization)",
      "Gender-ratio dynamics",
    ],
    comps: "Bumble (~24% share; women-first positioning). Top 3 = Tinder (25%) / Bumble (24%) / Hinge (18%).",
    keyRisks: [
      "Tinder turnaround succeeds",
      "Consistent dividends & buybacks / sustained FCF yield",
      "Activist interest",
    ],
  },
  {
    company: "Dropbox",
    ticker: "DBX",
    sector: "Software - cloud file sync & sharing (FSS)",
    pitchType: "Short",
    thesis:
      "Short: a melting ice cube - subscale player in commoditized FSS. Consensus models top-line stabilization by FY27 despite AI bundling by Microsoft/Google driving accelerated user declines and limited ARPU growth. Dash (AI search) is hyped but subpar, has no traction, and drags operating margin. Base case 2Y PT $15.61 (0.6x MOIC / 24.3% IRR).",
    businessModel:
      "Subscription FSS, ~18M paying users / $2.5B ARR, <3% paid penetration of 700M accounts, ~90% self-serve (consumers/SMBs). Three buckets: Core FSS, Adjacencies (Sign, DocSend, Replay - immaterial), Dash (2024 AI universal-search, ~$1-3M revenue, no committed enterprise customers).",
    modelingApproach:
      "Paying users x ARPU build into a secular-decline thesis. FY28E revenue ~4.4% below consensus, GAAP NI ~15% below. Base: capitalize $2.40 FY28E GAAP EPS at 6.5x fwd P/E -> $15.61, 24.3% IRR / 0.6x MOIC over 2Y. Bear: stabilization, $2.26 EPS at 14.0x -> -12.3% IRR / 1.2x MOIC. Heavy expert/channel checks. Bear/Base/Bull.",
    thesisPoints: [
      "TP1 - Subscale structural loser in FSS: storage is commoditized, DBX charges 7-20% more for a narrower offering, ARPU fell YoY for the first time in FY25; AI raises opportunity cost (Copilot/Gemini) and lowers switching cost (MSFT Migration Assistant); enterprise teams declining (600k FY22 -> ~575k FY25).",
      "TP2 - Dash hype unsubstantiated + margin drag: structurally dependent on third-party APIs, priced out by ecosystems that bundle search for free; intense startup competition (Glean $7.2B, Guru, Unleash, Coveo); insufficient R&D to win.",
    ],
    cases: {
      bear: "Paying-user declines stabilize, ARPU flat, R&D moderates -> $2.26 FY28E EPS at 14.0x -> -12.3% IRR / 1.2x MOIC (short loses)",
      base: "Declining users + compressing ARPU + elevated R&D -> $2.40 FY28E EPS at 6.5x -> $15.61, 24.3% IRR / 0.6x MOIC",
      bull: "Accelerating secular decline as AI bundling widens the value gap",
    },
    keyDrivers: [
      "Paying users (churn to MSFT/Google)",
      "ARPU (down-sells to lower tiers)",
      "R&D / EBIT margin (Dash drag)",
      "Competitive AI bundling",
      "Forward P/E multiple",
    ],
    comps:
      "Microsoft (OneDrive/SharePoint), Google (Drive) - bundled ecosystems; Box, Egnyte - enterprise. Dash vs Glean / Guru / Unleash / Coveo.",
    keyRisks: ["Takeout risk (deemed low)", "Short squeeze (~16% of float short, share count shrinking)"],
  },
  {
    company: "Montana Aerospace",
    ticker: "AERO",
    sector: "Industrials - aerostructures (Tier-2 aerospace supplier)",
    pitchType: "Long",
    analysts: ["Liam Tenenbaum", "George Ma", "Jane Rubenstein", "Ralitsa Hovanessian", "Lorenzo Lizzeri"],
    thesis:
      "Long: vertically integrated, single-source aerostructures supplier benefiting from the multi-year OEM delivery ramp against a ~10-year Boeing/Airbus backlog. Pure-play transition (divested e-mobility & energy) + improved capital allocation drive 20%+ growth, net-debt-free, at a reasonable 17.5x EV/EBIT with a likely large beat to conservative FY26 guidance. Base: EUR398 EBIT FY29, 28.2% IRR over 4Y.",
    businessModel:
      "16 sites in 10 countries. Aerostructures ~91% (structural/critical/functional aircraft components + aluminum/titanium space parts for SpaceX, Airbus D&S, Lockheed); customer split ~40/40/20 Boeing/Airbus/other, ~50/50 narrowbody/widebody. Other ~9% (Alpine Metal Tech 'asset for disposal', holding co).",
    modelingApproach:
      "Revenue build off the OE delivery ramp x continued market-share gains; EBIT-margin expansion (~200bps/yr) from vertical integration & Design Authority; FCF conversion (~87% of EBIT by 2029). Base: capitalize EUR398 FY30 EBIT at 13.5x EV/EBIT -> 28.2% IRR / 2.6x MOIC. Frames a 17.1% FY29 revenue beat / 66.1% EBIT beat vs consensus. Heavy expert calls (ex-ASCO CEO). Bear/Base/Bull.",
    thesisPoints: [
      "TP1 - Vertical integration & single-source (90% of portfolio sole-qualified; 20-30yr program life; Design Authority on A350/A220 keeps 100% of cost savings; full commodity pass-through) -> margin visibility, share gains, and a near-term guidance-beat catalyst.",
      "TP2 - OE delivery ramp (Boeing/Airbus deliveries +17%/+11%/+9% in '26-'28; ~10yr backlog) with AERO outgrowing the market (28% segment CAGR vs 14% OE deliveries '20-'25; +32.5% in 2024 despite -12% industry).",
      "TP3 - Capital allocation post-divestment: net-debt-free by YE26, ~EUR1.17B cumulative FCF FY26-29 for tuck-in M&A, buybacks/dividends, potential US dual-listing; founder owns 50.1% with recent insider buys.",
    ],
    cases: {
      bear: "Lower-than-expected OEM production rates / supply-chain or FX drag",
      base: "EUR398 FY30 EBIT at 13.5x EV/EBIT -> 28.2% IRR / 2.6x MOIC over 4Y",
      bull: "Larger guidance beat as the delivery ramp accelerates past conservative management assumptions",
    },
    keyDrivers: [
      "OE delivery ramp (Boeing/Airbus)",
      "Market-share gains (vs Tier-2 peers)",
      "EBIT-margin expansion (~200bps/yr)",
      "FCF conversion (~87% of EBIT)",
      "EV/EBIT multiple (pure-play re-rate)",
      "FY26 guidance beat",
    ],
    comps: "Tier-2 peers: Spirit AeroSystems, GKN Aerospace, Premium AEROTEC (also ASCO, Figeac).",
    keyRisks: ["Lower OEM production rate", "Supply-chain volatility from macro/tariffs", "FX volatility"],
  },
  {
    company: "Fannie Mae",
    ticker: "FNMA",
    sector: "Financials - mortgage credit guarantee (GSE); special situation",
    pitchType: "Long (special situation / paired)",
    analysts: ["Marina Peng", "Alex Cheng", "Jay Crowther", "Aydin Turgut"],
    thesis:
      "Long special-situation: high-quality mortgage-guarantee business with a misunderstood near-term setup and complex capital structure. Market inefficiently prices the odds of a normalization transaction (NYSE relisting / recap / exit from conservatorship). Paired trade: 200bps long common (FNMA) + 200bps long junior preferred (FNMAS) to hedge holdout risk. ~28.1% probability-weighted IRR at FY27 exit, 1.6x MOIC.",
    businessModel:
      "Asset-light credit-guarantee quasi-monopoly (congressional charter): ~$4T MBS guaranteed (25% housing share); Single-family ~84% of revenue (g-fees ~67bps), Multifamily ~16% (~90bps). Low-teens ROE; structurally subordinated to borrower equity (>20% home-price decline before loss); 90-day delinquencies <0.6%.",
    modelingApproach:
      "Probability-weighted scenario tree on deal outcomes (SPS forgiveness + Treasury warrant exercise; leverage ratio cut 4% -> 2.5%; junior-pref conversion at 60% of liquidation preference). Relisting valuation on P/B (base 1.5x P/B ~ 11x fwd P/E; downside ~1x P/B for litigation overhang). Paired long common + junior pref; base case 40% weighting; 30% holdout probability. -> 1.6x MOIC / 28.1% IRR. Bear/Base/Bull via scenario probabilities.",
    thesisPoints: [
      "TP1 - Relisting soon is likely: economically & politically aligned for all stakeholders (Treasury maximizes warrant value by keeping common large; junior pref/common get a non-zero 'tip' to avoid litigation); low-disruption, headline-friendly catalyst executable without full recap.",
      "TP2 - Downside cushion: even if timing slips, the core guarantee business is structurally resilient and compounds GAAP equity at low-teens, making a future IPO more valuable.",
      "TP3 - Capital requirement (4%) is excessive vs asset quality and likely cut to ~2.5% (per Ackman/Burry) to enable a viable post-conservatorship ROE.",
    ],
    cases: {
      bear: "Treasury converts SPS to common / zeroes equity holders amid litigation -> ~1x P/B (or holdout, 30% prob)",
      base: "(40% wt) SPS forgiven + warrants exercised, leverage to 2.5%, junior pref converts at 60% of liq pref, relist at 1.5x P/B",
      bull: "Faster relisting + favorable terms; book compounds into a larger IPO value",
    },
    keyDrivers: [
      "Relisting / conservatorship-exit timing & probability",
      "Capital (leverage) requirement (4% -> 2.5%)",
      "SPS forgiveness & warrant exercise",
      "Junior-pref conversion ratio / holdout risk",
      "P/B re-rating multiple",
      "Core g-fee book growth (~2-3%/yr)",
    ],
    comps: "Insurers/financials trade >2x P/B and ~11-15x fwd P/E; private mortgage insurers MGIC, Radian.",
    keyRisks: ["IPO/relisting takes longer than expected", "Treasury zeroes out all equity", "Political volatility", "Junior-preferred holdouts"],
  },
  {
    company: "Upwork",
    ticker: "UPWK",
    sector: "Internet - online freelance / work marketplace",
    pitchType: "Short",
    thesis:
      "Short: a melting ice cube facing secular AI pressure - non-AI GSV already declining and new AI GSV facing intense specialist competition. Consensus's expected 25pt+ enterprise-GSV acceleration is unlikely given low-value-add acquisitions and underinvestment in S&M, against a management team with a poor execution track record and recent insider sales. Base: $1.54 FY28E Adj. EPS at 8x fwd P/E -> 24.7% IRR / 0.6x MOIC over 2Y.",
    businessModel:
      "World's largest online work marketplace, $4.0B FY24 GSV. Marketplace ~86% (talent service fees, client fees, Connects/ads), Enterprise 'Lifted' ~14% (managed services + employer-of-record, where 100% of GSV is recognized as revenue).",
    modelingApproach:
      "Segment GSV build (marketplace vs enterprise) x take rate -> revenue, with an AI-disruption decomposition of GSV categories. Variant view: -17% marketplace GSV and -45.3% enterprise GSV vs consensus FY28E. Base: $1.54 FY28E Adj. EPS at 8x fwd P/E -> 24.7% IRR / 0.6x MOIC. Bear: GSV reaccelerates HSD, $2.44 EPS at 15.3x -> -23.6% IRR / 1.5x MOIC. Heavy expert/freelancer primary work. Bear/Base/Bull.",
    thesisPoints: [
      "TP1 - Secular AI risk: non-AI GSV (~92% of marketplace) declining since 2023; ~60% of GSV in AI-exposed categories (Dev/IT, Admin/CS, Finance); AI GSV is only ~7.8% of GSV, undifferentiated, and competed by vertical specialists (Toptal, Andela, Turing, Braintrust).",
      "TP2 - Enterprise re-acceleration flawed: 'Lifted' rebrand + Ascen/Bubty add little (same talent base); EOR mix is margin-dilutive (~24% GM); S&M was cut ~40% so the implied LTV/CAC and GP/client jumps are unrealistic.",
      "TP3 - Management has little credibility: history of failed initiatives (Project Catalog, Upwork Business) and missed targets; heavy turnover (3 CFOs / 2 CTOs / 3 enterprise heads in 4yrs); recent insider sales.",
    ],
    cases: {
      bear: "Short risk: client declines revert, GSV reaccelerates HSD, management hits ~13% rev / ~18% EBITDA -> $2.44 EPS at 15.3x -> -23.6% IRR / 1.5x MOIC",
      base: "Marketplace & enterprise GSV below consensus -> $1.54 FY28E Adj. EPS at 8x -> 24.7% IRR / 0.6x MOIC",
      bull: "Non-AI GSV declines accelerate + Lifted reaccel fails -> guidance cuts",
    },
    keyDrivers: [
      "Marketplace GSV (AI disruption)",
      "Enterprise/Lifted GSV & EOR margin mix",
      "Take rate",
      "S&M efficiency (LTV/CAC)",
      "Forward P/E multiple",
    ],
    comps: "Fiverr (peer marketplace). Vertical specialists: Toptal, Andela, Braintrust, A.Team, Worksome, Turing.",
    keyRisks: [
      "AI GSV accelerates / AI disruption slower than modeled",
      "Acquisitions drive enterprise reacceleration",
      "S&M efficiency improves",
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
