-- Demote legacy PDF cards that were materialized without an actual download source.
-- The four records remain Admin-visible drafts and can be edited, restored, or deleted safely.
-- Archived records, records with a MediaAsset, records with a downloadUrl, and custom records are not changed.

WITH legacy_cards("slug") AS (
  VALUES
    ('tyt-calisma-plani-pdf'),
    ('ayt-tekrar-cizelgesi-pdf'),
    ('deneme-analiz-formu-pdf'),
    ('hedef-takip-sayfasi-pdf')
)
UPDATE "free_material_items" item
SET
  "publishStatus" = 'DRAFT'::"ContentStatus",
  "href" = NULL,
  "buttonLabel" = COALESCE(item."buttonLabel", 'Dosya eklenince indir'),
  "accessibilityLabel" = COALESCE(item."accessibilityLabel", item."title" || ' dosyası yayına hazırlanıyor'),
  "version" = item."version" + 1,
  "updatedAt" = CURRENT_TIMESTAMP
FROM legacy_cards, "free_material_categories" category
WHERE item."slug" = legacy_cards."slug"
  AND category."id" = item."categoryId"
  AND category."key" = 'pdf-documents'
  AND item."itemType" = 'PDF'::"FreeMaterialItemType"
  AND item."publishStatus" = 'PUBLISHED'::"ContentStatus"
  AND item."mediaAssetId" IS NULL
  AND NULLIF(BTRIM(COALESCE(item."downloadUrl", '')), '') IS NULL;
