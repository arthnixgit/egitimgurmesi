import { requestWithStaffToken } from "./auth-client";

export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type BranchStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type BranchMembershipStatus = "ACTIVE" | "SUSPENDED" | "LEFT";
export type StaffBranchRole = "BRANCH_ADMIN" | "INSTRUCTOR" | "COACH" | "ACCOUNTANT" | "STAFF";
export type ClassGroupStatus = "ACTIVE" | "ARCHIVED";
export type GradeLevel =
  | "GRADE_5"
  | "GRADE_6"
  | "GRADE_7"
  | "GRADE_8"
  | "GRADE_9"
  | "GRADE_10"
  | "GRADE_11"
  | "GRADE_12"
  | "GRADUATE"
  | "UNIVERSITY"
  | "OTHER";
export type StudyTrack =
  | "SAYISAL"
  | "SOZEL"
  | "ESIT_AGIRLIK"
  | "DIL"
  | "TYT"
  | "LGS"
  | "MSU"
  | "ARA_SINIF"
  | "KPSS"
  | "OTHER";

export type TenancyScope = {
  actor: {
    actorId: string;
    email: string;
    roleKeys: string[];
    organizationId?: string | null;
    primaryBranchId?: string | null;
    branchIds: string[];
    isSuperAdmin: boolean;
  };
  counts: {
    organizations: number;
    educationCenters: number;
    branches: number;
    classGroups: number;
  };
};

export type TenancyOrganization = {
  id: string;
  slug: string;
  name: string;
  legalName?: string | null;
  status: OrganizationStatus;
  taxNumber?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    educationCenters: number;
    branches: number;
    users: number;
    staffUsers: number;
  };
};

export type TenancyEducationCenter = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  legalName?: string | null;
  centerType?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    branches: number;
  };
};

export type TenancyBranch = {
  id: string;
  organizationId: string;
  educationCenterId?: string | null;
  slug: string;
  name: string;
  code?: string | null;
  status: BranchStatus;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  educationCenter?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count?: {
    staffAssignments: number;
    studentMemberships: number;
    classGroups: number;
  };
};

export type BranchStaffAssignment = {
  id: string;
  organizationId: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    slug: string;
  };
  staffUserId: string;
  staffUser?: {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  roleKey: StaffBranchRole;
  status?: "ACTIVE" | "REVOKED";
  isPrimary: boolean;
  assignedAt: string;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StudentBranchMembership = {
  id: string;
  organizationId: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    slug: string;
  };
  userId: string;
  student?: {
    id: string;
    displayName: string;
    email: string;
    phone?: string | null;
    status: string;
  };
  status: BranchMembershipStatus;
  isPrimary: boolean;
  joinedAt: string;
  leftAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TenancyClassGroup = {
  id: string;
  organizationId: string;
  branchId: string;
  slug: string;
  name: string;
  description?: string | null;
  gradeLevel?: GradeLevel | null;
  studyTrack?: StudyTrack | null;
  status: ClassGroupStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    instructorAssignments: number;
    coachAssignments: number;
  };
};

export type CreateOrganizationPayload = {
  name: string;
  slug?: string;
  legalName?: string;
  taxNumber?: string;
  supportEmail?: string;
  supportPhone?: string;
};

export type UpdateOrganizationPayload = {
  name?: string;
  legalName?: string | null;
  status?: OrganizationStatus;
  taxNumber?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
};

