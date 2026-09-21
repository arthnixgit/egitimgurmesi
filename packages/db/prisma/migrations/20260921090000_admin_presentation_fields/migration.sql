-- Additive only: every column is nullable or has a default, so existing rows
-- keep rendering exactly as before and no data is rewritten.

-- Navbar logo size, wordmark toggle and site typography.
ALTER TABLE "site_settings"
  ADD COLUMN "navbarLogoHeight" INTEGER,
  ADD COLUMN "showNavbarWordmark" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "fontFamily" TEXT,
  ADD COLUMN "headingFontFamily" TEXT,
  ADD COLUMN "headingScale" INTEGER,
  ADD COLUMN "bodyScale" INTEGER;

-- Short note beside a package's price.
ALTER TABLE "product_variants" ADD COLUMN "priceNote" TEXT;

-- Score report photo on success story cards.
ALTER TABLE "success_stories" ADD COLUMN "scoreReportImageUrl" TEXT;
