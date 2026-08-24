import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import {
  AuthActorType,
  PERMISSION_KEYS,
  ROLE_KEYS,
  StaffBranchRole,
  StaffStatus
} from "@ega/db";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import type { PrismaService } from "../database/prisma.service";
import { OperationsService } from "./operations.service";

type MockClassGroup = {
  id: string;
  organizationId: string;
  branchId: string;
  slug: string;
  name: string;
  description: string | null;
  gradeLevel: string | null;
  studyTrack: string | null;
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockBranch = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
};

type MockStaffUser = {
  id: string;
  organizationId: string | null;
  primaryBranchId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  status: StaffStatus;
  roles: string[];
};

type MockBranchStaffAssignment = {
  id: string;
  organizationId: string;
  branchId: string;
  staffUserId: string;
  roleKey: StaffBranchRole;
  isPrimary: boolean;
  assignedAt: Date;
  revokedAt: Date | null;
};

type MockStaffClassGroupAssignment = {
  id: string;
  organizationId: string;
  branchId: string;
  classGroupId: string | null;
  staffUserId: string;
  startsAt: Date;
  isActive: boolean;
  assignedByStaffUserId: string | null;
};

type MockState = {
  branches: MockBranch[];
  classGroups: MockClassGroup[];
  staffUsers: MockStaffUser[];
  branchStaffAssignments: MockBranchStaffAssignment[];
  instructorAssignments: MockStaffClassGroupAssignment[];
  coachAssignments: MockStaffClassGroupAssignment[];
  auditLogs: Array<Record<string, unknown>>;
};

type PrismaArgs = {
  where?: any;
  data?: any;
  include?: any;
  orderBy?: any;
  take?: number;
  skip?: number;
};

