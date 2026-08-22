import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { AuthActorType, ROLE_KEYS, StaffStatus } from "@ega/db";
import { AdminStaffService } from "./admin-staff.service";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import type { PasswordService } from "../auth/password.service";
import type { PrismaService } from "../database/prisma.service";
import type { CreateStaffUserDto } from "./dto/admin-staff.dto";

type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

type MockRole = {
  id: string;
  key: RoleKey;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Array<{ permission: { key: string } }>;
};

type MockStaffUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  status: StaffStatus;
  inviteAcceptedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockStaffUserRole = {
  id: string;
  staffUserId: string;
  roleId: string;
  assignedByStaffUserId: string | null;
};

type MockState = {
  roles: MockRole[];
  staffUsers: MockStaffUser[];
  staffUserRoles: MockStaffUserRole[];
  auditLogs: Array<Record<string, unknown>>;
};

type MockPrisma = PrismaService & { state: MockState };

type RoleFindManyArgs = {
  where?: {
    key?: {
      in?: string[];
    };
  };
  select?: {
    key?: boolean;
  };
};

type StaffUserFindUniqueArgs = {
  where: {
    id?: string;
    email?: string;
  };
  include?: unknown;
};

type StaffUserCreateRoleInput = {
  assignedBy?: {
    connect: {
      id: string;
    };
  };
  assignedByStaffUserId?: string;
  role: {
    connect: {
      key: string;
    };
  };
};

type StaffUserCreateArgs = {
  data: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    status?: StaffStatus;
    inviteAcceptedAt: Date;
    roles?: {
      create: StaffUserCreateRoleInput[];
    };
  };
  include?: unknown;
};

describe("AdminStaffService.createUser", () => {
  it("creates a staff account with one role", async () => {
    const { auth, service } = createHarness();

    const created = await service.createUser(buildCreateDto(), auth);

    assert.equal(created.email, "new.staff@example.com");
    assert.deepEqual(created.roleKeys, [ROLE_KEYS.branchAdmin]);
  });

  it("creates a staff account with multiple roles", async () => {
    const { auth, prisma, service } = createHarness();
    const roleKeys = [ROLE_KEYS.branchAdmin, ROLE_KEYS.instructor];

    const created = await service.createUser(buildCreateDto({ roleKeys }), auth);
    const staffUser = findStaffUserByEmail(prisma.state, created.email);
    const assignments = findAssignmentsForStaffUser(prisma.state, staffUser.id);

    assert.deepEqual(new Set(created.roleKeys), new Set(roleKeys));
    assert.equal(assignments.length, 2);
  });

  it("points StaffUserRole records to the selected roles", async () => {
    const { auth, prisma, service } = createHarness();
    const roleKeys = [ROLE_KEYS.branchAdmin, ROLE_KEYS.coach];

    await service.createUser(buildCreateDto({ roleKeys }), auth);

    const staffUser = findStaffUserByEmail(prisma.state, "new.staff@example.com");
    const assignedRoleKeys = findAssignmentsForStaffUser(prisma.state, staffUser.id)
      .map((assignment) => findRoleById(prisma.state, assignment.roleId).key)
      .sort();

    assert.deepEqual(assignedRoleKeys, [...roleKeys].sort());
  });

  it("records the authenticated creator on StaffUserRole records", async () => {
    const { auth, prisma, service } = createHarness();

    await service.createUser(
      buildCreateDto({ roleKeys: [ROLE_KEYS.branchAdmin, ROLE_KEYS.instructor] }),
      auth
    );

    const staffUser = findStaffUserByEmail(prisma.state, "new.staff@example.com");
    const assignments = findAssignmentsForStaffUser(prisma.state, staffUser.id);

    assert.ok(assignments.length > 0);
    assert.ok(assignments.every((assignment) => assignment.assignedByStaffUserId === auth.actorId));
  });

  it("returns controlled 409 for duplicate email", async () => {
    const { auth, prisma, service } = createHarness();
    prisma.state.staffUsers.push(
      makeStaffUser({
        id: "staff_existing",
        email: "existing.staff@example.com",
        firstName: "Existing",
        lastName: "Staff"
      })
    );

    await assert.rejects(
      () => service.createUser(buildCreateDto({ email: "Existing.Staff@Example.com" }), auth),
      (error: unknown) => {
        assert.ok(error instanceof ConflictException);
        assert.equal(error.getStatus(), 409);
        return true;
      }
    );
  });

  it("returns controlled 400 for invalid role", async () => {
    const { auth, service } = createHarness();

    await assert.rejects(
      () => service.createUser(buildCreateDto({ roleKeys: ["missing-role"] }), auth),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.equal(error.getStatus(), 400);
        return true;
      }
    );
  });

  it("rolls back partial staff account creation when a later transaction step fails", async () => {
    const { auth, prisma, service } = createHarness({ failAuditCreate: true });

    await assert.rejects(
      () => service.createUser(buildCreateDto({ email: "rollback.staff@example.com" }), auth),
      /audit write failed/
    );

    assert.equal(
      prisma.state.staffUsers.some((staffUser) => staffUser.email === "rollback.staff@example.com"),
      false
    );
    assert.equal(prisma.state.staffUserRoles.length, 0);
  });
});

