-- CreateEnum
CREATE TYPE "ProductVideoSourceType" AS ENUM ('DIRECT', 'EMBED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "introVideoPosterUrl" TEXT,
ADD COLUMN     "introVideoSourceType" "ProductVideoSourceType",
ADD COLUMN     "introVideoTitle" TEXT,
ADD COLUMN     "introVideoUrl" TEXT;
