-- Persisted website drafts.
--
-- Until now "Taslağı Kaydet" wrote an audit trail and returned the payload to
-- the client without storing it, so unpublished editing work was lost on
-- reload. This table gives every editable website entity one shared draft,
-- keyed the same way revisions already are (entityType + entityKey), holding
-- the full editor snapshot plus the published version it was based on.

CREATE TABLE IF NOT EXISTS "website_content_drafts" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityKey" TEXT NOT NULL,
  "baseVersion" INTEGER NOT NULL,
  "data" JSONB NOT NULL,
  "updatedByStaffUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "website_content_drafts_pkey" PRIMARY KEY ("id")
);

-- One draft per entity: drafts are shared by the editing team, not per user,
-- so that "publish" has a single unambiguous candidate.
CREATE UNIQUE INDEX IF NOT EXISTS "website_content_drafts_entityType_entityKey_key"
  ON "website_content_drafts" ("entityType", "entityKey");

CREATE INDEX IF NOT EXISTS "website_content_drafts_updatedAt_idx"
  ON "website_content_drafts" ("updatedAt");
