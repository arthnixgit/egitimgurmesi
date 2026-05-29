-- Production media handling: uploaded media, external video embeds, and staff intro video fields.

CREATE TYPE "MediaAssetSourceType" AS ENUM ('LOCAL_UPLOAD', 'EXTERNAL_URL');

ALTER TABLE "media_assets"
ADD COLUMN "sourceType" "MediaAssetSourceType" NOT NULL DEFAULT 'LOCAL_UPLOAD',
ADD COLUMN "externalProvider" TEXT,
ADD COLUMN "externalUrl" TEXT,
ADD COLUMN "embedUrl" TEXT,
ADD COLUMN "thumbnailUrl" TEXT,
ADD COLUMN "createdByStaffUserId" TEXT;

ALTER TABLE "staff_profile_groups"
ADD COLUMN "introVideoSourceType" "ProductVideoSourceType",
ADD COLUMN "introVideoUrl" TEXT,
ADD COLUMN "introVideoPosterUrl" TEXT,
ADD COLUMN "introVideoTitle" TEXT;

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_createdByStaffUserId_fkey"
FOREIGN KEY ("createdByStaffUserId") REFERENCES "staff_users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "media_assets_kind_sourceType_idx" ON "media_assets"("kind", "sourceType");
CREATE INDEX "media_assets_createdByStaffUserId_idx" ON "media_assets"("createdByStaffUserId");
