import {
  AnnouncementAudience,
  AnnouncementStatus,
  AuditActorType,
  ClassGroupStudentStatus,
  LiveSessionStatus,
  PERMISSION_KEYS,
  Prisma,
  ROLE_KEYS
} from "@ega/db";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { assertBranchAccess } from "../auth/scope.guard";
import { PrismaService } from "../database/prisma.service";
import {
  AddClassGroupStudentDto,
  AssignClassGroupStaffDto,
  CreateAnnouncementDto,
  CreateCoachingNoteDto,
  CreateCoachingPlanDto,
  CreateLiveSessionDto,
  ListOperationalQueryDto,
  UpdateLiveSessionStatusDto
} from "./dto/operations.dto";

const classGroupStudentInclude = {
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: { select: { firstName: true, lastName: true } },
      studentProfile: { select: { gradeLevel: true, studyTrack: true, schoolName: true } }
    }
  }
} satisfies Prisma.ClassGroupStudentInclude;

const classGroupInclude = {
  branch: { select: { id: true, name: true, slug: true } },
  _count: {
    select: {
      students: true,
      instructorAssignments: true,
      coachAssignments: true,
      liveSessions: true
    }
  }
} satisfies Prisma.ClassGroupInclude;

const liveSessionInclude = {
  branch: { select: { id: true, name: true, slug: true } },
  classGroup: { select: { id: true, name: true, slug: true } },
  course: { select: { id: true, title: true, slug: true } },
  instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
  coach: { select: { id: true, firstName: true, lastName: true, email: true } },
  participants: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } }
        }
      }
    }
  }
} satisfies Prisma.LiveSessionInclude;

