import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { AuthActorType, ROLE_KEYS, StaffBranchRole } from "@ega/db";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import {
  ROLE_ASSIGNMENT_DENIED_MESSAGE,
  STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE,
  assertBranchRoleAssignmentAllowed,
  assertRoleAssignmentAllowed,
  assertStaffCreationAllowed,
  assertStaffTargetReadable,
  assertStaffTargetWritable,
  buildBranchAssignmentWhereInput,
  buildStaffUserWhereInput,
  canReadStaffTarget,
  canWriteStaffTarget,
  deriveBranchRoleFromRoleKeys,
  deriveBranchRolesFromRoleKeys,
  resolveStaffManagementScope,
  type StaffManagementTarget
} from "./staff-management-scope";

describe("staff management scope policy", () => {
  it("allows super admin to read, write, and assign privileged roles globally", () => {
    const scope = resolveStaffManagementScope(makeAuth({ roleKeys: [ROLE_KEYS.superAdmin], isSuperAdmin: true }));
    const target = makeTarget({ roleKeys: [ROLE_KEYS.superAdmin], organizationId: null, branchIds: [] });

    assert.equal(canReadStaffTarget(scope, target), true);
    assert.equal(canWriteStaffTarget(scope, target), true);
    assert.doesNotThrow(() => assertRoleAssignmentAllowed(scope, [ROLE_KEYS.superAdmin, ROLE_KEYS.technician]));
    assert.deepEqual(buildStaffUserWhereInput(scope), {});
  });

  it("treats admin as organization-scoped only when organizationId is present", () => {
    const scope = resolveStaffManagementScope(makeAuth({ roleKeys: [ROLE_KEYS.admin], organizationId: "org_a" }));

    assert.equal(scope.kind, "organization");
    assert.equal(scope.hasValidScope, true);
    assert.deepEqual(scope.assignableRoleKeys, [
      ROLE_KEYS.branchAdmin,
      ROLE_KEYS.instructor,
      ROLE_KEYS.coach,
      ROLE_KEYS.accountant
    ]);
  });

  it("does not let organization admin operate unscoped without organizationId", () => {
    const scope = resolveStaffManagementScope(makeAuth({ roleKeys: [ROLE_KEYS.admin], organizationId: null }));

    assert.equal(scope.kind, "organization");
    assert.equal(scope.hasValidScope, false);
    assert.throws(() => assertStaffCreationAllowed(scope), ForbiddenException);
    assert.deepEqual(buildStaffUserWhereInput(scope), { id: "__none__" });
  });

  it("allows organization admin to read own-organization staff by organizationId", () => {
    const scope = orgScope();
    const target = makeTarget({ organizationId: "org_a", branchIds: [] });

    assert.doesNotThrow(() => assertStaffTargetReadable(scope, target));
  });

  it("allows organization admin to read own-organization staff by active branch assignment", () => {
    const scope = orgScope();
    const target = makeTarget({ organizationId: null, branchIds: ["branch_a"], assignmentOrganizationId: "org_a" });

    assert.equal(canReadStaffTarget(scope, target), true);
  });

  it("denies organization admin direct-ID access to another organization", () => {
    const scope = orgScope();
    const target = makeTarget({ organizationId: "org_b", branchIds: ["branch_b"], assignmentOrganizationId: "org_b" });

    assertDenied(() => assertStaffTargetReadable(scope, target), STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
    assertDenied(() => assertStaffTargetWritable(scope, target), STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
  });

  it("hides super-admin and platform technical accounts from organization admin", () => {
    const scope = orgScope();

    assert.equal(canReadStaffTarget(scope, makeTarget({ roleKeys: [ROLE_KEYS.superAdmin], organizationId: "org_a" })), false);
    assert.equal(canReadStaffTarget(scope, makeTarget({ roleKeys: [ROLE_KEYS.technician], organizationId: "org_a" })), false);
  });

  it("prevents organization admin from modifying another organization admin", () => {
    const scope = orgScope();
    const target = makeTarget({ roleKeys: [ROLE_KEYS.admin], organizationId: "org_a" });

    assert.equal(canReadStaffTarget(scope, target), true);
    assert.equal(canWriteStaffTarget(scope, target), false);
  });

  it("allows organization admin to assign lower operational roles only", () => {
    const scope = orgScope();

    assert.doesNotThrow(() => assertRoleAssignmentAllowed(scope, [ROLE_KEYS.branchAdmin, ROLE_KEYS.instructor]));
    assertDenied(() => assertRoleAssignmentAllowed(scope, [ROLE_KEYS.superAdmin]), ROLE_ASSIGNMENT_DENIED_MESSAGE);
    assertDenied(() => assertRoleAssignmentAllowed(scope, [ROLE_KEYS.technician]), ROLE_ASSIGNMENT_DENIED_MESSAGE);
  });

  it("allows branch admin to read only active staff in authorized branches", () => {
    const scope = branchScope();

    assert.equal(canReadStaffTarget(scope, makeTarget({ branchIds: ["branch_a"] })), true);
    assert.equal(canReadStaffTarget(scope, makeTarget({ branchIds: ["branch_b"] })), false);
    assert.equal(
      canReadStaffTarget(scope, makeTarget({ branchIds: ["branch_a"], revokedAt: new Date("2026-01-01") })),
      false
    );
  });

  it("prevents branch admin from seeing super-admin, organization admin, and technical accounts", () => {
    const scope = branchScope();

    assert.equal(canReadStaffTarget(scope, makeTarget({ branchIds: ["branch_a"], roleKeys: [ROLE_KEYS.superAdmin] })), false);
    assert.equal(canReadStaffTarget(scope, makeTarget({ branchIds: ["branch_a"], roleKeys: [ROLE_KEYS.admin] })), false);
    assert.equal(canReadStaffTarget(scope, makeTarget({ branchIds: ["branch_a"], roleKeys: [ROLE_KEYS.technician] })), false);
  });

  it("prevents branch admin from modifying equal branch admins", () => {
    const scope = branchScope();
    const target = makeTarget({ branchIds: ["branch_a"], roleKeys: [ROLE_KEYS.branchAdmin] });

    assert.equal(canReadStaffTarget(scope, target), true);
    assert.equal(canWriteStaffTarget(scope, target), false);
  });

  it("prevents branch admin direct-ID writes to super admin", () => {
    const scope = branchScope();
    const target = makeTarget({ branchIds: ["branch_a"], roleKeys: [ROLE_KEYS.superAdmin] });

    assertDenied(() => assertStaffTargetWritable(scope, target), STAFF_ACCOUNT_ACCESS_DENIED_MESSAGE);
  });

  it("allows branch admin to assign only lower branch-safe roles", () => {
    const scope = branchScope();

    assert.doesNotThrow(() => assertRoleAssignmentAllowed(scope, [ROLE_KEYS.instructor, ROLE_KEYS.coach]));
    assertDenied(() => assertRoleAssignmentAllowed(scope, [ROLE_KEYS.admin]), ROLE_ASSIGNMENT_DENIED_MESSAGE);
    assertDenied(() => assertRoleAssignmentAllowed(scope, [ROLE_KEYS.branchAdmin]), ROLE_ASSIGNMENT_DENIED_MESSAGE);
    assertDenied(() => assertRoleAssignmentAllowed(scope, [ROLE_KEYS.technician]), ROLE_ASSIGNMENT_DENIED_MESSAGE);
  });

  it("prevents branch admin with no branches from reading data or creating staff", () => {
    const scope = resolveStaffManagementScope(makeAuth({ roleKeys: [ROLE_KEYS.branchAdmin], branchIds: [] }));

    assert.equal(scope.kind, "branch");
    assert.equal(scope.hasValidScope, false);
    assert.throws(() => assertStaffCreationAllowed(scope), ForbiddenException);
    assert.deepEqual(buildStaffUserWhereInput(scope), { id: "__none__" });
  });

  it("filters multi-branch assignment metadata to caller-authorized branches", () => {
    const scope = branchScope();

    assert.deepEqual(buildBranchAssignmentWhereInput(scope), {
      branchId: { in: ["branch_a"] },
      revokedAt: null
    });
  });

  it("builds organization branch-assignment filters without leaking other organizations", () => {
    const scope = orgScope();

    assert.deepEqual(buildBranchAssignmentWhereInput(scope), {
      organizationId: "org_a",
      revokedAt: null
    });
  });

  it("validates branch operational role allowlists", () => {
    assert.doesNotThrow(() => assertBranchRoleAssignmentAllowed(orgScope(), StaffBranchRole.BRANCH_ADMIN));
    assertDenied(
      () => assertBranchRoleAssignmentAllowed(branchScope(), StaffBranchRole.BRANCH_ADMIN),
      ROLE_ASSIGNMENT_DENIED_MESSAGE
    );
    assert.doesNotThrow(() => assertBranchRoleAssignmentAllowed(branchScope(), StaffBranchRole.INSTRUCTOR));
  });

  it("derives branch operational role from selected global role", () => {
    assert.equal(deriveBranchRoleFromRoleKeys([ROLE_KEYS.branchAdmin]), StaffBranchRole.BRANCH_ADMIN);
    assert.equal(deriveBranchRoleFromRoleKeys([ROLE_KEYS.instructor]), StaffBranchRole.INSTRUCTOR);
    assert.equal(deriveBranchRoleFromRoleKeys([ROLE_KEYS.coach]), StaffBranchRole.COACH);
    assert.equal(deriveBranchRoleFromRoleKeys([ROLE_KEYS.accountant]), StaffBranchRole.ACCOUNTANT);
  });

  it("derives every branch operational role from multiple selected global roles", () => {
    assert.deepEqual(
      deriveBranchRolesFromRoleKeys([ROLE_KEYS.instructor, ROLE_KEYS.coach]),
      [StaffBranchRole.INSTRUCTOR, StaffBranchRole.COACH]
    );
    assert.deepEqual(
      deriveBranchRolesFromRoleKeys([ROLE_KEYS.coach], StaffBranchRole.INSTRUCTOR),
      [StaffBranchRole.INSTRUCTOR, StaffBranchRole.COACH]
    );
  });

  it("denies custom staff.manage roles without an explicit scoped policy", () => {
    const scope = resolveStaffManagementScope(makeAuth({ roleKeys: ["custom-staff-manager"] }));

    assert.equal(scope.kind, "none");
    assert.equal(scope.hasPolicy, false);
  });
});

function orgScope() {
  return resolveStaffManagementScope(
    makeAuth({ roleKeys: [ROLE_KEYS.admin], organizationId: "org_a", branchIds: [] })
  );
}

function branchScope() {
  return resolveStaffManagementScope(
    makeAuth({
      roleKeys: [ROLE_KEYS.branchAdmin],
      organizationId: "org_a",
      branchIds: ["branch_a"]
    })
  );
}

function makeAuth(overrides: Partial<AuthenticatedRequestContext> = {}): AuthenticatedRequestContext {
  return {
    actorId: "staff_actor",
    email: "staff@example.com",
    actorType: AuthActorType.STAFF,
    sessionFamily: "session_family",
    roleKeys: [],
    permissionKeys: ["staff.manage"],
    organizationId: null,
    primaryBranchId: null,
    branchIds: [],
    isSuperAdmin: false,
    branchRoles: [],
    ...overrides
  };
}

function makeTarget(input: {
  organizationId?: string | null;
  roleKeys?: string[];
  branchIds?: string[];
  assignmentOrganizationId?: string;
  revokedAt?: Date | null;
} = {}): StaffManagementTarget {
  const assignmentOrganizationId = input.assignmentOrganizationId ?? input.organizationId ?? "org_a";

  return {
    id: "staff_target",
    organizationId: input.organizationId === undefined ? "org_a" : input.organizationId,
    roleKeys: input.roleKeys ?? [ROLE_KEYS.instructor],
    branchAssignments: (input.branchIds ?? ["branch_a"]).map((branchId) => ({
      organizationId: assignmentOrganizationId,
      branchId,
      revokedAt: input.revokedAt ?? null
    }))
  };
}

function assertDenied(action: () => void, message: string) {
  assert.throws(
    action,
    (error: unknown) => {
      assert.ok(error instanceof ForbiddenException);
      assert.equal(error.message, message);
      return true;
    }
  );
}