describe("OperationsService branch classroom staff assignment", () => {
  it("lists only groups in branch-admin auth.branchIds", async () => {
    const { service } = createHarness();

    const dashboard = await service.getStaffDashboard(branchAdminAuth());

    assert.deepEqual(
      dashboard.classGroups.map((group) => group.id),
      ["group_a"]
    );
  });

  it("returns branch-specific eligible assignment candidates", async () => {
    const { service } = createHarness();

    const candidates = await service.listClassGroupAssignmentCandidates("group_a", branchAdminAuth());

    assert.deepEqual(
      candidates.instructors.map((candidate) => candidate.staffUserId),
      ["staff_instructor"]
    );
    assert.deepEqual(
      candidates.coaches.map((candidate) => candidate.staffUserId),
      ["staff_coach"]
    );
  });

  it("keeps selected-group candidates branch-specific for organization admin", async () => {
    const { service } = createHarness();

    const candidates = await service.listClassGroupAssignmentCandidates("group_a", orgAdminAuth());

    assert.deepEqual(
      candidates.instructors.map((candidate) => candidate.staffUserId),
      ["staff_instructor"]
    );
  });

  it("lets branch admin assign own-branch instructor and coach", async () => {
    const { service, state } = createHarness();
    const auth = branchAdminAuth();

    const instructor = await service.assignInstructorToClassGroup(
      "group_a",
      { staffUserId: "staff_instructor" },
      auth
    );
    const coach = await service.assignCoachToClassGroup("group_a", { staffUserId: "staff_coach" }, auth);

    assert.equal(instructor.staffUserId, "staff_instructor");
    assert.equal(coach.staffUserId, "staff_coach");
    assert.equal(state.instructorAssignments.length, 2);
    assert.equal(state.coachAssignments.length, 1);
  });

  it("lets organization admin assign within its organization branch", async () => {
    const { service } = createHarness();

    const assignment = await service.assignInstructorToClassGroup(
      "group_a",
      { staffUserId: "staff_instructor" },
      orgAdminAuth()
    );

    assert.equal(assignment.staffUserId, "staff_instructor");
  });

  it("lets super admin assign eligible branch staff but still requires branch eligibility", async () => {
    const { service } = createHarness();

    const assignment = await service.assignCoachToClassGroup(
      "group_a",
      { staffUserId: "staff_coach" },
      superAdminAuth()
    );

    assert.equal(assignment.staffUserId, "staff_coach");
    await assert.rejects(
      () =>
        service.assignInstructorToClassGroup(
          "group_a",
          { staffUserId: "staff_other_branch_instructor" },
          superAdminAuth()
        ),
      hasBadRequestMessage("Bu personel seçilen şubeye bağlı değildir.")
    );
  });

  it("rejects guessed cross-branch and cross-organization staff ids", async () => {
    const { service } = createHarness();
    const auth = branchAdminAuth();

    await assert.rejects(
      () =>
        service.assignInstructorToClassGroup(
          "group_a",
          { staffUserId: "staff_other_branch_instructor" },
          auth
        ),
      hasBadRequestMessage("Bu personel seçilen şubeye bağlı değildir.")
    );
    await assert.rejects(
      () =>
        service.assignInstructorToClassGroup(
          "group_a",
          { staffUserId: "staff_other_org_instructor" },
          orgAdminAuth()
        ),
      hasBadRequestMessage("Bu personel seçilen şubeye bağlı değildir.")
    );
  });

  it("rejects suspended staff and staff with wrong branch role", async () => {
    const { service } = createHarness();
    const auth = branchAdminAuth();

    await assert.rejects(
      () =>
        service.assignInstructorToClassGroup(
          "group_a",
          { staffUserId: "staff_suspended_instructor" },
          auth
        ),
      hasBadRequestMessage("Askıdaki personel sınıf veya gruba atanamaz.")
    );
    await assert.rejects(
      () =>
        service.assignInstructorToClassGroup(
          "group_a",
          { staffUserId: "staff_wrong_branch_role" },
          auth
        ),
      hasBadRequestMessage("Seçilen personelin bu şubede eğitmen yetkisi bulunmuyor.")
    );
  });

  it("rejects privileged platform accounts", async () => {
    const { service } = createHarness();

    await assert.rejects(
      () =>
        service.assignInstructorToClassGroup(
          "group_a",
          { staffUserId: "staff_privileged_instructor" },
          superAdminAuth()
        ),
      hasBadRequestMessage("Seçilen personelin bu şubede eğitmen yetkisi bulunmuyor.")
    );
  });

  it("returns an existing active assignment instead of creating a duplicate", async () => {
    const { service, state } = createHarness();
    const before = state.instructorAssignments.length;

    const assignment = await service.assignInstructorToClassGroup(
      "group_a",
      { staffUserId: "staff_already_assigned_instructor" },
      branchAdminAuth()
    );

    assert.equal(assignment.id, "instructor_assignment_existing");
    assert.equal(state.instructorAssignments.length, before);
  });

  it("returns 403 for staff without assignment permission without clearing session context", async () => {
    const { service } = createHarness();
    const auth = branchAdminAuth({ permissionKeys: [PERMISSION_KEYS.dashboardRead] });

    await assert.rejects(
      () => service.listClassGroupAssignmentCandidates("group_a", auth),
      (error: unknown) => {
        assert.ok(error instanceof ForbiddenException);
        assert.equal(error.getStatus(), 403);
        assert.equal(auth.sessionFamily, "session_family");
        return true;
      }
    );
  });

  it("lists a selected staff member's branch-scoped class/group assignments", async () => {
    const { service, state } = createHarness();
    state.classGroups.push({
      ...classGroup("group_archived", "org_a", "branch_a", "Archived Group"),
      status: "ARCHIVED"
    });

    const snapshot = await service.listBranchStaffClassGroupAssignments(
      "branch_a",
      "staff_already_assigned_instructor",
      branchAdminAuth()
    );

    assert.deepEqual(snapshot.classGroups.map((group) => group.id), ["group_a"]);
    assert.deepEqual(snapshot.availableInstructorClassGroups.map((group) => group.id), []);
    assert.equal(snapshot.instructorAssignments[0]?.assignmentId, "instructor_assignment_existing");
    assert.equal(snapshot.instructorAssignments[0]?.classGroupName, "Group A");
    assert.deepEqual(snapshot.availableCoachClassGroups, []);
  });

  it("excludes another branch and organization from staff class/group assignment reads", async () => {
    const { service } = createHarness();

    const snapshot = await service.listBranchStaffClassGroupAssignments(
      "branch_a",
      "staff_instructor",
      branchAdminAuth()
    );

    assert.deepEqual(snapshot.classGroups.map((group) => group.id), ["group_a"]);
    assert.doesNotMatch(JSON.stringify(snapshot), /group_b/);
    assert.doesNotMatch(JSON.stringify(snapshot), /group_other_org/);
  });

  it("displays existing coach assignments in the staff-centric read flow", async () => {
    const { service, state } = createHarness();
    state.coachAssignments.push({
      id: "coach_assignment_existing",
      organizationId: "org_a",
      branchId: "branch_a",
      classGroupId: "group_a",
      staffUserId: "staff_coach",
      startsAt: new Date("2026-08-23T09:30:00.000Z"),
      isActive: true,
      assignedByStaffUserId: "staff_branch_admin"
    });

    const snapshot = await service.listBranchStaffClassGroupAssignments(
      "branch_a",
      "staff_coach",
      branchAdminAuth()
    );

    assert.equal(snapshot.roles.coach, true);
    assert.equal(snapshot.coachAssignments[0]?.assignmentId, "coach_assignment_existing");
    assert.equal(snapshot.coachAssignments[0]?.classGroupName, "Group A");
    assert.deepEqual(snapshot.availableCoachClassGroups.map((group) => group.id), []);
  });

  it("rejects staff-centric reads for wrong branch role, revoked, suspended, and privileged staff", async () => {
    const { service } = createHarness();
    const auth = branchAdminAuth();

    await assert.rejects(
      () => service.listBranchStaffClassGroupAssignments("branch_a", "staff_other_branch_instructor", auth),
      hasBadRequestMessage("Bu personel veya sınıf seçili şube kapsamında değildir.")
    );
    await assert.rejects(
      () => service.listBranchStaffClassGroupAssignments("branch_a", "staff_revoked_instructor", auth),
      hasBadRequestMessage("Bu personel veya sınıf seçili şube kapsamında değildir.")
    );
    await assert.rejects(
      () => service.listBranchStaffClassGroupAssignments("branch_a", "staff_suspended_instructor", auth),
      hasBadRequestMessage("Askıdaki personel sınıf veya gruba atanamaz.")
    );
    await assert.rejects(
      () => service.listBranchStaffClassGroupAssignments("branch_a", "staff_privileged_instructor", superAdminAuth()),
      hasBadRequestMessage("Bu personel veya sınıf seçili şube kapsamında değildir.")
    );
  });

  it("prevents assigning to archived class/groups", async () => {
    const { service, state } = createHarness();
    state.classGroups.push({
      ...classGroup("group_archived", "org_a", "branch_a", "Archived Group"),
      status: "ARCHIVED"
    });

    await assert.rejects(
      () =>
        service.assignInstructorToClassGroup(
          "group_archived",
          { staffUserId: "staff_instructor" },
          branchAdminAuth()
        ),
      hasBadRequestMessage("Seçili sınıf veya grup aktif değildir.")
    );
  });
});

