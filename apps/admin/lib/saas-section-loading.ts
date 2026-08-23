export type SaasSectionKey =
  | "overview"
  | "organizations"
  | "centers"
  | "branches"
  | "staffAssignments"
  | "studentMemberships"
  | "classGroups"
  | "scope";

export type StaffBranchRoleValue = "BRANCH_ADMIN" | "INSTRUCTOR" | "COACH" | "ACCOUNTANT" | "STAFF";

export type StaffOverviewLike = {
  roleKeys: string[];
  permissionKeys: string[];
};

export type TenancyScopeLike = {
  actor: {
    organizationId?: string | null;
    primaryBranchId?: string | null;
    branchIds: string[];
    isSuperAdmin: boolean;
  };
};

export type BranchLike = {
  id: string;
  organizationId?: string | null;
};

export type BranchStaffAssignmentDisplayLike = {
  staffUserId: string;
  staffUser?: {
    displayName?: string | null;
    email?: string | null;
  } | null;
  roleKey: StaffBranchRoleValue;
  status?: "ACTIVE" | "REVOKED" | string;
  isPrimary: boolean;
};

export type SaasSectionLoadPlan = {
  loadOrganizations: boolean;
  loadBranches: boolean;
  loadEducationCenters: boolean;
  loadStaffDirectory: boolean;
  staffDirectoryRequiresSelectedBranch: boolean;
  loadStudentDirectory: boolean;
  studentDirectoryRequiresSelectedBranch: boolean;
  loadClassGroups: boolean;
  loadStaffAssignments: boolean;
  loadStudentMemberships: boolean;
  unavailableMessage: string;
};

export const noAuthorizedBranchMessage =
  "Bu hesap için aktif bir şube ataması bulunmuyor. Şube erişiminizi kurum yöneticinizle kontrol edin.";

export function hasSaasPermission(overview: StaffOverviewLike | null, permission: string) {
  return Boolean(overview?.permissionKeys.includes(permission) || overview?.roleKeys.includes("super-admin"));
}

export function isSaasBranchAdmin(overview: StaffOverviewLike | null, scope: TenancyScopeLike | null) {
  return Boolean(!scope?.actor.isSuperAdmin && overview?.roleKeys.includes("branch-admin"));
}

export function isSaasOrganizationAdmin(overview: StaffOverviewLike | null, scope: TenancyScopeLike | null) {
  return Boolean(
    !scope?.actor.isSuperAdmin &&
      overview?.roleKeys.includes("admin") &&
      scope?.actor.organizationId
  );
}

export function getSaasSectionLoadPlan(
  section: SaasSectionKey,
  overview: StaffOverviewLike | null,
  scope: TenancyScopeLike | null
): SaasSectionLoadPlan {
  const canReadOrganizations = hasSaasPermission(overview, "organizations.read");
  const canReadBranches = hasSaasPermission(overview, "branches.read");
  const canReadAssignments = hasSaasPermission(overview, "assignments.read");
  const canManageAssignments = hasSaasPermission(overview, "assignments.manage");
  const canReadClasses = hasSaasPermission(overview, "classes.read");
  const branchScoped = isSaasBranchAdmin(overview, scope);

  const plan: SaasSectionLoadPlan = {
    loadOrganizations: false,
    loadBranches: false,
    loadEducationCenters: false,
    loadStaffDirectory: false,
    staffDirectoryRequiresSelectedBranch: false,
    loadStudentDirectory: false,
    studentDirectoryRequiresSelectedBranch: false,
    loadClassGroups: false,
    loadStaffAssignments: false,
    loadStudentMemberships: false,
    unavailableMessage: ""
  };

  switch (section) {
    case "overview":
    case "scope":
      return plan;
    case "organizations":
      plan.loadOrganizations = canReadOrganizations;
      plan.unavailableMessage = canReadOrganizations ? "" : "Bu bölüm için organizasyon görüntüleme yetkiniz bulunmuyor.";
      return plan;
    case "centers":
      plan.loadOrganizations = canReadOrganizations;
      plan.loadEducationCenters = canReadOrganizations;
      plan.unavailableMessage = canReadOrganizations ? "" : "Bu bölüm için eğitim merkezi görüntüleme yetkiniz bulunmuyor.";
      return plan;
    case "branches":
      plan.loadOrganizations = canReadOrganizations && !branchScoped;
      plan.loadBranches = canReadBranches;
      plan.loadEducationCenters = canReadOrganizations && !branchScoped;
      plan.unavailableMessage = canReadBranches ? "" : "Bu bölüm için şube görüntüleme yetkiniz bulunmuyor.";
      return plan;
    case "staffAssignments":
      plan.loadOrganizations = canReadOrganizations && !branchScoped;
      plan.loadBranches = canReadBranches;
      plan.loadStaffAssignments = canReadAssignments;
      plan.loadStaffDirectory = canManageAssignments;
      plan.staffDirectoryRequiresSelectedBranch = branchScoped;
      plan.unavailableMessage =
        canReadBranches && canReadAssignments ? "" : "Bu bölüm için personel ataması görüntüleme yetkiniz bulunmuyor.";
      return plan;
    case "studentMemberships":
      plan.loadOrganizations = canReadOrganizations && !branchScoped;
      plan.loadBranches = canReadBranches;
      plan.loadStudentMemberships = canReadAssignments;
      plan.loadStudentDirectory = canManageAssignments;
      plan.studentDirectoryRequiresSelectedBranch = branchScoped;
      plan.unavailableMessage =
        canReadBranches && canReadAssignments ? "" : "Bu bölüm için öğrenci üyeliği görüntüleme yetkiniz bulunmuyor.";
      return plan;
    case "classGroups":
      plan.loadOrganizations = canReadOrganizations && !branchScoped;
      plan.loadBranches = canReadBranches;
      plan.loadClassGroups = canReadClasses;
      plan.unavailableMessage =
        canReadBranches && canReadClasses ? "" : "Bu bölüm için sınıf/grup görüntüleme yetkiniz bulunmuyor.";
      return plan;
  }
}

