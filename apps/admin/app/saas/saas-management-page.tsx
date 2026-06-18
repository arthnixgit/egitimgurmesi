"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearStaffTokens,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  isStaffSessionError,
  logoutStaff
} from "../../lib/auth-client";
import {
  addStudentToBranch,
  assignStaffToBranch,
  createBranch,
  createClassGroup,
  createEducationCenter,
  createOrganization,
  getTenancyOverview,
  getTenancyScope,
  listBranchStaffAssignments,
  listBranchStudentMemberships,
  listBranches,
  listClassGroups,
  listEducationCenters,
  listOrganizations,
  listStaff,
  listStudents,
  updateBranch,
  updateBranchStaffAssignment,
  updateClassGroup,
  updateEducationCenter,
  updateOrganization,
  updateStudentMembership,
  type BranchMembershipStatus,
  type BranchStaffAssignment,
  type BranchStatus,
  type ClassGroupStatus,
  type GradeLevel,
  type StaffBranchRole,
  type StudentBranchMembership,
  type StudyTrack,
  type TenancyBranch,
  type TenancyClassGroup,
  type TenancyEducationCenter,
  type TenancyOrganization,
  type TenancyOverview,
  type TenancyScope,
  type TenancyStaffSearchItem,
  type TenancyStudentSearchItem
} from "../../lib/admin-tenancy-client";

type SectionKey =
  | "overview"
  | "organizations"
  | "centers"
  | "branches"
  | "staffAssignments"
  | "studentMemberships"
  | "classGroups"
  | "scope";

type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;
type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;

type OrganizationDraft = {
  name: string;
  slug: string;
  legalName: string;
  taxNumber: string;
  supportEmail: string;
  supportPhone: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
};

type CenterDraft = {
  name: string;
  slug: string;
  legalName: string;
  centerType: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  status: BranchStatus;
};

type BranchDraft = {
  name: string;
  slug: string;
  educationCenterId: string;
  code: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  status: BranchStatus;
};

type ClassGroupDraft = {
  name: string;
  slug: string;
  description: string;
  gradeLevel: "" | GradeLevel;
  studyTrack: "" | StudyTrack;
  status: ClassGroupStatus;
};

const sectionLinks: Array<{
  key: SectionKey;
  href: string;
  label: string;
  description: string;
}> = [
  { key: "overview", href: "/saas", label: "Genel Bakış", description: "Kurum, şube ve kapsam özeti" },
  { key: "organizations", href: "/saas/organizasyonlar", label: "Organizasyonlar", description: "Ana kurum kayıtları" },
  { key: "centers", href: "/saas/egitim-merkezleri", label: "Eğitim Merkezleri", description: "Okul ve merkez yapısı" },
  { key: "branches", href: "/saas/subeler", label: "Şubeler", description: "Şube operasyon kapsamı" },
  { key: "staffAssignments", href: "/saas/personel-atamalari", label: "Personel Atamaları", description: "Şube rol bağlantıları" },
  { key: "studentMemberships", href: "/saas/ogrenci-uyelikleri", label: "Öğrenci Üyelikleri", description: "Öğrenciyi şubeye bağla" },
  { key: "classGroups", href: "/saas/sinif-gruplar", label: "Sınıf / Grup Yönetimi", description: "Şube sınıfları ve gruplar" },
  { key: "scope", href: "/saas/kapsam", label: "Yetki Özeti", description: "Rol ve şube kapsamı" }
];

const emptyOrganizationDraft: OrganizationDraft = {
  name: "",
  slug: "",
  legalName: "",
  taxNumber: "",
  supportEmail: "",
  supportPhone: "",
  status: "ACTIVE"
};

const emptyCenterDraft: CenterDraft = {
  name: "",
  slug: "",
  legalName: "",
  centerType: "",
  city: "",
  district: "",
  address: "",
  phone: "",
  email: "",
  status: "ACTIVE"
};

const emptyBranchDraft: BranchDraft = {
  name: "",
  slug: "",
  educationCenterId: "",
  code: "",
  city: "",
  district: "",
  address: "",
  phone: "",
  email: "",
  status: "ACTIVE"
};

const emptyClassGroupDraft: ClassGroupDraft = {
  name: "",
  slug: "",
  description: "",
  gradeLevel: "",
  studyTrack: "",
  status: "ACTIVE"
};

const staffRoles: Array<{ value: StaffBranchRole; label: string }> = [
  { value: "BRANCH_ADMIN", label: "Şube Yöneticisi" },
  { value: "INSTRUCTOR", label: "Eğitmen" },
  { value: "COACH", label: "Koç" },
  { value: "ACCOUNTANT", label: "Finans Yetkilisi" },
  { value: "STAFF", label: "Personel" }
];

const membershipStatuses: Array<{ value: BranchMembershipStatus; label: string }> = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "SUSPENDED", label: "Askıda" },
  { value: "LEFT", label: "Ayrıldı" }
];

const branchStatuses: Array<{ value: BranchStatus; label: string }> = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "SUSPENDED", label: "Askıda" },
  { value: "ARCHIVED", label: "Arşiv" }
];

const classGroupStatuses: Array<{ value: ClassGroupStatus; label: string }> = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "ARCHIVED", label: "Arşiv" }
];

const gradeLevels: Array<{ value: GradeLevel; label: string }> = [
  { value: "GRADE_5", label: "5. Sınıf" },
  { value: "GRADE_6", label: "6. Sınıf" },
  { value: "GRADE_7", label: "7. Sınıf" },
  { value: "GRADE_8", label: "8. Sınıf" },
  { value: "GRADE_9", label: "9. Sınıf" },
  { value: "GRADE_10", label: "10. Sınıf" },
  { value: "GRADE_11", label: "11. Sınıf" },
  { value: "GRADE_12", label: "12. Sınıf" },
  { value: "GRADUATE", label: "Mezun" },
  { value: "UNIVERSITY", label: "Üniversite" },
  { value: "OTHER", label: "Diğer" }
];

const studyTracks: Array<{ value: StudyTrack; label: string }> = [
  { value: "SAYISAL", label: "Sayısal" },
  { value: "SOZEL", label: "Sözel" },
  { value: "ESIT_AGIRLIK", label: "Eşit Ağırlık" },
  { value: "DIL", label: "Dil" },
  { value: "TYT", label: "TYT" },
  { value: "LGS", label: "LGS" },
  { value: "MSU", label: "MSÜ" },
  { value: "ARA_SINIF", label: "Ara Sınıf" },
  { value: "KPSS", label: "KPSS" },
  { value: "OTHER", label: "Diğer" }
];