function createHarness() {
  const state = createState();
  const prisma = createPrismaMock(state);

  return {
    state,
    prisma,
    service: new OperationsService(prisma as unknown as PrismaService)
  };
}

function createState(): MockState {
  const now = new Date("2026-08-23T09:00:00.000Z");

  return {
    branches: [
      { id: "branch_a", organizationId: "org_a", name: "Branch A", slug: "branch-a" },
      { id: "branch_b", organizationId: "org_a", name: "Branch B", slug: "branch-b" },
      { id: "branch_other_org", organizationId: "org_b", name: "Branch Other", slug: "branch-other" }
    ],
    classGroups: [
      classGroup("group_a", "org_a", "branch_a", "Group A"),
      classGroup("group_b", "org_a", "branch_b", "Group B"),
      classGroup("group_other_org", "org_b", "branch_other_org", "Group Other")
    ],
    staffUsers: [
      staff("staff_instructor", "org_a", StaffStatus.ACTIVE, [ROLE_KEYS.instructor]),
      staff("staff_coach", "org_a", StaffStatus.ACTIVE, [ROLE_KEYS.coach]),
      staff("staff_other_branch_instructor", "org_a", StaffStatus.ACTIVE, [ROLE_KEYS.instructor]),
      staff("staff_other_org_instructor", "org_b", StaffStatus.ACTIVE, [ROLE_KEYS.instructor]),
      staff("staff_revoked_instructor", "org_a", StaffStatus.ACTIVE, [ROLE_KEYS.instructor]),
      staff("staff_suspended_instructor", "org_a", StaffStatus.SUSPENDED, [ROLE_KEYS.instructor]),
      staff("staff_wrong_branch_role", "org_a", StaffStatus.ACTIVE, [ROLE_KEYS.instructor]),
      staff("staff_privileged_instructor", "org_a", StaffStatus.ACTIVE, [
        ROLE_KEYS.superAdmin,
        ROLE_KEYS.instructor
      ]),
      staff("staff_already_assigned_instructor", "org_a", StaffStatus.ACTIVE, [ROLE_KEYS.instructor]),
      staff("staff_branch_admin_only", "org_a", StaffStatus.ACTIVE, [ROLE_KEYS.branchAdmin])
    ],
    branchStaffAssignments: [
      branchStaff("bsa_instructor", "org_a", "branch_a", "staff_instructor", StaffBranchRole.INSTRUCTOR),
      branchStaff("bsa_coach", "org_a", "branch_a", "staff_coach", StaffBranchRole.COACH),
      branchStaff(
        "bsa_other_branch_instructor",
        "org_a",
        "branch_b",
        "staff_other_branch_instructor",
        StaffBranchRole.INSTRUCTOR
      ),
      branchStaff(
        "bsa_other_org_instructor",
        "org_b",
        "branch_other_org",
        "staff_other_org_instructor",
        StaffBranchRole.INSTRUCTOR
      ),
      {
        ...branchStaff(
          "bsa_revoked_instructor",
          "org_a",
          "branch_a",
          "staff_revoked_instructor",
          StaffBranchRole.INSTRUCTOR
        ),
        revokedAt: now
      },
      branchStaff(
        "bsa_suspended_instructor",
        "org_a",
        "branch_a",
        "staff_suspended_instructor",
        StaffBranchRole.INSTRUCTOR
      ),
      branchStaff(
        "bsa_wrong_branch_role",
        "org_a",
        "branch_a",
        "staff_wrong_branch_role",
        StaffBranchRole.COACH
      ),
      branchStaff(
        "bsa_privileged_instructor",
        "org_a",
        "branch_a",
        "staff_privileged_instructor",
        StaffBranchRole.INSTRUCTOR
      ),
      branchStaff(
        "bsa_already_assigned_instructor",
        "org_a",
        "branch_a",
        "staff_already_assigned_instructor",
        StaffBranchRole.INSTRUCTOR
      ),
      branchStaff(
        "bsa_branch_admin_only",
        "org_a",
        "branch_a",
        "staff_branch_admin_only",
        StaffBranchRole.BRANCH_ADMIN
      )
    ],
    instructorAssignments: [
      {
        id: "instructor_assignment_existing",
        organizationId: "org_a",
        branchId: "branch_a",
        classGroupId: "group_a",
        staffUserId: "staff_already_assigned_instructor",
        startsAt: now,
        isActive: true,
        assignedByStaffUserId: "staff_branch_admin"
      }
    ],
    coachAssignments: [],
    auditLogs: []
  };
}

