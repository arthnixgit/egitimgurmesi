-- Materialize the four legacy PDF cards as managed records without deleting or
-- overwriting custom content. Existing archived records are preserved.

WITH ensured_category AS (
  INSERT INTO "free_material_categories" (
    "id",
    "key",
    "label",
    "description",
    "sortOrder",
    "publishStatus",
    "version",
    "createdAt",
    "updatedAt"
  )
  SELECT
    'legacy-free-material-category-pdf-documents',
    'pdf-documents',
    'PDF Dökümanlar',
    'Takip ve planlama odaklı dökümanlar.',
    30,
    'PUBLISHED'::"ContentStatus",
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  WHERE NOT EXISTS (
    SELECT 1 FROM "free_material_categories" WHERE "key" = 'pdf-documents'
  )
  ON CONFLICT ("key") DO UPDATE SET "updatedAt" = "free_material_categories"."updatedAt"
  RETURNING "id"
),
resolved_category AS (
  SELECT "id" FROM ensured_category
  UNION ALL
  SELECT "id" FROM "free_material_categories" WHERE "key" = 'pdf-documents'
  LIMIT 1
),
legacy_cards("legacyId", "slug", "title", "summary", "href", "buttonLabel", "sortOrder") AS (
  VALUES
    (
      'legacy-free-material-pdf-tyt-calisma-plani',
      'tyt-calisma-plani-pdf',
      'TYT Çalışma Planı PDF',
      'Haftalık bloklar ve tekrar zamanlarını planlamak için TYT çalışma şablonu.',
      '/ucretsiz-materyaller/tyt-kac-gun-kaldi',
      'İçeriği İncele',
      10
    ),
    (
      'legacy-free-material-pdf-ayt-tekrar-cizelgesi',
      'ayt-tekrar-cizelgesi-pdf',
      'AYT Tekrar Çizelgesi PDF',
      'AYT konu tekrarlarını haftalara ayıran sade çizelge.',
      '/ucretsiz-materyaller/ayt-kac-gun-kaldi',
      'İçeriği İncele',
      20
    ),
    (
      'legacy-free-material-pdf-deneme-analiz-formu',
      'deneme-analiz-formu-pdf',
      'Deneme Analiz Formu PDF',
      'Net, süre ve eksik konu değerlendirmesi için analiz formu.',
      '/ucretsiz-materyaller/ydt-kac-gun-kaldi',
      'İçeriği İncele',
      30
    ),
    (
      'legacy-free-material-pdf-hedef-takip-sayfasi',
      'hedef-takip-sayfasi-pdf',
      'Hedef Takip Sayfası PDF',
      'Aylık hedefleri ve tamamlanan görevleri işlemek için takip sayfası.',
      '/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi',
      'İçeriği İncele',
      40
    )
)
UPDATE "free_material_items" item
SET
  "slug" = legacy_cards."slug",
  "updatedAt" = CURRENT_TIMESTAMP
FROM legacy_cards, resolved_category
WHERE item."categoryId" = resolved_category."id"
  AND item."title" = legacy_cards."title"
  AND item."slug" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "free_material_items" existing WHERE existing."slug" = legacy_cards."slug"
  );

WITH resolved_category AS (
  SELECT "id" FROM "free_material_categories" WHERE "key" = 'pdf-documents' LIMIT 1
),
legacy_cards("legacyId", "slug", "title", "summary", "href", "buttonLabel", "sortOrder") AS (
  VALUES
    (
      'legacy-free-material-pdf-tyt-calisma-plani',
      'tyt-calisma-plani-pdf',
      'TYT Çalışma Planı PDF',
      'Haftalık bloklar ve tekrar zamanlarını planlamak için TYT çalışma şablonu.',
      '/ucretsiz-materyaller/tyt-kac-gun-kaldi',
      'İçeriği İncele',
      10
    ),
    (
      'legacy-free-material-pdf-ayt-tekrar-cizelgesi',
      'ayt-tekrar-cizelgesi-pdf',
      'AYT Tekrar Çizelgesi PDF',
      'AYT konu tekrarlarını haftalara ayıran sade çizelge.',
      '/ucretsiz-materyaller/ayt-kac-gun-kaldi',
      'İçeriği İncele',
      20
    ),
    (
      'legacy-free-material-pdf-deneme-analiz-formu',
      'deneme-analiz-formu-pdf',
      'Deneme Analiz Formu PDF',
      'Net, süre ve eksik konu değerlendirmesi için analiz formu.',
      '/ucretsiz-materyaller/ydt-kac-gun-kaldi',
      'İçeriği İncele',
      30
    ),
    (
      'legacy-free-material-pdf-hedef-takip-sayfasi',
      'hedef-takip-sayfasi-pdf',
      'Hedef Takip Sayfası PDF',
      'Aylık hedefleri ve tamamlanan görevleri işlemek için takip sayfası.',
      '/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi',
      'İçeriği İncele',
      40
    )
)
INSERT INTO "free_material_items" (
  "id",
  "categoryId",
  "slug",
  "title",
  "itemType",
  "badgeLabel",
  "summary",
  "href",
  "buttonLabel",
  "opensInNewTab",
  "sortOrder",
  "isFeatured",
  "publishStatus",
  "iconKey",
  "tone",
  "accessibilityLabel",
  "version",
  "createdAt",
  "updatedAt"
)
SELECT
  legacy_cards."legacyId",
  resolved_category."id",
  legacy_cards."slug",
  legacy_cards."title",
  'PDF'::"FreeMaterialItemType",
  'PDF Döküman',
  legacy_cards."summary",
  legacy_cards."href",
  legacy_cards."buttonLabel",
  false,
  legacy_cards."sortOrder",
  false,
  'PUBLISHED'::"ContentStatus",
  'pdf',
  'navy',
  legacy_cards."buttonLabel",
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy_cards
CROSS JOIN resolved_category
WHERE NOT EXISTS (
  SELECT 1
  FROM "free_material_items" item
  WHERE item."slug" = legacy_cards."slug"
     OR (item."categoryId" = resolved_category."id" AND item."title" = legacy_cards."title")
);
