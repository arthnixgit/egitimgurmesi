-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GradeLevel" ADD VALUE 'GRADE_5';
ALTER TYPE "GradeLevel" ADD VALUE 'GRADE_6';
ALTER TYPE "GradeLevel" ADD VALUE 'GRADE_7';
ALTER TYPE "GradeLevel" ADD VALUE 'GRADE_8';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StudyTrack" ADD VALUE 'LGS';
ALTER TYPE "StudyTrack" ADD VALUE 'MSU';
ALTER TYPE "StudyTrack" ADD VALUE 'ARA_SINIF';
ALTER TYPE "StudyTrack" ADD VALUE 'KPSS';

-- CreateTable
CREATE TABLE "external_account_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "externalUserId" TEXT,
    "externalEmail" TEXT,
    "refreshToken" TEXT NOT NULL,
    "metadata" JSONB,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_account_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "external_account_links_provider_externalEmail_idx" ON "external_account_links"("provider", "externalEmail");

-- CreateIndex
CREATE UNIQUE INDEX "external_account_links_userId_provider_key" ON "external_account_links"("userId", "provider");

-- AddForeignKey
ALTER TABLE "external_account_links" ADD CONSTRAINT "external_account_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