type ClassGroupWithRelations = Prisma.ClassGroupGetPayload<{ include: typeof classGroupInclude }>;
type ClassGroupStudentWithRelations = Prisma.ClassGroupStudentGetPayload<{
  include: typeof classGroupStudentInclude;
}>;
type LiveSessionWithRelations = Prisma.LiveSessionGetPayload<{ include: typeof liveSessionInclude }>;

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStaffDashboard(auth: AuthenticatedRequestContext) {
    this.requireStaff(auth);

    const branchWhere = this.branchScopeWhere(auth);
    const classGroupWhere = this.classGroupScopeWhere(auth);
    const assignmentWhere = this.branchEntityScopeWhere(auth);
    const now = new Date();

    const [
      branches,
      classGroups,
      studentCount,
      instructorCount,
      coachCount,
      upcomingSessions,
      announcements,
      payments,
      orders,
      instructorAssignments,
      coachAssignments,
      coachingPlans,
      coachingNotes
    ] = await Promise.all([
      this.prisma.branch.findMany({
        where: branchWhere,
        orderBy: { name: "asc" },
        take: auth.isSuperAdmin ? 30 : 12,
        select: { id: true, name: true, slug: true, organizationId: true, city: true, district: true }
      }),
      this.prisma.classGroup.findMany({
        where: classGroupWhere,
        orderBy: { createdAt: "desc" },
        take: 12,
        include: classGroupInclude
      }),
      this.prisma.studentBranchMembership.count({ where: assignmentWhere }),
      this.prisma.branchStaffAssignment.count({
        where: { ...assignmentWhere, roleKey: "INSTRUCTOR", revokedAt: null }
      }),
      this.prisma.branchStaffAssignment.count({
        where: { ...assignmentWhere, roleKey: "COACH", revokedAt: null }
      }),
      this.listLiveSessionsInternal(auth, { from: now, take: 8 }),
      this.listAnnouncementsInternal(auth, { take: 8 }),
      this.prisma.payment.findMany({
        where: this.paymentScopeWhere(auth),
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          status: true,
          provider: true,
          amount: true,
          currency: true,
          createdAt: true,
          orderId: true
        }
      }),
      this.prisma.order.findMany({
        where: this.orderScopeWhere(auth),
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          currency: true,
          createdAt: true
        }
      }),
      this.prisma.instructorAssignment.findMany({
        where: this.instructorAssignmentWhere(auth),
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          branch: { select: { id: true, name: true } },
          classGroup: { select: { id: true, name: true } },
          student: { include: { profile: true } }
        }
      }),
      this.prisma.coachAssignment.findMany({
        where: this.coachAssignmentWhere(auth),
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          branch: { select: { id: true, name: true } },
          classGroup: { select: { id: true, name: true } },
          student: { include: { profile: true } }
        }
      }),
      this.prisma.coachingPlan.findMany({
        where: this.coachingScopeWhere(auth),
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          branch: { select: { id: true, name: true } },
          student: { include: { profile: true } },
          coach: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      }),
      this.prisma.coachingNote.findMany({
        where: this.coachingNoteScopeWhere(auth),
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          branch: { select: { id: true, name: true } },
          student: { include: { profile: true } },
          coach: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      })
    ]);

    return {
      actor: {
        id: auth.actorId,
        email: auth.email,
        roles: auth.roleKeys,
        permissions: auth.permissionKeys,
        organizationId: auth.organizationId,
        primaryBranchId: auth.primaryBranchId,
        branchIds: auth.branchIds,
        isSuperAdmin: auth.isSuperAdmin
      },
      capability: {
        branchAdmin: auth.isSuperAdmin || auth.roleKeys.includes(ROLE_KEYS.branchAdmin),
        instructor: auth.roleKeys.includes(ROLE_KEYS.instructor),
        coach: auth.roleKeys.includes(ROLE_KEYS.coach),
        accountant:
          auth.roleKeys.includes(ROLE_KEYS.accountant) || auth.roleKeys.includes(ROLE_KEYS.accounting)
      },
      totals: {
        branches: branches.length,
        classGroups: await this.prisma.classGroup.count({ where: classGroupWhere }),
        students: studentCount,
        instructors: instructorCount,
        coaches: coachCount,
        upcomingSessions: upcomingSessions.length,
        announcements: announcements.length,
        recentPayments: payments.length,
        recentOrders: orders.length
      },
      branches,
      classGroups: classGroups.map(mapClassGroup),
      upcomingSessions: upcomingSessions.map(mapLiveSession),
      announcements: announcements.map(mapAnnouncement),
      finance: {
        recentPayments: payments,
        recentOrders: orders,
        placeholders: ["Faturalar", "İadeler", "PayTR mutabakatı", "Şube gelir raporu"]
      },
      instructor: {
        assignments: instructorAssignments.map(mapAssignment),
        operationalBoundaries: ["Ders materyali", "Ödev taslağı", "Quiz taslağı", "Öğrenci ilerleme takibi"]
      },
      coach: {
        assignments: coachAssignments.map(mapAssignment),
        plans: coachingPlans.map(mapCoachingPlan),
        notes: coachingNotes.map(mapCoachingNote),
        operationalBoundaries: ["Haftalık plan", "Motivasyon notu", "Takip görevi", "Sınav hazırlık ilerlemesi"]
      }
    };
  }

  async listClassGroupRoster(classGroupId: string, auth: AuthenticatedRequestContext) {
    const classGroup = await this.ensureClassGroup(classGroupId, auth);

    const [students, instructors, coaches] = await Promise.all([
      this.prisma.classGroupStudent.findMany({
        where: { classGroupId: classGroup.id },
        orderBy: { joinedAt: "desc" },
        include: classGroupStudentInclude
      }),
      this.prisma.instructorAssignment.findMany({
        where: { classGroupId: classGroup.id, isActive: true },
        include: { instructor: { select: { id: true, firstName: true, lastName: true, email: true } } }
      }),
      this.prisma.coachAssignment.findMany({
        where: { classGroupId: classGroup.id, isActive: true },
        include: { coach: { select: { id: true, firstName: true, lastName: true, email: true } } }
      })
    ]);

    return {
      classGroup: mapClassGroup(classGroup),
      students: students.map(mapClassGroupStudent),
      instructors: instructors.map((assignment) => ({
        id: assignment.id,
        staffUserId: assignment.staffUserId,
        name: displayStaffName(assignment.instructor),
        email: assignment.instructor.email,
        startsAt: assignment.startsAt
      })),
      coaches: coaches.map((assignment) => ({
        id: assignment.id,
        staffUserId: assignment.staffUserId,
        name: displayStaffName(assignment.coach),
        email: assignment.coach.email,
        startsAt: assignment.startsAt
      }))
    };
  }

  async addStudentToClassGroup(
    classGroupId: string,
    dto: AddClassGroupStudentDto,
    auth: AuthenticatedRequestContext
  ) {
    this.requireAnyPermission(auth, [
      PERMISSION_KEYS.classesManage,
      PERMISSION_KEYS.assignmentsManage
    ]);
    const classGroup = await this.ensureClassGroup(classGroupId, auth);

    const membership = await this.prisma.studentBranchMembership.findFirst({
      where: {
        branchId: classGroup.branchId,
        userId: dto.userId
      }
    });

    if (!membership) {
      throw new BadRequestException("Öğrenci önce bu şubeye eklenmelidir.");
    }

    const classGroupStudent = await this.prisma.classGroupStudent.upsert({
      where: {
        classGroupId_userId: {
          classGroupId,
          userId: dto.userId
        }
      },
      create: {
        organizationId: classGroup.organizationId,
        branchId: classGroup.branchId,
        classGroupId,
        userId: dto.userId,
        status: dto.status ?? ClassGroupStudentStatus.ACTIVE
      },
      update: {
        status: dto.status ?? ClassGroupStudentStatus.ACTIVE,
        leftAt: dto.status === ClassGroupStudentStatus.LEFT ? new Date() : null
      },
      include: classGroupStudentInclude
    });

    await this.audit(auth, "class-group.student.assign", "ClassGroupStudent", classGroupStudent.id, {
      organizationId: classGroup.organizationId,
      branchId: classGroup.branchId,
      summary: "Öğrenci sınıf/gruba eklendi."
    });

    return mapClassGroupStudent(classGroupStudent);
  }

  async assignInstructorToClassGroup(
    classGroupId: string,
    dto: AssignClassGroupStaffDto,
    auth: AuthenticatedRequestContext
  ) {
    this.requireAnyPermission(auth, [
      PERMISSION_KEYS.classesManage,
      PERMISSION_KEYS.assignmentsManage
    ]);
    const classGroup = await this.ensureClassGroup(classGroupId, auth);
    await this.ensureStaff(dto.staffUserId);

    const assignment = await this.prisma.instructorAssignment.create({
      data: {
        organizationId: classGroup.organizationId,
        branchId: classGroup.branchId,
        classGroupId,
        staffUserId: dto.staffUserId,
        assignedByStaffUserId: auth.actorId
      },
      include: { instructor: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });

    await this.audit(auth, "class-group.instructor.assign", "InstructorAssignment", assignment.id, {
      organizationId: classGroup.organizationId,
      branchId: classGroup.branchId,
      summary: "Eğitmen sınıf/gruba atandı."
    });

    return {
      id: assignment.id,
      staffUserId: assignment.staffUserId,
      name: displayStaffName(assignment.instructor),
      email: assignment.instructor.email
    };
  }

  async assignCoachToClassGroup(
    classGroupId: string,
    dto: AssignClassGroupStaffDto,
    auth: AuthenticatedRequestContext
  ) {
    this.requireAnyPermission(auth, [
      PERMISSION_KEYS.classesManage,
      PERMISSION_KEYS.assignmentsManage
    ]);
    const classGroup = await this.ensureClassGroup(classGroupId, auth);
    await this.ensureStaff(dto.staffUserId);

    const assignment = await this.prisma.coachAssignment.create({
      data: {
        organizationId: classGroup.organizationId,
        branchId: classGroup.branchId,
        classGroupId,
        staffUserId: dto.staffUserId,
        assignedByStaffUserId: auth.actorId
      },
      include: { coach: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });

    await this.audit(auth, "class-group.coach.assign", "CoachAssignment", assignment.id, {
      organizationId: classGroup.organizationId,
      branchId: classGroup.branchId,
      summary: "Koç sınıf/gruba atandı."
    });

    return {
      id: assignment.id,
      staffUserId: assignment.staffUserId,
      name: displayStaffName(assignment.coach),
      email: assignment.coach.email
    };
  }

  async listLiveSessions(query: ListOperationalQueryDto, auth: AuthenticatedRequestContext) {
    return (await this.listLiveSessionsInternal(auth, {
      branchId: query.branchId,
      classGroupId: query.classGroupId,
      status: query.status,
      take: 80
    })).map(mapLiveSession);
  }

  async createLiveSession(dto: CreateLiveSessionDto, auth: AuthenticatedRequestContext) {
    this.requireAnyPermission(auth, [
      PERMISSION_KEYS.classesManage,
      PERMISSION_KEYS.lmsManage,
      PERMISSION_KEYS.instructorDashboardRead,
      PERMISSION_KEYS.coachDashboardRead
    ]);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime())) {
      throw new BadRequestException("Ders başlangıç ve bitiş tarihi geçerli olmalıdır.");
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException("Ders bitiş saati başlangıçtan sonra olmalıdır.");
    }

    const branchId = dto.branchId ?? auth.primaryBranchId;

    if (!branchId) {
      throw new BadRequestException("Canlı ders için şube seçilmelidir.");
    }

    const branch = await this.ensureBranch(branchId, auth);
    const classGroup = dto.classGroupId
       ? await this.ensureClassGroup(dto.classGroupId, auth)
      : null;

    if (classGroup && classGroup.branchId !== branch.id) {
      throw new BadRequestException("Seçilen grup bu şubeye bağlı değildir.");
    }

    const canManageSessions = this.hasAnyPermission(auth, [
      PERMISSION_KEYS.classesManage,
      PERMISSION_KEYS.lmsManage
    ]);

    const instructorStaffUserId = canManageSessions
       ? dto.instructorStaffUserId || null
      : auth.permissionKeys.includes(PERMISSION_KEYS.instructorDashboardRead)
         ? auth.actorId
        : dto.instructorStaffUserId || null;
    const coachStaffUserId = canManageSessions
       ? dto.coachStaffUserId || null
      : auth.permissionKeys.includes(PERMISSION_KEYS.coachDashboardRead)
         ? auth.actorId
        : dto.coachStaffUserId || null;

    const groupStudents = classGroup
      ? await this.prisma.classGroupStudent.findMany({
          where: { classGroupId: classGroup.id, status: ClassGroupStudentStatus.ACTIVE },
          select: { userId: true }
        })
      : [];
    const participantUserIds = Array.from(
      new Set([...(dto.participantUserIds ?? []), ...groupStudents.map((entry) => entry.userId)])
    );

    const session = await this.prisma.liveSession.create({
      data: {
        organizationId: branch.organizationId,
        branchId: branch.id,
        classGroupId: classGroup?.id,
        courseId: emptyToNull(dto.courseId),
        instructorStaffUserId,
        coachStaffUserId,
        createdByStaffUserId: auth.actorId,
        title: dto.title.trim(),
        description: emptyToNull(dto.description),
        startsAt,
        endsAt,
        meetingUrl: emptyToNull(dto.meetingUrl),
        participants: {
          createMany: {
            data: participantUserIds.map((userId) => ({ userId })),
            skipDuplicates: true
          }
        }
      },
      include: liveSessionInclude
    });

    await this.audit(auth, "live-session.create", "LiveSession", session.id, {
      organizationId: session.organizationId,
      branchId: session.branchId,
      summary: "Canlı ders planlandı."
    });

    return mapLiveSession(session);
  }

  async updateLiveSessionStatus(
    sessionId: string,
    dto: UpdateLiveSessionStatusDto,
    auth: AuthenticatedRequestContext
  ) {
    const existing = await this.prisma.liveSession.findUnique({ where: { id: sessionId } });

    if (!existing) {
      throw new NotFoundException("Canlı ders bulunamadı.");
    }

    if (existing.branchId) {
      assertBranchAccess(auth, existing.branchId);
    }

    const session = await this.prisma.liveSession.update({
      where: { id: sessionId },
      data: { status: dto.status },
      include: liveSessionInclude
    });

    await this.audit(auth, "live-session.status.update", "LiveSession", session.id, {
      organizationId: session.organizationId,
      branchId: session.branchId,
      summary: "Canlı ders durumu güncellendi."
    });

    return mapLiveSession(session);
  }

  async listAnnouncements(query: ListOperationalQueryDto, auth: AuthenticatedRequestContext) {
    return (await this.listAnnouncementsInternal(auth, {
      branchId: query.branchId,
      classGroupId: query.classGroupId,
      take: 80
    })).map(mapAnnouncement);
  }

  async createAnnouncement(dto: CreateAnnouncementDto, auth: AuthenticatedRequestContext) {
    this.requireAnyPermission(auth, [
      PERMISSION_KEYS.branchesManage,
      PERMISSION_KEYS.classesManage,
      PERMISSION_KEYS.lmsManage
    ]);

    const branchId = dto.branchId ?? auth.primaryBranchId ?? null;

    if (!branchId && !auth.isSuperAdmin) {
      throw new BadRequestException("Duyuru için şube seçilmelidir.");
    }

    const branch = branchId ? await this.ensureBranch(branchId, auth) : null;
    const classGroup = dto.classGroupId
       ? await this.ensureClassGroup(dto.classGroupId, auth)
      : null;

    if (classGroup && branch && classGroup.branchId !== branch.id) {
      throw new BadRequestException("Seçilen grup bu şubeye bağlı değildir.");
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        organizationId: branch?.organizationId ?? auth.organizationId,
        branchId: branch?.id,
        classGroupId: classGroup?.id,
        createdByStaffUserId: auth.actorId,
        title: dto.title.trim(),
        body: dto.body.trim(),
        audience: dto.audience ?? AnnouncementAudience.ALL,
        status: dto.status ?? AnnouncementStatus.PUBLISHED,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null
      }
    });

    await this.audit(auth, "announcement.create", "Announcement", announcement.id, {
      organizationId: announcement.organizationId,
      branchId: announcement.branchId,
      summary: "Duyuru oluşturuldu."
    });

    return mapAnnouncement(announcement);
  }

  async listCoachingPlans(query: ListOperationalQueryDto, auth: AuthenticatedRequestContext) {
    const where = this.coachingScopeWhere(auth);

    if (query.branchId) {
      assertBranchAccess(auth, query.branchId);
      where.branchId = query.branchId;
    }

    return (
      await this.prisma.coachingPlan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          branch: { select: { id: true, name: true } },
          student: { include: { profile: true } },
          coach: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      })
    ).map(mapCoachingPlan);
  }

  async createCoachingPlan(dto: CreateCoachingPlanDto, auth: AuthenticatedRequestContext) {
    this.requireAnyPermission(auth, [
      PERMISSION_KEYS.coachDashboardRead,
      PERMISSION_KEYS.assignmentsManage
    ]);

    const student = await this.ensureStudent(dto.userId);
    const branchId = dto.branchId ?? student.primaryBranchId ?? auth.primaryBranchId;

    if (!branchId) {
      throw new BadRequestException("Koçluk planı için şube seçilmelidir.");
    }

    const branch = await this.ensureBranch(branchId, auth);
    await this.assertCoachStudentAccess(auth, dto.userId, branchId);

    const plan = await this.prisma.coachingPlan.create({
      data: {
        organizationId: branch.organizationId,
        branchId,
        userId: dto.userId,
        coachStaffUserId: dto.coachStaffUserId ?? auth.actorId,
        createdByStaffUserId: auth.actorId,
        title: dto.title.trim(),
        summary: emptyToNull(dto.summary),
        weekStartsAt: dto.weekStartsAt ? new Date(dto.weekStartsAt) : null,
        weekEndsAt: dto.weekEndsAt ? new Date(dto.weekEndsAt) : null
      },
      include: {
        branch: { select: { id: true, name: true } },
        student: { include: { profile: true } },
        coach: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    await this.audit(auth, "coaching-plan.create", "CoachingPlan", plan.id, {
      organizationId: plan.organizationId,
      branchId: plan.branchId,
      summary: "Haftalık koçluk planı oluşturuldu."
    });

    return mapCoachingPlan(plan);
  }

  async createCoachingNote(dto: CreateCoachingNoteDto, auth: AuthenticatedRequestContext) {
    this.requireAnyPermission(auth, [
      PERMISSION_KEYS.coachDashboardRead,
      PERMISSION_KEYS.assignmentsManage
    ]);

    const student = await this.ensureStudent(dto.userId);
    const branchId = dto.branchId ?? student.primaryBranchId ?? auth.primaryBranchId;

    if (!branchId) {
      throw new BadRequestException("Koçluk notu için şube seçilmelidir.");
    }

    const branch = await this.ensureBranch(branchId, auth);
    await this.assertCoachStudentAccess(auth, dto.userId, branchId);

    const note = await this.prisma.coachingNote.create({
      data: {
        organizationId: branch.organizationId,
        branchId,
        userId: dto.userId,
        coachStaffUserId: dto.coachStaffUserId ?? auth.actorId,
        createdByStaffUserId: auth.actorId,
        title: dto.title.trim(),
        body: dto.body.trim(),
        followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : null,
        isPrivate: Boolean(dto.isPrivate)
      },
      include: {
        branch: { select: { id: true, name: true } },
        student: { include: { profile: true } },
        coach: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    await this.audit(auth, "coaching-note.create", "CoachingNote", note.id, {
      organizationId: note.organizationId,
      branchId: note.branchId,
      summary: "Koçluk takip notu oluşturuldu."
    });

    return mapCoachingNote(note);
  }

  private async listLiveSessionsInternal(
    auth: AuthenticatedRequestContext,
    input: {
      branchId?: string;
      classGroupId?: string;
      status?: LiveSessionStatus;
      from?: Date;
      take?: number;
    }
  ) {
    const where = this.liveSessionScopeWhere(auth);

    if (input.branchId) {
      assertBranchAccess(auth, input.branchId);
      where.branchId = input.branchId;
    }

    if (input.classGroupId) {
      const classGroup = await this.ensureClassGroup(input.classGroupId, auth);
      where.classGroupId = classGroup.id;
    }

    if (input.status) {
      where.status = input.status;
    }

    if (input.from) {
      where.startsAt = { gte: input.from };
    }

    return this.prisma.liveSession.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: input.take ?? 50,
      include: liveSessionInclude
    });
  }

  private async listAnnouncementsInternal(
    auth: AuthenticatedRequestContext,
    input: { branchId?: string; classGroupId?: string; take?: number }
  ) {
    const where = this.announcementScopeWhere(auth);

    if (input.branchId) {
      assertBranchAccess(auth, input.branchId);
      where.branchId = input.branchId;
    }

    if (input.classGroupId) {
      const classGroup = await this.ensureClassGroup(input.classGroupId, auth);
      where.classGroupId = classGroup.id;
    }

    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
      take: input.take ?? 50
    });
  }

  private liveSessionScopeWhere(auth: AuthenticatedRequestContext): Prisma.LiveSessionWhereInput {
    if (auth.isSuperAdmin) {
      return {};
    }

    const branchIds = auth.branchIds.length ? auth.branchIds : ["__none__"];
    const or: Prisma.LiveSessionWhereInput[] = [{ branchId: { in: branchIds } }];

    if (auth.permissionKeys.includes(PERMISSION_KEYS.instructorDashboardRead)) {
      or.push({ instructorStaffUserId: auth.actorId });
    }

    if (auth.permissionKeys.includes(PERMISSION_KEYS.coachDashboardRead)) {
      or.push({ coachStaffUserId: auth.actorId });
    }

    return { OR: or };
  }

  private announcementScopeWhere(auth: AuthenticatedRequestContext): Prisma.AnnouncementWhereInput {
    if (auth.isSuperAdmin) {
      return {};
    }

    const branchIds = auth.branchIds.length ? auth.branchIds : ["__none__"];
    return {
      OR: [
        { branchId: { in: branchIds } },
        { organizationId: auth.organizationId ?? "__none__", branchId: null },
        { createdByStaffUserId: auth.actorId }
      ]
    };
  }

  private branchScopeWhere(auth: AuthenticatedRequestContext): Prisma.BranchWhereInput {
    if (auth.isSuperAdmin) {
      return {};
    }

    return { id: { in: auth.branchIds.length ? auth.branchIds : ["__none__"] } };
  }

  private branchEntityScopeWhere(auth: AuthenticatedRequestContext) {
    return auth.isSuperAdmin
       ? {}
      : { branchId: { in: auth.branchIds.length ? auth.branchIds : ["__none__"] } };
  }

  private classGroupScopeWhere(auth: AuthenticatedRequestContext): Prisma.ClassGroupWhereInput {
    return auth.isSuperAdmin
       ? {}
      : { branchId: { in: auth.branchIds.length ? auth.branchIds : ["__none__"] } };
  }

  private instructorAssignmentWhere(auth: AuthenticatedRequestContext): Prisma.InstructorAssignmentWhereInput {
    if (auth.isSuperAdmin || this.hasAnyPermission(auth, [PERMISSION_KEYS.assignmentsRead])) {
      return this.branchEntityScopeWhere(auth);
    }

    return { staffUserId: auth.actorId, isActive: true };
  }

  private coachAssignmentWhere(auth: AuthenticatedRequestContext): Prisma.CoachAssignmentWhereInput {
    if (auth.isSuperAdmin || this.hasAnyPermission(auth, [PERMISSION_KEYS.assignmentsRead])) {
      return this.branchEntityScopeWhere(auth);
    }

    return { staffUserId: auth.actorId, isActive: true };
  }

  private coachingScopeWhere(auth: AuthenticatedRequestContext): Prisma.CoachingPlanWhereInput {
    if (auth.isSuperAdmin || this.hasAnyPermission(auth, [PERMISSION_KEYS.assignmentsRead])) {
      return this.branchEntityScopeWhere(auth);
    }

    if (auth.permissionKeys.includes(PERMISSION_KEYS.coachDashboardRead)) {
      return { coachStaffUserId: auth.actorId };
    }

    return { id: "__none__" };
  }

  private coachingNoteScopeWhere(auth: AuthenticatedRequestContext): Prisma.CoachingNoteWhereInput {
    if (auth.isSuperAdmin || this.hasAnyPermission(auth, [PERMISSION_KEYS.assignmentsRead])) {
      return this.branchEntityScopeWhere(auth);
    }

    if (auth.permissionKeys.includes(PERMISSION_KEYS.coachDashboardRead)) {
      return { coachStaffUserId: auth.actorId };
    }

    return { id: "__none__" };
  }

  private orderScopeWhere(auth: AuthenticatedRequestContext): Prisma.OrderWhereInput {
    if (auth.isSuperAdmin) {
      return {};
    }

    return { branchId: { in: auth.branchIds.length ? auth.branchIds : ["__none__"] } };
  }

  private paymentScopeWhere(auth: AuthenticatedRequestContext): Prisma.PaymentWhereInput {
    if (auth.isSuperAdmin) {
      return {};
    }

    return { branchId: { in: auth.branchIds.length ? auth.branchIds : ["__none__"] } };
  }

  private async ensureBranch(branchId: string, auth: AuthenticatedRequestContext) {
    assertBranchAccess(auth, branchId);
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });

    if (!branch) {
      throw new NotFoundException("Şube bulunamadı.");
    }

    return branch;
  }

  private async ensureClassGroup(classGroupId: string, auth: AuthenticatedRequestContext) {
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: classGroupInclude
    });

    if (!classGroup) {
      throw new NotFoundException("Sınıf/grup bulunamadı.");
    }

    assertBranchAccess(auth, classGroup.branchId);
    return classGroup;
  }

  private async ensureStaff(staffUserId: string) {
    const staff = await this.prisma.staffUser.findUnique({ where: { id: staffUserId } });

    if (!staff) {
      throw new NotFoundException("Personel bulunamadı.");
    }

    return staff;
  }

  private async ensureStudent(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("Öğrenci bulunamadı.");
    }

    return user;
  }

  private async assertCoachStudentAccess(
    auth: AuthenticatedRequestContext,
    userId: string,
    branchId: string
  ) {
    assertBranchAccess(auth, branchId);

    if (auth.isSuperAdmin || this.hasAnyPermission(auth, [PERMISSION_KEYS.assignmentsManage])) {
      return;
    }

    const directAssignment = await this.prisma.coachAssignment.findFirst({
      where: {
        branchId,
        staffUserId: auth.actorId,
        userId,
        isActive: true
      }
    });

    if (directAssignment) {
      return;
    }

    const groupAssignment = await this.prisma.coachAssignment.findFirst({
      where: {
        branchId,
        staffUserId: auth.actorId,
        isActive: true,
        classGroup: {
          students: {
            some: {
              userId,
              status: ClassGroupStudentStatus.ACTIVE
            }
          }
        }
      }
    });

    if (!groupAssignment) {
      throw new ForbiddenException("Bu öğrenci için koçluk yetkiniz bulunmuyor.");
    }
  }

  private requireStaff(auth: AuthenticatedRequestContext) {
    if (auth.actorType !== "STAFF") {
      throw new ForbiddenException("Bu alan yalnızca personel erişimine açıktır.");
    }
  }

  private requireAnyPermission(auth: AuthenticatedRequestContext, permissions: string[]) {
    if (this.hasAnyPermission(auth, permissions)) {
      return;
    }

    throw new ForbiddenException("Bu işlem için yetkiniz bulunmuyor.");
  }

  private hasAnyPermission(auth: AuthenticatedRequestContext, permissions: string[]) {
    return auth.isSuperAdmin || permissions.some((permission) => auth.permissionKeys.includes(permission));
  }

  private audit(
    auth: AuthenticatedRequestContext,
    action: string,
    entityType: string,
    entityId: string,
    input: {
      organizationId?: string | null;
      branchId?: string | null;
      summary?: string;
      metadata?: Prisma.InputJsonValue;
    }
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorType: AuditActorType.STAFF_USER,
        staffUserId: auth.actorId,
        organizationId: input.organizationId,
        branchId: input.branchId,
        action,
        entityType,
        entityId,
        summary: input.summary,
        metadata: input.metadata
      }
    });
  }
}