export type CreateEducationCenterPayload = {
  name: string;
  slug?: string;
  legalName?: string;
  centerType?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type UpdateEducationCenterPayload = {
  name?: string;
  legalName?: string | null;
  centerType?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: BranchStatus;
};

export type CreateBranchPayload = {
  name: string;
  slug?: string;
  educationCenterId?: string;
  code?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type UpdateBranchPayload = {
  name?: string;
  educationCenterId?: string | null;
  code?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: BranchStatus;
};

export type CreateClassGroupPayload = {
  name: string;
  slug?: string;
  description?: string;
  gradeLevel?: GradeLevel;
  studyTrack?: StudyTrack;
};

export type UpdateClassGroupPayload = {
  name?: string;
  description?: string | null;
  gradeLevel?: GradeLevel | null;
  studyTrack?: StudyTrack | null;
  status?: ClassGroupStatus;
};

export type TenancyOverview = {
  organizationCount: number;
  educationCenterCount: number;
  branchCount: number;
  classGroupCount: number;
  staffAssignmentCount: number;
  studentMembershipCount: number;
  recentBranches: Array<{
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    organization?: { id: string; name: string } | null;
    educationCenter?: { id: string; name: string } | null;
  }>;
  recentStaffAssignments: BranchStaffAssignment[];
  recentStudentMemberships: StudentBranchMembership[];
  currentScope: TenancyScope;
};

export type BetaReadinessItem = {
  key: string;
  label: string;
  count: number;
  ready: boolean;
};

export type BetaReadinessSummary = {
  generatedAt: string;
  readinessPercentage: number;
  readyCount: number;
  totalCount: number;
  missingItems: BetaReadinessItem[];
  items: BetaReadinessItem[];
  counts: Record<string, number>;
  demoData?: {
    staffCount: number;
    studentCount: number;
    organizationCount: number;
    branchCount: number;
    productCount: number;
    publicProductCount: number;
    publicCategoryCount: number;
    announcementCount: number;
    liveSessionCount: number;
    publicExposureRisk: boolean;
    productionSeedBlockedByDefault: boolean;
  };
  scope: {
    isSuperAdmin: boolean;
    organizationId?: string | null;
    branchIds: string[];
    roleKeys: string[];
  };
};

export type TenancyStudentSearchItem = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  organizationId?: string | null;
  primaryBranchId?: string | null;
  currentBranches: Array<{
    membershipId: string;
    branchId: string;
    branchName: string;
    status: BranchMembershipStatus;
    isPrimary: boolean;
  }>;
  createdAt: string;
};

export type TenancyStaffSearchItem = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  organizationId?: string | null;
  primaryBranchId?: string | null;
  roles: Array<{ id: string; key: string; name: string }>;
  assignedBranches: Array<{
    assignmentId: string;
    branchId: string;
    branchName: string;
    roleKey: StaffBranchRole;
    status: "ACTIVE" | "REVOKED";
    isPrimary: boolean;
  }>;
  createdAt: string;
};

export type TenancySearchResponse<T> = {
  total: number;
  page: number;
  limit: number;
  items: T[];
};

export function getTenancyScope() {
  return requestWithStaffToken<TenancyScope>("/admin-tenancy/scope");
}

export function getTenancyOverview() {
  return requestWithStaffToken<TenancyOverview>("/admin-tenancy/overview");
}

export function getBetaReadiness() {
  return requestWithStaffToken<BetaReadinessSummary>("/admin-tenancy/beta-readiness");
}

export function listStudents(params?: {
  q?: string;
  branchId?: string;
  limit?: number;
  page?: number;
}) {
  return requestWithStaffToken<TenancySearchResponse<TenancyStudentSearchItem>>(
    `/admin-tenancy/students${toQueryString(params)}`
  );
}

export function listStaff(params?: {
  q?: string;
  role?: StaffBranchRole;
  branchId?: string;
  limit?: number;
  page?: number;
}) {
  return requestWithStaffToken<TenancySearchResponse<TenancyStaffSearchItem>>(
    `/admin-tenancy/staff${toQueryString(params)}`
  );
}

export function listOrganizations() {
  return requestWithStaffToken<TenancyOrganization[]>("/admin-tenancy/organizations");
}

export function createOrganization(data: CreateOrganizationPayload) {
  return requestWithStaffToken<TenancyOrganization>("/admin-tenancy/organizations", {
    method: "POST",
    body: data
  });
}

