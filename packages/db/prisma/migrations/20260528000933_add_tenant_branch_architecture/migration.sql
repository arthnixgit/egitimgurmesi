-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BranchMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "StaffBranchRole" AS ENUM ('BRANCH_ADMIN', 'INSTRUCTOR', 'COACH', 'ACCOUNTANT', 'STAFF');

-- CreateEnum
CREATE TYPE "ClassGroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('PAYTR', 'UNIKAZAN', 'OPENAI', 'GOOGLE_DRIVE', 'OTHER');

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "product_categories" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "staff_users" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "primaryBranchId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "primaryBranchId" TEXT;

-- AlterTable
ALTER TABLE "whatsapp_leads" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "taxNumber" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_centers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "centerType" TEXT,
    "city" TEXT,
    "district" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "educationCenterId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "city" TEXT,
    "district" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_staff_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "roleKey" "StaffBranchRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "permissionsOverride" JSONB,
    "assignedByStaffUserId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_branch_memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BranchMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_branch_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_groups" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gradeLevel" "GradeLevel",
    "studyTrack" "StudyTrack",
    "status" "ClassGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdByStaffUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "userId" TEXT,
    "classGroupId" TEXT,
    "assignedByStaffUserId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "userId" TEXT,
    "classGroupId" TEXT,
    "assignedByStaffUserId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "branchId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "branchId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "value" JSONB,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_credentials" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "branchId" TEXT,
    "provider" "IntegrationProvider" NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "encryptedPayload" JSONB,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "education_centers_organizationId_status_idx" ON "education_centers"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "education_centers_organizationId_slug_key" ON "education_centers"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "branches_organizationId_status_idx" ON "branches"("organizationId", "status");