function mapClassGroup(classGroup: ClassGroupWithRelations) {
  return {
    id: classGroup.id,
    organizationId: classGroup.organizationId,
    branchId: classGroup.branchId,
    branch: classGroup.branch,
    slug: classGroup.slug,
    name: classGroup.name,
    description: classGroup.description,
    gradeLevel: classGroup.gradeLevel,
    studyTrack: classGroup.studyTrack,
    status: classGroup.status,
    startsAt: classGroup.startsAt,
    endsAt: classGroup.endsAt,
    counts: classGroup._count
  };
}

function mapClassGroupStudent(entry: ClassGroupStudentWithRelations) {
  return {
    id: entry.id,
    userId: entry.userId,
    status: entry.status,
    joinedAt: entry.joinedAt,
    leftAt: entry.leftAt,
    student: {
      id: entry.user.id,
      name: displayStudentName(entry.user),
      email: entry.user.email,
      phone: entry.user.phone,
      gradeLevel: entry.user.studentProfile?.gradeLevel,
      studyTrack: entry.user.studentProfile?.studyTrack,
      schoolName: entry.user.studentProfile?.schoolName
    }
  };
}

function mapLiveSession(session: LiveSessionWithRelations) {
  return {
    id: session.id,
    organizationId: session.organizationId,
    branchId: session.branchId,
    branch: session.branch,
    classGroupId: session.classGroupId,
    classGroup: session.classGroup,
    course: session.course,
    title: session.title,
    description: session.description,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    meetingUrl: session.meetingUrl,
    status: session.status,
    instructor: session.instructor
      ? {
          id: session.instructor.id,
          name: displayStaffName(session.instructor),
          email: session.instructor.email
        }
      : null,
    coach: session.coach
      ? {
          id: session.coach.id,
          name: displayStaffName(session.coach),
          email: session.coach.email
        }
      : null,
    participants: session.participants.map((participant) => ({
      id: participant.id,
      userId: participant.userId,
      name: displayStudentName(participant.user),
      email: participant.user.email,
      status: participant.status
    }))
  };
}

