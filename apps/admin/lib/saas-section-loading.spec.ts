import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAssignableBranchStaffRoles,
  getBranchStaffAssignmentDisplay,
  getBranchAccessMessage,
  getSaasSectionLoadPlan,
  noAuthorizedBranchMessage,
  resolveInitialBranchId,
  shouldClearStaffSessionForSaasError,
  shouldShowReadOnlyBranchLabel,
  type StaffBranchRoleValue,
  type StaffOverviewLike,
  type TenancyScopeLike
} from "./saas-section-loading";

const allRoles: Array<{ value: StaffBranchRoleValue; label: string }> = [
  { value: "BRANCH_ADMIN", label: "Şube Yöneticisi" },
  { value: "INSTRUCTOR", label: "Eğitmen" },
  { value: "COACH", label: "Koç" },
  { value: "ACCOUNTANT", label: "Finans Yetkilisi" },
  { value: "STAFF", label: "Personel" }
];

describe("SaaS section loading policy", () => {
  it("lets branch admin open staff assignments without calling organizations", () => {
    const plan = getSaasSectionLoadPlan("staffAssignments", branchAdminOverview(), branchScope(["branch_a"]));

    assert.equal(plan.unavailableMessage, "");
    assert.equal(plan.loadBranches, true);
    assert.equal(plan.loadStaffAssignments, true);
    assert.equal(plan.loadStaffDirectory, true);
    assert.equal(plan.staffDirectoryRequiresSelectedBranch, true);
    assert.equal(plan.loadOrganizations, false);
  });

  it("preselects the only branch for a branch admin and renders it read-only", () => {
    const scope = branchScope(["branch_a"], "branch_a");
    const branches = [{ id: "branch_a", organizationId: "org_a" }];

    assert.equal(resolveInitialBranchId(branches, scope), "branch_a");
    assert.equal(shouldShowReadOnlyBranchLabel(branchAdminOverview(), scope, branches), true);
  });

  it("uses primary branch first for a multi-branch branch admin", () => {
    assert.equal(
      resolveInitialBranchId(
        [
          { id: "branch_b", organizationId: "org_a" },
          { id: "branch_a", organizationId: "org_a" }
        ],
        branchScope(["branch_a", "branch_b"], "branch_a")
      ),
      "branch_a"
    );
  });

  it("shows a controlled empty state when branch admin has no active branches", () => {
    assert.equal(getBranchAccessMessage(branchAdminOverview(), branchScope([]), []), noAuthorizedBranchMessage);
  });

  it("keeps unrelated 403 errors from being treated as logout", () => {
    assert.equal(shouldClearStaffSessionForSaasError({ status: 403 }), false);
    assert.equal(shouldClearStaffSessionForSaasError({ status: 401 }), true);
  });

  it("lets student membership and class-group sections load without organizations.read for branch admin", () => {
    const studentPlan = getSaasSectionLoadPlan("studentMemberships", branchAdminOverview(), branchScope(["branch_a"]));
    const classGroupPlan = getSaasSectionLoadPlan("classGroups", branchAdminOverview(), branchScope(["branch_a"]));

    assert.equal(studentPlan.unavailableMessage, "");
    assert.equal(studentPlan.loadOrganizations, false);
    assert.equal(studentPlan.loadBranches, true);
    assert.equal(studentPlan.loadStudentMemberships, true);

    assert.equal(classGroupPlan.unavailableMessage, "");
    assert.equal(classGroupPlan.loadOrganizations, false);
    assert.equal(classGroupPlan.loadBranches, true);
    assert.equal(classGroupPlan.loadClassGroups, true);
  });

  it("scopes organization admin to organization-aware section loading", () => {
    const plan = getSaasSectionLoadPlan("staffAssignments", orgAdminOverview(), orgScope());

    assert.equal(plan.unavailableMessage, "");
    assert.equal(plan.loadOrganizations, true);
    assert.equal(plan.loadBranches, true);
    assert.equal(plan.staffDirectoryRequiresSelectedBranch, false);
  });

  it("preserves super admin global behavior", () => {
    const plan = getSaasSectionLoadPlan("staffAssignments", superAdminOverview(), superScope());

    assert.equal(plan.unavailableMessage, "");
    assert.equal(plan.loadOrganizations, true);
    assert.equal(plan.loadBranches, true);
    assert.equal(plan.staffDirectoryRequiresSelectedBranch, false);
  });

  it("removes Branch Admin from branch-admin assignable role options", () => {
    assert.deepEqual(
      getAssignableBranchStaffRoles(branchAdminOverview(), branchScope(["branch_a"]), allRoles).map((role) => role.value),
      ["INSTRUCTOR", "COACH", "ACCOUNTANT", "STAFF"]
    );
  });

  it("formats existing own-branch instructor assignments without raw ids as the primary label", () => {
    const display = getBranchStaffAssignmentDisplay(
      {
        staffUserId: "staff_instructor",
        branch: {
          name: "Merkez Şube"
        },
        staffUser: {
          displayName: "Ayşe Eğitmen",
          email: "ayse@example.com"
        },
        roleKey: "INSTRUCTOR",
        status: "ACTIVE",
        isPrimary: true
      },
      "Eğitmen"
    );

    assert.equal(display.title, "Ayşe Eğitmen");
    assert.equal(display.meta, "ayse@example.com · Merkez Şube · Eğitmen · Aktif · Birincil şube");
    assert.doesNotMatch(display.title, /staff_instructor/);
  });

  it("formats existing own-branch coach assignments with revoked and secondary state", () => {
    const display = getBranchStaffAssignmentDisplay(
      {
        staffUserId: "staff_coach",
        branch: {
          name: "Merkez Şube"
        },
        staffUser: {
          displayName: "Can Koç",
          email: "can@example.com"
        },
        roleKey: "COACH",
        status: "REVOKED",
        isPrimary: false
      },
      "Koç"
    );

    assert.equal(display.title, "Can Koç");
    assert.equal(display.meta, "can@example.com · Merkez Şube · Koç · Pasif · İkincil şube");
  });
});

function branchAdminOverview(): StaffOverviewLike {
  return {
    roleKeys: ["branch-admin"],
    permissionKeys: ["branches.read", "assignments.read", "assignments.manage", "classes.read", "classes.manage"]
  };
}

function orgAdminOverview(): StaffOverviewLike {
  return {
    roleKeys: ["admin"],
    permissionKeys: ["organizations.read", "branches.read", "assignments.read", "assignments.manage"]
  };
}

function superAdminOverview(): StaffOverviewLike {
  return {
    roleKeys: ["super-admin"],
    permissionKeys: []
  };
}

function branchScope(branchIds: string[], primaryBranchId: string | null = null): TenancyScopeLike {
  return {
    actor: {
      organizationId: "org_a",
      primaryBranchId,
      branchIds,
      isSuperAdmin: false
    }
  };
}

function orgScope(): TenancyScopeLike {
  return {
    actor: {
      organizationId: "org_a",
      primaryBranchId: null,
      branchIds: [],
      isSuperAdmin: false
    }
  };
}

function superScope(): TenancyScopeLike {
  return {
    actor: {
      organizationId: null,
      primaryBranchId: null,
      branchIds: [],
      isSuperAdmin: true
    }
  };
}
