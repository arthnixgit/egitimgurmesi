-- CreateEnum
CREATE TYPE "ClassGroupStudentStatus" AS ENUM ('ACTIVE', 'LEFT');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LiveSessionParticipantStatus" AS ENUM ('INVITED', 'ATTENDED', 'MISSED', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'STAFF', 'STUDENTS', 'BRANCH_ADMINS', 'INSTRUCTORS', 'COACHES', 'ACCOUNTANTS');

-- CreateEnum
CREATE TYPE "CoachingPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "class_group_students" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ClassGroupStudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_group_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "branchId" TEXT,
    "classGroupId" TEXT,
    "courseId" TEXT,
    "instructorStaffUserId" TEXT,
    "coachStaffUserId" TEXT,
    "createdByStaffUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT,
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_participants" (
    "id" TEXT NOT NULL,
    "liveSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "LiveSessionParticipantStatus" NOT NULL DEFAULT 'INVITED',
    "attendedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "branchId" TEXT,
    "classGroupId" TEXT,
    "createdByStaffUserId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "publishAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT,
    "staffUserId" TEXT,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "branchId" TEXT,
    "userId" TEXT NOT NULL,
    "coachStaffUserId" TEXT,
    "createdByStaffUserId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "weekStartsAt" TIMESTAMP(3),
    "weekEndsAt" TIMESTAMP(3),
    "goals" JSONB,
    "status" "CoachingPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaching_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "branchId" TEXT,
    "userId" TEXT NOT NULL,
    "coachStaffUserId" TEXT,
    "createdByStaffUserId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "followUpAt" TIMESTAMP(3),
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaching_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_group_students_classGroupId_userId_key" ON "class_group_students"("classGroupId", "userId");

-- CreateIndex
CREATE INDEX "class_group_students_organizationId_branchId_status_idx" ON "class_group_students"("organizationId", "branchId", "status");

-- CreateIndex
CREATE INDEX "class_group_students_userId_status_idx" ON "class_group_students"("userId", "status");

-- CreateIndex
CREATE INDEX "live_sessions_organizationId_branchId_startsAt_idx" ON "live_sessions"("organizationId", "branchId", "startsAt");

-- CreateIndex
CREATE INDEX "live_sessions_classGroupId_startsAt_idx" ON "live_sessions"("classGroupId", "startsAt");

-- CreateIndex
CREATE INDEX "live_sessions_instructorStaffUserId_startsAt_idx" ON "live_sessions"("instructorStaffUserId", "startsAt");

-- CreateIndex
CREATE INDEX "live_sessions_coachStaffUserId_startsAt_idx" ON "live_sessions"("coachStaffUserId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_participants_liveSessionId_userId_key" ON "live_session_participants"("liveSessionId", "userId");

-- CreateIndex
CREATE INDEX "live_session_participants_userId_status_idx" ON "live_session_participants"("userId", "status");

-- CreateIndex
CREATE INDEX "announcements_organizationId_branchId_status_publishAt_idx" ON "announcements"("organizationId", "branchId", "status", "publishAt");

-- CreateIndex
CREATE INDEX "announcements_classGroupId_status_publishAt_idx" ON "announcements"("classGroupId", "status", "publishAt");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcementId_userId_key" ON "announcement_reads"("announcementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcementId_staffUserId_key" ON "announcement_reads"("announcementId", "staffUserId");

-- CreateIndex
CREATE INDEX "announcement_reads_userId_readAt_idx" ON "announcement_reads"("userId", "readAt");

-- CreateIndex
CREATE INDEX "announcement_reads_staffUserId_readAt_idx" ON "announcement_reads"("staffUserId", "readAt");

-- CreateIndex
CREATE INDEX "coaching_plans_organizationId_branchId_status_idx" ON "coaching_plans"("organizationId", "branchId", "status");

-- CreateIndex
CREATE INDEX "coaching_plans_userId_status_idx" ON "coaching_plans"("userId", "status");

-- CreateIndex
CREATE INDEX "coaching_plans_coachStaffUserId_status_idx" ON "coaching_plans"("coachStaffUserId", "status");

-- CreateIndex
CREATE INDEX "coaching_notes_organizationId_branchId_createdAt_idx" ON "coaching_notes"("organizationId", "branchId", "createdAt");

-- CreateIndex
CREATE INDEX "coaching_notes_userId_createdAt_idx" ON "coaching_notes"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "coaching_notes_coachStaffUserId_createdAt_idx" ON "coaching_notes"("coachStaffUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "class_group_students" ADD CONSTRAINT "class_group_students_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_group_students" ADD CONSTRAINT "class_group_students_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_group_students" ADD CONSTRAINT "class_group_students_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_group_students" ADD CONSTRAINT "class_group_students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_instructorStaffUserId_fkey" FOREIGN KEY ("instructorStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_coachStaffUserId_fkey" FOREIGN KEY ("coachStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_createdByStaffUserId_fkey" FOREIGN KEY ("createdByStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdByStaffUserId_fkey" FOREIGN KEY ("createdByStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plans" ADD CONSTRAINT "coaching_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plans" ADD CONSTRAINT "coaching_plans_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plans" ADD CONSTRAINT "coaching_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plans" ADD CONSTRAINT "coaching_plans_coachStaffUserId_fkey" FOREIGN KEY ("coachStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plans" ADD CONSTRAINT "coaching_plans_createdByStaffUserId_fkey" FOREIGN KEY ("createdByStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_notes" ADD CONSTRAINT "coaching_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_notes" ADD CONSTRAINT "coaching_notes_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_notes" ADD CONSTRAINT "coaching_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_notes" ADD CONSTRAINT "coaching_notes_coachStaffUserId_fkey" FOREIGN KEY ("coachStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_notes" ADD CONSTRAINT "coaching_notes_createdByStaffUserId_fkey" FOREIGN KEY ("createdByStaffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
