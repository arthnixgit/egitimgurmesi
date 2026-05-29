import { Injectable } from "@nestjs/common";
import { AuthActorType } from "@ega/db";
import { PrismaService } from "../database/prisma.service";

type CreateSessionInput = {
  actorType: AuthActorType;
  userId?: string;
  staffUserId?: string;
  sessionFamily: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class AuthSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateSessionInput) {
    return this.prisma.authSession.create({
      data: input
    });
  }

  findActiveBySessionFamily(sessionFamily: string) {
    return this.prisma.authSession.findUnique({
      where: { sessionFamily }
    });
  }

  rotate(sessionFamily: string, refreshTokenHash: string, expiresAt: Date) {
    return this.prisma.authSession.update({
      where: { sessionFamily },
      data: {
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
        revokedAt: null
      }
    });
  }

  revoke(sessionFamily: string) {
    return this.prisma.authSession.update({
      where: { sessionFamily },
      data: {
        revokedAt: new Date()
      }
    });
  }

  revokeAllForUser(userId: string) {
    return this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }
}
