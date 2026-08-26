import type { BranchStaffAssignment, TenancyClassGroup } from "./admin-tenancy-client";
import type {
  AssignmentCandidate,
  BranchStaffClassGroupAssignments,
  ClassGroupAssignmentCandidates,
  ClassGroupRoster,
  StaffClassGroupAssignmentRole,
  StaffClassGroupAssignmentSummary,
  StaffClassGroupOption
} from "./operations-client";

export const personnelConnectionsPageTitle = "Personel Bağlantıları";
export const branchConnectionTitle = "Şube Bağlantısı";
export const branchConnectionDescription =
  "Personeli seçili şubeye bağlayın ve şube içindeki operasyon rolünü belirleyin.";
export const branchAssignmentButtonLabel = "Şubeye Ata";
export const classGroupStaffingTitle = "Sınıf / Grup Görevlendirmesi";
export const classGroupStaffingDescription =
  "Şubeye bağlı eğitmen ve koçları görev yapacakları sınıf veya gruplara atayın.";
export const currentPersonnelConnectionsTitle = "Mevcut Personel Bağlantıları";
export const classGroupCreateLinkLabel = "Sınıf / Grup Oluştur";
export const groupStaffingEditButtonLabel = "Düzenle";
export const groupStaffingManageButtonLabel = "Görevlendirmeleri Yönet";
export const noClassGroupForStaffingMessage = "Bu şubede henüz sınıf veya grup bulunmuyor.";
export const noInstructorCandidateMessage =
  "Bu sınıf veya gruba atanabilecek aktif eğitmen bulunmuyor. Personelin Eğitmen rolünü ve şube bağlantısını kontrol edin.";
export const noCoachCandidateMessage =
  "Bu sınıf veya gruba atanabilecek aktif koç bulunmuyor. Personelin Koç rolünü ve şube bağlantısını kontrol edin.";
export const alreadyAssignedMessage = "Personel bu sınıf veya gruba zaten atanmış.";
export const crossBranchStaffingMessage = "Bu personel veya sınıf seçili şube kapsamında değildir.";
export const assignmentOptionsLoadingMessage = "Görevlendirme seçenekleri yükleniyor...";
export const instructorAssignmentSuccessMessage = "Eğitmen sınıf veya gruba atandı.";
export const coachAssignmentSuccessMessage = "Koç sınıf veya gruba atandı.";

const privilegedGlobalRoleKeys = new Set(["super-admin", "admin", "technician", "accounting"]);

export function getClassGroupStaffingRole(
  assignment: BranchStaffAssignment
): StaffClassGroupAssignmentRole | null {
  if (assignment.status !== "ACTIVE" || assignment.staffUser?.status !== "ACTIVE") {
    return null;
  }

  const globalRoleKeys = new Set(assignment.staffUser?.roles?.map((role) => role.key) ?? []);

  if ([...globalRoleKeys].some((roleKey) => privilegedGlobalRoleKeys.has(roleKey))) {
    return null;
  }

  if (assignment.roleKey === "INSTRUCTOR" && globalRoleKeys.has("instructor")) {
    return "instructor";
  }

  if (assignment.roleKey === "COACH" && globalRoleKeys.has("coach")) {
    return "coach";
  }

  return null;
}

export function canShowClassGroupStaffingAction(assignment: BranchStaffAssignment) {
  return Boolean(getClassGroupStaffingRole(assignment));
}

export function getCurrentAssignmentsForStaffing(
  snapshot: BranchStaffClassGroupAssignments | null,
  role: StaffClassGroupAssignmentRole
): StaffClassGroupAssignmentSummary[] {
  if (!snapshot) return [];
  return role === "instructor" ? snapshot.instructorAssignments : snapshot.coachAssignments;
}

export function getAvailableClassGroupsForStaffing(
  snapshot: BranchStaffClassGroupAssignments | null,
  role: StaffClassGroupAssignmentRole
): StaffClassGroupOption[] {
  if (!snapshot) return [];
  return role === "instructor"
    ? snapshot.availableInstructorClassGroups
    : snapshot.availableCoachClassGroups;
}

