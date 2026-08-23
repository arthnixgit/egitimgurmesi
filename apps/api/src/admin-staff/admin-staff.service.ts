import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { AuditActorType, Prisma, ROLE_KEYS, StaffStatus } from "@ega/db";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { PasswordService } from "../auth/password.service";
import {
  STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE,
  assertBranchRoleAssignmentAllowed,
  assertRoleAssignmentAllowed,
  assertStaffCreationAllowed,
  assertStaffTargetWritable,
  buildBranchAssignmentWhereInput,
  buildStaffUserWhereInput,
  buildVisibleBranchWhereInput,
  buildVisibleOrganizationWhereInput,
  deriveBranchRolesFromRoleKeys,
  resolveStaffManagementScope,
  type StaffManagementScope,
  type StaffManagementTarget
} from "./staff-management-scope";
import {
  CreateRoleDto,
  CreateStaffUserDto,
  UpdateRoleDto,
  UpdateStaffPasswordDto,
  UpdateStaffUserDto
} from "./dto/admin-staff.dto";

const staffUserInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  },
  organization: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  primaryBranch: {
    select: {
      id: true,
      name: true,
      slug: true,
      organizationId: true
    }
  },
  branchAssignments: {
    where: {
      revokedAt: null
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          slug: true,
          organizationId: true
        }
      }
    }
  }
} satisfies Prisma.StaffUserInclude;

const roleInclude = {
  permissions: {
    include: {
      permission: true
    }
  },
  _count: {
    select: {
      staffAssignments: true
    }
  }
} satisfies Prisma.RoleInclude;

type TransactionClient = Prisma.TransactionClient;
type StaffUserWithRoles = Prisma.StaffUserGetPayload<{ include: typeof staffUserInclude }>;
type RoleWithPermissions = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;

function staffUserIncludeForScope(scope: StaffManagementScope) {
  return {
    ...staffUserInclude,
    branchAssignments: {
      ...staffUserInclude.branchAssignments,
      where: buildBranchAssignmentWhereInput(scope)
    }
  } satisfies Prisma.StaffUserInclude;
}