function createPrismaMock(state: MockState) {
  return {
    branch: {
      findMany: async (args: PrismaArgs = {}) =>
        state.branches.filter((branch) => matchesBranchWhere(branch, args.where)),
      findUnique: async (args: PrismaArgs) =>
        state.branches.find((branch) => branch.id === args.where.id) ?? null
    },
    classGroup: {
      findMany: async (args: PrismaArgs = {}) =>
        state.classGroups
          .filter((group) => matchesClassGroupWhere(group, args.where))
          .map((group) => classGroupWithRelations(state, group)),
      findUnique: async (args: PrismaArgs) => {
        const group = state.classGroups.find((entry) => entry.id === args.where.id);
        return group ? classGroupWithRelations(state, group) : null;
      },
      count: async (args: PrismaArgs = {}) =>
        state.classGroups.filter((group) => matchesClassGroupWhere(group, args.where)).length
    },
    studentBranchMembership: {
      count: async () => 0
    },
    branchStaffAssignment: {
      count: async (args: PrismaArgs = {}) =>
        state.branchStaffAssignments.filter((assignment) =>
          matchesBranchStaffAssignmentWhere(state, assignment, args.where)
        ).length,
      findMany: async (args: PrismaArgs = {}) =>
        state.branchStaffAssignments
          .filter((assignment) => matchesBranchStaffAssignmentWhere(state, assignment, args.where))
          .map((assignment) => ({
            ...assignment,
            staffUser: staffSelect(findStaff(state, assignment.staffUserId))
          }))
    },
    staffUser: {
      findUnique: async (args: PrismaArgs) => {
        const staffUser = state.staffUsers.find((entry) => entry.id === args.where.id);

        if (!staffUser) {
          return null;
        }

        return {
          ...staffUser,
          roles: staffUser.roles.map((roleKey) => ({ role: { key: roleKey } })),
          branchAssignments: state.branchStaffAssignments.filter(
            (assignment) =>
              assignment.staffUserId === staffUser.id &&
              matchesBranchStaffAssignmentWhere(state, assignment, args.include?.branchAssignments?.where)
          )
        };
      }
    },
    instructorAssignment: staffAssignmentDelegate(state, "instructor"),
    coachAssignment: staffAssignmentDelegate(state, "coach"),
    classGroupStudent: {
      findMany: async () => []
    },
    liveSession: {
      findMany: async () => []
    },
    announcement: {
      findMany: async () => []
    },
    payment: {
      findMany: async () => []
    },
    order: {
      findMany: async () => []
    },
    coachingPlan: {
      findMany: async () => []
    },
    coachingNote: {
      findMany: async () => []
    },
    auditLog: {
      create: async (args: PrismaArgs) => {
        state.auditLogs.push(args.data);
        return args.data;
      }
    }
  };
}

