import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignmentCandidateGuidance,
  isAssignmentSubmitDisabled,
  keepSelectedAssignmentCandidate
} from "./operations-assignment-ui";
import {
  noCoachCandidateMessage,
  noInstructorCandidateMessage
} from "./saas-staffing-ui";
import type { AssignmentCandidate } from "./operations-client";

describe("operations assignment UI state", () => {
  it("disables assignment when no candidate is selected", () => {
    assert.equal(
      isAssignmentSubmitDisabled({
        selectedStaffUserId: "",
        saving: "",
        candidatesLoading: false
      }),
      true
    );
  });

  it("disables assignment while saving or loading candidates", () => {
    assert.equal(
      isAssignmentSubmitDisabled({
        selectedStaffUserId: "staff_instructor",
        saving: "instructor",
        candidatesLoading: false
      }),
      true
    );
    assert.equal(
      isAssignmentSubmitDisabled({
        selectedStaffUserId: "staff_instructor",
        saving: "",
        candidatesLoading: true
      }),
      true
    );
  });

  it("enables assignment when a candidate is selected and no save is active", () => {
    assert.equal(
      isAssignmentSubmitDisabled({
        selectedStaffUserId: "staff_instructor",
        saving: "",
        candidatesLoading: false
      }),
      false
    );
  });

  it("clears a selected candidate after refresh when it is no longer available", () => {
    const candidates: AssignmentCandidate[] = [
      candidate("staff_other", "Other Instructor")
    ];

    assert.equal(keepSelectedAssignmentCandidate("staff_instructor", candidates), "");
  });

  it("keeps a selected candidate when it remains available", () => {
    const candidates: AssignmentCandidate[] = [
      candidate("staff_instructor", "Own Branch Instructor")
    ];

    assert.equal(keepSelectedAssignmentCandidate("staff_instructor", candidates), "staff_instructor");
  });

  it("returns Turkish empty-state guidance for missing instructors and coaches", () => {
    assert.equal(assignmentCandidateGuidance("instructor"), noInstructorCandidateMessage);
    assert.equal(assignmentCandidateGuidance("coach"), noCoachCandidateMessage);
  });
});

function candidate(staffUserId: string, name: string): AssignmentCandidate {
  return {
    staffUserId,
    name,
    email: `${staffUserId}@example.com`,
    branchAssignmentId: `assignment_${staffUserId}`
  };
}
