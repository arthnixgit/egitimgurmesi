import { AuditActorType, LeadStatus, Prisma } from "@ega/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { ListLeadsDto, UpdateLeadStatusDto } from "./dto/admin-engagement.dto";

const leadInclude = {
  user: {
    select: {
      id: true,
      email: true
    }
  },
  product: {
    select: {
      id: true,
      slug: true,
      name: true
    }
  },
  handledBy: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    }
  }
} satisfies Prisma.WhatsAppLeadInclude;

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class AdminEngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async listLeads(query: ListLeadsDto) {
    const where: Prisma.WhatsAppLeadWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.sourcePage?.trim()
        ? {
            sourcePage: {
              contains: query.sourcePage.trim(),
              mode: Prisma.QueryMode.insensitive
            }
          }
        : {}),
      ...(query.q?.trim()
        ? {
            OR: [
              {
                phoneSnapshot: {
                  contains: query.q.trim(),
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                message: {
                  contains: query.q.trim(),
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                sourcePage: {
                  contains: query.q.trim(),
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                user: {
                  email: {
                    contains: query.q.trim(),
                    mode: Prisma.QueryMode.insensitive
                  }
                }
              },
              {
                product: {
                  name: {
                    contains: query.q.trim(),
                    mode: Prisma.QueryMode.insensitive
                  }
                }
              }
            ]
          }
        : {})
    };

    const [leads, total, counts, sourceGroups] = await Promise.all([
      this.prisma.whatsAppLead.findMany({
        where,
        include: leadInclude,
        orderBy: [{ createdAt: "desc" }]
      }),
      this.prisma.whatsAppLead.count({ where }),
      this.prisma.whatsAppLead.groupBy({
        by: ["status"],
        _count: {
          _all: true
        }
      }),
      this.prisma.whatsAppLead.groupBy({
        by: ["sourcePage"],
        _count: {
          _all: true
        }
      })
    ]);

    return {
      total,
      counts: {
        NEW: counts.find((entry) => entry.status === LeadStatus.NEW)?._count._all ?? 0,
        CONTACTED: counts.find((entry) => entry.status === LeadStatus.CONTACTED)?._count._all ?? 0,
        QUALIFIED: counts.find((entry) => entry.status === LeadStatus.QUALIFIED)?._count._all ?? 0,
        CLOSED: counts.find((entry) => entry.status === LeadStatus.CLOSED)?._count._all ?? 0
      },
      sourcePages: sourceGroups
        .filter((entry) => entry.sourcePage)
        .sort((left, right) => right._count._all - left._count._all)
        .map((entry) => ({
          value: entry.sourcePage!,
          count: entry._count._all
        })),
      leads: leads.map((lead) => normalizeLeadSummary(lead))
    };
  }

  async getLead(leadId: string) {
    const lead = await this.prisma.whatsAppLead.findUnique({
      where: { id: leadId },
      include: leadInclude
    });

    if (!lead) {
      throw new NotFoundException("Lead not found.");
    }

    return normalizeLeadDetail(lead);
  }

  async updateLeadStatus(
    leadId: string,
    payload: UpdateLeadStatusDto,
    auth: AuthenticatedRequestContext
  ) {
    const existing = await this.prisma.whatsAppLead.findUnique({
      where: { id: leadId },
      include: leadInclude
    });

    if (!existing) {
      throw new NotFoundException("Lead not found.");
    }

    await this.prisma.whatsAppLead.update({
      where: { id: leadId },
      data: {
        status: payload.status,
        handledByStaffUserId: auth.actorId ?? existing.handledByStaffUserId,
        handledAt: payload.status === LeadStatus.NEW ? null : new Date()
      }
    });

    await recordAuditLog(this.prisma, auth, {
      action: "engagement.lead.status.update",
      entityType: "WhatsAppLead",
      entityId: leadId,
      summary: `Changed lead status to ${payload.status}.`
    });

    return this.getLead(leadId);
  }
}

function normalizeLeadSummary(
  lead: Prisma.WhatsAppLeadGetPayload<{
    include: typeof leadInclude;
  }>
) {
  const parsed = parseLeadMessage(lead.message);

  return {
    id: lead.id,
    status: lead.status,
    sourcePage: lead.sourcePage,
    phoneSnapshot: lead.phoneSnapshot,
    fullName: parsed["Ad Soyad"] ?? null,
    studentName: parsed["Öğrenci Adı"] ?? parsed["Ogrenci Adi"] ?? null,
    email: parsed["E-posta"] ?? lead.user?.email ?? null,
    city: parsed["Şehir"] ?? parsed["Sehir"] ?? null,
    preview:
      parsed["Not"] ??
      parsed["Sınıf Düzeyi"] ??
      parsed["Sinif Duzeyi"] ??
      lead.message?.split("\n").slice(0, 2).join(" ") ??
      null,
    user: lead.user,
    product: lead.product,
    handledBy: lead.handledBy
      ? {
          id: lead.handledBy.id,
          fullName: `${lead.handledBy.firstName} ${lead.handledBy.lastName}`.trim(),
          email: lead.handledBy.email
        }
      : null,
    handledAt: lead.handledAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString()
  };
}

function normalizeLeadDetail(
  lead: Prisma.WhatsAppLeadGetPayload<{
    include: typeof leadInclude;
  }>
) {
  const parsed = parseLeadMessage(lead.message);

  return {
    id: lead.id,
    status: lead.status,
    sourcePage: lead.sourcePage,
    phoneSnapshot: lead.phoneSnapshot,
    message: lead.message,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    handledAt: lead.handledAt?.toISOString() ?? null,
    structuredFields: Object.entries(parsed).map(([label, value]) => ({
      label,
      value
    })),
    user: lead.user,
    product: lead.product,
    handledBy: lead.handledBy
      ? {
          id: lead.handledBy.id,
          fullName: `${lead.handledBy.firstName} ${lead.handledBy.lastName}`.trim(),
          email: lead.handledBy.email
        }
      : null
  };
}

function parseLeadMessage(message: string | null | undefined) {
  if (!message) {
    return {} as Record<string, string>;
  }

  return message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key && value) {
        accumulator[key] = value;
      }

      return accumulator;
    }, {});
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
  if (!auth.actorId) {
    return;
  }

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
