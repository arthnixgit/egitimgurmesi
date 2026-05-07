import { Injectable } from "@nestjs/common";
import { Prisma } from "@ega/db";
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
}
