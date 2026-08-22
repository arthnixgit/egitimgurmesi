import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { AuthActorType, BranchMembershipStatus, ROLE_KEYS } from "@ega/db";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import type { PrismaService } from "../database/prisma.service";
import { AdminTenancyService } from "./admin-tenancy.service";

describe("AdminTenancyService student isolation", () => {
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
        roleKey: "BRANCH_ADMIN",
        isPrimary: true
      }
    ]
  };
}
