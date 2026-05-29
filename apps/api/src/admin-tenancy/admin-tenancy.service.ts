import {
  AuditActorType,
  BranchMembershipStatus,
  BranchStatus,
  ClassGroupStatus,
  ContentStatus,
  Prisma,
  StaffBranchRole
} from "@ega/db";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { assertBranchAccess, assertOrganizationAccess } from "../auth/scope.guard";
import { PrismaService } from "../database/prisma.service";
import {
  AddStudentToBranchDto,
  AssignStaffToBranchDto,
  CreateBranchDto,
  CreateClassGroupDto,
  CreateEducationCenterDto,
  CreateOrganizationDto,
  ListStaffQueryDto,
  ListStudentsQueryDto,
  UpdateBranchDto,
  UpdateBranchStaffAssignmentDto,
  UpdateClassGroupDto,
  UpdateEducationCenterDto,
  UpdateOrganizationDto,
  UpdateStudentMembershipDto
} from "./dto/admin-tenancy.dto";

const branchStaffAssignmentInclude = {
  branch: { select: { id: true, name: true, slug: true } },
  staffUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true
    }
  }
} satisfies Prisma.BranchStaffAssignmentInclude;

const studentMembershipInclude = {
  branch: { select: { id: true, name: true, slug: true } },
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      status: true,
      profile: { select: { firstName: true, lastName: true } }
    }
  }
} satisfies Prisma.StudentBranchMembershipInclude;

type BranchStaffAssignmentWithRelations = Prisma.BranchStaffAssignmentGetPayload<{
  include: typeof branchStaffAssignmentInclude;
}>;

type StudentMembershipWithRelations = Prisma.StudentBranchMembershipGetPayload<{
  include: typeof studentMembershipInclude;
}>;

@Injectable()
export class AdminTenancyService {
  constructor(private readonly prisma: PrismaService) {}

  async getScopeOverview(auth: AuthenticatedRequestContext) {
    const organizationWhere = auth.isSuperAdmin
       ? {}
      : auth.organizationId
         ? { id: auth.organizationId }
        : { id: "__none__" };
    const branchWhere = auth.isSuperAdmin
       ? {}
      : auth.branchIds.length
         ? { id: { in: auth.branchIds } }
        : { id: "__none__" };

    const [organizationCount, branchCount, centerCount, classGroupCount] = await Promise.all([
      this.prisma.organization.count({ where: organizationWhere }),
      this.prisma.branch.count({ where: branchWhere }),
      this.prisma.educationCenter.count({
        where: auth.isSuperAdmin
           ? {}
          : auth.organizationId
             ? { organizationId: auth.organizationId }
            : { organizationId: "__none__" }
      }),
      this.prisma.classGroup.count({
        where: auth.isSuperAdmin
           ? {}
          : auth.branchIds.length
             ? { branchId: { in: auth.branchIds } }
            : { branchId: "__none__" }
      })
    ]);

    return {
      actor: {
        actorId: auth.actorId,
        email: auth.email,
        roleKeys: auth.roleKeys,
        organizationId: auth.organizationId,
        primaryBranchId: auth.primaryBranchId,
        branchIds: auth.branchIds,
        isSuperAdmin: auth.isSuperAdmin
      },
      counts: {
        organizations: organizationCount,
        educationCenters: centerCount,
        branches: branchCount,
        classGroups: classGroupCount
      }
    };
  }

  async getOverview(auth: AuthenticatedRequestContext) {
    const organizationWhere = this.organizationScopeWhere(auth);
    const branchWhere = this.branchScopeWhere(auth);
    const educationCenterWhere: Prisma.EducationCenterWhereInput = auth.isSuperAdmin
       ? {}
      : auth.organizationId
         ? { organizationId: auth.organizationId }
        : { organizationId: "__none__" };
    const classGroupWhere: Prisma.ClassGroupWhereInput = auth.isSuperAdmin
       ? {}
      : auth.branchIds.length
         ? { branchId: { in: auth.branchIds } }
        : { branchId: "__none__" };
    const assignmentWhere: Prisma.BranchStaffAssignmentWhereInput = auth.isSuperAdmin
       ? {}
      : auth.branchIds.length
         ? { branchId: { in: auth.branchIds } }
        : { branchId: "__none__" };
    const membershipWhere: Prisma.StudentBranchMembershipWhereInput = auth.isSuperAdmin
       ? {}
      : auth.branchIds.length
         ? { branchId: { in: auth.branchIds } }
        : { branchId: "__none__" };

    const [
      organizationCount,
      educationCenterCount,
      branchCount,
      classGroupCount,
      staffAssignmentCount,
      studentMembershipCount,
      recentBranches,
      recentStaffAssignments,
      recentStudentMemberships,
      currentScope
    ] = await Promise.all([
      this.prisma.organization.count({ where: organizationWhere }),
      this.prisma.educationCenter.count({ where: educationCenterWhere }),
      this.prisma.branch.count({ where: branchWhere }),
      this.prisma.classGroup.count({ where: classGroupWhere }),
      this.prisma.branchStaffAssignment.count({ where: assignmentWhere }),
      this.prisma.studentBranchMembership.count({ where: membershipWhere }),
      this.prisma.branch.findMany({
        where: branchWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          organization: { select: { id: true, name: true } },
          educationCenter: { select: { id: true, name: true } }
        }
      }),
      this.prisma.branchStaffAssignment.findMany({
        where: assignmentWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: branchStaffAssignmentInclude
      }),
      this.prisma.studentBranchMembership.findMany({
        where: membershipWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: studentMembershipInclude
      }),
      this.getScopeOverview(auth)
    ]);

