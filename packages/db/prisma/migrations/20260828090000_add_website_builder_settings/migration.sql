DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DOWNLOAD' AND enumtypid = '"FreeMaterialItemType"'::regtype) THEN
    ALTER TYPE "FreeMaterialItemType" ADD VALUE 'DOWNLOAD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'INTERNAL_PAGE' AND enumtypid = '"FreeMaterialItemType"'::regtype) THEN
    ALTER TYPE "FreeMaterialItemType" ADD VALUE 'INTERNAL_PAGE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EXTERNAL_LINK' AND enumtypid = '"FreeMaterialItemType"'::regtype) THEN
    ALTER TYPE "FreeMaterialItemType" ADD VALUE 'EXTERNAL_LINK';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'COUNTDOWN' AND enumtypid = '"FreeMaterialItemType"'::regtype) THEN
    ALTER TYPE "FreeMaterialItemType" ADD VALUE 'COUNTDOWN';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CALCULATOR' AND enumtypid = '"FreeMaterialItemType"'::regtype) THEN
    ALTER TYPE "FreeMaterialItemType" ADD VALUE 'CALCULATOR';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BLOG' AND enumtypid = '"FreeMaterialItemType"'::regtype) THEN
    ALTER TYPE "FreeMaterialItemType" ADD VALUE 'BLOG';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SIMULATION' AND enumtypid = '"FreeMaterialItemType"'::regtype) THEN
    ALTER TYPE "FreeMaterialItemType" ADD VALUE 'SIMULATION';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SYSTEM_TOOL' AND enumtypid = '"FreeMaterialItemType"'::regtype) THEN
    ALTER TYPE "FreeMaterialItemType" ADD VALUE 'SYSTEM_TOOL';
  END IF;
END $$;

ALTER TABLE "navigation_menus" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "marketing_pages" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "staff_profile_groups" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "free_material_categories" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "iconKey" TEXT;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "tone" TEXT;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "downloadUrl" TEXT;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "mediaAssetId" TEXT;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "displayFilename" TEXT;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "fileSizeBytes" INTEGER;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "accessibilityLabel" TEXT;
ALTER TABLE "free_material_items" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "countdown_pages" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logoFooterUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logoCompactUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logoDarkUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logoLightUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "defaultSocialImageUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logoAltText" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "displayPhone" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "canonicalPhone" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "whatsappMessage" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "publicContactEmail" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "footerBrandDescription" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "footerQuickLinks" JSONB;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "footerContactTitle" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "copyrightText" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "lastPublishedByStaffUserId" TEXT;

CREATE TABLE IF NOT EXISTS "website_content_revisions" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityKey" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT,
  "beforeData" JSONB,
  "afterData" JSONB NOT NULL,
  "createdByStaffUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "website_content_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "website_content_revisions_scope_entityType_entityKey_createdAt_idx"
  ON "website_content_revisions"("scope", "entityType", "entityKey", "createdAt");

CREATE INDEX IF NOT EXISTS "website_content_revisions_createdByStaffUserId_createdAt_idx"
  ON "website_content_revisions"("createdByStaffUserId", "createdAt");

