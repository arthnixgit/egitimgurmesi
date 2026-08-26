import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  alreadyAssignedMessage,
  assignmentOptionsLoadingMessage,
  branchAssignmentButtonLabel,
  branchConnectionDescription,
  branchConnectionTitle,
  canShowClassGroupStaffingAction,
  classGroupCandidateEmptyMessage,
  classGroupCandidateSelectLabel,
  classGroupCreateLinkLabel,
  classGroupCurrentAssignmentsTitle,
  classGroupStaffingActionLabel,
  classGroupStaffingDescription,
  classGroupStaffingEmptyMessage,
  classGroupStaffingRoleMissingMessage,
  classGroupStaffingSuccessMessage,
  classGroupStaffingTitle,
  coachAssignmentSuccessMessage,
  currentPersonnelConnectionsTitle,
  getAvailableClassGroupsForStaffing,
  getClassGroupAssignmentCandidatesForRole,
  getClassGroupStaffingCountSummary,
  getCurrentAssignmentsForStaffing,
  getCurrentClassGroupStaffForRole,
  groupStaffingEditButtonLabel,
  groupStaffingManageButtonLabel,
  instructorAssignmentSuccessMessage,
  isClassGroupCandidateSubmitDisabled,
  keepSelectedClassGroupStaffingCandidate,
  keepSelectedClassGroupForStaffing,
  noClassGroupForStaffingMessage,
  noCoachCandidateMessage,
  noInstructorCandidateMessage,
  personnelConnectionsPageTitle
} from "./saas-staffing-ui";
import type { BranchStaffAssignment, TenancyClassGroup } from "./admin-tenancy-client";
import type {
  BranchStaffClassGroupAssignments,
  ClassGroupAssignmentCandidates,
  ClassGroupRoster
} from "./operations-client";