    return {
      organizationCount,
      educationCenterCount,
      branchCount,
      classGroupCount,
      staffAssignmentCount,
      studentMembershipCount,
      recentBranches,
      recentStaffAssignments: recentStaffAssignments.map(formatBranchStaffAssignment),
      recentStudentMemberships: recentStudentMemberships.map(formatStudentMembership),
      currentScope
    };
  }

  async getBetaReadiness(auth: AuthenticatedRequestContext) {
    const branchWhere = this.branchScopeWhere(auth);
    const organizationWhere = this.organizationScopeWhere(auth);
    const educationCenterWhere: Prisma.EducationCenterWhereInput = auth.isSuperAdmin
       ? {}
      : auth.organizationId
         ? { organizationId: auth.organizationId }
        : { organizationId: "__none__" };
    const branchScoped: Prisma.BranchStaffAssignmentWhereInput = auth.isSuperAdmin
       ? {}
      : auth.branchIds.length
         ? { branchId: { in: auth.branchIds } }
        : { branchId: "__none__" };
    const studentMembershipWhere: Prisma.StudentBranchMembershipWhereInput = auth.isSuperAdmin
       ? { status: BranchMembershipStatus.ACTIVE }
      : {
          status: BranchMembershipStatus.ACTIVE,
          branchId: auth.branchIds.length ? { in: auth.branchIds } : "__none__"
        };
    const classGroupWhere: Prisma.ClassGroupWhereInput = auth.isSuperAdmin
       ? {}
      : auth.branchIds.length
         ? { branchId: { in: auth.branchIds } }
        : { branchId: "__none__" };
    const liveSessionWhere: Prisma.LiveSessionWhereInput = auth.isSuperAdmin
       ? {}
      : auth.branchIds.length
         ? { branchId: { in: auth.branchIds } }
        : { branchId: "__none__" };
    const announcementWhere: Prisma.AnnouncementWhereInput = auth.isSuperAdmin
       ? { status: "PUBLISHED" }
      : {
          status: "PUBLISHED",
          branchId: auth.branchIds.length ? { in: auth.branchIds } : "__none__"
        };
    const branchVisibleProductWhere: Prisma.ProductWhereInput = auth.isSuperAdmin
       ? { publishStatus: ContentStatus.PUBLISHED, branchId: { not: null } }
      : {
          publishStatus: ContentStatus.PUBLISHED,
          branchId: auth.branchIds.length ? { in: auth.branchIds } : "__none__"
        };

    const [
      organizationCount,
      educationCenterCount,
      branchCount,
      branchAdminCount,
      instructorCount,
      coachCount,
      accountantCount,
      studentCount,
      classGroupCount,
      liveSessionCount,
      announcementCount,
      publicPackageCount,
      branchVisiblePackageCount,
      demoStaffCount,
      demoStudentCount,
      demoOrganizationCount,
      demoBranchCount,
      demoProductCount,
      publicDemoProductCount,
      publicDemoCategoryCount,
      demoAnnouncementCount,
      demoLiveSessionCount
    ] = await Promise.all([
      this.prisma.organization.count({ where: organizationWhere }),
      this.prisma.educationCenter.count({ where: educationCenterWhere }),
      this.prisma.branch.count({ where: branchWhere }),
      this.prisma.branchStaffAssignment.count({
        where: { ...branchScoped, roleKey: StaffBranchRole.BRANCH_ADMIN, revokedAt: null }
      }),
      this.prisma.branchStaffAssignment.count({
        where: { ...branchScoped, roleKey: StaffBranchRole.INSTRUCTOR, revokedAt: null }
      }),
      this.prisma.branchStaffAssignment.count({
        where: { ...branchScoped, roleKey: StaffBranchRole.COACH, revokedAt: null }
      }),
      this.prisma.branchStaffAssignment.count({
        where: { ...branchScoped, roleKey: StaffBranchRole.ACCOUNTANT, revokedAt: null }
      }),
      this.prisma.studentBranchMembership.count({ where: studentMembershipWhere }),
      this.prisma.classGroup.count({ where: classGroupWhere }),
      this.prisma.liveSession.count({ where: liveSessionWhere }),
      this.prisma.announcement.count({ where: announcementWhere }),
      this.prisma.product.count({
        where: {
          publishStatus: ContentStatus.PUBLISHED,
          organizationId: null,
          branchId: null,
          NOT: { slug: { startsWith: "beta-" } }
        }
      }),
      this.prisma.product.count({ where: branchVisibleProductWhere }),
      this.prisma.staffUser.count({
        where: { email: { endsWith: ".local" } }
      }),
      this.prisma.user.count({
        where: { email: { endsWith: ".local" } }
      }),
      this.prisma.organization.count({
        where: {
          OR: [
            { slug: { startsWith: "egitim-gurmesi-demo" } },
            { name: { contains: "Demo", mode: "insensitive" } }
          ]
        }
      }),
      this.prisma.branch.count({
        where: {
          OR: [
            { slug: { startsWith: "online-sube" }, organization: { slug: { startsWith: "egitim-gurmesi-demo" } } },
            { name: { contains: "Demo", mode: "insensitive" } }
          ]
        }
      }),
      this.prisma.product.count({
        where: { slug: { startsWith: "beta-" } }
      }),
      this.prisma.product.count({
        where: {
          slug: { startsWith: "beta-" },
          publishStatus: ContentStatus.PUBLISHED,
          organizationId: null,
          branchId: null
        }
      }),
      this.prisma.productCategory.count({
        where: {
          slug: { startsWith: "beta-" },
          isActive: true,
          organizationId: null,
          branchId: null
        }
      }),
      this.prisma.announcement.count({
        where: { title: { startsWith: "Beta" } }
      }),
      this.prisma.liveSession.count({
        where: { title: { contains: "Demo", mode: "insensitive" } }
      })
    ]);

    const items = [
      readinessItem("organization", "Organizasyon", organizationCount),
      readinessItem("educationCenter", "Eğitim merkezi", educationCenterCount),
      readinessItem("branch", "Şube", branchCount),
      readinessItem("branchAdmin", "Branch Admin", branchAdminCount),
      readinessItem("instructor", "Eğitmen", instructorCount),
      readinessItem("coach", "Koç", coachCount),
      readinessItem("accountant", "Muhasebe", accountantCount),
      readinessItem("student", "Öğrenci", studentCount),
      readinessItem("classGroup", "Sınıf / grup", classGroupCount),
      readinessItem("liveSession", "Canlı ders", liveSessionCount),
      readinessItem("announcement", "Duyuru", announcementCount),
      readinessItem("publicPackage", "Public paket", publicPackageCount),
      readinessItem("branchVisiblePackage", "Şube görünür paket", branchVisiblePackageCount)
    ];
    const readyCount = items.filter((item) => item.ready).length;

    return {
      generatedAt: new Date().toISOString(),
      readinessPercentage: Math.round((readyCount / items.length) * 100),
      readyCount,
      totalCount: items.length,
      missingItems: items.filter((item) => !item.ready),
      items,
      counts: {
        organizationCount,
        educationCenterCount,
        branchCount,
        branchAdminCount,
        instructorCount,
        coachCount,
        accountantCount,
        studentCount,
        classGroupCount,
        liveSessionCount,
        announcementCount,
        publicPackageCount,
        branchVisiblePackageCount
      },
      demoData: {
        staffCount: demoStaffCount,
        studentCount: demoStudentCount,
        organizationCount: demoOrganizationCount,
        branchCount: demoBranchCount,
        productCount: demoProductCount,
        publicProductCount: publicDemoProductCount,
        publicCategoryCount: publicDemoCategoryCount,
        announcementCount: demoAnnouncementCount,
        liveSessionCount: demoLiveSessionCount,
        publicExposureRisk: publicDemoProductCount > 0 || publicDemoCategoryCount > 0,
        productionSeedBlockedByDefault: true
      },
      scope: {
        isSuperAdmin: auth.isSuperAdmin,
        organizationId: auth.organizationId,
        branchIds: auth.branchIds,
        roleKeys: auth.roleKeys
      }
    };
  }

  async listStudents(query: ListStudentsQueryDto, auth: AuthenticatedRequestContext) {
    const limit = normalizeLimit(query.limit);
    const page = normalizePage(query.page);
    const branchId = query.branchId?.trim();
    const keyword = query.q?.trim();
    const and: Prisma.UserWhereInput[] = [];

    if (branchId) {
      assertBranchAccess(auth, branchId);
      and.push({ branchMemberships: { some: { branchId } } });
    } else if (!auth.isSuperAdmin) {
      const branchIds = auth.branchIds.length ? auth.branchIds : ["__none__"];
      and.push({
        OR: [
          { primaryBranchId: { in: branchIds } },
          { branchMemberships: { some: { branchId: { in: branchIds } } } }
        ]
      });
    }

    if (keyword) {
      and.push({
        OR: [
          { email: { contains: keyword } },
          { phone: { contains: keyword } },
          { profile: { is: { firstName: { contains: keyword } } } },
          { profile: { is: { lastName: { contains: keyword } } } }
        ]
      });
    }

    const where: Prisma.UserWhereInput = and.length ? { AND: and } : {};
    const membershipWhere = branchId
       ? { branchId }
      : auth.isSuperAdmin
         ? {}
        : { branchId: { in: auth.branchIds.length ? auth.branchIds : ["__none__"] } };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          profile: true,
          studentProfile: true,
          branchMemberships: {
            where: membershipWhere,
            orderBy: { createdAt: "desc" },
            include: {
              branch: { select: { id: true, name: true, slug: true } }
            }
          }
        }
      })
    ]);

    return {
      total,
      page,
      limit,
      items: users.map((user) => ({
        id: user.id,
        name: displayStudentName(user),
        email: user.email,
        phone: user.phone,
        status: user.status,
        organizationId: user.organizationId,
        primaryBranchId: user.primaryBranchId,
        currentBranches: user.branchMemberships.map((membership) => ({
          membershipId: membership.id,
          branchId: membership.branchId,
          branchName: membership.branch.name,
          status: membership.status,
          isPrimary: membership.isPrimary
        })),
        createdAt: user.createdAt
      }))
    };
  }

  async listStaff(query: ListStaffQueryDto, auth: AuthenticatedRequestContext) {
    const limit = normalizeLimit(query.limit);
    const page = normalizePage(query.page);
    const branchId = query.branchId?.trim();
    const keyword = query.q?.trim();
    const and: Prisma.StaffUserWhereInput[] = [];

    if (branchId) {
      assertBranchAccess(auth, branchId);
      and.push({ branchAssignments: { some: { branchId } } });
    } else if (!auth.isSuperAdmin) {
      const branchIds = auth.branchIds.length ? auth.branchIds : ["__none__"];
      and.push({
        OR: [
          { primaryBranchId: { in: branchIds } },
          { branchAssignments: { some: { branchId: { in: branchIds }, revokedAt: null } } }
        ]
      });
    }

    if (query.role) {
      and.push({
        branchAssignments: {
          some: {
            roleKey: query.role,
            ...(branchId ? { branchId } : {})
          }
        }
      });
    }

    if (keyword) {
      and.push({
        OR: [
          { email: { contains: keyword } },
          { firstName: { contains: keyword } },
          { lastName: { contains: keyword } }
        ]
      });
    }

    const where: Prisma.StaffUserWhereInput = and.length ? { AND: and } : {};
    const branchAssignmentWhere = branchId
       ? { branchId }
      : auth.isSuperAdmin
         ? {}
        : { branchId: { in: auth.branchIds.length ? auth.branchIds : ["__none__"] } };

    const [total, staffUsers] = await Promise.all([
      this.prisma.staffUser.count({ where }),
      this.prisma.staffUser.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          roles: {
            include: {
              role: {
                select: { id: true, key: true, name: true }
              }
            }
          },
          branchAssignments: {
            where: branchAssignmentWhere,
            orderBy: { createdAt: "desc" },
            include: {
              branch: { select: { id: true, name: true, slug: true } }
            }
          }
        }
      })
    ]);

    return {
      total,
      page,
      limit,
      items: staffUsers.map((staffUser) => ({
        id: staffUser.id,
        name: displayStaffName(staffUser),
        firstName: staffUser.firstName,
        lastName: staffUser.lastName,
        email: staffUser.email,
        status: staffUser.status,
        organizationId: staffUser.organizationId,
        primaryBranchId: staffUser.primaryBranchId,
        roles: staffUser.roles.map((roleAssignment) => ({
          id: roleAssignment.role.id,
          key: roleAssignment.role.key,
          name: roleAssignment.role.name
        })),
        assignedBranches: staffUser.branchAssignments.map((assignment) => ({
          assignmentId: assignment.id,
          branchId: assignment.branchId,
          branchName: assignment.branch.name,
          roleKey: assignment.roleKey,
          status: assignment.revokedAt ? "REVOKED" : "ACTIVE",
          isPrimary: assignment.isPrimary
        })),
        createdAt: staffUser.createdAt
      }))
    };
  }

  listOrganizations(auth: AuthenticatedRequestContext) {
    const where = auth.isSuperAdmin
       ? {}
      : auth.organizationId
         ? { id: auth.organizationId }
        : { id: "__none__" };

    return this.prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            educationCenters: true,
            branches: true,
            users: true,
            staffUsers: true
          }
        }
      }
    });
  }

  async createOrganization(dto: CreateOrganizationDto, auth: AuthenticatedRequestContext) {
    this.requireSuperAdmin(auth);

    const organization = await this.prisma.organization.create({
      data: {
        slug: dto.slug?.trim() || slugify(dto.name),
        name: dto.name.trim(),
        legalName: emptyToNull(dto.legalName),
        taxNumber: emptyToNull(dto.taxNumber),
        supportEmail: emptyToNull(dto.supportEmail?.toLowerCase()),
        supportPhone: emptyToNull(dto.supportPhone)
      }
    });

    await this.audit(auth, "organization.create", "Organization", organization.id, {
      organizationId: organization.id,
      summary: `${organization.name} kurumu olusturuldu.`
    });

    return organization;
  }

  async updateOrganization(
    organizationId: string,
    dto: UpdateOrganizationDto,
    auth: AuthenticatedRequestContext
  ) {
    this.requireSuperAdmin(auth);
    await this.ensureOrganization(organizationId);

    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: dto.name?.trim(),
        legalName: nullableText(dto.legalName),
        status: dto.status,
        taxNumber: nullableText(dto.taxNumber),
        supportEmail: nullableText(dto.supportEmail?.toLowerCase()),
        supportPhone: nullableText(dto.supportPhone)
      }
    });

    await this.audit(auth, "organization.update", "Organization", organization.id, {
      organizationId: organization.id,
      summary: `${organization.name} kurumu guncellendi.`
    });

    return organization;
  }

  async listEducationCenters(organizationId: string, auth: AuthenticatedRequestContext) {
    assertOrganizationAccess(auth, organizationId);
    await this.ensureOrganization(organizationId);

    return this.prisma.educationCenter.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { branches: true }
        }
      }
    });
  }

  async createEducationCenter(
    organizationId: string,
    dto: CreateEducationCenterDto,
    auth: AuthenticatedRequestContext
  ) {
    assertOrganizationAccess(auth, organizationId);
    await this.ensureOrganization(organizationId);

    const center = await this.prisma.educationCenter.create({
      data: {
        organizationId,
        slug: dto.slug?.trim() || slugify(dto.name),
        name: dto.name.trim(),
        legalName: emptyToNull(dto.legalName),
        centerType: emptyToNull(dto.centerType),
        city: emptyToNull(dto.city),
        district: emptyToNull(dto.district),
        address: emptyToNull(dto.address),
        phone: emptyToNull(dto.phone),
        email: emptyToNull(dto.email?.toLowerCase())
      }
    });

    await this.audit(auth, "education-center.create", "EducationCenter", center.id, {
      organizationId,
      summary: `${center.name} egitim merkezi olusturuldu.`
    });

    return center;
  }

  async updateEducationCenter(
    centerId: string,
    dto: UpdateEducationCenterDto,
    auth: AuthenticatedRequestContext
  ) {
    const existing = await this.prisma.educationCenter.findUnique({ where: { id: centerId } });

    if (!existing) {
      throw new NotFoundException("Egitim merkezi bulunamadi.");
    }

    assertOrganizationAccess(auth, existing.organizationId);

    const center = await this.prisma.educationCenter.update({
      where: { id: centerId },
      data: {
        name: dto.name?.trim(),
        legalName: nullableText(dto.legalName),
        centerType: nullableText(dto.centerType),
        city: nullableText(dto.city),
        district: nullableText(dto.district),
        address: nullableText(dto.address),
        phone: nullableText(dto.phone),
        email: nullableText(dto.email?.toLowerCase()),
        status: dto.status
      }
    });

    await this.audit(auth, "education-center.update", "EducationCenter", center.id, {
      organizationId: center.organizationId,
      summary: `${center.name} egitim merkezi guncellendi.`
    });

    return center;
  }

  async listBranches(auth: AuthenticatedRequestContext, organizationId?: string) {
    const where: Prisma.BranchWhereInput = {};

    if (organizationId) {
      assertOrganizationAccess(auth, organizationId);
      where.organizationId = organizationId;
    }

    if (!auth.isSuperAdmin) {
      where.id = auth.branchIds.length ? { in: auth.branchIds } : "__none__";
    }

    return this.prisma.branch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: { id: true, name: true, slug: true }
        },
        educationCenter: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: {
            staffAssignments: true,
            studentMemberships: true,
            classGroups: true
          }
        }
      }
    });
  }

  async createBranch(
    organizationId: string,
    dto: CreateBranchDto,
    auth: AuthenticatedRequestContext
  ) {
    assertOrganizationAccess(auth, organizationId);
    await this.ensureOrganization(organizationId);

    if (dto.educationCenterId) {
      await this.ensureCenterBelongsToOrganization(dto.educationCenterId, organizationId);
    }

    const branch = await this.prisma.branch.create({
      data: {
        organizationId,
        educationCenterId: emptyToNull(dto.educationCenterId),
        slug: dto.slug?.trim() || slugify(dto.name),
        name: dto.name.trim(),
        code: emptyToNull(dto.code),
        city: emptyToNull(dto.city),
        district: emptyToNull(dto.district),
        address: emptyToNull(dto.address),
        phone: emptyToNull(dto.phone),
        email: emptyToNull(dto.email?.toLowerCase())
      }
    });

    await this.audit(auth, "branch.create", "Branch", branch.id, {
      organizationId,
      branchId: branch.id,
      summary: `${branch.name} subesi olusturuldu.`
    });

    return branch;
  }

  async updateBranch(branchId: string, dto: UpdateBranchDto, auth: AuthenticatedRequestContext) {
    const existing = await this.ensureBranch(branchId);
    assertBranchAccess(auth, branchId);

    if (dto.educationCenterId) {
      await this.ensureCenterBelongsToOrganization(dto.educationCenterId, existing.organizationId);
    }

    const branch = await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        educationCenterId: dto.educationCenterId === undefined ? undefined : dto.educationCenterId,
        name: dto.name?.trim(),
        code: nullableText(dto.code),
        city: nullableText(dto.city),
        district: nullableText(dto.district),
        address: nullableText(dto.address),
        phone: nullableText(dto.phone),
        email: nullableText(dto.email?.toLowerCase()),
        status: dto.status
      }
    });

    await this.audit(auth, "branch.update", "Branch", branch.id, {
      organizationId: branch.organizationId,
      branchId: branch.id,
      summary: `${branch.name} subesi guncellendi.`
    });

    return branch;
  }

  async assignStaffToBranch(
    branchId: string,
    dto: AssignStaffToBranchDto,
    auth: AuthenticatedRequestContext
  ) {
    const branch = await this.ensureBranch(branchId);
    assertBranchAccess(auth, branchId);

    const staff = await this.prisma.staffUser.findUnique({ where: { id: dto.staffUserId } });

    if (!staff) {
      throw new NotFoundException("Personel bulunamadi.");
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.branchStaffAssignment.updateMany({
          where: { staffUserId: dto.staffUserId },
          data: { isPrimary: false }
        });
      }

      const result = await tx.branchStaffAssignment.upsert({
        where: {
          staffUserId_branchId_roleKey: {
            staffUserId: dto.staffUserId,
            branchId,
            roleKey: dto.roleKey
          }
        },
        create: {
          organizationId: branch.organizationId,
          branchId,
          staffUserId: dto.staffUserId,
          roleKey: dto.roleKey,
          isPrimary: Boolean(dto.isPrimary),
          assignedByStaffUserId: auth.actorId
        },
        update: {
          organizationId: branch.organizationId,
          revokedAt: null,
          isPrimary: Boolean(dto.isPrimary),
          assignedByStaffUserId: auth.actorId,
          assignedAt: new Date()
        }
      });

      await tx.staffUser.update({
        where: { id: dto.staffUserId },
        data: {
          organizationId: staff.organizationId ?? branch.organizationId,
          primaryBranchId: dto.isPrimary ? branchId : staff.primaryBranchId
        }
      });

      return result;
    });

    await this.audit(auth, "branch.staff.assign", "BranchStaffAssignment", assignment.id, {
      organizationId: branch.organizationId,
      branchId,
      summary: `${dto.roleKey} personel atamasi yapildi.`
    });

    return assignment;
  }

  async listBranchStaffAssignments(branchId: string, auth: AuthenticatedRequestContext) {
    assertBranchAccess(auth, branchId);
    await this.ensureBranch(branchId);

    const assignments = await this.prisma.branchStaffAssignment.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
      include: branchStaffAssignmentInclude
    });

    return assignments.map(formatBranchStaffAssignment);
  }

  async updateBranchStaffAssignment(
    assignmentId: string,
    dto: UpdateBranchStaffAssignmentDto,
    auth: AuthenticatedRequestContext
  ) {
    const existing = await this.prisma.branchStaffAssignment.findUnique({
      where: { id: assignmentId },
      include: branchStaffAssignmentInclude
    });

    if (!existing) {
      throw new NotFoundException("Personel sube atamasi bulunamadi.");
    }

    assertBranchAccess(auth, existing.branchId);

    const assignment = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.branchStaffAssignment.updateMany({
          where: {
            staffUserId: existing.staffUserId,
            id: { not: existing.id }
          },
          data: { isPrimary: false }
        });
      }

      const updated = await tx.branchStaffAssignment.update({
        where: { id: assignmentId },
        data: {
          roleKey: dto.roleKey,
          isPrimary: dto.isPrimary,
          revokedAt:
            dto.status === "REVOKED"
              ? existing.revokedAt ?? new Date()
              : dto.status === "ACTIVE"
                ? null
                : undefined
        },
        include: branchStaffAssignmentInclude
      });

      if (dto.isPrimary) {
        await tx.staffUser.update({
          where: { id: existing.staffUserId },
          data: {
            organizationId: existing.organizationId,
            primaryBranchId: existing.branchId
          }
        });
      }

      return updated;
    });

    await this.audit(auth, "branch.staff.assignment.update", "BranchStaffAssignment", assignment.id, {
      organizationId: assignment.organizationId,
      branchId: assignment.branchId,
      summary: "Personel sube atamasi guncellendi."
    });

    return formatBranchStaffAssignment(assignment);
  }

  async addStudentToBranch(
    branchId: string,
    dto: AddStudentToBranchDto,
    auth: AuthenticatedRequestContext
  ) {
    const branch = await this.ensureBranch(branchId);
    assertBranchAccess(auth, branchId);

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });

    if (!user) {
      throw new NotFoundException("Ogrenci bulunamadi.");
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.studentBranchMembership.updateMany({
          where: { userId: dto.userId },
          data: { isPrimary: false }
        });
      }

      const result = await tx.studentBranchMembership.upsert({
        where: {
          userId_branchId: {
            userId: dto.userId,
            branchId
          }
        },
        create: {
          organizationId: branch.organizationId,
          branchId,
          userId: dto.userId,
          status: dto.status ?? BranchMembershipStatus.ACTIVE,
          isPrimary: Boolean(dto.isPrimary)
        },
        update: {
          organizationId: branch.organizationId,
          status: dto.status ?? BranchMembershipStatus.ACTIVE,
          isPrimary: Boolean(dto.isPrimary),
          leftAt: dto.status === BranchMembershipStatus.LEFT ? new Date() : null
        }
      });

      await tx.user.update({
        where: { id: dto.userId },
        data: {
          organizationId: user.organizationId ?? branch.organizationId,
          primaryBranchId: dto.isPrimary ? branchId : user.primaryBranchId
        }
      });

      return result;
    });

    await this.audit(auth, "branch.student.assign", "StudentBranchMembership", membership.id, {
      organizationId: branch.organizationId,
      branchId,
      summary: "Ogrenci subeye atandi."
    });

    return membership;
  }

  async listBranchStudentMemberships(branchId: string, auth: AuthenticatedRequestContext) {
    assertBranchAccess(auth, branchId);
    await this.ensureBranch(branchId);

    const memberships = await this.prisma.studentBranchMembership.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
      include: studentMembershipInclude
    });

    return memberships.map(formatStudentMembership);
  }

  async updateStudentMembership(
    membershipId: string,
    dto: UpdateStudentMembershipDto,
    auth: AuthenticatedRequestContext
  ) {
    const existing = await this.prisma.studentBranchMembership.findUnique({
      where: { id: membershipId },
      include: studentMembershipInclude
    });

    if (!existing) {
      throw new NotFoundException("Ogrenci sube uyeligi bulunamadi.");
    }

    assertBranchAccess(auth, existing.branchId);

    const membership = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.studentBranchMembership.updateMany({
          where: {
            userId: existing.userId,
            id: { not: existing.id }
          },
          data: { isPrimary: false }
        });
      }

      const updated = await tx.studentBranchMembership.update({
        where: { id: membershipId },
        data: {
          status: dto.status,
          isPrimary: dto.isPrimary,
          leftAt:
            dto.status === BranchMembershipStatus.LEFT
              ? existing.leftAt ?? new Date()
              : dto.status
                ? null
                : undefined
        },
        include: studentMembershipInclude
      });

      if (dto.isPrimary) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            organizationId: existing.organizationId,
            primaryBranchId: existing.branchId
          }
        });
      }

      return updated;
    });

    await this.audit(auth, "branch.student.membership.update", "StudentBranchMembership", membership.id, {
      organizationId: membership.organizationId,
      branchId: membership.branchId,
      summary: "Ogrenci sube uyeligi guncellendi."
    });

    return formatStudentMembership(membership);
  }

  async listClassGroups(branchId: string, auth: AuthenticatedRequestContext) {
    assertBranchAccess(auth, branchId);

    return this.prisma.classGroup.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            instructorAssignments: true,
            coachAssignments: true
          }
        }
      }
    });
  }

  async createClassGroup(
    branchId: string,
    dto: CreateClassGroupDto,
    auth: AuthenticatedRequestContext
  ) {
    const branch = await this.ensureBranch(branchId);
    assertBranchAccess(auth, branchId);

    const classGroup = await this.prisma.classGroup.create({
      data: {
        organizationId: branch.organizationId,
        branchId,
        slug: dto.slug?.trim() || slugify(dto.name),
        name: dto.name.trim(),
        description: emptyToNull(dto.description),
        gradeLevel: dto.gradeLevel,
        studyTrack: dto.studyTrack,
        createdByStaffUserId: auth.actorId
      }
    });

    await this.audit(auth, "class-group.create", "ClassGroup", classGroup.id, {
      organizationId: branch.organizationId,
      branchId,
      summary: `${classGroup.name} grubu olusturuldu.`
    });

    return classGroup;
  }

  async updateClassGroup(
    classGroupId: string,
    dto: UpdateClassGroupDto,
    auth: AuthenticatedRequestContext
  ) {
    const existing = await this.prisma.classGroup.findUnique({ where: { id: classGroupId } });

    if (!existing) {
      throw new NotFoundException("Sinif/grup bulunamadi.");
    }

    assertBranchAccess(auth, existing.branchId);

    const classGroup = await this.prisma.classGroup.update({
      where: { id: classGroupId },
      data: {
        name: dto.name?.trim(),
        description: nullableText(dto.description),
        gradeLevel: dto.gradeLevel,
        studyTrack: dto.studyTrack,
        status: dto.status
      }
    });

    await this.audit(auth, "class-group.update", "ClassGroup", classGroup.id, {
      organizationId: classGroup.organizationId,
      branchId: classGroup.branchId,
      summary: `${classGroup.name} grubu guncellendi.`
    });

    return classGroup;
  }

  private organizationScopeWhere(auth: AuthenticatedRequestContext): Prisma.OrganizationWhereInput {
    if (auth.isSuperAdmin) {
      return {};
    }

    return auth.organizationId ? { id: auth.organizationId } : { id: "__none__" };
  }

  private branchScopeWhere(auth: AuthenticatedRequestContext): Prisma.BranchWhereInput {
    if (auth.isSuperAdmin) {
      return {};
    }

    return auth.branchIds.length ? { id: { in: auth.branchIds } } : { id: "__none__" };
  }

  private requireSuperAdmin(auth: AuthenticatedRequestContext) {
    if (!auth.isSuperAdmin) {
      throw new ForbiddenException("Bu islem yalnizca Super Admin tarafindan yapilabilir.");
    }
  }

  private async ensureOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new NotFoundException("Kurum bulunamadi.");
    }

    return organization;
  }

  private async ensureBranch(branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });

    if (!branch) {
      throw new NotFoundException("Sube bulunamadi.");
    }

    return branch;
  }

  private async ensureCenterBelongsToOrganization(centerId: string, organizationId: string) {
    const center = await this.prisma.educationCenter.findFirst({
      where: {
        id: centerId,
        organizationId
      }
    });

    if (!center) {
      throw new NotFoundException("Egitim merkezi bu kuruma bagli degil.");
    }

    return center;
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

function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullableText(value: string | null | undefined) {
  return value === undefined ? undefined : emptyToNull(value);
}

function normalizeLimit(value?: number) {
  return Math.min(Math.max(value ?? 25, 1), 100);
}

function normalizePage(value?: number) {
  return Math.max(value ?? 1, 1);
}

function readinessItem(key: string, label: string, count: number) {
  return {
    key,
    label,
    count,
    ready: count > 0
  };
}

function displayStaffName(staffUser: { firstName: string; lastName: string; email: string }) {
  const fullName = `${staffUser.firstName} ${staffUser.lastName}`.trim();
  return fullName || staffUser.email;
}

function displayStudentName(user: {
  email: string;
  profile?: { firstName: string; lastName: string } | null;
}) {
  const fullName = `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim();
  return fullName || user.email;
}

function formatBranchStaffAssignment(assignment: BranchStaffAssignmentWithRelations) {
  return {
    id: assignment.id,
    organizationId: assignment.organizationId,
    branchId: assignment.branchId,
    branch: assignment.branch,
    staffUserId: assignment.staffUserId,
    staffUser: {
      id: assignment.staffUser.id,
      displayName: displayStaffName(assignment.staffUser),
      firstName: assignment.staffUser.firstName,
      lastName: assignment.staffUser.lastName,
      email: assignment.staffUser.email,
      status: assignment.staffUser.status
    },
    roleKey: assignment.roleKey,
    status: assignment.revokedAt ? "REVOKED" : "ACTIVE",
    isPrimary: assignment.isPrimary,
    assignedAt: assignment.assignedAt,
    revokedAt: assignment.revokedAt,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt
  };
}

function formatStudentMembership(membership: StudentMembershipWithRelations) {
  return {
    id: membership.id,
    organizationId: membership.organizationId,
    branchId: membership.branchId,
    branch: membership.branch,
    userId: membership.userId,
    student: {
      id: membership.user.id,
      displayName: displayStudentName(membership.user),
      email: membership.user.email,
      phone: membership.user.phone,
      status: membership.user.status
    },
    status: membership.status,
    isPrimary: membership.isPrimary,
    joinedAt: membership.joinedAt,
    leftAt: membership.leftAt,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt
  };
}