INSERT INTO "site_settings" (
  "id",
  "key",
  "siteName",
  "siteTitle",
  "tagline",
  "supportEmail",
  "supportPhone",
  "supportWhatsappNumber",
  "logoPrimaryUrl",
  "logoMarkUrl",
  "logoFooterUrl",
  "logoCompactUrl",
  "logoDarkUrl",
  "logoLightUrl",
  "faviconUrl",
  "defaultSocialImageUrl",
  "logoAltText",
  "displayPhone",
  "canonicalPhone",
  "whatsappMessage",
  "address",
  "publicContactEmail",
  "footerBrandDescription",
  "footerQuickLinks",
  "footerContactTitle",
  "socialLinks",
  "copyrightText",
  "footerNotice",
  "defaultSeoTitle",
  "defaultSeoDescription",
  "createdAt",
  "updatedAt",
  "publishedAt"
) VALUES (
  'site_default',
  'default',
  'Eğitim Gurmesi Akademi',
  'EĞİTİM GURMESİ AKADEMİ',
  'Video paketleri, koçluk akışı ve öğrenci paneli',
  'bilgi@egitimgurmesi.com',
  '+90 531 855 38 27',
  '905318553827',
  '/branding/ega-logo-official.png',
  '/branding/ega-mark-transparent.png',
  '/branding/ega-logo-official.png',
  '/branding/ega-mark-transparent.png',
  '/branding/ega-logo-official.png',
  '/branding/ega-logo-official.png',
  '/icon.png',
  '/branding/ega-logo-official.png',
  'Eğitim Gurmesi Akademi',
  '+90 531 855 38 27',
  '+905318553827',
  'Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.',
  'Alacaatlı Mah. 4834. Sok. No: 10/8-59 Çankaya/Ankara',
  'bilgi@egitimgurmesi.com',
  'Eğitim Gurmesi Akademi; kayıtlı video paketlerini, koçluk yönlendirme mantığını ve öğrenci hesap disiplinini tek çatı altında birleştiren yeni nesil bir eğitim satış platformu olarak kurgulanıyor.',
  '[{"label":"Paketlerimiz","href":"/paketlerimiz"},{"label":"Ücretsiz Materyaller","href":"/ucretsiz-materyaller"},{"label":"Hakkımızda","href":"/hakkimizda"},{"label":"Öğrenci Girişi","href":"/giris"}]'::jsonb,
  'İletişim',
  '[]'::jsonb,
  '© Eğitim Gurmesi Akademi. Tüm hakları saklıdır.',
  'Eğitim Gurmesi Akademi iletişim ve marka bilgileri.',
  'Eğitim Gurmesi Akademi',
  'Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT ("key") DO UPDATE SET
  "updatedAt" = CURRENT_TIMESTAMP,
  "supportPhone" = '+90 531 855 38 27',
  "supportWhatsappNumber" = '905318553827',
  "logoPrimaryUrl" = COALESCE("site_settings"."logoPrimaryUrl", EXCLUDED."logoPrimaryUrl"),
  "logoMarkUrl" = COALESCE("site_settings"."logoMarkUrl", EXCLUDED."logoMarkUrl"),
  "logoFooterUrl" = COALESCE("site_settings"."logoFooterUrl", EXCLUDED."logoFooterUrl"),
  "logoCompactUrl" = COALESCE("site_settings"."logoCompactUrl", EXCLUDED."logoCompactUrl"),
  "logoDarkUrl" = COALESCE("site_settings"."logoDarkUrl", EXCLUDED."logoDarkUrl"),
  "logoLightUrl" = COALESCE("site_settings"."logoLightUrl", EXCLUDED."logoLightUrl"),
  "faviconUrl" = COALESCE("site_settings"."faviconUrl", EXCLUDED."faviconUrl"),
  "defaultSocialImageUrl" = COALESCE("site_settings"."defaultSocialImageUrl", EXCLUDED."defaultSocialImageUrl"),
  "logoAltText" = COALESCE("site_settings"."logoAltText", EXCLUDED."logoAltText"),
  "displayPhone" = '+90 531 855 38 27',
  "canonicalPhone" = '+905318553827',
  "whatsappMessage" = COALESCE("site_settings"."whatsappMessage", EXCLUDED."whatsappMessage"),
  "address" = COALESCE("site_settings"."address", EXCLUDED."address"),
  "publicContactEmail" = COALESCE("site_settings"."publicContactEmail", "site_settings"."supportEmail", EXCLUDED."publicContactEmail"),
  "footerBrandDescription" = COALESCE("site_settings"."footerBrandDescription", EXCLUDED."footerBrandDescription"),
  "footerQuickLinks" = COALESCE("site_settings"."footerQuickLinks", EXCLUDED."footerQuickLinks"),
  "footerContactTitle" = COALESCE("site_settings"."footerContactTitle", EXCLUDED."footerContactTitle"),
  "socialLinks" = COALESCE("site_settings"."socialLinks", EXCLUDED."socialLinks"),
  "copyrightText" = COALESCE("site_settings"."copyrightText", EXCLUDED."copyrightText"),
  "defaultSeoTitle" = COALESCE("site_settings"."defaultSeoTitle", EXCLUDED."defaultSeoTitle"),
  "defaultSeoDescription" = COALESCE("site_settings"."defaultSeoDescription", EXCLUDED."defaultSeoDescription"),
  "publishedAt" = COALESCE("site_settings"."publishedAt", CURRENT_TIMESTAMP);
