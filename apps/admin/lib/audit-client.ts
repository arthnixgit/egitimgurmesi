import { requestWithStaffToken } from "./auth-client";

export type AdminAuditActorType = "STAFF_USER" | "USER" | "SYSTEM";

export type AdminAuditLogSummary = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  summary?: string | null;
  actorType: AdminAuditActorType;
  actor: {
    id: string | null;
    name: string;
    email: string | null;
  };
  createdAt: string;
};

export type AdminAuditLogDetail = AdminAuditLogSummary & {
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AdminAuditLogListResponse = {
  total: number;
  take: number;
  logs: AdminAuditLogSummary[];
};

type AuditLogQuery = {
  q?: string;
  entityType?: string;
  action?: string;
  actorType?: AdminAuditActorType | "ALL";
  take?: number;
};

export function fetchAdminAuditLogs(query: AuditLogQuery = {}) {
  const params = new URLSearchParams();

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.entityType?.trim()) {
    params.set("entityType", query.entityType.trim());
  }

  if (query.action?.trim()) {
    params.set("action", query.action.trim());
  }

  if (query.actorType && query.actorType !== "ALL") {
    params.set("actorType", query.actorType);
  }

  if (query.take) {
    params.set("take", String(query.take));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestWithStaffToken<AdminAuditLogListResponse>(`/admin-audit/logs${suffix}`);
}

export function fetchAdminAuditLog(auditLogId: string) {
  return requestWithStaffToken<AdminAuditLogDetail>(
    `/admin-audit/logs/${encodeURIComponent(auditLogId)}`
  );
}