export function updateOrganization(id: string, data: UpdateOrganizationPayload) {
  return requestWithStaffToken<TenancyOrganization>(
    `/admin-tenancy/organizations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: data
    }
  );
}

export function listEducationCenters(organizationId: string) {
  return requestWithStaffToken<TenancyEducationCenter[]>(
    `/admin-tenancy/organizations/${encodeURIComponent(organizationId)}/education-centers`
  );
}

export function createEducationCenter(organizationId: string, data: CreateEducationCenterPayload) {
  return requestWithStaffToken<TenancyEducationCenter>(
    `/admin-tenancy/organizations/${encodeURIComponent(organizationId)}/education-centers`,
    {
      method: "POST",
      body: data
    }
  );
}

export function updateEducationCenter(centerId: string, data: UpdateEducationCenterPayload) {
  return requestWithStaffToken<TenancyEducationCenter>(
    `/admin-tenancy/education-centers/${encodeURIComponent(centerId)}`,
    {
      method: "PATCH",
      body: data
    }
  );
}

export function listBranches(filters?: { organizationId?: string }) {
  const query = filters?.organizationId
    ? `?organizationId=${encodeURIComponent(filters.organizationId)}`
    : "";

  return requestWithStaffToken<TenancyBranch[]>(`/admin-tenancy/branches${query}`);
}

export function createBranch(organizationId: string, data: CreateBranchPayload) {
  return requestWithStaffToken<TenancyBranch>(
    `/admin-tenancy/organizations/${encodeURIComponent(organizationId)}/branches`,
    {
      method: "POST",
      body: data
    }
  );
}

export function updateBranch(branchId: string, data: UpdateBranchPayload) {
  return requestWithStaffToken<TenancyBranch>(
    `/admin-tenancy/branches/${encodeURIComponent(branchId)}`,
    {
      method: "PATCH",
      body: data
    }
  );
}

export function assignStaffToBranch(
  branchId: string,
  data: {
    staffUserId: string;
    roleKey: StaffBranchRole;
    isPrimary?: boolean;
  }
) {
  return requestWithStaffToken<BranchStaffAssignment>(
    `/admin-tenancy/branches/${encodeURIComponent(branchId)}/staff-assignments`,
    {
      method: "POST",
      body: data
    }
  );
}

export function listBranchStaffAssignments(branchId: string) {
  return requestWithStaffToken<BranchStaffAssignment[]>(
    `/admin-tenancy/branches/${encodeURIComponent(branchId)}/staff-assignments`
  );
}

export function updateBranchStaffAssignment(
  assignmentId: string,
  data: {
    roleKey?: StaffBranchRole;
    status?: "ACTIVE" | "REVOKED";
    isPrimary?: boolean;
  }
) {
  return requestWithStaffToken<BranchStaffAssignment>(
    `/admin-tenancy/branch-staff-assignments/${encodeURIComponent(assignmentId)}`,
    {
      method: "PATCH",
      body: data
    }
  );
}

export function addStudentToBranch(
  branchId: string,
  data: {
    userId: string;
    status?: BranchMembershipStatus;
    isPrimary?: boolean;
  }
) {
  return requestWithStaffToken<StudentBranchMembership>(
    `/admin-tenancy/branches/${encodeURIComponent(branchId)}/student-memberships`,
    {
      method: "POST",
      body: data
    }
  );
}

export function listBranchStudentMemberships(branchId: string) {
  return requestWithStaffToken<StudentBranchMembership[]>(
    `/admin-tenancy/branches/${encodeURIComponent(branchId)}/student-memberships`
  );
}

export function updateStudentMembership(
  membershipId: string,
  data: {
    status?: BranchMembershipStatus;
    isPrimary?: boolean;
  }
) {
  return requestWithStaffToken<StudentBranchMembership>(
    `/admin-tenancy/student-memberships/${encodeURIComponent(membershipId)}`,
    {
      method: "PATCH",
      body: data
    }
  );
}

export function listClassGroups(branchId: string) {
  return requestWithStaffToken<TenancyClassGroup[]>(
    `/admin-tenancy/branches/${encodeURIComponent(branchId)}/class-groups`
  );
}

export function createClassGroup(branchId: string, data: CreateClassGroupPayload) {
  return requestWithStaffToken<TenancyClassGroup>(
    `/admin-tenancy/branches/${encodeURIComponent(branchId)}/class-groups`,
    {
      method: "POST",
      body: data
    }
  );
}

export function updateClassGroup(classGroupId: string, data: UpdateClassGroupPayload) {
  return requestWithStaffToken<TenancyClassGroup>(
    `/admin-tenancy/class-groups/${encodeURIComponent(classGroupId)}`,
    {
      method: "PATCH",
      body: data
    }
  );
}

function toQueryString(params?: Record<string, string | number | undefined>) {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
