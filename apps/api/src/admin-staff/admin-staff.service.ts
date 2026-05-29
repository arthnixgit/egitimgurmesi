import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { AuditActorType, Prisma, ROLE_KEYS, StaffStatus } from "@ega/db";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { PasswordService } from "../auth/password.service";
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

@Injectable()
export class AdminStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService
  ) {}

  async getOverview() {
    const [users, roles, permissions] = await Promise.all([
      this.prisma.staffUser.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: staffUserInclude
      }),
      this.prisma.role.findMany({
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        include: roleInclude
      }),
      this.prisma.permission.findMany({
        orderBy: { key: "asc" }
      })
    ]);

    return {
      users: users.map(mapStaffUser),
      roles: roles.map(mapRole),
      permissions: permissions.map((permission) => ({
        id: permission.id,
        key: permission.key,
        name: permission.name,
        description: permission.description
      }))
    };
  }

  listUsers() {
    return this.prisma.staffUser
      .findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: staffUserInclude
      })
      .then((users) => users.map(mapStaffUser));
  }

  async createUser(dto: CreateStaffUserDto, auth: AuthenticatedRequestContext) {
    const email = normalizeEmail(dto.email);
    const roleKeys = normalizeUnique(dto.roleKeys);

    await this.ensureRolesExist(roleKeys);

    const existing = await this.prisma.staffUser.findUnique({
      where: { email }
    });

    if (existing) {
      throw new ConflictException("Bu e-posta ile kayıtlı personel hesabı zaten var.");
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const created = await this.prisma.$transaction(async (tx) => {
      const staffUser = await tx.staffUser.create({
        data: {
          email,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          passwordHash,
          status: dto.status ?? StaffStatus.ACTIVE,
          inviteAcceptedAt: new Date(),
          roles: {
            create: roleKeys.map((roleKey) => ({
              assignedByStaffUserId: auth.actorId,
              role: {
                connect: {
                  key: roleKey
                }
              }
            }))
          }
        },
        include: staffUserInclude
      });

      await recordAuditLog(tx, auth, {
        action: "staff.user.create",
        entityType: "StaffUser",
        entityId: staffUser.id,
        summary: `${staffUser.email} personel hesabı oluşturuldu.`
      });

      return staffUser;
    });

    return mapStaffUser(created);
  }

  async updateUser(staffUserId: string, dto: UpdateStaffUserDto, auth: AuthenticatedRequestContext) {
    const roleKeys = dto.roleKeys ? normalizeUnique(dto.roleKeys) : undefined;

    if (roleKeys) {
      await this.ensureRolesExist(roleKeys);
    }

    const existing = await this.prisma.staffUser.findUnique({
      where: { id: staffUserId },
      include: staffUserInclude
    });

    if (!existing) {
      throw new NotFoundException("Personel hesabı bulunamadı.");
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
        include: staffUserInclude
      });
    });

    return mapStaffUser(updated);
  }

  async updateUserPassword(
    staffUserId: string,
    dto: UpdateStaffPasswordDto,
    auth: AuthenticatedRequestContext
  ) {
    const existing = await this.prisma.staffUser.findUnique({
      where: { id: staffUserId }
    });

    if (!existing) {
      throw new NotFoundException("Personel hesabı bulunamadı.");
    }

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
        include: staffUserInclude
      });
    });

    return mapStaffUser(updated);
  }

  listRoles() {
    return this.prisma.role
      .findMany({
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        include: roleInclude
      })
      .then((roles) => roles.map(mapRole));
  }

  async createRole(dto: CreateRoleDto, auth: AuthenticatedRequestContext) {
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

function mapStaffUser(user: StaffUserWithRoles) {
  const roles = user.roles
    .map((assignment) => mapAssignedRole(assignment.role))
    .sort((left, right) => left.name.localeCompare(right.name, "tr"));
  const permissionKeys = Array.from(
    new Set(roles.flatMap((role) => role.permissionKeys))
  ).sort();

  return {
    id: user.id,
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

function mapAssignedRole(role: StaffUserWithRoles["roles"][number]["role"]) {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissionKeys: role.permissions.map((entry) => entry.permission.key).sort()
  };
}

function mapRole(role: RoleWithPermissions) {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    staffCount: role._count.staffAssignments,
    permissionKeys: role.permissions.map((entry) => entry.permission.key).sort(),
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString()
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
