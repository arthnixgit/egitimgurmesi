import { Injectable } from "@nestjs/common";
import { Prisma, ROLE_KEYS, StaffStatus } from "@ega/db";
import { PrismaService } from "../database/prisma.service";

const staffAccessInclude = {
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
  branchAssignments: {
    where: {
      revokedAt: null
    },
    select: {
      branchId: true,
      organizationId: true,
      roleKey: true,
      isPrimary: true
    }
  }
} satisfies Prisma.StaffUserInclude;

export type StaffUserWithAccess = Prisma.StaffUserGetPayload<{
  include: typeof staffAccessInclude;
}>;

@Injectable()
export class StaffUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithAccess(email: string) {
    return this.prisma.staffUser.findUnique({
      where: { email: email.toLowerCase() },
      include: staffAccessInclude
    });
  }

  findByIdWithAccess(id: string) {
    return this.prisma.staffUser.findUnique({
      where: { id },
      include: staffAccessInclude
    });
  }

  touchLastLogin(id: string) {
    return this.prisma.staffUser.update({
      where: { id },
      data: {
        lastLoginAt: new Date()
      }
    });
  }

  hasSuperAdmin() {
    return this.prisma.staffUser.count({
      where: {
        roles: {
          some: {
            role: {
              key: ROLE_KEYS.superAdmin
            }
          }
        }
      }
    });
  }

  createSuperAdmin(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }) {
    return this.prisma.staffUser.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        status: StaffStatus.ACTIVE,
        inviteAcceptedAt: new Date(),
        roles: {
          create: {
            role: {
              connect: {
                key: ROLE_KEYS.superAdmin
              }
            }
          }
        }
      },
      include: staffAccessInclude
    });
  }
}
