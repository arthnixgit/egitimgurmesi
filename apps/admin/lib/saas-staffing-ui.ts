import type { BranchStaffAssignment } from "./admin-tenancy-client";
import type {
  BranchStaffClassGroupAssignments,
  StaffClassGroupAssignmentRole,
  StaffClassGroupAssignmentSummary,
  StaffClassGroupOption
} from "./operations-client";

export const branchConnectionTitle = "Şube Bağlantısı";
export const branchConnectionDescription =
  "Bu işlem personeli seçili şubeye bağlar ve şube içindeki operasyon rolünü belirler.";
export const branchAssignmentButtonLabel = "Şubeye Ata";
export const classGroupStaffingTitle = "Sınıf / Grup Görevlendirmesi";
export const classGroupStaffingDescription =
  "Şubeye bağlı eğitmen ve koçları, görev yapacakları sınıf veya gruplara atayın.";
export const classGroupCreateLinkLabel = "Sınıf / Grup Oluştur";
export const noClassGroupForStaffingMessage =
  "Bu şubede henüz sınıf veya grup bulunmuyor. Personel görevlendirmeden önce bir sınıf veya grup oluşturun.";
export const alreadyAssignedMessage = "Personel bu sınıf veya gruba zaten atanmış.";

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
  return role === "instructor"
    ? "Eğitmen seçilen sınıf veya gruba atandı."
    : "Koç seçilen sınıf veya gruba atandı.";
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
