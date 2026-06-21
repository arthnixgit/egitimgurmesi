import type { LeadStatus } from "@ega/db";

export const LEAD_STATUS_VALUES = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUALIFIED: "QUALIFIED",
  CLOSED: "CLOSED"
} as const satisfies Record<LeadStatus, LeadStatus>;
