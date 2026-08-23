import type { AssignmentCandidate } from "./operations-client";

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
    return "Bu şubede sınıfa atanabilecek aktif eğitmen bulunmuyor. Önce Personel ve Roller bölümünden Eğitmen rolüne sahip bir personel oluşturun veya mevcut personelin şube atamasını kontrol edin.";
  }

  return "Bu şubede sınıfa atanabilecek aktif koç bulunmuyor. Önce Personel ve Roller bölümünden Koç rolüne sahip bir personel oluşturun veya mevcut personelin şube atamasını kontrol edin.";
}
