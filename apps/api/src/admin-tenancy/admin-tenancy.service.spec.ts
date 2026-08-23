import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { AuthActorType, BranchMembershipStatus, ROLE_KEYS, StaffBranchRole } from "@ega/db";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import type { PrismaService } from "../database/prisma.service";
import { AdminTenancyService } from "./admin-tenancy.service";

describe("AdminTenancyService student isolation", () => {
  it("scopes branch-admin branch listing to auth.branchIds", async () => {
    const prisma = createListBranchesPrismaMock();
    const service = new AdminTenancyService(prisma as unknown as PrismaService);

    await service.listBranches(branchAdminAuth());

    assert.deepEqual(prisma.capturedBranchWhere(), { id: { in: ["branch_a"] } });
  });

  it("scopes organization-admin branch listing to its organization", async () => {
    const prisma = createListBranchesPrismaMock();
    const service = new AdminTenancyService(prisma as unknown as PrismaService);

    await service.listBranches(orgAdminAuth());

    assert.deepEqual(prisma.capturedBranchWhere(), { organizationId: "org_a" });
  });

  it("filters privileged platform accounts from branch-admin staff assignment listing", async () => {
    const prisma = createListBranchStaffAssignmentsPrismaMock();
    const service = new AdminTenancyService(prisma as unknown as PrismaService);

    await service.listBranchStaffAssignments("branch_a", branchAdminAuth());

    assert.deepEqual(prisma.capturedAssignmentWhere(), {
      AND: [
        { branchId: "branch_a", revokedAt: null },
        {
          NOT: {
            staffUser: {
              roles: {
                some: {
                  role: {
                    key: { in: [ROLE_KEYS.superAdmin, ROLE_KEYS.admin, ROLE_KEYS.technician, ROLE_KEYS.accounting] }
                  }
                }
              }
            }
          }
        }
      ]
    });
  });

  it("keeps super-admin branch assignment listing global for the selected branch", async () => {
    const prisma = createListBranchStaffAssignmentsPrismaMock();
    const service = new AdminTenancyService(prisma as unknown as PrismaService);

    await service.listBranchStaffAssignments("branch_a", superAdminAuth());

    assert.deepEqual(prisma.capturedAssignmentWhere(), { branchId: "branch_a" });
  });

  it("excludes super admin accounts from branch-admin assignable staff search", async () => {
    const prisma = createListStaffPrismaMock();
    const service = new AdminTenancyService(prisma as unknown as PrismaService);

    await service.listStaff({ branchId: "branch_a" }, branchAdminAuth());

    const where = JSON.stringify(prisma.capturedStaffWhere());

    assert.ok(where.includes(ROLE_KEYS.superAdmin));
    assert.ok(where.includes(ROLE_KEYS.admin));
    assert.ok(where.includes(ROLE_KEYS.technician));
    assert.ok(where.includes(ROLE_KEYS.accounting));
  });

  it("scopes organization-admin student listing to its organization", async () => {
    const prisma = createListStudentsPrismaMock();
    const service = new AdminTenancyService(prisma as unknown as PrismaService);

    await service.listStudents({}, orgAdminAuth());

    const where = prisma.capturedUserWhere();
    assert.match(JSON.stringify(where), /org_a/);
    assert.doesNotMatch(JSON.stringify(where), /branch_a/);
  });

  it("scopes branch-admin student listing to active authorized branch memberships", async () => {
    const prisma = createListStudentsPrismaMock();
    const service = new AdminTenancyService(prisma as unknown as PrismaService);

    await service.listStudents({}, branchAdminAuth());

    assert.deepEqual(prisma.capturedUserWhere(), {
      AND: [
        {
          OR: [
            { primaryBranchId: { in: ["branch_a"] } },
            {
              branchMemberships: {
                some: {
                  branchId: { in: ["branch_a"] },
                  status: BranchMembershipStatus.ACTIVE
                }
              }
            }
          ]
        }
      ]
    });
  });

  it("denies direct-ID cross-tenant student membership creation", async () => {
    const prisma = createAddStudentPrismaMock();
    const service = new AdminTenancyService(prisma as unknown as PrismaService);

    await assert.rejects(
      () =>
        service.addStudentToBranch(
          "branch_a",
          { userId: "student_other_org", status: BranchMembershipStatus.ACTIVE },
          orgAdminAuth()
        ),
      (error: unknown) => {
        assert.ok(error instanceof ForbiddenException);
        assert.equal(error.getStatus(), 403);
        assert.equal(prisma.transactionCalled, false);
        return true;
      }
    );
  });
});