function staffAssignmentDelegate(state: MockState, kind: "instructor" | "coach") {
  const list = kind === "instructor" ? state.instructorAssignments : state.coachAssignments;
  const relationName = kind === "instructor" ? "instructor" : "coach";

  return {
    findMany: async (args: PrismaArgs = {}) =>
      list
        .filter((entry) => matchesStaffClassGroupAssignmentWhere(state, entry, args.where))
        .map((assignment) => staffClassGroupAssignmentWithRelation(state, assignment, relationName)),
    findFirst: async (args: PrismaArgs = {}) => {
      const assignment =
        list.find((entry) => matchesStaffClassGroupAssignmentWhere(state, entry, args.where)) ?? null;

      return assignment ? staffClassGroupAssignmentWithRelation(state, assignment, relationName) : null;
    },
    create: async (args: PrismaArgs) => {
      const assignment: MockStaffClassGroupAssignment = {
        id: `${kind}_assignment_${list.length + 1}`,
        organizationId: args.data.organizationId,
        branchId: args.data.branchId,
        classGroupId: args.data.classGroupId,
        staffUserId: args.data.staffUserId,
        startsAt: new Date("2026-08-23T10:00:00.000Z"),
        isActive: true,
        assignedByStaffUserId: args.data.assignedByStaffUserId ?? null
      };

      list.push(assignment);
      return staffClassGroupAssignmentWithRelation(state, assignment, relationName);
    }
  };
}

function classGroup(id: string, organizationId: string, branchId: string, name: string): MockClassGroup {
  return {
    id,
    organizationId,
    branchId,
    slug: id,
    name,
    description: null,
    gradeLevel: null,
    studyTrack: null,
    status: "ACTIVE",
    startsAt: null,
    endsAt: null,
    createdAt: new Date("2026-08-23T08:00:00.000Z"),
    updatedAt: new Date("2026-08-23T08:00:00.000Z")
  };
}

