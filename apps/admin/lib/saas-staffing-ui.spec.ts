import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  alreadyAssignedMessage,
  branchAssignmentButtonLabel,
  branchConnectionDescription,
  branchConnectionTitle,
  canShowClassGroupStaffingAction,
  classGroupCreateLinkLabel,
  classGroupStaffingActionLabel,
  classGroupStaffingDescription,
  classGroupStaffingEmptyMessage,
  classGroupStaffingRoleMissingMessage,
  classGroupStaffingTitle,
  getAvailableClassGroupsForStaffing,
  noClassGroupForStaffingMessage
} from "./saas-staffing-ui";
import type { BranchStaffAssignment } from "./admin-tenancy-client";
import type { BranchStaffClassGroupAssignments } from "./operations-client";

describe("SaaS branch and classroom staffing UI policy", () => {
  it("explains branch-level assignment separately from classroom staffing", () => {
    assert.equal(branchConnectionTitle, "Şube Bağlantısı");
    assert.match(branchConnectionDescription, /personeli seçili şubeye bağlar/);
    assert.equal(classGroupStaffingTitle, "Sınıf / Grup Görevlendirmesi");
    assert.match(classGroupStaffingDescription, /görev yapacakları sınıf veya gruplara/);
  });

  it("uses the branch-scoped button label", () => {
    assert.equal(branchAssignmentButtonLabel, "Şubeye Ata");
  });

  it("shows classroom action for explicit instructor and coach roles", () => {
    assert.equal(canShowClassGroupStaffingAction(assignment("INSTRUCTOR", ["instructor"])), true);
    assert.equal(canShowClassGroupStaffingAction(assignment("COACH", ["coach"])), true);
  });

  it("does not show classroom action for accountant, ordinary staff, or platform accounts", () => {
    assert.equal(canShowClassGroupStaffingAction(assignment("ACCOUNTANT", ["accounting"])), false);
    assert.equal(canShowClassGroupStaffingAction(assignment("STAFF", ["staff"])), false);
    assert.equal(canShowClassGroupStaffingAction(assignment("INSTRUCTOR", ["super-admin", "instructor"])), false);
  });

  it("requires compatible global and branch roles", () => {
    assert.equal(canShowClassGroupStaffingAction(assignment("INSTRUCTOR", ["coach"])), false);
    assert.equal(canShowClassGroupStaffingAction(assignment("COACH", ["instructor"])), false);
    assert.equal(canShowClassGroupStaffingAction(assignment("INSTRUCTOR", ["instructor"], "REVOKED")), false);
  });

  it("returns role-specific action labels and missing-role guidance", () => {
    assert.equal(classGroupStaffingActionLabel("instructor"), "Eğitmen Olarak Ata");
    assert.equal(classGroupStaffingActionLabel("coach"), "Koç Olarak Ata");
    assert.equal(
      classGroupStaffingRoleMissingMessage("instructor"),
      "Bu personelin seçili şubede aktif eğitmen yetkisi bulunmuyor."
    );
    assert.equal(
      classGroupStaffingRoleMissingMessage("coach"),
      "Bu personelin seçili şubede aktif koç yetkisi bulunmuyor."
    );
  });

  it("shows no-class/group guidance and creation link copy", () => {
    assert.equal(classGroupStaffingEmptyMessage(snapshot({ classGroups: [] }), "instructor"), noClassGroupForStaffingMessage);
    assert.equal(classGroupCreateLinkLabel, "Sınıf / Grup Oluştur");
  });

  it("removes already assigned class/groups from eligible choices", () => {
    const current = snapshot({
      instructorAssignments: [
        {
          assignmentId: "assignment_1",
          classGroupId: "group_a",
          classGroupName: "Group A",
          isActive: true,
          startsAt: "2026-08-24T09:00:00.000Z"
        }
      ]
    });

    assert.deepEqual(
      getAvailableClassGroupsForStaffing(current, "instructor").map((group) => group.id),
      ["group_b"]
    );
  });

  it("shows already-assigned guidance when there is no remaining eligible group", () => {
    assert.equal(
      classGroupStaffingEmptyMessage(
        snapshot({
          classGroups: [{ id: "group_a", name: "Group A", slug: "group-a", status: "ACTIVE" }],
          availableInstructorClassGroups: [],
          instructorAssignments: [
            {
              assignmentId: "assignment_1",
              classGroupId: "group_a",
              classGroupName: "Group A",
              isActive: true,
              startsAt: "2026-08-24T09:00:00.000Z"
            }
          ]
        }),
        "instructor"
      ),
      alreadyAssignedMessage
    );
  });
});

function assignment(
  roleKey: BranchStaffAssignment["roleKey"],
  globalRoleKeys: string[],
  status: BranchStaffAssignment["status"] = "ACTIVE"
): BranchStaffAssignment {
  return {
    id: `assignment_${roleKey}`,
    organizationId: "org_a",
    branchId: "branch_a",
    branch: { id: "branch_a", name: "Merkez Şube", slug: "merkez-sube" },
    staffUserId: `staff_${roleKey}`,
    staffUser: {
      id: `staff_${roleKey}`,
      displayName: `${roleKey} User`,
      firstName: roleKey,
      lastName: "User",
      email: `${roleKey}@example.com`,
      status: "ACTIVE",
      roles: globalRoleKeys.map((key) => ({ id: `role_${key}`, key, name: key }))
    },
    roleKey,
    status,
    isPrimary: true,
    assignedAt: "2026-08-24T09:00:00.000Z"
  };
}

function snapshot(
  input: Partial<BranchStaffClassGroupAssignments> = {}
): BranchStaffClassGroupAssignments {
  const classGroups =
    input.classGroups ?? [
      { id: "group_a", name: "Group A", slug: "group-a", status: "ACTIVE" },
      { id: "group_b", name: "Group B", slug: "group-b", status: "ACTIVE" }
    ];
  const instructorAssignments = input.instructorAssignments ?? [];
  const assignedInstructorGroupIds = new Set(instructorAssignments.map((assignment) => assignment.classGroupId));

  return {
    staff: { id: "staff_instructor", name: "Instructor Test", email: "instructor@example.com" },
    branch: { id: "branch_a", name: "Merkez Şube" },
    roles: { instructor: true, coach: true, ...(input.roles ?? {}) },
    classGroups,
    instructorAssignments,
    coachAssignments: input.coachAssignments ?? [],
    availableInstructorClassGroups:
      input.availableInstructorClassGroups ??
      classGroups.filter((classGroup) => !assignedInstructorGroupIds.has(classGroup.id)),
    availableCoachClassGroups: input.availableCoachClassGroups ?? classGroups
  };
}
