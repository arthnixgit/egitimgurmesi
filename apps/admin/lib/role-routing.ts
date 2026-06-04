export type StaffRouteContext = {
  roleKeys?: string[];
  permissionKeys?: string[];
};

const SUPER_ADMIN_ROLES = new Set(["super-admin", "admin"]);
const BRANCH_ADMIN_ROLES = new Set(["branch-admin"]);
const INSTRUCTOR_ROLES = new Set(["instructor"]);
const COACH_ROLES = new Set(["coach"]);
const ACCOUNTANT_ROLES = new Set(["accountant", "accounting"]);

export function normalizeRoleKeys(roleKeys?: string[]) {
  return new Set((roleKeys ?? []).map((role) => role.toLowerCase()));
}

export function isSuperAdminRole(roleKeys?: string[]) {
  const roles = normalizeRoleKeys(roleKeys);
  return [...SUPER_ADMIN_ROLES].some((role) => roles.has(role));
}

export function isBranchAdminRole(roleKeys?: string[]) {
  const roles = normalizeRoleKeys(roleKeys);
  return [...BRANCH_ADMIN_ROLES].some((role) => roles.has(role));
}

export function isInstructorRole(roleKeys?: string[]) {
  const roles = normalizeRoleKeys(roleKeys);
  return [...INSTRUCTOR_ROLES].some((role) => roles.has(role));
}

export function isCoachRole(roleKeys?: string[]) {
  const roles = normalizeRoleKeys(roleKeys);
  return [...COACH_ROLES].some((role) => roles.has(role));
}

export function isAccountantRole(roleKeys?: string[]) {
  const roles = normalizeRoleKeys(roleKeys);
  return [...ACCOUNTANT_ROLES].some((role) => roles.has(role));
}

export function getStaffDefaultRoute(context: StaffRouteContext) {
  const roleKeys = context.roleKeys ?? [];

  if (isSuperAdminRole(roleKeys)) {
    return "/platform";
  }

  if (isBranchAdminRole(roleKeys)) {
    return "/sube";
  }

  if (isInstructorRole(roleKeys)) {
    return "/egitmen";
  }

  if (isCoachRole(roleKeys)) {
    return "/koc";
  }

  if (isAccountantRole(roleKeys)) {
    return "/finans";
  }

  return "/platform";
}

export function getPrimaryRoleLabel(roleKeys?: string[]) {
  if (isSuperAdminRole(roleKeys)) {
    return "Platform yöneticisi";
  }

  if (isBranchAdminRole(roleKeys)) {
    return "Şube yöneticisi";
  }

  if (isInstructorRole(roleKeys)) {
    return "Eğitmen";
  }

  if (isCoachRole(roleKeys)) {
    return "Koç";
  }

  if (isAccountantRole(roleKeys)) {
    return "Finans yetkilisi";
  }

  return "Personel";
}
