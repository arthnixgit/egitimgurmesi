import { AuditActorType, Prisma } from "@ega/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

const auditActorInclude = {
  staffActor: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    }
  },
  userActor: {
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  }
} satisfies Prisma.AuditLogInclude;

type AuditLogRecord = Prisma.AuditLogGetPayload<{
  include: typeof auditActorInclude;
}>;

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(query: ListAuditLogsDto) {
    const where = buildAuditWhere(query);
    const take = query.take ?? 60;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: auditActorInclude,
        orderBy: [{ createdAt: "desc" }],
        take
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      total,
      take,
      logs: logs.map(mapAuditLogSummary)
    };
  }

  async getLog(auditLogId: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: auditLogId },
      include: auditActorInclude
    });

    if (!log) {
      throw new NotFoundException("Audit kaydı bulunamadı.");
    }

    return mapAuditLogDetail(log);
  }
}

function buildAuditWhere(query: ListAuditLogsDto): Prisma.AuditLogWhereInput {
  const q = query.q?.trim();

  return {
    actorType: query.actorType,
    entityType: query.entityType?.trim() || undefined,
    action: query.action?.trim() || undefined,
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" } },
            { entityType: { contains: q, mode: "insensitive" } },
            { entityId: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function mapAuditLogSummary(log: AuditLogRecord) {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    summary: log.summary,
    actorType: log.actorType,
    actor: mapAuditActor(log),
    createdAt: log.createdAt.toISOString()
  };
}

function mapAuditLogDetail(log: AuditLogRecord) {
  return {
    ...mapAuditLogSummary(log),
    beforeData: log.beforeData,
    afterData: log.afterData,
    metadata: log.metadata,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent
  };
}

function mapAuditActor(log: AuditLogRecord) {
  if (log.actorType === AuditActorType.STAFF_USER) {
    return {
      id: log.staffActor?.id ?? null,
      name:
        [log.staffActor?.firstName, log.staffActor?.lastName].filter(Boolean).join(" ").trim() ||
        log.staffActor?.email ||
        "Bilinmeyen personel",
      email: log.staffActor?.email ?? null
    };
  }

  if (log.actorType === AuditActorType.USER) {
    return {
      id: log.userActor?.id ?? null,
      name:
        [log.userActor?.profile?.firstName, log.userActor?.profile?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        log.userActor?.email ||
        "Bilinmeyen kullanıcı",
      email: log.userActor?.email ?? null
    };
  }

  return {
    id: null,
    name: "System",
    email: null
  };
}