function mapAnnouncement(announcement: {
  id: string;
  organizationId: string | null;
  branchId: string | null;
  classGroupId: string | null;
  title: string;
  body: string;
  status: AnnouncementStatus;
  audience: AnnouncementAudience;
  publishAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: announcement.id,
    organizationId: announcement.organizationId,
    branchId: announcement.branchId,
    classGroupId: announcement.classGroupId,
    title: announcement.title,
    body: announcement.body,
    status: announcement.status,
    audience: announcement.audience,
    publishAt: announcement.publishAt,
    expiresAt: announcement.expiresAt,
    createdAt: announcement.createdAt
  };
}

function mapAssignment(assignment: {
  id: string;
  branch?: { id: string; name: string } | null;
  classGroup?: { id: string; name: string } | null;
  student?: {
    id: string;
    email: string;
    profile?: { firstName: string; lastName: string } | null;
  } | null;
  startsAt: Date;
}) {
  return {
    id: assignment.id,
    branch: assignment.branch,
    classGroup: assignment.classGroup,
    student: assignment.student
      ? {
          id: assignment.student.id,
          name: displayStudentName(assignment.student),
          email: assignment.student.email
        }
      : null,
    startsAt: assignment.startsAt
  };
}

function mapCoachingPlan(plan: {
  id: string;
  branch?: { id: string; name: string } | null;
  student: { id: string; email: string; profile?: { firstName: string; lastName: string } | null };
  coach?: { id: string; firstName: string; lastName: string; email: string } | null;
  title: string;
  summary: string | null;
  status: string;
  weekStartsAt: Date | null;
  weekEndsAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: plan.id,
    branch: plan.branch,
    student: {
      id: plan.student.id,
      name: displayStudentName(plan.student),
      email: plan.student.email
    },
    coach: plan.coach
       ? { id: plan.coach.id, name: displayStaffName(plan.coach), email: plan.coach.email }
      : null,
    title: plan.title,
    summary: plan.summary,
    status: plan.status,
    weekStartsAt: plan.weekStartsAt,
    weekEndsAt: plan.weekEndsAt,
    createdAt: plan.createdAt
  };
}

function mapCoachingNote(note: {
  id: string;
  branch?: { id: string; name: string } | null;
  student: { id: string; email: string; profile?: { firstName: string; lastName: string } | null };
  coach?: { id: string; firstName: string; lastName: string; email: string } | null;
  title: string;
  body: string;
  followUpAt: Date | null;
  isPrivate: boolean;
  createdAt: Date;
}) {
  return {
    id: note.id,
    branch: note.branch,
    student: {
      id: note.student.id,
      name: displayStudentName(note.student),
      email: note.student.email
    },
    coach: note.coach
       ? { id: note.coach.id, name: displayStaffName(note.coach), email: note.coach.email }
      : null,
    title: note.title,
    body: note.body,
    followUpAt: note.followUpAt,
    isPrivate: note.isPrivate,
    createdAt: note.createdAt
  };
}

function displayStudentName(user: {
  email: string;
  profile?: { firstName: string; lastName: string } | null;
}) {
  const fullName = `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim();
  return fullName || user.email;
}

function displayStaffName(staffUser: { firstName: string; lastName: string; email: string }) {
  const fullName = `${staffUser.firstName} ${staffUser.lastName}`.trim();
  return fullName || staffUser.email;
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
