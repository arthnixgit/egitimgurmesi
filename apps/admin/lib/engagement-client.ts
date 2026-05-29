import { requestWithStaffToken } from "./auth-client";

export type AdminLeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CLOSED";

export type AdminLeadSummary = {
  id: string;
  status: AdminLeadStatus;
  sourcePage?: string | null;
  phoneSnapshot?: string | null;
  fullName?: string | null;
  studentName?: string | null;
  email?: string | null;
  city?: string | null;
  preview?: string | null;
  user?: {
    id: string;
    email: string;
  } | null;
  product?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  handledBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  handledAt?: string | null;
  createdAt: string;
};

export type AdminLeadDetail = {
  id: string;
  status: AdminLeadStatus;
  sourcePage?: string | null;
  phoneSnapshot?: string | null;
  message?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  createdAt: string;
  updatedAt: string;
  handledAt?: string | null;
  structuredFields: Array<{
    label: string;
    value: string;
  }>;
  user?: {
    id: string;
    email: string;
  } | null;
  product?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  handledBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

export type AdminLeadListResponse = {
  total: number;
  counts: Record<AdminLeadStatus, number>;
  sourcePages: Array<{
    value: string;
    count: number;
  }>;
  leads: AdminLeadSummary[];
};

type LeadQuery = {
  q?: string;
  status?: AdminLeadStatus | "ALL";
  sourcePage?: string;
};

export function fetchAdminLeads(query: LeadQuery = {}) {
  const params = new URLSearchParams();

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.status && query.status !== "ALL") {
    params.set("status", query.status);
  }

  if (query.sourcePage?.trim()) {
    params.set("sourcePage", query.sourcePage.trim());
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestWithStaffToken<AdminLeadListResponse>(`/admin-engagement/leads${suffix}`);
}

export function fetchAdminLead(leadId: string) {
  return requestWithStaffToken<AdminLeadDetail>(
    `/admin-engagement/leads/${encodeURIComponent(leadId)}`
  );
}

export function updateAdminLeadStatus(leadId: string, status: AdminLeadStatus) {
  return requestWithStaffToken<AdminLeadDetail>(
    `/admin-engagement/leads/${encodeURIComponent(leadId)}/status`,
    {
      method: "PATCH",
      body: {
        status
      }
    }
  );
}
