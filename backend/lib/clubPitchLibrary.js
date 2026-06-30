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
  {
    company: "Winmark Corporation",
    ticker: "WINA",
    sector: "Consumer - franchisor of resale retail brands",
    pitchType: "Short",
    analysts: ["Will Kim", "Emilie Su", "Oliver Ho", "Mira Schubert"],
    thesis:
      "Short: an MSD/HSD/low-teens revenue/EBIT/EPS grower priced for growth at ~35x fwd P/E vs ~20x historical. SSS grows at inflation, store count grows only LSD (new stores smaller/slower), and there's limited runway to cut OpEx - so the stock should re-rate back toward its historical ~25x. Base: 1.1Y PT $313 (Dec-2026 exit, 22% IRR).",
    businessModel:
      "Franchisor of 5 resale brands; 91% of FY24 revenue is high-margin Royalty & Franchise (R&F) fees. Plato's Closet (515 stores, 42% of R&F), Once Upon a Child (430, 33%), Play It Again Sports (302, 19%), Style Encore + Music Go Round (103, 6%). Capital-light, ~49% net margin; market treats it as a recession-proof 'compounder'.",
    modelingApproach:
      "SSS (at ~inflation) x store count (LSD growth, new stores 10%+ smaller) build; SG&A broken out (~60% direct visibility) to show operating leverage is exhausted; EPS-multiple re-rate from ~35x toward historical ~25x. Base PT $313 (Dec-26, 22% IRR) exiting on ~6% fwd rev / ~10% fwd EPS growth. Primary research: Placer.ai foot-traffic, Google Trends, ZIP-overlap-with-Goodwill analysis, expert calls, signed-franchise-agreement leading indicator. Bear/Base/Bull (SG&A 'Other' sensitized).",
    thesisPoints: [
      "TP1 - Low growth: 13+ years of SSS at/below inflation, new stores HSD-mid-teens less productive; not benefiting from the mid-teens secondhand-market CAGR (loses share to Goodwill in overlapping ZIPs and to online resale where sellers get better pricing); management conservatively awards franchises (~20 openings/yr, 99%+ renewal) -> store count grows LSD.",
      "TP2 - No OpEx runway: SG&A grew just 1.5% over 14yrs and headcount was cut >20% since 2018, but headcount bottomed FY23 and is growing again -> OpEx grows LSD and EBIT only MSD-HSD; the operating-leverage story is over.",
    ],
    cases: {
      bear: "Short risk: multiple stays elevated / idiosyncratic SSS inflection / AI cost cuts / Canada growth",
      base: "2-3% SSS, 2-3% store growth, 3% SG&A -> re-rate toward historical; PT $313, 22% IRR (Dec-26)",
      bull: "Faster re-rate to ~25x as growth disappoints and buyback/EPS tailwind fades",
    },
    keyDrivers: [
      "SSS growth (~inflation)",
      "Store count growth (LSD) & new-store productivity",
      "SG&A growth (~3%, no cut runway)",
      "Buyback/EPS tailwind fading (rising SOFR, $30M maturities '28/'29)",
      "P/E multiple re-rate (~35x -> ~25x)",
    ],
    comps:
      "Consumer/apparel/specialty retail peers avg ~20.6x LTM P/E (WINA ~37x = ~80% premium). Resale competitors: ThredUp, RealReal, Depop, Poshmark (online); Savers Value Village, Goodwill (offline).",
    keyRisks: ["AI adoption cuts costs", "International / Canada growth", "Idiosyncratic SSS inflection"],
  },
  {
    company: "Synopsys",
    ticker: "SNPS",
    sector: "Software / semiconductors - electronic design automation (EDA)",
    pitchType: "Long",
    analysts: ["John Cardwell", "Aria Gao", "Raina Swani", "AJ Caesar"],
    thesis:
      "Long: durable compounder in the EDA duopoly with Cadence (mission-critical chip-design tools, ~100% renewal). Ansys acquisition + shift to customized IP broaden monetization; a 3Q25 EPS miss + 30% drawdown from temporary IP headwinds (China export ban, Intel pause) created a discount to history/comps. Frames 16.5% / 19.1% / 39% beats to 2028 consensus Rev / Adj. OpInc / Adj. EPS; capitalize 44x LTM EPS -> Dec-2029 exit $1,145, 27.1% IRR.",
    businessModel:
      "EDA software, hardware, and IP across all stages of chip design. Design Automation ~70% of revenue (~80% recurring 3Y software, ~20% upfront hardware/services); Design IP ~30% (up from 15% in 2015). Dominant in logic synthesis & signoff (70%+ share for decades); verification (ZeBu vs Cadence's Palladium) is the key battleground.",
    modelingApproach:
      "EDA wallet-share build (% of customers' R&D: 3.8% -> ~4.3% by 2029) + a ~1.5% productivity-tool (DSO/VSO/TSO.ai) uplift + a hardware-cycle call + IP recovery/margin. Consensus-beat framing; capitalize 44x LTM EPS -> $1,145 (Dec-29), 27.1% IRR. Heavy expert calls + government-contract pricing analysis. Bear/Base/Bull (the four key variables/debates).",
    thesisPoints: [
      "TP1 - Rising EDA share of R&D: advanced-node (<=7nm) penetration, exploding design cost, and an engineering-labor shortage drive EDA to capture more of customer R&D; .ai productivity tools add ~1.5% growth; a ZeBu hardware cycle drives near-term beats and reverses the Cadence share-loss narrative.",
      "TP2 - IP written to zero: the Q3 selloff priced China + Intel IP (~15% of value) to zero, de-risking the downside, while custom-IP monetization (Arm-style royalty uplift) is neglected and recoverable.",
      "Call option (TP3) - Ansys gives SNPS the lead in multi-physics simulation, the next phase of EDA.",
    ],
    cases: {
      bear: "China BIS restrictions persist / Intel spend shifts away / custom-IP margins stay depressed",
      base: "44x LTM EPS -> $1,145 Dec-2029, 27.1% IRR (16.5%/19.1%/39% beats to 2028 Rev/OpInc/EPS)",
      bull: "Faster wallet-share gains + .ai monetization + Ansys synergies",
    },
    keyDrivers: [
      "EDA wallet share of customer R&D",
      "Advanced-node (<=7nm) penetration",
      ".ai productivity-tool monetization",
      "Hardware cycle (ZeBu vs Palladium)",
      "IP recovery (China/Intel) & custom-IP margin",
      "Ansys integration / multi-physics",
      "LTM P/E multiple",
    ],
    comps:
      "Cadence (CDNS) - the duopoly partner (~40x fwd EPS vs SNPS ~32x); Siemens EDA distant #3. Design IP: Arm, Rambus, Alphawave.",
    keyRisks: ["China BIS export restrictions on EDA/IP", "Intel spend shift away from SNPS", "Custom-IP margins don't recover", "Ansys integration risk"],
  },
  {
    company: "Solventum",
    ticker: "SOLV",
    sector: "Healthcare - medtech (2024 spinoff from 3M)",
    pitchType: "Long",
    thesis:
      "Long: healthcare-products carve-out from 3M (Apr-2024) that was previously mismanaged and underinvested. New CEO Bryan Hanson (ex-Zimmer Biomet / Medtronic) is driving a turnaround - R&D up (~5% -> ~9% of sales), SKU rationalization, cost-out, and tuck-in M&A - while the stock trades at just 13.2x NTM P/E on a back-loaded (FY27+) EPS ramp and a 3M-overhang discount. Base: capitalize $10.75 2029 GAAP EPS at 14.5x -> $156 PT, 1.9x MOIC, 22.4% IRR over 3-4Y.",
    businessModel:
      "Three segments post-P&F divestiture: MedSurg ~64% (Advanced Wound Care - NPWT, Prevena/Snap; Infection Prevention & Surgical - Tegaderm ~75% share of transparent dressings), Dental ~18% (Clarity aligners/ortho, restorative), Health Information Systems ~18% (clinical documentation, autonomous coding, revenue-cycle management).",
    modelingApproach:
      "Segment revenue-beat build off volume/adoption (MedSurg 7.6% CAGR -> 18.9% beat; Dental 4.5% -> 5.2% beat; HIS 6.6% -> 6.3% beat; ~14.1% total FY29 rev beat) + margin expansion (90bps COGS, 820bps SG&A FY24-29) + capital allocation. Capitalize $10.75 2029 GAAP EPS at 14.5x -> $156, 1.9x MOIC, 22.4% IRR. Heavy expert calls. Bear/Base/Bull.",
    thesisPoints: [
      "TP1 - Product-quality & launch execution drive consensus-beating volume: NPWT/Prevena penetration <30% (Prevena 4x fewer complications/readmissions), sterilization-assurance underpenetrated, Acera Surgical acquisition in regenerative wound care; Dental new launches; HIS automation scale-up (throughput +33-43%).",
      "TP2 - Cost base + capital allocation -> carve-out to compounder: SG&A was sized for a ~$30B 3M segment vs a ~$9B standalone; TSA roll-off + SKU rationalization (25%+ variant cut) lift margins; $4.1B P&F sale funded $2.8B debt paydown + Acera + a $1B buyback.",
    ],
    cases: {
      bear: "Separation/TSA costs drag, 3M stake monetization overhang weighs on the multiple, EPS ramp slips",
      base: "$10.75 2029 GAAP EPS at 14.5x -> $156, 1.9x MOIC, 22.4% IRR",
      bull: "Faster margin expansion + accretive tuck-in M&A + multiple re-rate toward higher-quality medtech comps",
    },
    keyDrivers: [
      "MedSurg adoption (NPWT/Prevena penetration)",
      "Dental & HIS organic growth",
      "SG&A margin (820bps) + COGS (SKU rationalization)",
      "TSA roll-off",
      "Capital allocation (debt paydown / M&A / buyback)",
      "3M stake overhang (~15%)",
      "Exit P/E multiple",
    ],
    comps:
      "Higher-quality medtech trading above SOLV's 14.5x exit: Smith & Nephew (15.3x), Envista (17.2x), Alcon (15.9x), Becton Dickinson (16.7x). Wound: Smith & Nephew, Molnlycke, ConvaTec, Cardinal. Dental: Dentsply Sirona, Envista, Align. HIS: Nuance/Microsoft, Epic, Oracle Health.",
    keyRisks: ["3M stake monetization overhang", "EPS growth back-loaded to FY27+", "TSA exit / separation execution"],
  },
  {
    company: "Compass Inc",
    ticker: "COMP",
    sector: "Real estate - residential brokerage / proptech",
    pitchType: "Long",
    analysts: ["Noah Altschuler", "Abhi Bansal", "Santiago Criado", "Katherine Lee", "Matthew Ottenbreit"],
    thesis:
      "Long: #1 US residential brokerage (~6% share with only ~1.5% agent share, luxury skew ~$1.1M avg transaction). A differentiated, proprietary tech platform drives structurally higher agent productivity and organic flow-share gains from fragmented incumbents; a long accretive tuck-in M&A runway (multiple arbitrage) plus a cyclical home-sales recovery and disciplined OpEx compound into outsized EBITDA. Revenue ~23% / Adj. EBITDA ~52% '25-'30 CAGR.",
    businessModel:
      "33,000-agent cloud-platform brokerage; ~88% of revenue from gross commissions (~18% take rate after agent splits), plus franchise (8%) and integrated services (4%). Grows inorganically via tuck-ins (Christie's $444M Jan-25; Anywhere/HOUS ~$1.6B announced Sep-25).",
    modelingApproach:
      "Organic agent flow-share build (NAR churn x COMP flow share rising ~5% -> ~23% by 2030) + productivity uplift (~+20% first year) + tuck-in M&A TAM (~100 targets / ~$335B GTV at 3.0-4.5x EBITDA vs COMP's 10-15x = multiple arb) + cyclical existing-home-sales recovery (4.1M -> 20yr-avg 5.1M, >25% uplift) + OpEx discipline (3-4% organic growth flowing straight to EBITDA). ~+9.3% revenue delta -> ~+38% Adj. EBITDA delta in 2030; EV/EBITDA exit (11x declining to 8x). Bear/Base/Bull.",
    thesisPoints: [
      "TP1 - Tech platform: ~$1.8B cumulative R&D builds a unified data layer competitors (RE/MAX outsourced, eXp on kvCORE, ~5x levered legacy) can't finance; drives organic flow-share of churning agents (~5% '23 -> ~16% '25 -> ~23% '30) and +20% first-year productivity.",
      "TP2 - M&A runway & multiple arb: tuck-ins at 3.0-4.5x pre-synergy vs COMP at 10-15x; paused 4Q25 for HOUS integration + deleveraging (~4.4x -> ~1.5x by 2028), resuming ~2028 for ~$10-15B GTV (3-4.5% annual inorganic tailwind).",
      "TP3 - Cyclical + operating leverage: existing-home sales revert from ~4.1M toward the 5.1M 20yr average (>25% uplift) while OpEx grows only 3-4% -> gross profit flows directly to Adj. EBITDA.",
    ],
    cases: {
      bear: "Home-sales cycle stays depressed / HOUS integration or leverage issues",
      base: "PT ~$21-22; ~22.8% IRR on a 2029 exit (higher for nearer exits); ~23% rev / ~52% Adj. EBITDA '25-30 CAGR",
      bull: "Faster home-sales recovery + M&A resumes + accelerating flow-share gains",
    },
    keyDrivers: [
      "Organic agent flow share & productivity",
      "Tuck-in M&A runway (multiple arb)",
      "Existing-home-sales cycle (4.1M -> 5.1M)",
      "OpEx discipline (operating leverage)",
      "Net leverage (4.4x -> 1.5x by 2028)",
      "EV/EBITDA exit multiple",
    ],
    comps:
      "Anywhere/HOUS (~4-5%), Keller Williams (~4%), RE/MAX (~3-4%), eXp (~3%), Redfin (<1%). Top 10 brokerages only ~25-30% of transactions.",
    keyRisks: ["Home-sales cycle stays depressed", "HOUS integration risk", "Leverage / deleveraging path", "M&A execution"],
  },
  {
    company: "ICON plc",
    ticker: "ICLR",
    sector: "Healthcare - contract research organization (CRO)",
    pitchType: "Long",
    analysts: ["Marina Peng", "Alex Cheng", "Jay Crowther", "Aydin Turgut"],
    thesis:
      "Long: 2nd-largest CRO (~21% share). Market mistakes a cyclical trough for idiosyncratic weakness; ICLR disproportionately benefits from the FSO->FSP shift, and consensus wrongly rolls forward one-off vaccine (BARDA) cancellations. Bear case already priced in: trades at a 15Y-trough 12x NTM EPS and a -4.7x multiple spread to best comp IQV (vs -1.7x 5Y avg). ~500bps position, FYE-2028 exit, 22.1% blended IRR.",
    businessModel:
      "CRO serving pharma/biotech across trial phases II-IV. FSO (full-service, ~52%, long 5-15yr backlog, 35-40% GM), FSP (functional, ~28%, 1-3yr burn, 20-25% GM but annuity-like/sticky), Hybrid (~20%, 30-35% GM). Reports a single net revenue figure.",
    modelingApproach:
      "Gross-backlog-bookings build (~5.2% CAGR) with cancellations normalizing (13.5% '25E -> ~9% by '27) and burn rate flatlined at 33%; revenue 5.3% 4Y CAGR vs consensus 3.3% (~8.7% '29 beat). Exit 13.5x fwd P/E (vs ~19x historical) -> 22.1% IRR / 1.5x MOIC. Plus SG&A automation leverage (~130bps) and aggressive buybacks (>10% of shares through FYE26). Biologics pipeline phase-conversion build; heavy expert calls. Bear/Base/Bull (bear already in the price).",
    thesisPoints: [
      "TP1 - FSO->FSP beneficiary: largest FSP player (~21%); top-10 pharma now ~80% FSP; cost/operational control + the $65B->$450B (by 2030) LOE patent cliff push more FSP; ICLR's scale/data moat (Symphony, 17/20 pharma relationships) -> backlog flowshare 34.6% ('21) -> 43.3% ('24); Street wrongly implies share loss.",
      "TP2 - Cyclical recovery: biopharma R&D trough is cyclical; demand inflection in 2026-27 (funding recovering, book-to-bill normalizing) propagating from early- to late-stage trials that ICLR (phases II-IV) serves.",
      "TP3 - Cancellations peaked '25, normalize '26: BARDA COVID-vaccine cancellations are one-off; ex-BARDA book-to-bill ~1.15 (vs 1.02 reported); vaccines now ~1-2% of revenue.",
      "TP4 - SG&A automation + buybacks: ~$3.5B FCF over N3Y at >100% conversion funds >10% buyback; attractive buyout candidate.",
    ],
    cases: {
      bear: "Already priced in - consensus 3.3% rev CAGR (below end-market R&D growth) sets the floor",
      base: "5.3% 4Y rev CAGR (8.7% '29 beat), exit 13.5x fwd P/E -> 22.1% IRR / 1.5x MOIC (FYE-2028)",
      bull: "Faster biopharma recovery + FSP share gains + multiple re-rate toward historical ~19x",
    },
    keyDrivers: [
      "FSP/FSO mix shift",
      "Biopharma R&D recovery (book-to-bill)",
      "Cancellation normalization (BARDA roll-off)",
      "Backlog growth (~5.2%)",
      "SG&A automation leverage",
      "Buybacks / FCF conversion",
      "P/E multiple re-rate (12x -> 13.5x)",
    ],
    comps:
      "IQVIA (IQV) - closest comp (-4.7x spread vs -1.7x 5Y avg); PPD (Thermo Fisher); Parexel, Fortrea, Syneos, Medpace. Top 3 (ICON/IQVIA/PPD) ~61% share.",
    keyRisks: ["Negative biopharma R&D revision", "Outsourcing behavior change from the patent cliff", "Regulatory uncertainty / funding cuts"],
  },
  {
    company: "Intuit",
    ticker: "INTU",
    sector: "Software - SMB financial / accounting + consumer tax (QuickBooks, TurboTax)",
    pitchType: "Long",
    thesis:
      "Long: investors underestimate the durability of Intuit's growth after a Spruce Point short report, AI-disruption fears in TurboTax, and a conservative FY26 guide cut the multiple to a 2Y trough (~27x from 35x). QuickBooks remains the monopolistic SMB system-of-record with mid-market right-to-win and underpenetrated platform services, and TurboTax keeps gaining dollar share via Live/Fully Assisted despite low-end DIY losses. Base: 3.7Y PT $1,340.33 (2.0x MOIC / 20.5% IRR).",
    businessModel:
      "Four segments: Global Business Solutions ~59% (QuickBooks: QBO 75% / QBD 25%), Consumer ~26% (TurboTax: DIY 52% / Live 43% / Desktop 5%), Credit Karma ~12%, ProTax ~3%.",
    modelingApproach:
      "QBO customer + ARPC build (~6% customer growth; ~13% ARPC = ~10% price/yr + ~3% mid-market mix shift) + platform-services ramp (payments take-rate inflection ~61 -> ~103bps, Capital, Bill Pay) + TurboTax mix-shift to Live/Fully Assisted (dollar share). Reverse-DCF shows consensus too bearish; ~10% / 16% / 21% beats to FY30 rev / adj. EBIT / adj. EPS. Capitalize adj. EPS at 28x -> $1,340.33 (2.0x MOIC / 20.5% IRR). Bear $784.01 (1.2x MOIC / 4.4% IRR, 21.5x) -> ~2.1x risk/reward. Heavy expert/Tegus calls + website price scrapes. Bear/Base/Bull.",
    thesisPoints: [
      "TP1 - QuickBooks SMB monopoly + mid-market: ~65% share of 1-9 employee SMBs, ~90% flow share, 600k+ ProAdvisor accountant network, scale/brand/800+ integrations; ~10% price/yr with 8.4/10 value rating; Advanced + Intuit Enterprise Suite extend right-to-win up-market.",
      "TP2 - Platform services scale faster than Street: AR/AP only ~2-8% penetrated (80% of bills still paid by check), incremental payments take rate ~103bps vs ~61bps blended, Capital ~2% penetrated, Bill Pay 4x'd volume.",
      "TP3 - TurboTax risks overblown: AI/government (Direct File ended) fears overstated; low-end DIY share loss offset by higher-ARPU Live/Fully Assisted dollar-share gains; OBBBA tax-complexity tailwind to assisted filing.",
    ],
    cases: {
      bear: "GBS decelerates to low-teens (harder mid-market) + LSD TurboTax (AI disruption) -> $784.01, 1.2x MOIC / 4.4% IRR at 21.5x",
      base: "EPS compounding ~19% (mid-market + platform + Live mix) -> $1,340.33, 2.0x MOIC / 20.5% IRR at 28x",
      bull: "Faster mid-market wins + platform-services inflection + TurboTax re-rate",
    },
    keyDrivers: [
      "QBO customer & ARPC growth (price + mid-market mix)",
      "Platform services (payments take-rate, Capital, Bill Pay)",
      "TurboTax Live / Fully Assisted mix shift",
      "AI (data moat, expert-assist efficiency)",
      "P/E multiple re-rate",
    ],
    comps:
      "Xero (~5% SMB), Sage Intacct, NetSuite (mid-market); BILL, Melio (payments); ADP, Paychex, Gusto, Rippling (payroll); H&R Block, FreeTaxUSA (tax); Credit Karma vs NerdWallet, LendingTree, SoFi.",
    keyRisks: ["Competition / AI take TurboTax share", "SMB macro downturn (QuickBooks churn, Capital defaults, Credit Karma)", "Poor capital allocation (Mailchimp/Credit Karma history)"],
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