function staff(
  id: string,
  organizationId: string,
  status: StaffStatus,
  roles: string[]
): MockStaffUser {
  return {
    id,
    organizationId,
    primaryBranchId: "branch_a",
    email: `${id}@example.com`,
    firstName: id,
    lastName: "User",
    status,
    roles
  };
}

function branchStaff(
  id: string,
  organizationId: string,
  branchId: string,
  staffUserId: string,
  roleKey: StaffBranchRole
): MockBranchStaffAssignment {
  return {
    id,
    organizationId,
    branchId,
    staffUserId,
    roleKey,
    isPrimary: true,
    assignedAt: new Date("2026-08-23T08:30:00.000Z"),
    revokedAt: null
  };
}

function branchAdminAuth(input?: Partial<AuthenticatedRequestContext>): AuthenticatedRequestContext {
  return {
    actorId: "staff_branch_admin",
    email: "branch.admin@example.com",
    actorType: AuthActorType.STAFF,
    sessionFamily: "session_family",
    roleKeys: [ROLE_KEYS.branchAdmin],
    permissionKeys: [
      PERMISSION_KEYS.dashboardRead,
      PERMISSION_KEYS.classesManage,
      PERMISSION_KEYS.assignmentsManage
    ],
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
    ],
    ...input
  };
}

