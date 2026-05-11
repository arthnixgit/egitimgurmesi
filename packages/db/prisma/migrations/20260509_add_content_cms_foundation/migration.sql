-- CreateEnum
CREATE TYPE "NavigationMenuLocation" AS ENUM ('PRIMARY', 'FOOTER', 'MOBILE');

-- CreateEnum
CREATE TYPE "MarketingPageType" AS ENUM ('HOME', 'LANDING', 'DIRECTORY', 'CONTENT', 'LEGAL');

-- CreateEnum
CREATE TYPE "FreeMaterialItemType" AS ENUM ('TOOL', 'LINK', 'PDF', 'GUIDANCE', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MediaAssetKind" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO', 'BRANDING', 'OTHER');

-- AlterTable
ALTER TABLE "product_categories" ADD COLUMN     "ctaHref" TEXT,
ADD COLUMN     "parentCategoryId" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- CreateTable
CREATE TABLE "navigation_menus" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" "NavigationMenuLocation" NOT NULL DEFAULT 'PRIMARY',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_menu_items" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "itemKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "description" TEXT,
    "target" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_pages" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "description" TEXT,
    "pageType" "MarketingPageType" NOT NULL,
    "publishStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "heroImageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_page_sections" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT,
    "body" TEXT,
    "variantKey" TEXT,
    "payload" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profile_groups" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "eyebrow" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profile_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT,
    "biography" TEXT,
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "success_stories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "city" TEXT,
    "examLabel" TEXT,
    "resultTitle" TEXT NOT NULL,
    "highlight" TEXT NOT NULL,
    "story" TEXT,
    "avatarUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "success_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_material_categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_material_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_material_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "itemType" "FreeMaterialItemType" NOT NULL,
    "badgeLabel" TEXT,
    "summary" TEXT,
    "href" TEXT,
    "buttonLabel" TEXT,
    "opensInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "countdownPageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_material_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countdown_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updatedLabel" TEXT,
    "videoTitle" TEXT NOT NULL,
    "videoNote" TEXT NOT NULL,
    "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countdown_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countdown_targets" (
    "id" TEXT NOT NULL,
    "countdownPageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "targetAt" TIMESTAMP(3),
    "dateLabel" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countdown_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countdown_official_links" (
    "id" TEXT NOT NULL,
    "countdownPageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "buttonLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countdown_official_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countdown_article_sections" (
    "id" TEXT NOT NULL,
    "countdownPageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countdown_article_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "kind" "MediaAssetKind" NOT NULL,
    "title" TEXT NOT NULL,
    "altText" TEXT,
    "mimeType" TEXT,
    "storageKey" TEXT,
    "publicUrl" TEXT,
    "originalFileName" TEXT,
    "sizeBytes" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "siteTitle" TEXT NOT NULL,
    "tagline" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "supportWhatsappNumber" TEXT,
    "logoPrimaryUrl" TEXT,
    "logoMarkUrl" TEXT,
    "footerNotice" TEXT,
    "defaultSeoTitle" TEXT,
    "defaultSeoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "navigation_menus_key_key" ON "navigation_menus"("key");

-- CreateIndex
CREATE INDEX "navigation_menu_items_menuId_parentId_sortOrder_idx" ON "navigation_menu_items"("menuId", "parentId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_menu_items_menuId_itemKey_key" ON "navigation_menu_items"("menuId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_pages_key_key" ON "marketing_pages"("key");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_pages_slug_key" ON "marketing_pages"("slug");

-- CreateIndex
CREATE INDEX "marketing_pages_pageType_publishStatus_idx" ON "marketing_pages"("pageType", "publishStatus");

-- CreateIndex
CREATE INDEX "marketing_page_sections_pageId_sortOrder_idx" ON "marketing_page_sections"("pageId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_page_sections_pageId_sectionKey_key" ON "marketing_page_sections"("pageId", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profile_groups_key_key" ON "staff_profile_groups"("key");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_slug_key" ON "staff_profiles"("slug");

-- CreateIndex
CREATE INDEX "staff_profiles_groupId_sortOrder_idx" ON "staff_profiles"("groupId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "success_stories_slug_key" ON "success_stories"("slug");

-- CreateIndex
CREATE INDEX "success_stories_publishStatus_sortOrder_idx" ON "success_stories"("publishStatus", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "free_material_categories_key_key" ON "free_material_categories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "free_material_items_slug_key" ON "free_material_items"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "free_material_items_countdownPageId_key" ON "free_material_items"("countdownPageId");

-- CreateIndex
CREATE INDEX "free_material_items_categoryId_sortOrder_idx" ON "free_material_items"("categoryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "countdown_pages_slug_key" ON "countdown_pages"("slug");

-- CreateIndex
CREATE INDEX "countdown_targets_countdownPageId_sortOrder_idx" ON "countdown_targets"("countdownPageId", "sortOrder");

-- CreateIndex
CREATE INDEX "countdown_official_links_countdownPageId_sortOrder_idx" ON "countdown_official_links"("countdownPageId", "sortOrder");

-- CreateIndex
CREATE INDEX "countdown_article_sections_countdownPageId_sortOrder_idx" ON "countdown_article_sections"("countdownPageId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");

-- AddForeignKey
ALTER TABLE "navigation_menu_items" ADD CONSTRAINT "navigation_menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "navigation_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_menu_items" ADD CONSTRAINT "navigation_menu_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "navigation_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_page_sections" ADD CONSTRAINT "marketing_page_sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "marketing_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "staff_profile_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_material_items" ADD CONSTRAINT "free_material_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "free_material_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_material_items" ADD CONSTRAINT "free_material_items_countdownPageId_fkey" FOREIGN KEY ("countdownPageId") REFERENCES "countdown_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "countdown_targets" ADD CONSTRAINT "countdown_targets_countdownPageId_fkey" FOREIGN KEY ("countdownPageId") REFERENCES "countdown_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "countdown_official_links" ADD CONSTRAINT "countdown_official_links_countdownPageId_fkey" FOREIGN KEY ("countdownPageId") REFERENCES "countdown_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "countdown_article_sections" ADD CONSTRAINT "countdown_article_sections_countdownPageId_fkey" FOREIGN KEY ("countdownPageId") REFERENCES "countdown_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