function createListStudentsPrismaMock() {
  let capturedWhere: unknown = null;

  return {
    capturedUserWhere: () => capturedWhere,
    user: {
      count: async (args: { where: unknown }) => {
        capturedWhere = args.where;
        return 0;
      },
      findMany: async () => []
    }
  };
}

function createListBranchesPrismaMock() {
  let capturedWhere: unknown = null;

  return {
    capturedBranchWhere: () => capturedWhere,
    branch: {
      findMany: async (args: { where: unknown }) => {
        capturedWhere = args.where;
        return [];
      }
    }
  };
}

function createListBranchStaffAssignmentsPrismaMock() {
  let capturedWhere: unknown = null;

  return {
    capturedAssignmentWhere: () => capturedWhere,
    branch: {
      findUnique: async () => ({
        id: "branch_a",
        organizationId: "org_a"
      })
    },
    branchStaffAssignment: {
      findMany: async (args: { where: unknown }) => {
        capturedWhere = args.where;
        return [];
      }
    }
  };
}

function createListStaffPrismaMock() {
  let capturedWhere: unknown = null;

  return {
    capturedStaffWhere: () => capturedWhere,
    branch: {
      findUnique: async () => ({
        id: "branch_a",
        organizationId: "org_a"
      })
    },
    staffUser: {
      count: async (args: { where: unknown }) => {
        capturedWhere = args.where;
        return 0;
      },
      findMany: async () => []
    }
  };
}

function createAddStudentPrismaMock() {
  return {
    transactionCalled: false,
    branch: {
      findUnique: async () => ({
        id: "branch_a",
        organizationId: "org_a"
      })
    },
    user: {
      findUnique: async () => ({
        id: "student_other_org",
        organizationId: "org_b",
        primaryBranchId: "branch_b",
        branchMemberships: [
          {
            organizationId: "org_b",
            branchId: "branch_b",
            status: BranchMembershipStatus.ACTIVE
          }
        ]
      })
    },
    $transaction: async () => {
      throw new Error("transaction should not run");
    }
  };
}

function orgAdminAuth(): AuthenticatedRequestContext {
  return {
    actorId: "staff_org_admin",
    email: "org.admin@example.com",
    actorType: AuthActorType.STAFF,
    sessionFamily: "session_family",
    roleKeys: [ROLE_KEYS.admin],
    permissionKeys: ["staff.manage", "users.manage"],
    organizationId: "org_a",
    primaryBranchId: null,
    branchIds: [],
    isSuperAdmin: false,
    branchRoles: []
  };
}

function superAdminAuth(): AuthenticatedRequestContext {
  return {
    actorId: "staff_super_admin",
    email: "super.admin@example.com",
    actorType: AuthActorType.STAFF,
    sessionFamily: "session_family",
    roleKeys: [ROLE_KEYS.superAdmin],
    permissionKeys: [],
    organizationId: null,
    primaryBranchId: null,
    branchIds: [],
    isSuperAdmin: true,
    branchRoles: []
  };
}

function branchAdminAuth(): AuthenticatedRequestContext {
  return {
    actorId: "staff_branch_admin",
    email: "branch.admin@example.com",
    actorType: AuthActorType.STAFF,
    sessionFamily: "session_family",
    roleKeys: [ROLE_KEYS.branchAdmin],
    permissionKeys: ["staff.manage", "users.manage"],
    organizationId: "org_a",
    primaryBranchId: "branch_a",
    branchIds: ["branch_a"],
    isSuperAdmin: false,
    branchRoles: [
      {
        organizationId: "org_a",
        branchId: "branch_a",
        roleKey: StaffBranchRole.BRANCH_ADMIN,
        isPrimary: true
      }
    ]
  };
}
