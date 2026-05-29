import { Injectable } from "@nestjs/common";
import { Prisma } from "@ega/db";
import { PrismaService } from "../database/prisma.service";

const passwordResetInclude = {
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
} satisfies Prisma.PasswordResetTokenInclude;

export type PasswordResetTokenWithUser = Prisma.PasswordResetTokenGetPayload<{
  include: typeof passwordResetInclude;
}>;

@Injectable()
export class PasswordResetTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteActiveForUser(userId: string) {
    return this.prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        consumedAt: null
      }
    });
  }

  create(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
  }

  findActiveByHash(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: passwordResetInclude
    });
  }

  consume(id: string) {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data: {
        consumedAt: new Date()
      }
    });
  }
}
