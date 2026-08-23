import { ForbiddenException } from "@nestjs/common";
import { Prisma, ROLE_KEYS, StaffBranchRole } from "@ega/db";
import type { AuthenticatedRequestContext } from "../auth/auth.types";

const NONE_ID = "__none__";

export const STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE =
  "Bu personel hesabını görüntüleme veya değiştirme yetkiniz bulunmuyor.";
export const ROLE_ASSIGNMENT_DENIED_MESSAGE = "Bu rolü atama yetkiniz bulunmuyor.";

const ORGANIZATION_ASSIGNABLE_ROLE_KEYS = [
  ROLE_KEYS.branchAdmin,
  ROLE_KEYS.instructor,
  ROLE_KEYS.coach,
  ROLE_KEYS.accountant
];

const BRANCH_ASSIGNABLE_ROLE_KEYS = [
  ROLE_KEYS.instructor,
  ROLE_KEYS.coach,
  ROLE_KEYS.accountant
];

const ORGANIZATION_READ_DENIED_ROLE_KEYS = [
  ROLE_KEYS.superAdmin,
  ROLE_KEYS.technician,
  ROLE_KEYS.accounting
];

const ORGANIZATION_WRITE_DENIED_ROLE_KEYS = [
  ROLE_KEYS.superAdmin,
  ROLE_KEYS.admin,
  ROLE_KEYS.technician,
  ROLE_KEYS.accounting
];

const BRANCH_READ_DENIED_ROLE_KEYS = [
  ROLE_KEYS.superAdmin,
  ROLE_KEYS.admin,
  ROLE_KEYS.technician,
  ROLE_KEYS.accounting
];

const BRANCH_WRITE_DENIED_ROLE_KEYS = [
  ...BRANCH_READ_DENIED_ROLE_KEYS,
  ROLE_KEYS.branchAdmin
];

const ORGANIZATION_ASSIGNABLE_BRANCH_ROLES = [
  StaffBranchRole.BRANCH_ADMIN,
  StaffBranchRole.INSTRUCTOR,
  StaffBranchRole.COACH,
  StaffBranchRole.ACCOUNTANT,
  StaffBranchRole.STAFF
];

const BRANCH_ASSIGNABLE_BRANCH_ROLES = [
  StaffBranchRole.INSTRUCTOR,
  StaffBranchRole.COACH,
  StaffBranchRole.ACCOUNTANT,
  StaffBranchRole.STAFF
];

export type StaffManagementScopeKind = "super" | "organization" | "branch" | "none";

export type StaffManagementScope = {
  kind: StaffManagementScopeKind;
  hasPolicy: boolean;
  hasValidScope: boolean;
  organizationId: string | null;
  branchIds: string[];
  assignableRoleKeys: string[] | null;
  canManageRoles: boolean;
  canCreateUnassignedStaff: boolean;
};

export type StaffManagementTarget = {
  id?: string;
  organizationId?: string | null;
  roleKeys: string[];
  branchAssignments: Array<{
    organizationId: string;
    branchId: string;
    revokedAt?: Date | string | null;
  }>;
};

export function resolveStaffManagementScope(
  auth: AuthenticatedRequestContext
): StaffManagementScope {
  if (auth.isSuperAdmin) {
    return {
      kind: "super",
      hasPolicy: true,
      hasValidScope: true,
      organizationId: auth.organizationId ?? null,
      branchIds: uniqueValues(auth.branchIds),
      assignableRoleKeys: null,
      canManageRoles: true,
      canCreateUnassignedStaff: true
    };
  }

  if (auth.roleKeys.includes(ROLE_KEYS.admin)) {
    const organizationId = auth.organizationId ?? null;

    return {
      kind: "organization",
      hasPolicy: true,
      hasValidScope: Boolean(organizationId),
      organizationId,
      branchIds: uniqueValues(auth.branchIds),
      assignableRoleKeys: [...ORGANIZATION_ASSIGNABLE_ROLE_KEYS],
      canManageRoles: false,
      canCreateUnassignedStaff: Boolean(organizationId)
    };
  }

  if (auth.roleKeys.includes(ROLE_KEYS.branchAdmin)) {
    const branchIds = uniqueValues(auth.branchIds);

    return {
      kind: "branch",
      hasPolicy: true,
      hasValidScope: branchIds.length > 0,
      organizationId: auth.organizationId ?? null,
      branchIds,
      assignableRoleKeys: [...BRANCH_ASSIGNABLE_ROLE_KEYS],
      canManageRoles: false,
      canCreateUnassignedStaff: false
    };
  }

  return {
    kind: "none",
    hasPolicy: false,
    hasValidScope: false,
    organizationId: auth.organizationId ?? null,
    branchIds: uniqueValues(auth.branchIds),
    assignableRoleKeys: [],
    canManageRoles: false,
    canCreateUnassignedStaff: false
  };
}