function createHarness(options: { failAuditCreate?: boolean } = {}) {
  const creator = makeStaffUser({ id: "staff_creator", email: "creator@example.com" });
  const state: MockState = {
    roles: [
      makeRole(ROLE_KEYS.branchAdmin, "Branch Admin"),
      makeRole(ROLE_KEYS.instructor, "Instructor"),
      makeRole(ROLE_KEYS.coach, "Coach")
    ],
    staffUsers: [creator],
    staffUserRoles: [],
    auditLogs: []
  };
  const prisma = createPrismaMock(state, options);
  const passwordService: Pick<PasswordService, "hash"> = {
    hash: async (password: string) => `hashed:${password}`
  };
  const service = new AdminStaffService(prisma, passwordService as PasswordService);

  return {
    auth: makeAuthContext(creator.id),
    prisma,
    service
  };
}

function createPrismaMock(
  state: MockState,
  options: { failAuditCreate?: boolean }
): MockPrisma {
  let nextStaffUserId = 1;
  let nextAssignmentId = 1;

  function makeClient(workingState: MockState) {
    return {
      role: {
        findMany: async (args?: RoleFindManyArgs) => {
          const keys = args?.where?.key?.in;
          const roles = keys
            ? workingState.roles.filter((role) => keys.includes(role.key))
            : workingState.roles;

          if (args?.select?.key) {
            return roles.map((role) => ({ key: role.key }));
          }

          return roles;
        }
      },
      staffUser: {
        findUnique: async (args: StaffUserFindUniqueArgs) => {
          const staffUser = args.where.email
            ? workingState.staffUsers.find((candidate) => candidate.email === args.where.email)
            : workingState.staffUsers.find((candidate) => candidate.id === args.where.id);

          if (!staffUser) {
            return null;
          }

          return args.include ? hydrateStaffUser(staffUser, workingState) : staffUser;
        },
        create: async (args: StaffUserCreateArgs) => {
          if (workingState.staffUsers.some((staffUser) => staffUser.email === args.data.email)) {
            throw new Error("Unique constraint failed on StaffUser.email");
          }

          const staffUser = makeStaffUser({
            id: `staff_${nextStaffUserId++}`,
            email: args.data.email,
            firstName: args.data.firstName,
            lastName: args.data.lastName,
            passwordHash: args.data.passwordHash,
            status: args.data.status ?? StaffStatus.ACTIVE,
            inviteAcceptedAt: args.data.inviteAcceptedAt
          });
          workingState.staffUsers.push(staffUser);

          for (const roleCreate of args.data.roles?.create ?? []) {
            if (roleCreate.assignedByStaffUserId !== undefined) {
              throw new Error("Nested StaffUserRole create must use the assignedBy relation.");
            }

            const role = workingState.roles.find(
              (candidate) => candidate.key === roleCreate.role.connect.key
            );

            if (!role) {
              throw new Error(`Role not found: ${roleCreate.role.connect.key}`);
            }

            workingState.staffUserRoles.push({
              id: `assignment_${nextAssignmentId++}`,
              staffUserId: staffUser.id,
              roleId: role.id,
              assignedByStaffUserId: roleCreate.assignedBy?.connect.id ?? null
            });
          }

          return hydrateStaffUser(staffUser, workingState);
        }
      },
      auditLog: {
        create: async (args: { data: Record<string, unknown> }) => {
          if (options.failAuditCreate) {
            throw new Error("audit write failed");
          }

          workingState.auditLogs.push(args.data);
          return args.data;
        }
      }
    };
  }

  const rootClient = makeClient(state);

  return {
    ...rootClient,
    state,
    $transaction: async <T>(callback: (tx: ReturnType<typeof makeClient>) => Promise<T>) => {
      const workingState = cloneState(state);
      const result = await callback(makeClient(workingState));
      state.roles = workingState.roles;
      state.staffUsers = workingState.staffUsers;
      state.staffUserRoles = workingState.staffUserRoles;
      state.auditLogs = workingState.auditLogs;
      return result;
    }
  } as unknown as MockPrisma;
}