export function SaasManagementPage({ initialSection }: { initialSection: SectionKey }) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [staffOverview, setStaffOverview] = useState<StaffOverviewResponse | null>(null);
  const [scope, setScope] = useState<TenancyScope | null>(null);
  const [tenancyOverview, setTenancyOverview] = useState<TenancyOverview | null>(null);
  const [organizations, setOrganizations] = useState<TenancyOrganization[]>([]);
  const [centers, setCenters] = useState<TenancyEducationCenter[]>([]);
  const [branches, setBranches] = useState<TenancyBranch[]>([]);
  const [classGroups, setClassGroups] = useState<TenancyClassGroup[]>([]);
  const [staffDirectory, setStaffDirectory] = useState<TenancyStaffSearchItem[]>([]);
  const [studentDirectory, setStudentDirectory] = useState<TenancyStudentSearchItem[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<BranchStaffAssignment[]>([]);
  const [studentMemberships, setStudentMemberships] = useState<StudentBranchMembership[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [centerFilterId, setCenterFilterId] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStaffUserId, setSelectedStaffUserId] = useState("");
  const [selectedStaffRole, setSelectedStaffRole] = useState<StaffBranchRole>("BRANCH_ADMIN");
  const [staffPrimary, setStaffPrimary] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentStatus, setStudentStatus] = useState<BranchMembershipStatus>("ACTIVE");
  const [studentPrimary, setStudentPrimary] = useState(true);
  const [organizationDraft, setOrganizationDraft] = useState<OrganizationDraft>(emptyOrganizationDraft);
  const [centerDraft, setCenterDraft] = useState<CenterDraft>(emptyCenterDraft);
  const [branchDraft, setBranchDraft] = useState<BranchDraft>(emptyBranchDraft);
  const [classGroupDraft, setClassGroupDraft] = useState<ClassGroupDraft>(emptyClassGroupDraft);
  const [editingOrganizationId, setEditingOrganizationId] = useState("");
  const [editingCenterId, setEditingCenterId] = useState("");
  const [editingBranchId, setEditingBranchId] = useState("");
  const [editingClassGroupId, setEditingClassGroupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManageOrganizations = hasPermission(staffOverview, "organizations.manage");
  const canManageBranches = hasPermission(staffOverview, "branches.manage");
  const canManageAssignments = hasPermission(staffOverview, "assignments.manage");
  const canManageClasses = hasPermission(staffOverview, "classes.manage");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const bootstrapStatus = await fetchBootstrapStatus();

        if (!active) return;

        if (bootstrapStatus.requiresBootstrap) {
          router.replace("/kurulum");
          return;
        }

        const [
          staffResponse,
          staffOverviewResponse,
          scopeResponse,
          tenancyOverviewResponse,
          organizationResponse,
          branchResponse,
          staffResponseList,
          studentResponseList
        ] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview(),
          getTenancyScope(),
          getTenancyOverview(),
          listOrganizations(),
          listBranches(),
          listStaff({ limit: 50 }),
          listStudents({ limit: 50 })
        ]);

        if (!active) return;

        const firstOrganizationId = organizationResponse[0]?.id ?? "";
        const firstBranchId = branchResponse[0]?.id ?? "";

        setStaff(staffResponse);
        setStaffOverview(staffOverviewResponse);
        setScope(scopeResponse);
        setTenancyOverview(tenancyOverviewResponse);
        setOrganizations(organizationResponse);
        setBranches(branchResponse);
        setStaffDirectory(staffResponseList.items);
        setStudentDirectory(studentResponseList.items);
        setSelectedOrganizationId(firstOrganizationId);
        setSelectedBranchId(firstBranchId);
        setSelectedStaffUserId(staffResponseList.items[0]?.id ?? "");
        setSelectedStudentId(studentResponseList.items[0]?.id ?? "");

        const [centerResponse, groupResponse, assignmentResponse, membershipResponse] =
          await Promise.all([
            firstOrganizationId ? listEducationCenters(firstOrganizationId).catch(() => []) : [],
            firstBranchId ? listClassGroups(firstBranchId).catch(() => []) : [],
            firstBranchId ? listBranchStaffAssignments(firstBranchId).catch(() => []) : [],
            firstBranchId ? listBranchStudentMemberships(firstBranchId).catch(() => []) : []
          ]);

        if (!active) return;

        setCenters(centerResponse);
        setClassGroups(groupResponse);
        setStaffAssignments(assignmentResponse);
        setStudentMemberships(membershipResponse);
      } catch (requestError) {
        if (!active) return;

        if (isStaffSessionError(requestError)) {
          clearStaffTokens();
          router.replace("/giris");
          return;
        }

        setError(toFriendlyError(requestError, "SaaS yönetimi verileri yüklenemedi."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedOrganizationId) {
      setCenters([]);
      return;
    }

    let active = true;
    setSectionLoading(true);

    listEducationCenters(selectedOrganizationId)
      .then((response) => {
        if (active) setCenters(response);
      })
      .catch((requestError) => {
        if (active) setError(toFriendlyError(requestError, "Eğitim merkezleri yüklenemedi."));
      })
      .finally(() => {
        if (active) setSectionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (!selectedBranchId) {
      setClassGroups([]);
      setStaffAssignments([]);
      setStudentMemberships([]);
      return;
    }

    let active = true;
    setSectionLoading(true);

    Promise.all([
      listClassGroups(selectedBranchId),
      listBranchStaffAssignments(selectedBranchId),
      listBranchStudentMemberships(selectedBranchId)
    ])
      .then(([groupResponse, assignmentResponse, membershipResponse]) => {
        if (!active) return;
        setClassGroups(groupResponse);
        setStaffAssignments(assignmentResponse);
        setStudentMemberships(membershipResponse);
      })
      .catch((requestError) => {
        if (active) setError(toFriendlyError(requestError, "Şube bağlantıları yüklenemedi."));
      })
      .finally(() => {
        if (active) setSectionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedBranchId]);

  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);

  const filteredOrganizations = useMemo(() => {
    const query = organizationSearch.trim().toLocaleLowerCase("tr-TR");
    if (!query) return organizations;

    return organizations.filter((organization) =>
      [organization.name, organization.slug, organization.legalName, organization.supportEmail]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("tr-TR").includes(query))
    );
  }, [organizationSearch, organizations]);

  const filteredBranches = useMemo(() => {
    const query = branchSearch.trim().toLocaleLowerCase("tr-TR");

    return branches.filter((branch) => {
      const matchesCenter = !centerFilterId || branch.educationCenterId === centerFilterId;
      const matchesText =
        !query ||
        [branch.name, branch.slug, branch.code, branch.city, branch.district, branch.organization?.name]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase("tr-TR").includes(query));

      return matchesCenter && matchesText;
    });
  }, [branchSearch, branches, centerFilterId]);

  async function refreshScopeAndOverview() {
    const [scopeResponse, overviewResponse] = await Promise.all([getTenancyScope(), getTenancyOverview()]);
    setScope(scopeResponse);
    setTenancyOverview(overviewResponse);
  }

  async function reloadOrganizations(nextOrganizationId?: string) {
    const response = await listOrganizations();
    setOrganizations(response);
    const resolvedId =
      nextOrganizationId ??
      (selectedOrganizationId && response.some((item) => item.id === selectedOrganizationId)
        ? selectedOrganizationId
        : response[0]?.id ?? "");
    setSelectedOrganizationId(resolvedId);
    return response;
  }

  async function reloadBranches(nextBranchId?: string) {
    const response = await listBranches();
    setBranches(response);
    const resolvedId =
      nextBranchId ??
      (selectedBranchId && response.some((item) => item.id === selectedBranchId)
        ? selectedBranchId
        : response[0]?.id ?? "");
    setSelectedBranchId(resolvedId);
    return response;
  }

  async function reloadBranchConnections(branchId = selectedBranchId) {
    if (!branchId) return;
    const [groups, assignments, memberships] = await Promise.all([
      listClassGroups(branchId),
      listBranchStaffAssignments(branchId),
      listBranchStudentMemberships(branchId)
    ]);
    setClassGroups(groups);
    setStaffAssignments(assignments);
    setStudentMemberships(memberships);
  }

  async function loadStaffDirectory() {
    const response = await listStaff({ q: optionalDraft(staffSearch), limit: 50 });
    setStaffDirectory(response.items);
    setSelectedStaffUserId((current) => current || response.items[0]?.id || "");
  }

  async function loadStudentDirectory() {
    const response = await listStudents({ q: optionalDraft(studentSearch), limit: 50 });
    setStudentDirectory(response.items);
    setSelectedStudentId((current) => current || response.items[0]?.id || "");
  }

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  async function saveOrganization() {
    if (!canManageOrganizations) return setError("Bu işlem için yetkiniz bulunmuyor.");
    if (!organizationDraft.name.trim()) return setError("Organizasyon adı zorunludur.");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingOrganizationId) {
        const updated = await updateOrganization(editingOrganizationId, {
          name: organizationDraft.name,
          legalName: nullableDraft(organizationDraft.legalName),
          status: organizationDraft.status,
          taxNumber: nullableDraft(organizationDraft.taxNumber),
          supportEmail: nullableDraft(organizationDraft.supportEmail),
          supportPhone: nullableDraft(organizationDraft.supportPhone)
        });
        await reloadOrganizations(updated.id);
        setSuccess("Organizasyon güncellendi.");
      } else {
        const created = await createOrganization({
          name: organizationDraft.name,
          slug: optionalDraft(organizationDraft.slug),
          legalName: optionalDraft(organizationDraft.legalName),
          taxNumber: optionalDraft(organizationDraft.taxNumber),
          supportEmail: optionalDraft(organizationDraft.supportEmail),
          supportPhone: optionalDraft(organizationDraft.supportPhone)
        });
        await reloadOrganizations(created.id);
        setSuccess("Yeni organizasyon oluşturuldu.");
      }

      setOrganizationDraft(emptyOrganizationDraft);
      setEditingOrganizationId("");
      await refreshScopeAndOverview();
    } catch (requestError) {
      setError(toFriendlyError(requestError, "Organizasyon kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function saveEducationCenter() {
    if (!selectedOrganizationId) return setError("Önce organizasyon seçmelisiniz.");
    if (!centerDraft.name.trim()) return setError("Merkez adı zorunludur.");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingCenterId) {
        await updateEducationCenter(editingCenterId, {
          name: centerDraft.name,
          legalName: nullableDraft(centerDraft.legalName),
          centerType: nullableDraft(centerDraft.centerType),
          city: nullableDraft(centerDraft.city),
          district: nullableDraft(centerDraft.district),
          address: nullableDraft(centerDraft.address),
          phone: nullableDraft(centerDraft.phone),
          email: nullableDraft(centerDraft.email),
          status: centerDraft.status
        });
        setSuccess("Eğitim merkezi güncellendi.");
      } else {
        await createEducationCenter(selectedOrganizationId, {
          name: centerDraft.name,
          slug: optionalDraft(centerDraft.slug),
          legalName: optionalDraft(centerDraft.legalName),
          centerType: optionalDraft(centerDraft.centerType),
          city: optionalDraft(centerDraft.city),
          district: optionalDraft(centerDraft.district),
          address: optionalDraft(centerDraft.address),
          phone: optionalDraft(centerDraft.phone),
          email: optionalDraft(centerDraft.email)
        });
        setSuccess("Yeni eğitim merkezi oluşturuldu.");
      }

      setCenters(await listEducationCenters(selectedOrganizationId));
      await reloadOrganizations();
      setCenterDraft(emptyCenterDraft);
      setEditingCenterId("");
      await refreshScopeAndOverview();
    } catch (requestError) {
      setError(toFriendlyError(requestError, "Eğitim merkezi kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function saveBranch() {
    if (!selectedOrganizationId) return setError("Önce organizasyon seçmelisiniz.");
    if (!branchDraft.name.trim()) return setError("Şube adı zorunludur.");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingBranchId) {
        const updated = await updateBranch(editingBranchId, {
          name: branchDraft.name,
          educationCenterId: branchDraft.educationCenterId || null,
          code: nullableDraft(branchDraft.code),
          city: nullableDraft(branchDraft.city),
          district: nullableDraft(branchDraft.district),
          address: nullableDraft(branchDraft.address),
          phone: nullableDraft(branchDraft.phone),
          email: nullableDraft(branchDraft.email),
          status: branchDraft.status
        });
        await reloadBranches(updated.id);
        setSuccess("Şube güncellendi.");
      } else {
        const created = await createBranch(selectedOrganizationId, {
          name: branchDraft.name,
          slug: optionalDraft(branchDraft.slug),
          educationCenterId: optionalDraft(branchDraft.educationCenterId),
          code: optionalDraft(branchDraft.code),
          city: optionalDraft(branchDraft.city),
          district: optionalDraft(branchDraft.district),
          address: optionalDraft(branchDraft.address),
          phone: optionalDraft(branchDraft.phone),
          email: optionalDraft(branchDraft.email)
        });
        await reloadBranches(created.id);
        setSuccess("Yeni şube oluşturuldu.");
      }

      setBranchDraft(emptyBranchDraft);
      setEditingBranchId("");
      await refreshScopeAndOverview();
    } catch (requestError) {
      setError(toFriendlyError(requestError, "Şube kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function saveStaffAssignment() {
    if (!selectedBranchId) return setError("Önce şube seçmelisiniz.");
    if (!selectedStaffUserId) return setError("Personel seçmelisiniz.");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await assignStaffToBranch(selectedBranchId, {
        staffUserId: selectedStaffUserId,
        roleKey: selectedStaffRole,
        isPrimary: staffPrimary
      });
      await Promise.all([reloadBranchConnections(), reloadBranches(), refreshScopeAndOverview()]);
      setSuccess("Personel ataması kaydedildi.");
    } catch (requestError) {
      setError(toFriendlyError(requestError, "Personel ataması yapılamadı."));
    } finally {
      setSaving(false);
    }
  }

  async function saveStudentMembership() {
    if (!selectedBranchId) return setError("Önce şube seçmelisiniz.");
    if (!selectedStudentId) return setError("Öğrenci seçmelisiniz.");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await addStudentToBranch(selectedBranchId, {
        userId: selectedStudentId,
        status: studentStatus,
        isPrimary: studentPrimary
      });
      await Promise.all([reloadBranchConnections(), reloadBranches(), refreshScopeAndOverview()]);
      setSuccess("Öğrenci şubeye eklendi.");
    } catch (requestError) {
      setError(toFriendlyError(requestError, "Öğrenci şubeye eklenemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function setAssignmentStatus(assignmentId: string, status: "ACTIVE" | "REVOKED") {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateBranchStaffAssignment(assignmentId, { status });
      await Promise.all([reloadBranchConnections(), refreshScopeAndOverview()]);
      setSuccess("Personel ataması güncellendi.");
    } catch (requestError) {
      setError(toFriendlyError(requestError, "Personel ataması güncellenemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function setMembershipStatus(membershipId: string, status: BranchMembershipStatus) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateStudentMembership(membershipId, { status });
      await Promise.all([reloadBranchConnections(), refreshScopeAndOverview()]);
      setSuccess("Öğrenci üyeliği güncellendi.");
    } catch (requestError) {
      setError(toFriendlyError(requestError, "Öğrenci üyeliği güncellenemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function saveClassGroup() {
    if (!selectedBranchId) return setError("Önce şube seçmelisiniz.");
    if (!classGroupDraft.name.trim()) return setError("Grup adı zorunludur.");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingClassGroupId) {
        await updateClassGroup(editingClassGroupId, {
          name: classGroupDraft.name,
          description: nullableDraft(classGroupDraft.description),
          gradeLevel: classGroupDraft.gradeLevel || null,
          studyTrack: classGroupDraft.studyTrack || null,
          status: classGroupDraft.status
        });
        setSuccess("Sınıf/grup güncellendi.");
      } else {
        await createClassGroup(selectedBranchId, {
          name: classGroupDraft.name,
          slug: optionalDraft(classGroupDraft.slug),
          description: optionalDraft(classGroupDraft.description),
          gradeLevel: classGroupDraft.gradeLevel || undefined,
          studyTrack: classGroupDraft.studyTrack || undefined
        });
        setSuccess("Yeni sınıf/grup oluşturuldu.");
      }

      await Promise.all([reloadBranchConnections(), reloadBranches(), refreshScopeAndOverview()]);
      setClassGroupDraft(emptyClassGroupDraft);
      setEditingClassGroupId("");
    } catch (requestError) {
      setError(toFriendlyError(requestError, "Sınıf/grup kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  function startEditOrganization(organization: TenancyOrganization) {
    setEditingOrganizationId(organization.id);
    setOrganizationDraft({
      name: organization.name,
      slug: organization.slug,
      legalName: organization.legalName ?? "",
      taxNumber: organization.taxNumber ?? "",
      supportEmail: organization.supportEmail ?? "",
      supportPhone: organization.supportPhone ?? "",
      status: organization.status
    });
  }

  function startEditCenter(center: TenancyEducationCenter) {
    setEditingCenterId(center.id);
    setCenterDraft({
      name: center.name,
      slug: center.slug,
      legalName: center.legalName ?? "",
      centerType: center.centerType ?? "",
      city: center.city ?? "",
      district: center.district ?? "",
      address: center.address ?? "",
      phone: center.phone ?? "",
      email: center.email ?? "",
      status: center.status
    });
  }

  function startEditBranch(branch: TenancyBranch) {
    setEditingBranchId(branch.id);
    setSelectedOrganizationId(branch.organizationId);
    setBranchDraft({
      name: branch.name,
      slug: branch.slug,
      educationCenterId: branch.educationCenterId ?? "",
      code: branch.code ?? "",
      city: branch.city ?? "",
      district: branch.district ?? "",
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      status: branch.status
    });
  }

  function startEditClassGroup(classGroup: TenancyClassGroup) {
    setEditingClassGroupId(classGroup.id);
    setClassGroupDraft({
      name: classGroup.name,
      slug: classGroup.slug,
      description: classGroup.description ?? "",
      gradeLevel: classGroup.gradeLevel ?? "",
      studyTrack: classGroup.studyTrack ?? "",
      status: classGroup.status
    });
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-card">
          <p>Yönetim paneli yükleniyor...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell admin-saas-shell">
      <header className="admin-saas-hero">
        <div>
          <span className="admin-badge">Kurum ve Şube Yönetimi</span>
          <h1>Kurum, merkez ve şube operasyonları</h1>
          <p>
            {staff?.staffUser.firstName} {staff?.staffUser.lastName} için mevcut kapsam:
            {" "}
            {scope?.actor.isSuperAdmin ? "Tüm platform" : `${scope?.actor.branchIds.length ?? 0} şube`}
          </p>
        </div>
        <button className="admin-button--ghost" type="button" onClick={handleLogout}>
          Çıkış yap
        </button>
      </header>

      <nav className="admin-saas-tabs" aria-label="Kurum ve Şube Yönetimi">
        {sectionLinks.map((section) => (
          <Link
            key={section.key}
            href={section.href}
            className={`admin-saas-tab ${initialSection === section.key ? "admin-saas-tab--active" : ""}`}
          >
            <strong>{section.label}</strong>
            <span>{section.description}</span>
          </Link>
        ))}
      </nav>

      {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}
      {success ? <div className="admin-alert admin-alert--success">{success}</div> : null}

      {initialSection === "overview" ? renderOverview() : null}
      {initialSection === "organizations" ? renderOrganizations() : null}
      {initialSection === "centers" ? renderCenters() : null}
      {initialSection === "branches" ? renderBranches() : null}
      {initialSection === "staffAssignments" ? renderStaffAssignments() : null}
      {initialSection === "studentMemberships" ? renderStudentMemberships() : null}
      {initialSection === "classGroups" ? renderClassGroups() : null}
      {initialSection === "scope" ? renderScope() : null}
    </main>
  );

  function renderOverview() {
    return (
      <section className="admin-saas-grid">
        <article className="admin-card admin-saas-main-card">
          <div className="admin-saas-section-head">
            <div>
              <span className="admin-badge">Genel Bakış</span>
              <h2>Platform operasyon özeti</h2>
              <p>Kurum, şube ve atama durumunu tek bakışta izleyin.</p>
            </div>
          </div>
          <div className="admin-saas-stat-grid">
            <StatCard label="Organizasyon" value={tenancyOverview?.organizationCount ?? 0} />
            <StatCard label="Eğitim Merkezi" value={tenancyOverview?.educationCenterCount ?? 0} />
            <StatCard label="Şube" value={tenancyOverview?.branchCount ?? 0} />
            <StatCard label="Sınıf / Grup" value={tenancyOverview?.classGroupCount ?? 0} />
            <StatCard label="Personel Ataması" value={tenancyOverview?.staffAssignmentCount ?? 0} />
            <StatCard label="Öğrenci Üyeliği" value={tenancyOverview?.studentMembershipCount ?? 0} />
          </div>
          <div className="admin-saas-quick-actions">
            <Link className="admin-button" href="/saas/organizasyonlar">Yeni Organizasyon</Link>
            <Link className="admin-button" href="/saas/egitim-merkezleri">Yeni Eğitim Merkezi</Link>
            <Link className="admin-button" href="/saas/subeler">Yeni Şube</Link>
            <Link className="admin-button" href="/saas/sinif-gruplar">Yeni Sınıf/Grup</Link>
          </div>
        </article>
        <article className="admin-card">
          <span className="admin-badge">Son İşlemler</span>
          <h3>Yeni şubeler ve atamalar</h3>
          <div className="admin-saas-record-list">
            {tenancyOverview?.recentBranches.map((branch) => (
              <RecordRow key={branch.id} title={branch.name} meta={branch.organization?.name ?? "Organizasyon"} detail={formatDate(branch.createdAt)} />
            ))}
            {tenancyOverview?.recentStaffAssignments.map((assignment) => (
              <RecordRow
                key={assignment.id}
                title={assignment.staffUser?.displayName ?? assignment.staffUserId}
                meta={`${assignment.branch?.name ?? "Şube"} · ${roleLabel(assignment.roleKey)}`}
                detail={formatDate(assignment.createdAt)}
              />
            ))}
            {tenancyOverview?.recentStudentMemberships.map((membership) => (
              <RecordRow
                key={membership.id}
                title={membership.student?.displayName ?? membership.userId}
                meta={`${membership.branch?.name ?? "Şube"} · ${statusLabel(membership.status)}`}
                detail={formatDate(membership.createdAt)}
              />
            ))}
            {!tenancyOverview?.recentBranches.length &&
            !tenancyOverview?.recentStaffAssignments.length &&
            !tenancyOverview?.recentStudentMemberships.length ? (
              <EmptyState title="Hareket bulunmuyor" body="Yeni şube ve atamalar listelenir." />
            ) : null}
          </div>
        </article>
      </section>
    );
  }

  function renderOrganizations() {
    return (
      <section className="admin-saas-grid">
        <article className="admin-card admin-saas-main-card">
          <div className="admin-saas-section-head">
            <div>
              <span className="admin-badge">Organizasyonlar</span>
              <h2>Kurum kayıtları</h2>
            </div>
            <input className="admin-input" placeholder="Organizasyon ara" value={organizationSearch} onChange={(event) => setOrganizationSearch(event.target.value)} />
          </div>
          {filteredOrganizations.length ? (
            <div className="admin-saas-table">
              {filteredOrganizations.map((organization) => (
                <button key={organization.id} className="admin-saas-row" type="button" onClick={() => startEditOrganization(organization)}>
                  <span><strong>{organization.name}</strong><small>{organization.legalName || organization.slug}</small></span>
                  <span>{statusLabel(organization.status)}</span>
                  <span>{organization._count?.branches ?? 0} şube</span>
                  <span>{organization._count?.educationCenters ?? 0} merkez</span>
                  <span>{formatDate(organization.createdAt)}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="Organizasyon bulunamadı" body="Aramayı temizleyin veya yeni organizasyon oluşturun." />
          )}
        </article>
        <article className="admin-card admin-saas-form-card">
          <span className="admin-badge">{editingOrganizationId ? "Güncelle" : "Yeni Organizasyon"}</span>
          <FormGrid>
            <Field label="Organizasyon Adı"><input className="admin-input" value={organizationDraft.name} onChange={(event) => setOrganizationDraft({ ...organizationDraft, name: event.target.value })} /></Field>
            <Field label="Slug"><input className="admin-input" value={organizationDraft.slug} onChange={(event) => setOrganizationDraft({ ...organizationDraft, slug: event.target.value })} disabled={Boolean(editingOrganizationId)} /></Field>
            <Field label="Ticari Unvan"><input className="admin-input" value={organizationDraft.legalName} onChange={(event) => setOrganizationDraft({ ...organizationDraft, legalName: event.target.value })} /></Field>
            <Field label="Vergi No"><input className="admin-input" value={organizationDraft.taxNumber} onChange={(event) => setOrganizationDraft({ ...organizationDraft, taxNumber: event.target.value })} /></Field>
            <Field label="Destek E-posta"><input className="admin-input" value={organizationDraft.supportEmail} onChange={(event) => setOrganizationDraft({ ...organizationDraft, supportEmail: event.target.value })} /></Field>
            <Field label="Destek Telefon"><input className="admin-input" value={organizationDraft.supportPhone} onChange={(event) => setOrganizationDraft({ ...organizationDraft, supportPhone: event.target.value })} /></Field>
            <Field label="Durum"><Select value={organizationDraft.status} onChange={(value) => setOrganizationDraft({ ...organizationDraft, status: value as OrganizationDraft["status"] })} options={branchStatuses} /></Field>
          </FormGrid>
          <FormActions saving={saving} saveLabel={editingOrganizationId ? "Güncelle" : "Kaydet"} onSave={saveOrganization} onCancel={() => { setEditingOrganizationId(""); setOrganizationDraft(emptyOrganizationDraft); }} />
        </article>
      </section>
    );
  }

  function renderCenters() {
    return (
      <section className="admin-saas-grid">
        <article className="admin-card admin-saas-main-card">
          <div className="admin-saas-section-head">
            <div>
              <span className="admin-badge">Eğitim Merkezleri</span>
              <h2>Organizasyona bağlı merkezler</h2>
            </div>
            <OrganizationSelect />
          </div>
          {sectionLoading ? <p className="admin-empty-state">Eğitim merkezleri yükleniyor...</p> : null}
          {!sectionLoading && centers.length ? (
            <div className="admin-saas-table">
              {centers.map((center) => (
                <button key={center.id} className="admin-saas-row" type="button" onClick={() => startEditCenter(center)}>
                  <span><strong>{center.name}</strong><small>{center.legalName || center.slug}</small></span>
                  <span>{center.city || "Şehir yok"}</span>
                  <span>{statusLabel(center.status)}</span>
                  <span>{center._count?.branches ?? 0} şube</span>
                </button>
              ))}
            </div>
          ) : null}
          {!sectionLoading && !centers.length ? <EmptyState title="Merkez bulunamadı" body="Seçili organizasyon için ilk merkezi oluşturun." /> : null}
        </article>
        <article className="admin-card admin-saas-form-card">
          <span className="admin-badge">{editingCenterId ? "Güncelle" : "Yeni Eğitim Merkezi"}</span>
          <p className="admin-saas-muted">Bağlı organizasyon: {selectedOrganization?.name ?? "Seçilmedi"}</p>
          <FormGrid>
            <Field label="Merkez Adı"><input className="admin-input" value={centerDraft.name} onChange={(event) => setCenterDraft({ ...centerDraft, name: event.target.value })} /></Field>
            <Field label="Slug"><input className="admin-input" value={centerDraft.slug} onChange={(event) => setCenterDraft({ ...centerDraft, slug: event.target.value })} disabled={Boolean(editingCenterId)} /></Field>
            <Field label="Merkez Tipi"><input className="admin-input" value={centerDraft.centerType} onChange={(event) => setCenterDraft({ ...centerDraft, centerType: event.target.value })} /></Field>
            <Field label="Şehir"><input className="admin-input" value={centerDraft.city} onChange={(event) => setCenterDraft({ ...centerDraft, city: event.target.value })} /></Field>
            <Field label="İlçe"><input className="admin-input" value={centerDraft.district} onChange={(event) => setCenterDraft({ ...centerDraft, district: event.target.value })} /></Field>
            <Field label="Telefon"><input className="admin-input" value={centerDraft.phone} onChange={(event) => setCenterDraft({ ...centerDraft, phone: event.target.value })} /></Field>
            <Field label="E-posta"><input className="admin-input" value={centerDraft.email} onChange={(event) => setCenterDraft({ ...centerDraft, email: event.target.value })} /></Field>
            <Field label="Durum"><Select value={centerDraft.status} onChange={(value) => setCenterDraft({ ...centerDraft, status: value as BranchStatus })} options={branchStatuses} /></Field>
          </FormGrid>
          <Field label="Adres"><textarea className="admin-input admin-textarea admin-textarea--compact" value={centerDraft.address} onChange={(event) => setCenterDraft({ ...centerDraft, address: event.target.value })} /></Field>
          <FormActions saving={saving} saveLabel={editingCenterId ? "Güncelle" : "Kaydet"} onSave={saveEducationCenter} onCancel={() => { setEditingCenterId(""); setCenterDraft(emptyCenterDraft); }} />
        </article>
      </section>
    );
  }

  function renderBranches() {
    return (
      <section className="admin-saas-grid">
        <article className="admin-card admin-saas-main-card">
          <div className="admin-saas-section-head">
            <div>
              <span className="admin-badge">Şubeler</span>
              <h2>Yetkili olduğun şubeler</h2>
            </div>
            <div className="admin-saas-filter-stack">
              <OrganizationSelect />
              <select className="admin-input" value={centerFilterId} onChange={(event) => setCenterFilterId(event.target.value)}>
                <option value="">Tüm merkezler</option>
                {centers.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
              </select>
              <input className="admin-input" placeholder="Şube ara" value={branchSearch} onChange={(event) => setBranchSearch(event.target.value)} />
            </div>
          </div>
          {filteredBranches.length ? (
            <div className="admin-saas-card-grid">
              {filteredBranches.map((branch) => (
                <article key={branch.id} className="admin-saas-branch-card">
                  <div>
                    <span className="admin-badge">{statusLabel(branch.status)}</span>
                    <h3>{branch.name}</h3>
                    <p>{branch.organization?.name ?? "Organizasyon yok"} · {branch.educationCenter?.name ?? "Merkez yok"}</p>
                  </div>
                  <dl>
                    <div><dt>Sınıflar / Gruplar</dt><dd>{branch._count?.classGroups ?? 0}</dd></div>
                    <div><dt>Personel Atamaları</dt><dd>{branch._count?.staffAssignments ?? 0}</dd></div>
                    <div><dt>Öğrenci Üyelikleri</dt><dd>{branch._count?.studentMemberships ?? 0}</dd></div>
                  </dl>
                  <div className="admin-actions">
                    <button className="admin-button--ghost admin-button--compact" type="button" onClick={() => startEditBranch(branch)}>Detaylar</button>
                    <Link className="admin-button--ghost admin-button--compact" href="/saas/personel-atamalari">Personel</Link>
                    <Link className="admin-button--ghost admin-button--compact" href="/saas/sinif-gruplar">Sınıflar</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Şube bulunamadı" body="Filtreleri temizleyin veya yeni şube oluşturun." />
          )}
        </article>
        <article className="admin-card admin-saas-form-card">
          <span className="admin-badge">{editingBranchId ? "Güncelle" : "Yeni Şube"}</span>
          <p className="admin-saas-muted">Organizasyon: {selectedOrganization?.name ?? "Seçilmedi"}</p>
          <FormGrid>
            <Field label="Şube Adı"><input className="admin-input" value={branchDraft.name} onChange={(event) => setBranchDraft({ ...branchDraft, name: event.target.value })} /></Field>
            <Field label="Slug"><input className="admin-input" value={branchDraft.slug} onChange={(event) => setBranchDraft({ ...branchDraft, slug: event.target.value })} disabled={Boolean(editingBranchId)} /></Field>
            <Field label="Eğitim Merkezi">
              <select className="admin-input" value={branchDraft.educationCenterId} onChange={(event) => setBranchDraft({ ...branchDraft, educationCenterId: event.target.value })}>
                <option value="">Merkez seçilmedi</option>
                {centers.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
              </select>
            </Field>
            <Field label="Şube Kodu"><input className="admin-input" value={branchDraft.code} onChange={(event) => setBranchDraft({ ...branchDraft, code: event.target.value })} /></Field>
            <Field label="Şehir"><input className="admin-input" value={branchDraft.city} onChange={(event) => setBranchDraft({ ...branchDraft, city: event.target.value })} /></Field>
            <Field label="İlçe"><input className="admin-input" value={branchDraft.district} onChange={(event) => setBranchDraft({ ...branchDraft, district: event.target.value })} /></Field>
            <Field label="Telefon"><input className="admin-input" value={branchDraft.phone} onChange={(event) => setBranchDraft({ ...branchDraft, phone: event.target.value })} /></Field>
            <Field label="E-posta"><input className="admin-input" value={branchDraft.email} onChange={(event) => setBranchDraft({ ...branchDraft, email: event.target.value })} /></Field>
            <Field label="Durum"><Select value={branchDraft.status} onChange={(value) => setBranchDraft({ ...branchDraft, status: value as BranchStatus })} options={branchStatuses} /></Field>
          </FormGrid>
          <Field label="Adres"><textarea className="admin-input admin-textarea admin-textarea--compact" value={branchDraft.address} onChange={(event) => setBranchDraft({ ...branchDraft, address: event.target.value })} /></Field>
          <FormActions saving={saving} saveLabel={editingBranchId ? "Güncelle" : "Kaydet"} onSave={saveBranch} onCancel={() => { setEditingBranchId(""); setBranchDraft(emptyBranchDraft); }} />
        </article>
      </section>
    );
  }

  function renderStaffAssignments() {
    return (
      <section className="admin-saas-grid">
        <article className="admin-card admin-saas-main-card">
          <div className="admin-saas-section-head">
            <div>
              <span className="admin-badge">Personel Atamaları</span>
              <h2>Şubeye personel rolü ata</h2>
            </div>
            <BranchSelect />
          </div>
          <FormGrid>
            <Field label="Personel Ara">
              <div className="admin-saas-inline-search">
                <input className="admin-input" value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} placeholder="Ad, soyad veya e-posta" />
                <button className="admin-button--ghost" type="button" onClick={loadStaffDirectory}>Ara</button>
              </div>
            </Field>
            <Field label="Personel Seç">
              <select className="admin-input" value={selectedStaffUserId} onChange={(event) => setSelectedStaffUserId(event.target.value)}>
                <option value="">Personel seç</option>
                {staffDirectory.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}
              </select>
            </Field>
            <Field label="Rol"><Select value={selectedStaffRole} onChange={(value) => setSelectedStaffRole(value as StaffBranchRole)} options={staffRoles} /></Field>
            <label className="admin-saas-check"><input type="checkbox" checked={staffPrimary} onChange={(event) => setStaffPrimary(event.target.checked)} /> Birincil şube olarak işaretle</label>
          </FormGrid>
          <div className="admin-actions">
            <button className="admin-button" type="button" disabled={saving || !canManageAssignments} onClick={saveStaffAssignment}>{saving ? "Kaydediliyor..." : "Atama Yap"}</button>
          </div>
        </article>
        <article className="admin-card">
          <span className="admin-badge">Mevcut Atamalar</span>
          <p className="admin-saas-muted">Şube: {selectedBranch?.name ?? "Seçilmedi"}</p>
          {sectionLoading ? <p className="admin-empty-state">Atamalar yükleniyor...</p> : null}
          {!sectionLoading && staffAssignments.length ? (
            <div className="admin-saas-record-list">
              {staffAssignments.map((assignment) => (
                <div className="admin-saas-record-row" key={assignment.id}>
                  <span>
                    <strong>{assignment.staffUser?.displayName ?? assignment.staffUserId}</strong>
                    <small>{assignment.staffUser?.email ?? ""} · {roleLabel(assignment.roleKey)} · {assignment.status === "REVOKED" ? "Pasif" : "Aktif"}</small>
                  </span>
                  <div className="admin-actions">
                    <button className="admin-button--ghost admin-button--compact" type="button" disabled={saving || !canManageAssignments} onClick={() => setAssignmentStatus(assignment.id, "ACTIVE")}>Aktifleştir</button>
                    <button className="admin-button--ghost admin-button--compact" type="button" disabled={saving || !canManageAssignments} onClick={() => setAssignmentStatus(assignment.id, "REVOKED")}>Pasifleştir</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!sectionLoading && !staffAssignments.length ? <EmptyState title="Atama yok" body="Seçili şube için personel ataması bulunmuyor." /> : null}
        </article>
      </section>
    );
  }

  function renderStudentMemberships() {
    return (
      <section className="admin-saas-grid">
        <article className="admin-card admin-saas-main-card">
          <div className="admin-saas-section-head">
            <div>
              <span className="admin-badge">Öğrenci Üyelikleri</span>
              <h2>Öğrenciyi şubeye bağla</h2>
            </div>
            <BranchSelect />
          </div>
          <FormGrid>
            <Field label="Öğrenci Ara">
              <div className="admin-saas-inline-search">
                <input className="admin-input" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Ad, soyad, e-posta veya telefon" />
                <button className="admin-button--ghost" type="button" onClick={loadStudentDirectory}>Ara</button>
              </div>
            </Field>
            <Field label="Öğrenci Seç">
              <select className="admin-input" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                <option value="">Öğrenci seç</option>
                {studentDirectory.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.email}</option>)}
              </select>
            </Field>
            <Field label="Üyelik Durumu"><Select value={studentStatus} onChange={(value) => setStudentStatus(value as BranchMembershipStatus)} options={membershipStatuses} /></Field>
            <label className="admin-saas-check"><input type="checkbox" checked={studentPrimary} onChange={(event) => setStudentPrimary(event.target.checked)} /> Birincil şube olarak işaretle</label>
          </FormGrid>
          <div className="admin-actions">
            <button className="admin-button" type="button" disabled={saving || !canManageAssignments} onClick={saveStudentMembership}>{saving ? "Kaydediliyor..." : "Şubeye Ekle"}</button>
          </div>
        </article>
        <article className="admin-card">
          <span className="admin-badge">Mevcut Üyelikler</span>
          <p className="admin-saas-muted">Şube: {selectedBranch?.name ?? "Seçilmedi"}</p>
          {sectionLoading ? <p className="admin-empty-state">Üyelikler yükleniyor...</p> : null}
          {!sectionLoading && studentMemberships.length ? (
            <div className="admin-saas-record-list">
              {studentMemberships.map((membership) => (
                <div className="admin-saas-record-row" key={membership.id}>
                  <span>
                    <strong>{membership.student?.displayName ?? membership.userId}</strong>
                    <small>{membership.student?.email ?? ""} · {statusLabel(membership.status)}</small>
                  </span>
                  <div className="admin-actions">
                    <button className="admin-button--ghost admin-button--compact" type="button" disabled={saving || !canManageAssignments} onClick={() => setMembershipStatus(membership.id, "ACTIVE")}>Aktif</button>
                    <button className="admin-button--ghost admin-button--compact" type="button" disabled={saving || !canManageAssignments} onClick={() => setMembershipStatus(membership.id, "SUSPENDED")}>Askıya Al</button>
                    <button className="admin-button--ghost admin-button--compact" type="button" disabled={saving || !canManageAssignments} onClick={() => setMembershipStatus(membership.id, "LEFT")}>Ayrıldı</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!sectionLoading && !studentMemberships.length ? <EmptyState title="Üyelik yok" body="Seçili şubede öğrenci üyeliği bulunmuyor." /> : null}
        </article>
      </section>
    );
  }

  function renderClassGroups() {
    return (
      <section className="admin-saas-grid">
        <article className="admin-card admin-saas-main-card">
          <div className="admin-saas-section-head">
            <div>
              <span className="admin-badge">Sınıf / Grup Yönetimi</span>
              <h2>Şube sınıfları ve çalışma grupları</h2>
            </div>
            <BranchSelect />
          </div>
          {sectionLoading ? <p className="admin-empty-state">Sınıf/grup kayıtları yükleniyor...</p> : null}
          {!sectionLoading && classGroups.length ? (
            <div className="admin-saas-table">
              {classGroups.map((classGroup) => (
                <button key={classGroup.id} className="admin-saas-row" type="button" onClick={() => startEditClassGroup(classGroup)}>
                  <span><strong>{classGroup.name}</strong><small>{classGroup.description || classGroup.slug}</small></span>
                  <span>{gradeLabel(classGroup.gradeLevel)}</span>
                  <span>{trackLabel(classGroup.studyTrack)}</span>
                  <span>{statusLabel(classGroup.status)}</span>
                  <span>{classGroup._count?.instructorAssignments ?? 0} öğretmen · {classGroup._count?.coachAssignments ?? 0} koç</span>
                </button>
              ))}
            </div>
          ) : null}
          {!sectionLoading && !classGroups.length ? <EmptyState title="Sınıf/grup yok" body="Seçili şube için ilk sınıf veya çalışma grubunu oluşturun." /> : null}
        </article>
        <article className="admin-card admin-saas-form-card">
          <span className="admin-badge">{editingClassGroupId ? "Güncelle" : "Yeni Sınıf / Grup"}</span>
          <p className="admin-saas-muted">Şube: {selectedBranch?.name ?? "Seçilmedi"}</p>
          <FormGrid>
            <Field label="Grup Adı"><input className="admin-input" value={classGroupDraft.name} onChange={(event) => setClassGroupDraft({ ...classGroupDraft, name: event.target.value })} /></Field>
            <Field label="Slug"><input className="admin-input" value={classGroupDraft.slug} onChange={(event) => setClassGroupDraft({ ...classGroupDraft, slug: event.target.value })} disabled={Boolean(editingClassGroupId)} /></Field>
            <Field label="Seviye">
              <select className="admin-input" value={classGroupDraft.gradeLevel} onChange={(event) => setClassGroupDraft({ ...classGroupDraft, gradeLevel: event.target.value as ClassGroupDraft["gradeLevel"] })}>
                <option value="">Seviye seçilmedi</option>
                {gradeLevels.map((grade) => <option key={grade.value} value={grade.value}>{grade.label}</option>)}
              </select>
            </Field>
            <Field label="Ders / Alan">
              <select className="admin-input" value={classGroupDraft.studyTrack} onChange={(event) => setClassGroupDraft({ ...classGroupDraft, studyTrack: event.target.value as ClassGroupDraft["studyTrack"] })}>
                <option value="">Alan seçilmedi</option>
                {studyTracks.map((track) => <option key={track.value} value={track.value}>{track.label}</option>)}
              </select>
            </Field>
            <Field label="Durum"><Select value={classGroupDraft.status} onChange={(value) => setClassGroupDraft({ ...classGroupDraft, status: value as ClassGroupStatus })} options={classGroupStatuses} /></Field>
          </FormGrid>
          <Field label="Açıklama"><textarea className="admin-input admin-textarea admin-textarea--compact" value={classGroupDraft.description} onChange={(event) => setClassGroupDraft({ ...classGroupDraft, description: event.target.value })} /></Field>
          <FormActions saving={saving} saveLabel={editingClassGroupId ? "Güncelle" : "Kaydet"} onSave={saveClassGroup} onCancel={() => { setEditingClassGroupId(""); setClassGroupDraft(emptyClassGroupDraft); }} />
        </article>
      </section>
    );
  }

  function renderScope() {
    const resolvedScope = tenancyOverview?.currentScope ?? scope;

    return (
      <section className="admin-saas-grid">
        <article className="admin-card admin-saas-main-card">
          <span className="admin-badge">Yetki Özeti</span>
          <h2>Rol ve erişim kapsamı</h2>
          <div className="admin-saas-diagnostics">
            <Diagnostic label="Rol" value={staffOverview?.roleKeys.join(", ") || "Rol yok"} />
            <Diagnostic label="Organizasyon Yetkisi" value={resolvedScope?.actor.organizationId || "Tüm organizasyonlar veya henüz atanmadı"} />
            <Diagnostic label="Şube Yetkisi" value={resolvedScope?.actor.branchIds.length ? resolvedScope.actor.branchIds.join(", ") : "Tüm şubeler veya henüz atanmadı"} />
            <Diagnostic label="Super Admin" value={resolvedScope?.actor.isSuperAdmin ? "Evet" : "Hayır"} />
            <Diagnostic label="Yetki Sayısı" value={`${staffOverview?.permissionKeys.length ?? 0} aktif yetki`} />
          </div>
          <details className="admin-saas-advanced">
            <summary>Teknik yetki anahtarlarını göster</summary>
            <div className="admin-saas-permission-grid">
              {(staffOverview?.permissionKeys ?? []).map((permission) => <span key={permission}>{permission}</span>)}
            </div>
          </details>
        </article>
        <article className="admin-card">
          <span className="admin-badge">Gelişmiş</span>
          <h2>Teknik kapsam detayı</h2>
          <p>Destek ve denetim gerektiğinde ayrıntılı kapsam bilgisi açılabilir.</p>
          <details className="admin-saas-advanced">
            <summary>Teknik detayları göster</summary>
            <pre className="admin-saas-json">{JSON.stringify(resolvedScope, null, 2)}</pre>
          </details>
        </article>
      </section>
    );
  }

  function OrganizationSelect() {
    return (
      <select className="admin-input" value={selectedOrganizationId} onChange={(event) => { setSelectedOrganizationId(event.target.value); setEditingCenterId(""); setEditingBranchId(""); setCenterDraft(emptyCenterDraft); setBranchDraft(emptyBranchDraft); }}>
        <option value="">Organizasyon Seç</option>
        {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
      </select>
    );
  }

  function BranchSelect() {
    return (
      <select className="admin-input" value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)}>
        <option value="">Şube Seç</option>
        {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
      </select>
    );
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="admin-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function RecordRow({ title, meta, detail }: { title: string; meta: string; detail: string }) {
  return (
    <div className="admin-saas-record-row">
      <span>
        <strong>{title}</strong>
        <small>{meta}</small>
      </span>
      <time>{detail}</time>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="admin-empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="admin-form-grid admin-saas-form-grid">{children}</div>;
}

function Select({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select className="admin-input" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function FormActions({
  saving,
  saveLabel,
  onSave,
  onCancel
}: {
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="admin-actions">
      <button className="admin-button" type="button" disabled={saving} onClick={onSave}>
        {saving ? "Kaydediliyor..." : saveLabel}
      </button>
      <button className="admin-button--ghost" type="button" disabled={saving} onClick={onCancel}>
        İptal
      </button>
    </div>
  );
}

function Diagnostic({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-saas-diagnostic">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function hasPermission(overview: StaffOverviewResponse | null, permission: string) {
  return Boolean(overview?.permissionKeys.includes(permission) || overview?.roleKeys.includes("super-admin"));
}

function optionalDraft(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function nullableDraft(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";

  if (message.toLocaleLowerCase("tr-TR").includes("forbidden") || message.includes("yetki")) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }

  return message || fallback;
}

function statusLabel(value?: string | null) {
  switch (value) {
    case "ACTIVE":
      return "Aktif";
    case "SUSPENDED":
      return "Askıda";
    case "ARCHIVED":
      return "Arşiv";
    case "LEFT":
      return "Ayrıldı";
    case "REVOKED":
      return "Pasif";
    default:
      return "Belirsiz";
  }
}

function roleLabel(value?: StaffBranchRole | null) {
  return staffRoles.find((role) => role.value === value)?.label ?? "Rol yok";
}

function gradeLabel(value?: GradeLevel | null) {
  return gradeLevels.find((grade) => grade.value === value)?.label ?? "Seviye yok";
}

function trackLabel(value?: StudyTrack | null) {
  return studyTracks.find((track) => track.value === value)?.label ?? "Ders yok";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