export function keepSelectedClassGroupForStaffing(
  selectedClassGroupId: string,
  snapshot: BranchStaffClassGroupAssignments | null,
  role: StaffClassGroupAssignmentRole
) {
  return getAvailableClassGroupsForStaffing(snapshot, role).some((group) => group.id === selectedClassGroupId)
    ? selectedClassGroupId
    : "";
}

export function isClassGroupStaffingSubmitDisabled(input: {
  selectedClassGroupId: string;
  saving: boolean;
  loading: boolean;
}) {
  return !input.selectedClassGroupId || input.saving || input.loading;
}

export function classGroupStaffingRoleLabel(role: StaffClassGroupAssignmentRole) {
  return role === "instructor" ? "Eğitmen" : "Koç";
}

export function classGroupStaffingActionLabel(role: StaffClassGroupAssignmentRole) {
  return role === "instructor" ? "Eğitmen Olarak Ata" : "Koç Olarak Ata";
}

export function classGroupStaffingSuccessMessage(role: StaffClassGroupAssignmentRole) {
  return role === "instructor" ? instructorAssignmentSuccessMessage : coachAssignmentSuccessMessage;
}

export function classGroupStaffingRoleMissingMessage(role: StaffClassGroupAssignmentRole) {
  return role === "instructor"
    ? "Bu personelin seçili şubede aktif eğitmen yetkisi bulunmuyor."
    : "Bu personelin seçili şubede aktif koç yetkisi bulunmuyor.";
}

export function classGroupStaffingEmptyMessage(
  snapshot: BranchStaffClassGroupAssignments | null,
  role: StaffClassGroupAssignmentRole
) {
  if (!snapshot) return "";

  if (!snapshot.classGroups.length) {
    return noClassGroupForStaffingMessage;
  }

  if (!snapshot.roles[role]) {
    return classGroupStaffingRoleMissingMessage(role);
  }

  if (
    getCurrentAssignmentsForStaffing(snapshot, role).length > 0 &&
    getAvailableClassGroupsForStaffing(snapshot, role).length === 0
  ) {
    return alreadyAssignedMessage;
  }

  return "";
}

export function getClassGroupAssignmentCandidatesForRole(
  candidates: ClassGroupAssignmentCandidates | null,
  role: StaffClassGroupAssignmentRole
): AssignmentCandidate[] {
  if (!candidates) return [];
  return role === "instructor" ? candidates.instructors : candidates.coaches;
}

export function getCurrentClassGroupStaffForRole(
  roster: ClassGroupRoster | null,
  role: StaffClassGroupAssignmentRole
) {
  if (!roster) return [];
  return role === "instructor" ? roster.instructors : roster.coaches;
}

export function keepSelectedClassGroupStaffingCandidate(
  selectedStaffUserId: string,
  candidates: ClassGroupAssignmentCandidates | null,
  role: StaffClassGroupAssignmentRole
) {
  return getClassGroupAssignmentCandidatesForRole(candidates, role).some(
    (candidate) => candidate.staffUserId === selectedStaffUserId
  )
    ? selectedStaffUserId
    : "";
}

export function classGroupCandidateEmptyMessage(role: StaffClassGroupAssignmentRole) {
  return role === "instructor" ? noInstructorCandidateMessage : noCoachCandidateMessage;
}

export function classGroupCandidateSelectLabel(role: StaffClassGroupAssignmentRole) {
  return role === "instructor" ? "Eğitmen adayı" : "Koç adayı";
}

export function classGroupCurrentAssignmentsTitle(role: StaffClassGroupAssignmentRole) {
  return role === "instructor" ? "Mevcut Eğitmenler" : "Mevcut Koçlar";
}

export function isClassGroupCandidateSubmitDisabled(input: {
  selectedStaffUserId: string;
  savingRole: StaffClassGroupAssignmentRole | "";
  loading: boolean;
}) {
  return !input.selectedStaffUserId || Boolean(input.savingRole) || input.loading;
}

export function getClassGroupStaffingCountSummary(classGroup: Pick<TenancyClassGroup, "_count">) {
  const instructorCount = classGroup._count?.instructorAssignments ?? 0;
  const coachCount = classGroup._count?.coachAssignments ?? 0;
  return `${instructorCount} eğitmen · ${coachCount} koç`;
}