export function buildStaffUserWhereInput(
  scope: StaffManagementScope
): Prisma.StaffUserWhereInput {
  if (scope.kind === "super") {
    return {};
  }

  if (!scope.hasValidScope) {
    return { id: NONE_ID };
  }

  if (scope.kind === "organization") {
    return {
      AND: [
        {
          OR: [
            { organizationId: scope.organizationId },
            {
              branchAssignments: {
                some: {
                  organizationId: scope.organizationId ?? NONE_ID,
                  revokedAt: null
                }
              }
            }
          ]
        },
        staffRoleDenyWhere(ORGANIZATION_READ_DENIED_ROLE_KEYS)
      ]
    };
  }

  if (scope.kind === "branch") {
    return {
      AND: [
        {
          branchAssignments: {
            some: {
              branchId: { in: scope.branchIds },
              revokedAt: null
            }
          }
        },
        staffRoleDenyWhere(BRANCH_READ_DENIED_ROLE_KEYS)
      ]
    };
  }

  return { id: NONE_ID };
}

export function buildBranchAssignmentWhereInput(
  scope: StaffManagementScope
): Prisma.BranchStaffAssignmentWhereInput {
  if (scope.kind === "super") {
    return { revokedAt: null };
  }

  if (!scope.hasValidScope) {
    return { id: NONE_ID };
  }

  if (scope.kind === "organization") {
    return {
      organizationId: scope.organizationId ?? NONE_ID,
      revokedAt: null
    };
  }

  if (scope.kind === "branch") {
    return {
      branchId: { in: scope.branchIds },
      revokedAt: null
    };
  }

  return { id: NONE_ID };
}

export function buildVisibleBranchWhereInput(
  scope: StaffManagementScope
): Prisma.BranchWhereInput {
  if (scope.kind === "super") {
    return {};
  }

  if (!scope.hasValidScope) {
    return { id: NONE_ID };
  }

  if (scope.kind === "organization") {
    return { organizationId: scope.organizationId ?? NONE_ID };
  }

  if (scope.kind === "branch") {
    return { id: { in: scope.branchIds } };
  }

  return { id: NONE_ID };
}

export function buildVisibleOrganizationWhereInput(
  scope: StaffManagementScope
): Prisma.OrganizationWhereInput {
  if (scope.kind === "super") {
    return {};
  }

  if (!scope.hasValidScope) {
    return { id: NONE_ID };
  }

  if (scope.organizationId) {
    return { id: scope.organizationId };
  }

  if (scope.kind === "branch") {
    return {
      branches: {
        some: {
          id: { in: scope.branchIds }
        }
      }
    };
  }

  return { id: NONE_ID };
}

export function canReadStaffTarget(
  scope: StaffManagementScope,
  target: StaffManagementTarget
) {
  if (scope.kind === "super") {
    return true;
  }

  if (!scope.hasValidScope) {
    return false;
  }

  if (scope.kind === "organization") {
    return (
      isTargetInOrganization(scope, target) &&
      !hasAnyRole(target.roleKeys, ORGANIZATION_READ_DENIED_ROLE_KEYS)
    );
  }

  if (scope.kind === "branch") {
    return (
      hasActiveAssignmentInBranches(target, scope.branchIds) &&
      !hasAnyRole(target.roleKeys, BRANCH_READ_DENIED_ROLE_KEYS)
    );
  }

  return false;
}

export function canWriteStaffTarget(
  scope: StaffManagementScope,
  target: StaffManagementTarget
) {
  if (!canReadStaffTarget(scope, target)) {
    return false;
  }

  if (scope.kind === "organization") {
    return !hasAnyRole(target.roleKeys, ORGANIZATION_WRITE_DENIED_ROLE_KEYS);
  }

  if (scope.kind === "branch") {
    return !hasAnyRole(target.roleKeys, BRANCH_WRITE_DENIED_ROLE_KEYS);
  }

  return scope.kind === "super";
}

