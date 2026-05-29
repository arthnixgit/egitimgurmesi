import { requestWithStaffToken } from "./auth-client";

export type OperationalDashboard = {
  actor: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    organizationId?: string | null;
    primaryBranchId?: string | null;
    branchIds: string[];
    isSuperAdmin: boolean;
  };
  capability: {
    branchAdmin: boolean;
    instructor: boolean;
    coach: boolean;
    accountant: boolean;
  };
  totals: {
    branches: number;
    classGroups: number;
    students: number;
    instructors: number;
    coaches: number;
    upcomingSessions: number;
    announcements: number;
    recentPayments: number;
    recentOrders: number;
  };
  branches: Array<{ id: string; name: string; slug: string; city?: string | null; district?: string | null }>;
  classGroups: ClassGroupOperationalItem[];
  upcomingSessions: LiveSessionItem[];
  announcements: AnnouncementItem[];
  finance: {
    recentPayments: Array<Record<string, unknown>>;
    recentOrders: Array<Record<string, unknown>>;
    placeholders: string[];
  };
  instructor: {
    assignments: AssignmentItem[];
    operationalBoundaries: string[];
  };
  coach: {
    assignments: AssignmentItem[];
    plans: CoachingPlanItem[];
    notes: CoachingNoteItem[];
    operationalBoundaries: string[];
  };
};

export type ClassGroupOperationalItem = {
  id: string;
  organizationId: string;
  branchId: string;
  branch?: { id: string; name: string; slug: string } | null;
  slug: string;
  name: string;
  description?: string | null;
  gradeLevel?: string | null;
  studyTrack?: string | null;
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
  counts?: {
    students: number;
    instructorAssignments: number;
    coachAssignments: number;
    liveSessions: number;
  };
};

export type LiveSessionItem = {
  id: string;
  branchId?: string | null;
  classGroupId?: string | null;
  branch?: { id: string; name: string; slug: string } | null;
  classGroup?: { id: string; name: string; slug: string } | null;
  course?: { id: string; title: string; slug: string } | null;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string | null;
  status: string;
  instructor?: { id: string; name: string; email: string } | null;
  coach?: { id: string; name: string; email: string } | null;
  participants: Array<{ id: string; userId: string; name: string; email: string; status: string }>;
};

export type AnnouncementItem = {
  id: string;
  branchId?: string | null;
  classGroupId?: string | null;
  title: string;
  body: string;
  status: string;
  audience: string;
  publishAt?: string | null;
  createdAt: string;
};

export type AssignmentItem = {
  id: string;
  branch?: { id: string; name: string } | null;
  classGroup?: { id: string; name: string } | null;
  student?: { id: string; name: string; email: string } | null;
  startsAt: string;
};

export type CoachingPlanItem = {
  id: string;
  branch?: { id: string; name: string } | null;
  student: { id: string; name: string; email: string };
  coach?: { id: string; name: string; email: string } | null;
  title: string;
  summary?: string | null;
  status: string;
  weekStartsAt?: string | null;
  weekEndsAt?: string | null;
  createdAt: string;
};

export type CoachingNoteItem = {
  id: string;
  branch?: { id: string; name: string } | null;
  student: { id: string; name: string; email: string };
  coach?: { id: string; name: string; email: string } | null;
  title: string;
  body: string;
  followUpAt?: string | null;
  isPrivate: boolean;
  createdAt: string;
};

export type ClassGroupRoster = {
  classGroup: ClassGroupOperationalItem;
  students: Array<{
    id: string;
    userId: string;
    status: string;
    joinedAt: string;
    student: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      gradeLevel?: string | null;
      studyTrack?: string | null;
      schoolName?: string | null;
    };
  }>;
  instructors: Array<{ id: string; staffUserId: string; name: string; email: string; startsAt: string }>;
  coaches: Array<{ id: string; staffUserId: string; name: string; email: string; startsAt: string }>;
};

export function getOperationalDashboard() {
  return requestWithStaffToken<OperationalDashboard>("/operations/staff-dashboard");
}

export function getClassGroupRoster(classGroupId: string) {
  return requestWithStaffToken<ClassGroupRoster>(
    `/operations/class-groups/${encodeURIComponent(classGroupId)}/roster`
  );
}

export function addStudentToClassGroup(classGroupId: string, userId: string) {
  return requestWithStaffToken(`/operations/class-groups/${encodeURIComponent(classGroupId)}/students`, {
    method: "POST",
    body: { userId }
  });
}

export function assignInstructorToClassGroup(classGroupId: string, staffUserId: string) {
  return requestWithStaffToken(
    `/operations/class-groups/${encodeURIComponent(classGroupId)}/instructors`,
    {
      method: "POST",
      body: { staffUserId }
    }
  );
}

export function assignCoachToClassGroup(classGroupId: string, staffUserId: string) {
  return requestWithStaffToken(`/operations/class-groups/${encodeURIComponent(classGroupId)}/coaches`, {
    method: "POST",
    body: { staffUserId }
  });
}

export function listLiveSessions(params?: { branchId?: string; classGroupId?: string }) {
  return requestWithStaffToken<LiveSessionItem[]>(`/operations/live-sessions${toQueryString(params)}`);
}

export function createLiveSession(data: {
  branchId?: string;
  classGroupId?: string;
  instructorStaffUserId?: string;
  coachStaffUserId?: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string;
}) {
  return requestWithStaffToken<LiveSessionItem>("/operations/live-sessions", {
    method: "POST",
    body: data
  });
}

export function updateLiveSessionStatus(sessionId: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED") {
  return requestWithStaffToken<LiveSessionItem>(
    `/operations/live-sessions/${encodeURIComponent(sessionId)}/status`,
    {
      method: "PATCH",
      body: { status }
    }
  );
}

export function createAnnouncement(data: {
  branchId?: string;
  classGroupId?: string;
  title: string;
  body: string;
  audience?: string;
  status?: string;
}) {
  return requestWithStaffToken<AnnouncementItem>("/operations/announcements", {
    method: "POST",
    body: data
  });
}

export function createCoachingPlan(data: {
  userId: string;
  branchId?: string;
  coachStaffUserId?: string;
  title: string;
  summary?: string;
  weekStartsAt?: string;
  weekEndsAt?: string;
}) {
  return requestWithStaffToken<CoachingPlanItem>("/operations/coaching-plans", {
    method: "POST",
    body: data
  });
}

export function createCoachingNote(data: {
  userId: string;
  branchId?: string;
  coachStaffUserId?: string;
  title: string;
  body: string;
  followUpAt?: string;
  isPrivate?: boolean;
}) {
  return requestWithStaffToken<CoachingNoteItem>("/operations/coaching-notes", {
    method: "POST",
    body: data
  });
}

function toQueryString(params?: Record<string, string | undefined>) {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