function orgAdminAuth(): AuthenticatedRequestContext {
  return {
    actorId: "staff_org_admin",
    email: "org.admin@example.com",
    actorType: AuthActorType.STAFF,
    sessionFamily: "session_family",
    roleKeys: [ROLE_KEYS.admin],
    permissionKeys: [
      PERMISSION_KEYS.dashboardRead,
      PERMISSION_KEYS.classesManage,
      PERMISSION_KEYS.assignmentsManage
    ],
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

function hasBadRequestMessage(message: string) {
  return (error: unknown) => {
    assert.ok(error instanceof BadRequestException);
    assert.equal(error.getStatus(), 400);
    assert.equal(exceptionMessage(error), message);
    return true;
  };
}

function exceptionMessage(error: BadRequestException | ForbiddenException) {
  const response = error.getResponse();
  return typeof response === "string" ? response : String((response as { message: string }).message);
}

function classGroupWithRelations(state: MockState, group: MockClassGroup) {
  return {
    ...group,
    branch: state.branches.find((branch) => branch.id === group.branchId) ?? null,
    _count: {
      students: 0,
      instructorAssignments: state.instructorAssignments.filter(
        (assignment) => assignment.classGroupId === group.id && assignment.isActive
      ).length,
      coachAssignments: state.coachAssignments.filter(
        (assignment) => assignment.classGroupId === group.id && assignment.isActive
      ).length,
      liveSessions: 0
    }
  };
}

function findStaff(state: MockState, staffUserId: string) {
  const staffUser = state.staffUsers.find((entry) => entry.id === staffUserId);

  if (!staffUser) {
    throw new Error(`Missing mock staff user: ${staffUserId}`);
  }

  return staffUser;
}

function staffSelect(staffUser: MockStaffUser) {
  return {
    id: staffUser.id,
    firstName: staffUser.firstName,
    lastName: staffUser.lastName,
    email: staffUser.email
  };
}

function staffClassGroupAssignmentWithRelation(
  state: MockState,
  assignment: MockStaffClassGroupAssignment,
  relationName: "instructor" | "coach"
) {
  return {
    ...assignment,
    [relationName]: staffSelect(findStaff(state, assignment.staffUserId)),
    classGroup: state.classGroups
      .filter((classGroup) => classGroup.id === assignment.classGroupId)
      .map((classGroup) => ({ id: classGroup.id, name: classGroup.name }))
      [0] ?? null
  };
}

function matchesBranchWhere(branch: MockBranch, where: any) {
  if (!where) {
    return true;
  }

  if (where.id === "__none__") {
    return false;
  }

  if (where.id?.in && !where.id.in.includes(branch.id)) {
    return false;
  }

  if (where.organizationId && branch.organizationId !== where.organizationId) {
    return false;
  }

  return true;
}

function matchesClassGroupWhere(group: MockClassGroup, where: any) {
  if (!where) {
    return true;
  }

  if (where.id === "__none__") {
    return false;
  }

  if (where.branchId?.in && !where.branchId.in.includes(group.branchId)) {
    return false;
  }

  if (where.branchId && typeof where.branchId === "string" && group.branchId !== where.branchId) {
    return false;
  }

  if (where.organizationId && group.organizationId !== where.organizationId) {
    return false;
  }

  if (where.status && group.status !== where.status) {
    return false;
  }

  return true;
}

function matchesBranchStaffAssignmentWhere(
  state: MockState,
  assignment: MockBranchStaffAssignment,
  where: any
) {
  if (!where) {
    return true;
  }

  if (where.id === "__none__") {
    return false;
  }

  if (where.organizationId && assignment.organizationId !== where.organizationId) {
    return false;
  }

  if (where.branchId?.in && !where.branchId.in.includes(assignment.branchId)) {
    return false;
  }

  if (where.branchId && typeof where.branchId === "string" && assignment.branchId !== where.branchId) {
    return false;
  }

  if (where.roleKey && assignment.roleKey !== where.roleKey) {
    return false;
  }

  if (where.revokedAt === null && assignment.revokedAt !== null) {
    return false;
  }

  if (where.staffUser && !matchesStaffUserWhere(state, findStaff(state, assignment.staffUserId), where.staffUser)) {
    return false;
  }

  return true;
}

function matchesStaffUserWhere(state: MockState, staffUser: MockStaffUser, where: any) {
  if (where.organizationId && staffUser.organizationId !== where.organizationId) {
    return false;
  }

  if (where.status && staffUser.status !== where.status) {
    return false;
  }

  const requiredRole = where.roles?.some?.role?.key;

  if (requiredRole && !staffUser.roles.includes(requiredRole)) {
    return false;
  }

  const deniedRoles = where.NOT?.roles?.some?.role?.key?.in ?? [];

  if (staffUser.roles.some((roleKey) => deniedRoles.includes(roleKey))) {
    return false;
  }

  const instructorNone = where.instructorAssignments?.none;

  if (
    instructorNone &&
    state.instructorAssignments.some(
      (assignment) =>
        assignment.staffUserId === staffUser.id &&
        assignment.classGroupId === instructorNone.classGroupId &&
        assignment.isActive === instructorNone.isActive
    )
  ) {
    return false;
  }

  const coachNone = where.coachAssignments?.none;

  if (
    coachNone &&
    state.coachAssignments.some(
      (assignment) =>
        assignment.staffUserId === staffUser.id &&
        assignment.classGroupId === coachNone.classGroupId &&
        assignment.isActive === coachNone.isActive
    )
  ) {
    return false;
  }

  return true;
}

function matchesStaffClassGroupAssignmentWhere(
  state: MockState,
  assignment: MockStaffClassGroupAssignment,
  where: any
) {
  if (!where) {
    return true;
  }

  if (where.classGroupId !== undefined && assignment.classGroupId !== where.classGroupId) {
    if (where.classGroupId?.not !== undefined && assignment.classGroupId !== where.classGroupId.not) {
      return true;
    }

    return false;
  }

  if (where.organizationId !== undefined && assignment.organizationId !== where.organizationId) {
    return false;
  }

  if (where.branchId !== undefined && assignment.branchId !== where.branchId) {
    return false;
  }

  if (where.staffUserId !== undefined && assignment.staffUserId !== where.staffUserId) {
    return false;
  }

  if (where.isActive !== undefined && assignment.isActive !== where.isActive) {
    return false;
  }

  if (where.classGroup?.status !== undefined) {
    const classGroup = state.classGroups.find((group) => group.id === assignment.classGroupId);
    if (!classGroup || classGroup.status !== where.classGroup.status) {
      return false;
    }
  }

  return true;
}
