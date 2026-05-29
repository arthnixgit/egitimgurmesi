import { Injectable } from "@nestjs/common";
import { Prisma } from "@ega/db";
import { PrismaService } from "../database/prisma.service";

const verificationCodeInclude = {
  user: {
    include: {
      profile: true,
      studentProfile: true,
      externalAccounts: {
        select: {
          id: true,
          provider: true,
          externalEmail: true,
          linkedAt: true
        }
      }
    }
  }
} satisfies Prisma.EmailVerificationCodeInclude;

export type EmailVerificationCodeWithUser = Prisma.EmailVerificationCodeGetPayload<{
  include: typeof verificationCodeInclude;
}>;

@Injectable()
export class EmailVerificationCodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteActiveForUser(userId: string) {
    return this.prisma.emailVerificationCode.deleteMany({
      where: {
        userId,
        consumedAt: null
      }
    });
  }

  create(userId: string, codeHash: string, expiresAt: Date) {
    return this.prisma.emailVerificationCode.create({
      data: {
        userId,
        codeHash,
        expiresAt
      }
    });
  }

  findActiveByHash(codeHash: string) {
    return this.prisma.emailVerificationCode.findFirst({
      where: {
        codeHash,
        consumedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: verificationCodeInclude
    });
  }

  consume(id: string) {
    return this.prisma.emailVerificationCode.update({
      where: { id },
      data: {
        consumedAt: new Date()
      }
    });
  }
}
