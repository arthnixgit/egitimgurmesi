ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "detailAudienceHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "detailAudienceBody" TEXT,
  ADD COLUMN IF NOT EXISTS "detailBenefitsHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "detailBenefitsDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "detailBackCtaLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "detailPurchaseCtaLabel" TEXT;