function buildCreateDto(overrides: Partial<CreateStaffUserDto> = {}): CreateStaffUserDto {
  return {
    email: "new.staff@example.com",
    firstName: "New",
    lastName: "Staff",
    password: "password123",
    status: StaffStatus.ACTIVE,
    roleKeys: [ROLE_KEYS.branchAdmin],
    ...overrides
  };
}

function makeAuthContext(actorId: string): AuthenticatedRequestContext {
  return {
    actorId,
    email: "creator@example.com",
    actorType: AuthActorType.STAFF,
    sessionFamily: "session_family",
    roleKeys: [ROLE_KEYS.superAdmin],
    permissionKeys: ["staff.manage", "roles.manage"],
    branchIds: [],
    isSuperAdmin: true,
    branchRoles: []
  };
}

function makeRole(key: RoleKey, name: string): MockRole {
  return {
    id: `role_${key}`,
    key,
    name,
    description: `${name} role`,
    isSystem: true,
    permissions: []
  };
}

function makeStaffUser(overrides: Partial<MockStaffUser> = {}): MockStaffUser {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    id: "staff_default",
    email: "staff@example.com",
    firstName: "Staff",
    lastName: "User",
    passwordHash: "hashed:password123",
    status: StaffStatus.ACTIVE,
    inviteAcceptedAt: now,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function hydrateStaffUser(staffUser: MockStaffUser, state: MockState) {
  return {
    ...staffUser,
    roles: findAssignmentsForStaffUser(state, staffUser.id).map((assignment) => ({
      ...assignment,
      role: findRoleById(state, assignment.roleId)
    }))
  };
}

function findStaffUserByEmail(state: MockState, email: string) {
  const staffUser = state.staffUsers.find((candidate) => candidate.email === email);
  assert.ok(staffUser, `Expected staff user ${email} to exist.`);
  return staffUser;
}

function findAssignmentsForStaffUser(state: MockState, staffUserId: string) {
  return state.staffUserRoles.filter((assignment) => assignment.staffUserId === staffUserId);
}

function findRoleById(state: MockState, roleId: string) {
  const role = state.roles.find((candidate) => candidate.id === roleId);
  assert.ok(role, `Expected role ${roleId} to exist.`);
  return role;
}

function cloneState(state: MockState): MockState {
  return {
    roles: state.roles.map((role) => ({
      ...role,
      permissions: role.permissions.map((entry) => ({ permission: { ...entry.permission } }))
    })),
    staffUsers: state.staffUsers.map((staffUser) => ({ ...staffUser })),
    staffUserRoles: state.staffUserRoles.map((assignment) => ({ ...assignment })),
    auditLogs: state.auditLogs.map((auditLog) => ({ ...auditLog }))
  };
}