export function assertStaffTargetReadable(
  scope: StaffManagementScope,
  target: StaffManagementTarget
) {
  if (!canReadStaffTarget(scope, target)) {
    throw new ForbiddenException(STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
  }
}

export function assertStaffTargetWritable(
  scope: StaffManagementScope,
  target: StaffManagementTarget
) {
  if (!canWriteStaffTarget(scope, target)) {
    throw new ForbiddenException(STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
  }
}

export function assertStaffCreationAllowed(scope: StaffManagementScope) {
  if (!scope.hasPolicy || !scope.hasValidScope) {
    throw new ForbiddenException(STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
  }
}

export function assertRoleAssignmentAllowed(
  scope: StaffManagementScope,
  roleKeys: string[]
) {
  if (scope.kind === "super") {
    return;
  }

  if (!scope.hasValidScope || !scope.assignableRoleKeys) {
    throw new ForbiddenException(ROLE_ASSIGNMENT_DENIED_MESSAGE);
  }

  const allowed = new Set(scope.assignableRoleKeys);
  const forbiddenRole = roleKeys.find((roleKey) => !allowed.has(roleKey));

  if (forbiddenRole) {
    throw new ForbiddenException(ROLE_ASSIGNMENT_DENIED_MESSAGE);
  }
}

export function assertBranchRoleAssignmentAllowed(
  scope: StaffManagementScope,
  branchRoleKey: StaffBranchRole
) {
  if (scope.kind === "super") {
    return;
  }

  const allowed =
    scope.kind === "organization"
      ? ORGANIZATION_ASSIGNABLE_BRANCH_ROLES
      : scope.kind === "branch"
        ? BRANCH_ASSIGNABLE_BRANCH_ROLES
        : [];

  if (!scope.hasValidScope || !allowed.includes(branchRoleKey)) {
    throw new ForbiddenException(ROLE_ASSIGNMENT_DENIED_MESSAGE);
  }
}

export function deriveBranchRoleFromRoleKeys(roleKeys: string[]) {
  if (roleKeys.includes(ROLE_KEYS.branchAdmin)) {
    return StaffBranchRole.BRANCH_ADMIN;
  }

  if (roleKeys.includes(ROLE_KEYS.instructor)) {
    return StaffBranchRole.INSTRUCTOR;
  }

  if (roleKeys.includes(ROLE_KEYS.coach)) {
    return StaffBranchRole.COACH;
  }

  if (roleKeys.includes(ROLE_KEYS.accountant)) {
    return StaffBranchRole.ACCOUNTANT;
  }

  return StaffBranchRole.STAFF;
}

export function deriveBranchRolesFromRoleKeys(
  roleKeys: string[],
  requestedBranchRoleKey?: StaffBranchRole
) {
  const branchRoleKeys: StaffBranchRole[] = [];

  if (requestedBranchRoleKey) {
    branchRoleKeys.push(requestedBranchRoleKey);
  }

  if (roleKeys.includes(ROLE_KEYS.branchAdmin)) {
    branchRoleKeys.push(StaffBranchRole.BRANCH_ADMIN);
  }

  if (roleKeys.includes(ROLE_KEYS.instructor)) {
    branchRoleKeys.push(StaffBranchRole.INSTRUCTOR);
  }

  if (roleKeys.includes(ROLE_KEYS.coach)) {
    branchRoleKeys.push(StaffBranchRole.COACH);
  }

  if (roleKeys.includes(ROLE_KEYS.accountant)) {
    branchRoleKeys.push(StaffBranchRole.ACCOUNTANT);
  }

  return uniqueValues(branchRoleKeys.length ? branchRoleKeys : [StaffBranchRole.STAFF]);
}

export function isOrganizationAdminContext(auth: AuthenticatedRequestContext) {
  return !auth.isSuperAdmin && auth.roleKeys.includes(ROLE_KEYS.admin);
}

export function isBranchAdminContext(auth: AuthenticatedRequestContext) {
  return !auth.isSuperAdmin && auth.roleKeys.includes(ROLE_KEYS.branchAdmin);
}

function staffRoleDenyWhere(roleKeys: string[]): Prisma.StaffUserWhereInput {
  return {
    NOT: {
      roles: {
        some: {
          role: {
            key: { in: roleKeys }
          }
        }
      }
    }
  };
}

function isTargetInOrganization(
  scope: StaffManagementScope,
  target: StaffManagementTarget
) {
  const organizationId = scope.organizationId;

  if (!organizationId) {
    return false;
  }

  return (
    target.organizationId === organizationId ||
    target.branchAssignments.some(
      (assignment) =>
        assignment.organizationId === organizationId && assignment.revokedAt == null
    )
  );
}

function hasActiveAssignmentInBranches(
  target: StaffManagementTarget,
  branchIds: string[]
) {
  const branchIdSet = new Set(branchIds);

  return target.branchAssignments.some(
    (assignment) => assignment.revokedAt == null && branchIdSet.has(assignment.branchId)
  );
}

function hasAnyRole(roleKeys: string[], deniedRoleKeys: string[]) {
  const denied = new Set(deniedRoleKeys);
  return roleKeys.some((roleKey) => denied.has(roleKey));
}

function uniqueValues<T extends string>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