@Injectable()
export class AdminStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService
  ) {}

  async getOverview(auth: AuthenticatedRequestContext) {
    const scope = this.resolveReadableScope(auth);
    const includePermissionKeys = scope.kind === "super";
    const roleWhere: Prisma.RoleWhereInput =
      scope.kind === "super"
        ? {}
        : scope.hasValidScope
          ? { key: { in: scope.assignableRoleKeys ?? [] } }
          : { key: { in: [] } };

    const [users, roles, permissions, organizations, branches] = await Promise.all([
      this.prisma.staffUser.findMany({
        where: buildStaffUserWhereInput(scope),
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: staffUserIncludeForScope(scope)
      }),
      this.prisma.role.findMany({
        where: roleWhere,
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        include: roleInclude
      }),
      includePermissionKeys
        ? this.prisma.permission.findMany({
            orderBy: { key: "asc" }
          })
        : Promise.resolve([]),
      this.prisma.organization.findMany({
        where: buildVisibleOrganizationWhereInput(scope),
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true }
      }),
      this.prisma.branch.findMany({
        where: buildVisibleBranchWhereInput(scope),
        orderBy: [{ organizationId: "asc" }, { name: "asc" }],
        select: {
          id: true,
          organizationId: true,
          name: true,
          slug: true
        }
      })
    ]);

    return {
      scope: mapStaffScope(scope),
      organizations,
      branches,
      users: users.map((user) => mapStaffUser(user, { includePermissionKeys })),
      roles: roles.map((role) =>
        mapRole(role, {
          includePermissionKeys,
          includeStaffCount: scope.kind === "super"
        })
      ),
      permissions: permissions.map((permission) => ({
        id: permission.id,
        key: permission.key,
        name: permission.name,
        description: permission.description
      }))
    };
  }

  listUsers(auth: AuthenticatedRequestContext) {
    const scope = this.resolveReadableScope(auth);
    const includePermissionKeys = scope.kind === "super";

    return this.prisma.staffUser
      .findMany({
        where: buildStaffUserWhereInput(scope),
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: staffUserIncludeForScope(scope)
      })
      .then((users) => users.map((user) => mapStaffUser(user, { includePermissionKeys })));
  }

  async createUser(dto: CreateStaffUserDto, auth: AuthenticatedRequestContext) {
    const scope = resolveStaffManagementScope(auth);
    const email = normalizeEmail(dto.email);
    const roleKeys = normalizeUnique(dto.roleKeys);
    const requestedOrganizationId = emptyToNull(dto.organizationId);
    const requestedBranchId = emptyToNull(dto.branchId);

    assertStaffCreationAllowed(scope);
    assertRoleAssignmentAllowed(scope, roleKeys);
    await this.ensureRolesExist(roleKeys);

    const existing = await this.prisma.staffUser.findUnique({
      where: { email }
    });

    if (existing) {
      throw new ConflictException("Bu e-posta ile kayıtlı personel hesabı zaten var.");
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const branch = await this.resolveCreationBranch(scope, requestedBranchId);
    const organizationId = this.resolveCreationOrganizationId(scope, requestedOrganizationId, branch);
    const branchRoleKeys = branch
      ? deriveBranchRolesFromRoleKeys(roleKeys, dto.branchRoleKey)
      : [];

    for (const branchRoleKey of branchRoleKeys) {
      assertBranchRoleAssignmentAllowed(scope, branchRoleKey);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const staffUser = await tx.staffUser.create({
        data: {
          organizationId,
          primaryBranchId: branch?.id ?? null,
          email,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          passwordHash,
          status: dto.status ?? StaffStatus.ACTIVE,
          inviteAcceptedAt: new Date(),
          roles: {
            create: roleKeys.map((roleKey) => ({
              assignedBy: {
                connect: {
                  id: auth.actorId
                }
              },
              role: {
                connect: {
                  key: roleKey
                }
              }
            }))
          }
        }
      });

      if (branch) {
        for (const [index, branchRoleKey] of branchRoleKeys.entries()) {
          await tx.branchStaffAssignment.create({
            data: {
              organizationId: branch.organizationId,
              branchId: branch.id,
              staffUserId: staffUser.id,
              roleKey: branchRoleKey,
              isPrimary: index === 0,
              assignedByStaffUserId: auth.actorId
            }
          });
        }
      }

      await recordAuditLog(tx, auth, {
        action: "staff.user.create",
        entityType: "StaffUser",
        entityId: staffUser.id,
        summary: `${staffUser.email} personel hesabı oluşturuldu.`
      });

      return tx.staffUser.findUniqueOrThrow({
        where: { id: staffUser.id },
        include: staffUserIncludeForScope(scope)
      });
    });

    return mapStaffUser(created, { includePermissionKeys: scope.kind === "super" });
  }

  async updateUser(staffUserId: string, dto: UpdateStaffUserDto, auth: AuthenticatedRequestContext) {
    const scope = resolveStaffManagementScope(auth);
    const roleKeys = dto.roleKeys ? normalizeUnique(dto.roleKeys) : undefined;

    const existing = await this.prisma.staffUser.findUnique({
      where: { id: staffUserId },
      include: staffUserIncludeForScope(scope)
    });

    if (!existing) {
      throw new NotFoundException("Personel hesabı bulunamadı.");
    }

    assertStaffTargetWritable(scope, staffUserToTarget(existing));

    if (roleKeys) {
      assertRoleAssignmentAllowed(scope, roleKeys);
      await this.ensureRolesExist(roleKeys);
    }

    if (auth.actorId === staffUserId && dto.status && dto.status !== StaffStatus.ACTIVE) {
      throw new BadRequestException("Kendi hesabınızı pasife alamazsınız.");
    }

    if (
      auth.actorId === staffUserId &&
      roleKeys &&
      !sameStringSet(roleKeys, existing.roles.map((assignment) => assignment.role.key))
    ) {
      throw new BadRequestException("Kendi rol atamalarınızı bu ekrandan değiştiremezsiniz.");
    }

    if (dto.email !== undefined) {
      const nextEmail = normalizeEmail(dto.email);

      if (nextEmail !== existing.email) {
        const emailOwner = await this.prisma.staffUser.findUnique({
          where: { email: nextEmail },
          select: { id: true }
        });

        if (emailOwner && emailOwner.id !== staffUserId) {
          throw new ConflictException("Bu e-posta başka bir personel hesabında kullanılıyor.");
        }
      }
    }

    await this.ensureSuperAdminWillRemain(existing, dto.status, roleKeys);

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.StaffUserUpdateInput = {};

      if (dto.email !== undefined) {
        updateData.email = normalizeEmail(dto.email);
      }

      if (dto.firstName !== undefined) {
        updateData.firstName = dto.firstName.trim();
      }

      if (dto.lastName !== undefined) {
        updateData.lastName = dto.lastName.trim();
      }

      if (dto.status !== undefined) {
        updateData.status = dto.status;
      }

      await tx.staffUser.update({
        where: { id: staffUserId },
        data: updateData
      });

      if (roleKeys) {
        const roles = await tx.role.findMany({
          where: { key: { in: roleKeys } },
          select: { id: true, key: true }
        });

        await tx.staffUserRole.deleteMany({
          where: { staffUserId }
        });

        await tx.staffUserRole.createMany({
          data: roles.map((role) => ({
            staffUserId,
            roleId: role.id,
            assignedByStaffUserId: auth.actorId
          })),
          skipDuplicates: true
        });
      }

      await recordAuditLog(tx, auth, {
        action: "staff.user.update",
        entityType: "StaffUser",
        entityId: staffUserId,
        summary: `${existing.email} personel hesabı güncellendi.`
      });

      return tx.staffUser.findUniqueOrThrow({
        where: { id: staffUserId },
        include: staffUserIncludeForScope(scope)
      });
    });

    return mapStaffUser(updated, { includePermissionKeys: scope.kind === "super" });
  }

  async updateUserPassword(
    staffUserId: string,
    dto: UpdateStaffPasswordDto,
    auth: AuthenticatedRequestContext
  ) {
    const scope = resolveStaffManagementScope(auth);
    const existing = await this.prisma.staffUser.findUnique({
      where: { id: staffUserId },
      include: staffUserIncludeForScope(scope)
    });

    if (!existing) {
      throw new NotFoundException("Personel hesabı bulunamadı.");
    }

    assertStaffTargetWritable(scope, staffUserToTarget(existing));

    const passwordHash = await this.passwordService.hash(dto.password);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id: staffUserId },
        data: {
          passwordHash,
          status: StaffStatus.ACTIVE,
          inviteAcceptedAt: existing.inviteAcceptedAt ?? new Date()
        }
      });

      await tx.authSession.deleteMany({
        where: { staffUserId }
      });

      await recordAuditLog(tx, auth, {
        action: "staff.user.password.reset",
        entityType: "StaffUser",
        entityId: staffUserId,
        summary: `${existing.email} personel şifresi yenilendi.`
      });

      return tx.staffUser.findUniqueOrThrow({
        where: { id: staffUserId },
        include: staffUserIncludeForScope(scope)
      });
    });

    return mapStaffUser(updated, { includePermissionKeys: scope.kind === "super" });
  }

  listRoles(auth: AuthenticatedRequestContext) {
    this.requireSuperAdmin(auth);

    return this.prisma.role
      .findMany({
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        include: roleInclude
      })
      .then((roles) => roles.map((role) => mapRole(role)));
  }

  async createRole(dto: CreateRoleDto, auth: AuthenticatedRequestContext) {
    this.requireSuperAdmin(auth);

    const key = dto.key.trim().toLowerCase();
    const permissionKeys = normalizeUnique(dto.permissionKeys);

    await this.ensurePermissionsExist(permissionKeys);

    const existing = await this.prisma.role.findUnique({
      where: { key }
    });

    if (existing) {
      throw new ConflictException("Bu anahtarla kayıtlı rol zaten var.");
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          key,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          isSystem: false
        }
      });

      const permissions = await tx.permission.findMany({
        where: { key: { in: permissionKeys } },
        select: { id: true }
      });

      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id
        })),
        skipDuplicates: true
      });

      await recordAuditLog(tx, auth, {
        action: "staff.role.create",
        entityType: "Role",
        entityId: role.id,
        summary: `${role.name} rolü oluşturuldu.`
      });

      return tx.role.findUniqueOrThrow({
        where: { id: role.id },
        include: roleInclude
      });
    });

    return mapRole(created);
  }

  async updateRole(roleId: string, dto: UpdateRoleDto, auth: AuthenticatedRequestContext) {
    this.requireSuperAdmin(auth);

    const existing = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: roleInclude
    });

    if (!existing) {
      throw new NotFoundException("Rol bulunamadı.");
    }

    if (existing.isSystem) {
      throw new BadRequestException("Sistem rolleri panelden değiştirilemez. Yeni özel rol oluşturun.");
    }

    const permissionKeys = dto.permissionKeys ? normalizeUnique(dto.permissionKeys) : undefined;

    if (permissionKeys) {
      await this.ensurePermissionsExist(permissionKeys);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: roleId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {})
        }
      });

      if (permissionKeys) {
        const permissions = await tx.permission.findMany({
          where: { key: { in: permissionKeys } },
          select: { id: true }
        });

        await tx.rolePermission.deleteMany({
          where: { roleId }
        });

        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId,
            permissionId: permission.id
          })),
          skipDuplicates: true
        });
      }

      await recordAuditLog(tx, auth, {
        action: "staff.role.update",
        entityType: "Role",
        entityId: roleId,
        summary: `${existing.name} rolü güncellendi.`
      });

      return tx.role.findUniqueOrThrow({
        where: { id: roleId },
        include: roleInclude
      });
    });

    return mapRole(updated);
  }

  private resolveReadableScope(auth: AuthenticatedRequestContext) {
    const scope = resolveStaffManagementScope(auth);

    if (!scope.hasPolicy) {
      throw new ForbiddenException(STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
    }

    return scope;
  }

  private requireSuperAdmin(auth: AuthenticatedRequestContext) {
    if (!auth.isSuperAdmin) {
      throw new ForbiddenException("Bu işlem yalnızca Super Admin tarafından yapılabilir.");
    }
  }

  private resolveCreationOrganizationId(
    scope: StaffManagementScope,
    requestedOrganizationId: string | null,
    branch: { organizationId: string } | null
  ) {
    if (scope.kind === "super") {
      if (requestedOrganizationId && branch && requestedOrganizationId !== branch.organizationId) {
        throw new BadRequestException("Seçilen şube bu organizasyona bağlı değil.");
      }

      return requestedOrganizationId ?? branch?.organizationId ?? null;
    }

    if (scope.kind === "organization") {
      if (!scope.organizationId) {
        throw new ForbiddenException(STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
      }

      if (!requestedOrganizationId) {
        throw new BadRequestException("Organizasyon seçimi zorunludur.");
      }

      if (requestedOrganizationId !== scope.organizationId) {
        throw new ForbiddenException(STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
      }

      return scope.organizationId;
    }

    if (scope.kind === "branch") {
      if (!branch) {
        throw new BadRequestException("Şube seçimi zorunludur.");
      }

      return branch.organizationId;
    }

    throw new ForbiddenException(STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
  }

  private async resolveCreationBranch(scope: StaffManagementScope, branchId: string | null) {
    if (!branchId) {
      if (scope.kind === "branch") {
        throw new BadRequestException("Şube seçimi zorunludur.");
      }

      return null;
    }

    const branch = await this.prisma.branch.findFirst({
      where:
        scope.kind === "super"
          ? { id: branchId }
          : scope.kind === "organization"
            ? { id: branchId, organizationId: scope.organizationId ?? "__none__" }
            : scope.kind === "branch"
              ? { id: { in: scope.branchIds.includes(branchId) ? [branchId] : [] } }
              : { id: "__none__" },
      select: {
        id: true,
        organizationId: true
      }
    });

    if (!branch) {
      throw new ForbiddenException("Bu şube için personel oluşturma yetkiniz bulunmuyor.");
    }

    return branch;
  }

  private async ensureRolesExist(roleKeys: string[]) {
    const roles = await this.prisma.role.findMany({
      where: { key: { in: roleKeys } },
      select: { key: true }
    });
    const foundKeys = new Set(roles.map((role) => role.key));
    const missingKey = roleKeys.find((roleKey) => !foundKeys.has(roleKey));

    if (missingKey) {
      throw new BadRequestException(`Geçersiz rol: ${missingKey}`);
    }
  }

  private async ensurePermissionsExist(permissionKeys: string[]) {
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { key: true }
    });
    const foundKeys = new Set(permissions.map((permission) => permission.key));
    const missingKey = permissionKeys.find((permissionKey) => !foundKeys.has(permissionKey));

    if (missingKey) {
      throw new BadRequestException(`Geçersiz yetki: ${missingKey}`);
    }
  }

  private async ensureSuperAdminWillRemain(
    existing: StaffUserWithRoles,
    nextStatus?: StaffStatus,
    nextRoleKeys?: string[]
  ) {
    const hasSuperAdminRole = existing.roles.some((assignment) => assignment.role.key === ROLE_KEYS.superAdmin);
    const willRemainActive = (nextStatus ?? existing.status) === StaffStatus.ACTIVE;
    const willKeepSuperAdmin = nextRoleKeys ? nextRoleKeys.includes(ROLE_KEYS.superAdmin) : hasSuperAdminRole;

    if (!hasSuperAdminRole || (willRemainActive && willKeepSuperAdmin)) {
      return;
    }

    const activeSuperAdmins = await this.prisma.staffUser.count({
      where: {
        status: StaffStatus.ACTIVE,
        roles: {
          some: {
            role: {
              key: ROLE_KEYS.superAdmin
            }
          }
        }
      }
    });

    if (activeSuperAdmins <= 1) {
      throw new BadRequestException("Son aktif super-admin hesabının yetkisi veya erişimi kaldırılamaz.");
    }
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeUnique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function staffUserToTarget(user: StaffUserWithRoles): StaffManagementTarget {
  return {
    id: user.id,
    organizationId: user.organizationId,
    roleKeys: user.roles.map((assignment) => assignment.role.key),
    branchAssignments: user.branchAssignments.map((assignment) => ({
      organizationId: assignment.organizationId,
      branchId: assignment.branchId,
      revokedAt: assignment.revokedAt
    }))
  };
}

function mapStaffUser(
  user: StaffUserWithRoles,
  options: { includePermissionKeys?: boolean } = {}
) {
  const includePermissionKeys = options.includePermissionKeys ?? true;
  const roles = user.roles
    .map((assignment) => mapAssignedRole(assignment.role, { includePermissionKeys }))
    .sort((left, right) => left.name.localeCompare(right.name, "tr"));
  const permissionKeys = Array.from(
    new Set(includePermissionKeys ? roles.flatMap((role) => role.permissionKeys) : [])
  ).sort();

  return {
    id: user.id,
    organizationId: user.organizationId,
    primaryBranchId: user.primaryBranchId,
    organization: user.organization
      ? {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug
        }
      : null,
    primaryBranch: user.primaryBranch
      ? {
          id: user.primaryBranch.id,
          organizationId: user.primaryBranch.organizationId,
          name: user.primaryBranch.name,
          slug: user.primaryBranch.slug
        }
      : null,
    branchAssignments: user.branchAssignments.map((assignment) => ({
      id: assignment.id,
      organizationId: assignment.organizationId,
      branchId: assignment.branchId,
      roleKey: assignment.roleKey,
      isPrimary: assignment.isPrimary,
      assignedAt: assignment.assignedAt.toISOString(),
      revokedAt: assignment.revokedAt?.toISOString() ?? null,
      branch: {
        id: assignment.branch.id,
        organizationId: assignment.branch.organizationId,
        name: assignment.branch.name,
        slug: assignment.branch.slug
      }
    })),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    inviteAcceptedAt: user.inviteAcceptedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles,
    roleKeys: roles.map((role) => role.key),
    permissionKeys
  };
}

function mapAssignedRole(
  role: StaffUserWithRoles["roles"][number]["role"],
  options: { includePermissionKeys?: boolean } = {}
) {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissionKeys: options.includePermissionKeys === false
      ? []
      : role.permissions.map((entry) => entry.permission.key).sort()
  };
}

function mapRole(
  role: RoleWithPermissions,
  options: { includePermissionKeys?: boolean; includeStaffCount?: boolean } = {}
) {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    staffCount: options.includeStaffCount === false ? 0 : role._count.staffAssignments,
    permissionKeys: options.includePermissionKeys === false
      ? []
      : role.permissions.map((entry) => entry.permission.key).sort(),
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString()
  };
}

function mapStaffScope(scope: StaffManagementScope) {
  return {
    kind: scope.kind,
    hasValidScope: scope.hasValidScope,
    organizationId: scope.organizationId,
    branchIds: scope.branchIds,
    assignableRoleKeys: scope.assignableRoleKeys,
    canManageRoles: scope.canManageRoles,
    canCreateUnassignedStaff: scope.canCreateUnassignedStaff
  };
}

async function recordAuditLog(
  client: PrismaService | TransactionClient,
  auth: AuthenticatedRequestContext,
  payload: {
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
  }
) {
  await client.auditLog.create({
    data: {
      actorType: AuditActorType.STAFF_USER,
      staffUserId: auth.actorId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      summary: payload.summary
    }
  });
}
