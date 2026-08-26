import type { AssignmentCandidate } from "./operations-client";
import {
  noCoachCandidateMessage,
  noInstructorCandidateMessage
} from "./saas-staffing-ui";

export type AssignmentCandidateKind = "instructor" | "coach";

export function keepSelectedAssignmentCandidate(
  selectedStaffUserId: string,
  candidates: AssignmentCandidate[]
) {
  return candidates.some((candidate) => candidate.staffUserId === selectedStaffUserId)
    ? selectedStaffUserId
    : "";
}

export function isAssignmentSubmitDisabled(input: {
  selectedStaffUserId: string;
  saving: string;
  candidatesLoading: boolean;
}) {
  return !input.selectedStaffUserId || Boolean(input.saving) || input.candidatesLoading;
}

export function assignmentCandidateGuidance(kind: AssignmentCandidateKind) {
  if (kind === "instructor") {
    return noInstructorCandidateMessage;
  }

  return noCoachCandidateMessage;
}