describe("SaaS branch and classroom staffing UI policy", () => {
  it("uses the requested personnel page hierarchy and Turkish copy", () => {
    assert.equal(personnelConnectionsPageTitle, "Personel Bağlantıları");
    assert.equal(branchConnectionTitle, "Şube Bağlantısı");
    assert.equal(
      branchConnectionDescription,
      "Personeli seçili şubeye bağlayın ve şube içindeki operasyon rolünü belirleyin."
    );
    assert.equal(classGroupStaffingTitle, "Sınıf / Grup Görevlendirmesi");
    assert.equal(
      classGroupStaffingDescription,
      "Şubeye bağlı eğitmen ve koçları görev yapacakları sınıf veya gruplara atayın."
    );
    assert.equal(currentPersonnelConnectionsTitle, "Mevcut Personel Bağlantıları");
  });

  it("uses branch-level and group-level action labels", () => {
    assert.equal(branchAssignmentButtonLabel, "Şubeye Ata");
    assert.equal(classGroupCreateLinkLabel, "Sınıf / Grup Oluştur");
    assert.equal(groupStaffingEditButtonLabel, "Düzenle");
    assert.equal(groupStaffingManageButtonLabel, "Görevlendirmeleri Yönet");
  });

  it("renders the personnel classroom action for eligible instructor and coach records", () => {
    assert.equal(canShowClassGroupStaffingAction(assignment("INSTRUCTOR", ["instructor"])), true);
    assert.equal(canShowClassGroupStaffingAction(assignment("COACH", ["coach"])), true);
  });

  it("does not render the personnel classroom action for accountant, ordinary staff, or platform accounts", () => {
    assert.equal(canShowClassGroupStaffingAction(assignment("ACCOUNTANT", ["accounting"])), false);
    assert.equal(canShowClassGroupStaffingAction(assignment("STAFF", ["staff"])), false);
    assert.equal(canShowClassGroupStaffingAction(assignment("INSTRUCTOR", ["super-admin", "instructor"])), false);
  });

  it("requires compatible global and branch roles", () => {
    assert.equal(canShowClassGroupStaffingAction(assignment("INSTRUCTOR", ["coach"])), false);
    assert.equal(canShowClassGroupStaffingAction(assignment("COACH", ["instructor"])), false);
    assert.equal(canShowClassGroupStaffingAction(assignment("INSTRUCTOR", ["instructor"], "REVOKED")), false);
  });

  it("returns role-specific assignment labels and success states", () => {
    assert.equal(classGroupStaffingActionLabel("instructor"), "Eğitmen Olarak Ata");
    assert.equal(classGroupStaffingActionLabel("coach"), "Koç Olarak Ata");
    assert.equal(classGroupStaffingSuccessMessage("instructor"), instructorAssignmentSuccessMessage);
    assert.equal(classGroupStaffingSuccessMessage("coach"), coachAssignmentSuccessMessage);
    assert.equal(instructorAssignmentSuccessMessage, "Eğitmen sınıf veya gruba atandı.");
    assert.equal(coachAssignmentSuccessMessage, "Koç sınıf veya gruba atandı.");
  });

  it("returns role-specific missing-role guidance", () => {
    assert.equal(
      classGroupStaffingRoleMissingMessage("instructor"),
      "Bu personelin seçili şubede aktif eğitmen yetkisi bulunmuyor."
    );
    assert.equal(
      classGroupStaffingRoleMissingMessage("coach"),
      "Bu personelin seçili şubede aktif koç yetkisi bulunmuyor."
    );
  });

  it("displays current groups and available groups for personnel-centric assignment", () => {
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
      getCurrentAssignmentsForStaffing(current, "instructor").map((assignment) => assignment.classGroupName),
      ["Group A"]
    );
    assert.deepEqual(
      getAvailableClassGroupsForStaffing(current, "instructor").map((group) => group.id),
      ["group_b"]
    );
  });

  it("prevents duplicate personnel-centric assignment choices", () => {
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

  it("uses the required Turkish empty and loading states", () => {
    assert.equal(classGroupStaffingEmptyMessage(snapshot({ classGroups: [] }), "instructor"), noClassGroupForStaffingMessage);
    assert.equal(noClassGroupForStaffingMessage, "Bu şubede henüz sınıf veya grup bulunmuyor.");
    assert.equal(classGroupCandidateEmptyMessage("instructor"), noInstructorCandidateMessage);
    assert.equal(classGroupCandidateEmptyMessage("coach"), noCoachCandidateMessage);
    assert.equal(assignmentOptionsLoadingMessage, "Görevlendirme seçenekleri yükleniyor...");
  });

  it("models group-centric current assignments, candidates, and candidate labels", () => {
    const groupRoster = roster();
    const groupCandidates = candidates();

    assert.deepEqual(getCurrentClassGroupStaffForRole(groupRoster, "instructor").map((person) => person.name), [
      "Instructor Test"
    ]);
    assert.deepEqual(getCurrentClassGroupStaffForRole(groupRoster, "coach").map((person) => person.name), [
      "Coach Test"
    ]);
    assert.deepEqual(
      getClassGroupAssignmentCandidatesForRole(groupCandidates, "instructor").map((person) => person.staffUserId),
      ["staff_instructor"]
    );
    assert.deepEqual(
      getClassGroupAssignmentCandidatesForRole(groupCandidates, "coach").map((person) => person.staffUserId),
      ["staff_coach"]
    );
    assert.equal(classGroupCandidateSelectLabel("instructor"), "Eğitmen adayı");
    assert.equal(classGroupCurrentAssignmentsTitle("coach"), "Mevcut Koçlar");
  });

  it("clears selected candidates and class groups after refresh when they are no longer available", () => {
    assert.equal(keepSelectedClassGroupForStaffing("group_a", snapshot(), "instructor"), "group_a");
    assert.equal(
      keepSelectedClassGroupForStaffing(
        "group_a",
        snapshot({ availableInstructorClassGroups: [{ id: "group_b", name: "Group B", slug: "group-b", status: "ACTIVE" }] }),
        "instructor"
      ),
      ""
    );
    assert.equal(keepSelectedClassGroupStaffingCandidate("staff_instructor", candidates(), "instructor"), "staff_instructor");
    assert.equal(keepSelectedClassGroupStaffingCandidate("staff_instructor", candidates({ instructors: [] }), "instructor"), "");
  });

  it("disables group-centric assignment while saving, loading, or without a candidate", () => {
    assert.equal(
      isClassGroupCandidateSubmitDisabled({ selectedStaffUserId: "", savingRole: "", loading: false }),
      true
    );
    assert.equal(
      isClassGroupCandidateSubmitDisabled({ selectedStaffUserId: "staff_instructor", savingRole: "coach", loading: false }),
      true
    );
    assert.equal(
      isClassGroupCandidateSubmitDisabled({ selectedStaffUserId: "staff_instructor", savingRole: "", loading: true }),
      true
    );
    assert.equal(
      isClassGroupCandidateSubmitDisabled({ selectedStaffUserId: "staff_instructor", savingRole: "", loading: false }),
      false
    );
  });

  it("formats group teacher and coach counts for the group page", () => {
    assert.equal(
      getClassGroupStaffingCountSummary(classGroup({ instructorAssignments: 2, coachAssignments: 1 })),
      "2 eğitmen · 1 koç"
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

function roster(input: Partial<ClassGroupRoster> = {}): ClassGroupRoster {
  return {
    classGroup: {
      id: "group_a",
      organizationId: "org_a",
      branchId: "branch_a",
      branch: { id: "branch_a", name: "Merkez Şube", slug: "merkez-sube" },
      slug: "group-a",
      name: "Group A",
      status: "ACTIVE",
      counts: {
        students: 0,
        instructorAssignments: 1,
        coachAssignments: 1,
        liveSessions: 0
      }
    },
    students: [],
    instructors: [
      {
        id: "instructor_assignment_1",
        staffUserId: "staff_instructor",
        name: "Instructor Test",
        email: "instructor@example.com",
        startsAt: "2026-08-24T09:00:00.000Z"
      }
    ],
    coaches: [
      {
        id: "coach_assignment_1",
        staffUserId: "staff_coach",
        name: "Coach Test",
        email: "coach@example.com",
        startsAt: "2026-08-24T09:00:00.000Z"
      }
    ],
    ...input
  };
}

function candidates(input: Partial<ClassGroupAssignmentCandidates> = {}): ClassGroupAssignmentCandidates {
  return {
    classGroup: {
      id: "group_a",
      branchId: "branch_a",
      organizationId: "org_a",
      name: "Group A"
    },
    instructors: [
      {
        staffUserId: "staff_instructor",
        name: "Instructor Test",
        email: "instructor@example.com",
        branchAssignmentId: "bsa_instructor"
      }
    ],
    coaches: [
      {
        staffUserId: "staff_coach",
        name: "Coach Test",
        email: "coach@example.com",
        branchAssignmentId: "bsa_coach"
      }
    ],
    ...input
  };
}

function classGroup(counts: { instructorAssignments: number; coachAssignments: number }): TenancyClassGroup {
  return {
    id: "group_a",
    organizationId: "org_a",
    branchId: "branch_a",
    slug: "group-a",
    name: "Group A",
    status: "ACTIVE",
    createdAt: "2026-08-24T09:00:00.000Z",
    updatedAt: "2026-08-24T09:00:00.000Z",
    _count: counts
  };
}