-- CreateIndex
CREATE INDEX "branches_educationCenterId_idx" ON "branches"("educationCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organizationId_slug_key" ON "branches"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "branch_staff_assignments_organizationId_branchId_idx" ON "branch_staff_assignments"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "branch_staff_assignments_staffUserId_revokedAt_idx" ON "branch_staff_assignments"("staffUserId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "branch_staff_assignments_staffUserId_branchId_roleKey_key" ON "branch_staff_assignments"("staffUserId", "branchId", "roleKey");

-- CreateIndex
CREATE INDEX "student_branch_memberships_organizationId_branchId_status_idx" ON "student_branch_memberships"("organizationId", "branchId", "status");

-- CreateIndex
CREATE INDEX "student_branch_memberships_userId_status_idx" ON "student_branch_memberships"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_branch_memberships_userId_branchId_key" ON "student_branch_memberships"("userId", "branchId");

-- CreateIndex
CREATE INDEX "class_groups_organizationId_branchId_status_idx" ON "class_groups"("organizationId", "branchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "class_groups_branchId_slug_key" ON "class_groups"("branchId", "slug");

-- CreateIndex
CREATE INDEX "instructor_assignments_organizationId_branchId_isActive_idx" ON "instructor_assignments"("organizationId", "branchId", "isActive");

-- CreateIndex
CREATE INDEX "instructor_assignments_staffUserId_isActive_idx" ON "instructor_assignments"("staffUserId", "isActive");

-- CreateIndex
CREATE INDEX "instructor_assignments_userId_isActive_idx" ON "instructor_assignments"("userId", "isActive");

-- CreateIndex
CREATE INDEX "instructor_assignments_classGroupId_isActive_idx" ON "instructor_assignments"("classGroupId", "isActive");

-- CreateIndex
CREATE INDEX "coach_assignments_organizationId_branchId_isActive_idx" ON "coach_assignments"("organizationId", "branchId", "isActive");

-- CreateIndex
CREATE INDEX "coach_assignments_staffUserId_isActive_idx" ON "coach_assignments"("staffUserId", "isActive");

-- CreateIndex
CREATE INDEX "coach_assignments_userId_isActive_idx" ON "coach_assignments"("userId", "isActive");

-- CreateIndex
CREATE INDEX "coach_assignments_classGroupId_isActive_idx" ON "coach_assignments"("classGroupId", "isActive");

-- CreateIndex
CREATE INDEX "feature_flags_key_isEnabled_idx" ON "feature_flags"("key", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_organizationId_branchId_key_key" ON "feature_flags"("organizationId", "branchId", "key");

-- CreateIndex
CREATE INDEX "tenant_settings_key_idx" ON "tenant_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_organizationId_branchId_key_key" ON "tenant_settings"("organizationId", "branchId", "key");

-- CreateIndex
CREATE INDEX "integration_credentials_provider_isActive_idx" ON "integration_credentials"("provider", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "integration_credentials_organizationId_branchId_provider_ke_key" ON "integration_credentials"("organizationId", "branchId", "provider", "key");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_branchId_createdAt_idx" ON "audit_logs"("organizationId", "branchId", "createdAt");

-- CreateIndex
CREATE INDEX "courses_organizationId_branchId_publishStatus_idx" ON "courses"("organizationId", "branchId", "publishStatus");

-- CreateIndex
CREATE INDEX "enrollments_organizationId_branchId_status_idx" ON "enrollments"("organizationId", "branchId", "status");

-- CreateIndex
CREATE INDEX "media_assets_organizationId_branchId_idx" ON "media_assets"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "orders_organizationId_branchId_status_idx" ON "orders"("organizationId", "branchId", "status");

-- CreateIndex
CREATE INDEX "payments_organizationId_branchId_status_idx" ON "payments"("organizationId", "branchId", "status");

-- CreateIndex
CREATE INDEX "product_categories_organizationId_branchId_idx" ON "product_categories"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "products_organizationId_branchId_idx" ON "products"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "staff_users_organizationId_idx" ON "staff_users"("organizationId");

-- CreateIndex
CREATE INDEX "staff_users_primaryBranchId_idx" ON "staff_users"("primaryBranchId");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_primaryBranchId_idx" ON "users"("primaryBranchId");

-- CreateIndex
CREATE INDEX "whatsapp_leads_organizationId_branchId_status_idx" ON "whatsapp_leads"("organizationId", "branchId", "status");

-- AddForeignKey
ALTER TABLE "education_centers" ADD CONSTRAINT "education_centers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_educationCenterId_fkey" FOREIGN KEY ("educationCenterId") REFERENCES "education_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_staff_assignments" ADD CONSTRAINT "branch_staff_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_staff_assignments" ADD CONSTRAINT "branch_staff_assignments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_staff_assignments" ADD CONSTRAINT "branch_staff_assignments_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_staff_assignments" ADD CONSTRAINT "branch_staff_assignments_assignedByStaffUserId_fkey" FOREIGN KEY ("assignedByStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_branch_memberships" ADD CONSTRAINT "student_branch_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_branch_memberships" ADD CONSTRAINT "student_branch_memberships_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_branch_memberships" ADD CONSTRAINT "student_branch_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_createdByStaffUserId_fkey" FOREIGN KEY ("createdByStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_assignedByStaffUserId_fkey" FOREIGN KEY ("assignedByStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_assignments" ADD CONSTRAINT "coach_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_assignments" ADD CONSTRAINT "coach_assignments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_assignments" ADD CONSTRAINT "coach_assignments_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_assignments" ADD CONSTRAINT "coach_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_assignments" ADD CONSTRAINT "coach_assignments_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_assignments" ADD CONSTRAINT "coach_assignments_assignedByStaffUserId_fkey" FOREIGN KEY ("assignedByStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_primaryBranchId_fkey" FOREIGN KEY ("primaryBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_primaryBranchId_fkey" FOREIGN KEY ("primaryBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_leads" ADD CONSTRAINT "whatsapp_leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_leads" ADD CONSTRAINT "whatsapp_leads_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
