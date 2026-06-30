-- Per-company AI business summary (cached, generated once on first profile view)
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "aiSummary" JSONB;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "aiSummaryGeneratedAt" TIMESTAMP(3);

-- Portfolio-level AI rollup (cached, regenerated when membership changes)
ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "aiRollup" JSONB;
ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "aiRollupGeneratedAt" TIMESTAMP(3);
ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "aiRollupKey" TEXT;