export function resolveInitialBranchId(
  branches: BranchLike[],
  scope: TenancyScopeLike | null,
  currentBranchId = ""
) {
  if (currentBranchId && branches.some((branch) => branch.id === currentBranchId)) {
    return currentBranchId;
  }

  const primaryBranchId = scope?.actor.primaryBranchId;

  if (primaryBranchId && branches.some((branch) => branch.id === primaryBranchId)) {
    return primaryBranchId;
  }

  return branches[0]?.id ?? "";
}

export function resolveInitialOrganizationId(
  organizations: Array<{ id: string }>,
  branches: BranchLike[],
  scope: TenancyScopeLike | null,
  currentOrganizationId = ""
) {
  if (currentOrganizationId && organizations.some((organization) => organization.id === currentOrganizationId)) {
    return currentOrganizationId;
  }

  const scopedOrganizationId = scope?.actor.organizationId;

  if (scopedOrganizationId) {
    return scopedOrganizationId;
  }

  return organizations[0]?.id ?? branches[0]?.organizationId ?? "";
}

export function shouldShowReadOnlyBranchLabel(
  overview: StaffOverviewLike | null,
  scope: TenancyScopeLike | null,
  branches: BranchLike[]
) {
  return isSaasBranchAdmin(overview, scope) && branches.length === 1;
}

export function getBranchAccessMessage(
  overview: StaffOverviewLike | null,
  scope: TenancyScopeLike | null,
  branches: BranchLike[]
) {
  if (isSaasBranchAdmin(overview, scope) && (!scope?.actor.branchIds.length || !branches.length)) {
    return noAuthorizedBranchMessage;
  }

  return "";
}

export function getAssignableBranchStaffRoles(
  overview: StaffOverviewLike | null,
  scope: TenancyScopeLike | null,
  allRoles: Array<{ value: StaffBranchRoleValue; label: string }>
) {
  if (!isSaasBranchAdmin(overview, scope)) {
    return allRoles;
  }

  return allRoles.filter((role) => role.value !== "BRANCH_ADMIN");
}

export function getBranchStaffAssignmentDisplay(
  assignment: BranchStaffAssignmentDisplayLike,
  roleLabel: string
) {
  return {
    title: assignment.staffUser?.displayName || assignment.staffUser?.email || "Personel hesabı",
    meta: [
      assignment.staffUser?.email || "E-posta yok",
      roleLabel,
      assignment.status === "REVOKED" ? "Pasif" : "Aktif",
      assignment.isPrimary ? "Birincil şube" : "İkincil şube"
    ].join(" · ")
  };
}

export function shouldClearStaffSessionForSaasError(error: unknown) {
  if (typeof error === "object" && error && "status" in error) {
    return (error as { status?: number }).status === 401;
  }

  return (
    error instanceof Error &&
    (error.message === "Staff session is missing." || error.message === "Refresh token is missing.")
  );
}
