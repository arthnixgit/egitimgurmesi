"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearStaffTokens,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  getAdminRequestErrorMessage,
  isStaffSessionError,
  logoutStaff
} from "../../lib/auth-client";
import {
  createAdminStaffRole,
  createAdminStaffUser,
  fetchAdminStaffManagementOverview,
  updateAdminStaffPassword,
  updateAdminStaffRole,
  updateAdminStaffUser,
  type AdminPermission,
  type AdminStaffManagementOverview,
  type AdminStaffRole,
  type AdminStaffStatus,
  type AdminStaffUser
} from "../../lib/staff-management-client";

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;

type UserDraft = {
  email: string;
  firstName: string;
  lastName: string;
  status: AdminStaffStatus;
  password: string;
  roleKeys: string[];
};

type RoleDraft = {
  key: string;
  name: string;
  description: string;
  permissionKeys: string[];
};

const emptyUserDraft: UserDraft = {
  email: "",
  firstName: "",
  lastName: "",
  status: "ACTIVE",
  password: "",
  roleKeys: []
};

const emptyRoleDraft: RoleDraft = {
  key: "",
  name: "",
  description: "",
  permissionKeys: ["dashboard.read"]
};

export default function AdminStaffManagementPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [management, setManagement] = useState<AdminStaffManagementOverview | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [userDraft, setUserDraft] = useState<UserDraft>(emptyUserDraft);
  const [roleDraft, setRoleDraft] = useState<RoleDraft>(emptyRoleDraft);
  const [activePanel, setActivePanel] = useState<"users" | "roles">("users");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const bootstrapStatus = await fetchBootstrapStatus();

        if (!active) {
          return;
        }

        if (bootstrapStatus.requiresBootstrap) {
          router.replace("/kurulum");
          return;
        }

        const [staffResponse, overviewResponse, managementResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview(),
          fetchAdminStaffManagementOverview()
        ]);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);
        setManagement(managementResponse);
        const firstUser = managementResponse.users[0] ?? null;
        const firstRole = managementResponse.roles[0] ?? null;
        setSelectedUserId(firstUser?.id ?? "");
        setSelectedRoleId(firstRole?.id ?? "");
        setUserDraft(firstUser ? toUserDraft(firstUser) : emptyUserDraft);
        setRoleDraft(firstRole ? toRoleDraft(firstRole) : emptyRoleDraft);
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (isStaffSessionError(requestError)) {
          clearStaffTokens();
          setStaff(null);
          setOverview(null);
          setManagement(null);
          router.replace("/giris");
          return;
        }
        setError(
          getAdminRequestErrorMessage(requestError, {
            forbidden: "Bu alan için yetkiniz bulunmuyor.",
            notFound: "Personel kaydı bulunamadı.",
            server: "Personel servisine ulaşılamadı.",
            fallback: "Personel yönetimi yüklenemedi."
          })
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const selectedUser = useMemo(
    () => management?.users.find((user) => user.id === selectedUserId) ?? null,
    [management?.users, selectedUserId]
  );

  const selectedRole = useMemo(
    () => management?.roles.find((role) => role.id === selectedRoleId) ?? null,
    [management?.roles, selectedRoleId]
  );

  const canManageRoles = overview?.permissionKeys.includes("roles.manage") ?? false;
  const canManageStaff = overview?.permissionKeys.includes("staff.manage") ?? false;
  const userIsCreateMode = selectedUserId === "__new";
  const roleIsCreateMode = selectedRoleId === "__new";
  const roleIsReadOnly = Boolean(selectedRole && selectedRole.isSystem);

  async function reloadManagement(nextUserId?: string, nextRoleId?: string) {
    const managementResponse = await fetchAdminStaffManagementOverview();
    setManagement(managementResponse);

    const resolvedUser =
      managementResponse.users.find((user) => user.id === nextUserId) ??
      managementResponse.users.find((user) => user.id === selectedUserId) ??
      managementResponse.users[0] ??
      null;
    const resolvedRole =
      managementResponse.roles.find((role) => role.id === nextRoleId) ??
      managementResponse.roles.find((role) => role.id === selectedRoleId) ??
      managementResponse.roles[0] ??
      null;

    setSelectedUserId(resolvedUser?.id ?? "");
    setSelectedRoleId(resolvedRole?.id ?? "");
    setUserDraft(resolvedUser ? toUserDraft(resolvedUser) : emptyUserDraft);
    setRoleDraft(resolvedRole ? toRoleDraft(resolvedRole) : emptyRoleDraft);
  }

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  function selectUser(user: AdminStaffUser) {
    setSelectedUserId(user.id);
    setUserDraft(toUserDraft(user));
    setError("");
    setSuccess("");
  }

  function startNewUser() {
    setSelectedUserId("__new");
    setUserDraft({
      ...emptyUserDraft,
      roleKeys: management?.roles.find((role) => role.key === "admin") ? ["admin"] : []
    });
    setActivePanel("users");
    setError("");
    setSuccess("");
  }

  function selectRole(role: AdminStaffRole) {
    setSelectedRoleId(role.id);
    setRoleDraft(toRoleDraft(role));
    setError("");
    setSuccess("");
  }

  function startNewRole() {
    setSelectedRoleId("__new");
    setRoleDraft(emptyRoleDraft);
    setActivePanel("roles");
    setError("");
    setSuccess("");
  }

  function toggleUserRole(roleKey: string) {
    setUserDraft((current) => ({
      ...current,
      roleKeys: toggleValue(current.roleKeys, roleKey)
    }));
  }

  function toggleRolePermission(permissionKey: string) {
    setRoleDraft((current) => ({
      ...current,
      permissionKeys: toggleValue(current.permissionKeys, permissionKey)
    }));
  }

  async function saveUser() {
    if (!canManageStaff) {
      setError("Bu işlem için staff.manage yetkisi gerekli.");
      return;
    }

    const validationError = validateUserDraft(userDraft, userIsCreateMode);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (userIsCreateMode) {
        const created = await createAdminStaffUser({
          email: userDraft.email,
          firstName: userDraft.firstName,
          lastName: userDraft.lastName,
          password: userDraft.password,
          status: userDraft.status,
          roleKeys: userDraft.roleKeys
        });
        await reloadManagement(created.id);
        setSuccess("Personel hesabı oluşturuldu.");
        return;
      }

      if (!selectedUser) {
        throw new Error("Güncellenecek personel seçilmedi.");
      }

      const updated = await updateAdminStaffUser(selectedUser.id, {
        email: userDraft.email,
        firstName: userDraft.firstName,
        lastName: userDraft.lastName,
        status: userDraft.status,
        roleKeys: userDraft.roleKeys
      });

      if (userDraft.password.trim()) {
        await updateAdminStaffPassword(selectedUser.id, userDraft.password.trim());
      }

      await reloadManagement(updated.id);
      setSuccess(userDraft.password.trim() ? "Personel ve şifre güncellendi." : "Personel güncellendi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Personel kaydı tamamlanamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRole() {
    if (!canManageRoles) {
      setError("Bu işlem için roles.manage yetkisi gerekli.");
      return;
    }

    if (roleIsReadOnly) {
      setError("Korunan roller değiştirilemez. Yeni özel rol oluşturun.");
      return;
    }

    const validationError = validateRoleDraft(roleDraft, roleIsCreateMode);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (roleIsCreateMode) {
        const created = await createAdminStaffRole(roleDraft);
        await reloadManagement(undefined, created.id);
        setSuccess("Özel rol oluşturuldu.");
        return;
      }

      if (!selectedRole) {
        throw new Error("Güncellenecek rol seçilmedi.");
      }

      const updated = await updateAdminStaffRole(selectedRole.id, {
        name: roleDraft.name,
        description: roleDraft.description,
        permissionKeys: roleDraft.permissionKeys
      });
      await reloadManagement(undefined, updated.id);
      setSuccess("Rol güncellendi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Rol kaydı tamamlanamadı.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-card">
          <span className="admin-badge">Yükleniyor</span>
          <h1>Personel yönetimi açılıyor</h1>
          <div className="admin-message admin-message--success">Ekip kayıtları ve yetkiler yükleniyor.</div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">RBAC</div>
          <div>
            <strong style={{ display: "block" }}>Personel ve Roller</strong>
            <span style={{ color: "var(--admin-muted)" }}>
              Ekip hesaplarını, rollerini ve erişim yetkilerini yönetin.
            </span>
          </div>
        </div>

        <div className="admin-actions">
          <button className="admin-button--ghost" type="button" onClick={() => void reloadManagement()}>
            Yenile
          </button>
          <button className="admin-button" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      {error ? <div className="admin-message admin-message--error">{error}</div> : null}
      {success ? <div className="admin-message admin-message--success">{success}</div> : null}

      <div className="admin-panel-grid">
        <aside className="admin-card admin-sidebar">
          <span className="admin-badge">Erişim</span>
          <h2 style={{ marginTop: 18 }}>Yetki Yönetimi</h2>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            Personel erişimlerini güvenli ve düzenli şekilde yönetin.
          </p>

          <div className="admin-summary">
            <div className="admin-list__item">
              <strong>
                {staff?.staffUser.firstName} {staff?.staffUser.lastName}
              </strong>
              <div>{staff?.staffUser.email}</div>
            </div>
            <div className="admin-list__item">
              <strong>Yetkiler</strong>
              <div>{overview?.permissionKeys.length ?? 0} aktif yetki</div>
            </div>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi">
              <strong>{management?.users.length ?? 0}</strong>
              <span>Personel</span>
            </div>
            <div className="admin-kpi">
              <strong>{management?.roles.length ?? 0}</strong>
              <span>Rol</span>
            </div>
            <div className="admin-kpi">
              <strong>{management?.permissions.length ?? 0}</strong>
              <span>Yetki</span>
            </div>
            <div className="admin-kpi">
              <strong>{management?.users.filter((user) => user.status === "ACTIVE").length ?? 0}</strong>
              <span>Aktif hesap</span>
            </div>
          </div>

          <div className="admin-tab-list">
            <button
              className={`admin-tab ${activePanel === "users" ? "admin-tab--active" : ""}`}
              type="button"
              onClick={() => setActivePanel("users")}
            >
              <strong>Personel Hesapları</strong>
              <span>Panel kullanıcıları ve rol atamaları</span>
            </button>
            <button
              className={`admin-tab ${activePanel === "roles" ? "admin-tab--active" : ""}`}
              type="button"
              onClick={() => setActivePanel("roles")}
            >
              <strong>Roller ve Yetkiler</strong>
              <span>Özel roller ve izin paketleri</span>
            </button>
          </div>
        </aside>

        <section className="admin-card admin-editor-panel">
          <div className="admin-editor-header">
            <div>
              <span className="admin-badge">{activePanel === "users" ? "Personel" : "Roller"}</span>
              <h1>{activePanel === "users" ? "Personel Yönetimi" : "Rol ve Yetki Yönetimi"}</h1>
              <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
                Rolleri düzenleyin, ekip üyelerine uygun erişimleri atayın.
              </p>
            </div>

            <div className="admin-actions">
              <button className="admin-button--ghost" type="button" onClick={startNewUser}>
                Yeni Personel
              </button>
              <button className="admin-button--ghost" type="button" onClick={startNewRole}>
                Yeni Rol
              </button>
            </div>
          </div>

          {activePanel === "users" ? (
            <section className="admin-record-grid">
              <div className="admin-record-list">
                <div className="admin-record-list__items">
                  {userIsCreateMode ? (
                    <button className="admin-record-item admin-record-item--active" type="button">
                      <div className="admin-record-item__top">
                        <strong>Yeni personel</strong>
                        <span className="admin-status-pill admin-status-pill--active">Yeni</span>
                      </div>
                    </button>
                  ) : null}
                  {management?.users.map((user) => (
                    <button
                      key={user.id}
                      className={`admin-record-item ${selectedUserId === user.id ? "admin-record-item--active" : ""}`}
                      type="button"
                      onClick={() => selectUser(user)}
                    >
                      <div className="admin-record-item__top">
                        <strong>{user.firstName} {user.lastName}</strong>
                        <span className={`admin-status-pill admin-status-pill--${user.status.toLowerCase()}`}>
                          {formatStatus(user.status)}
                        </span>
                      </div>
                      <div className="admin-record-item__meta">
                        <span>{user.email}</span>
                        <span>{user.roleKeys.join(", ") || "Rol yok"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-record-editor">
                <StaffUserForm
                  draft={userDraft}
                  roles={management?.roles ?? []}
                  isCreateMode={userIsCreateMode}
                  isSelf={selectedUser?.id === staff?.staffUser.id}
                  saving={saving}
                  onDraftChange={setUserDraft}
                  onToggleRole={toggleUserRole}
                  onSave={() => void saveUser()}
                />
              </div>
            </section>
          ) : null}

          {activePanel === "roles" ? (
            <section className="admin-record-grid">
              <div className="admin-record-list">
                <div className="admin-record-list__items">
                  {roleIsCreateMode ? (
                    <button className="admin-record-item admin-record-item--active" type="button">
                      <div className="admin-record-item__top">
                        <strong>Yeni özel rol</strong>
                        <span className="admin-status-pill admin-status-pill--active">Yeni</span>
                      </div>
                    </button>
                  ) : null}
                  {management?.roles.map((role) => (
                    <button
                      key={role.id}
                      className={`admin-record-item ${selectedRoleId === role.id ? "admin-record-item--active" : ""}`}
                      type="button"
                      onClick={() => selectRole(role)}
                    >
                      <div className="admin-record-item__top">
                        <strong>{role.name}</strong>
                        <span className={`admin-status-pill ${role.isSystem ? "admin-status-pill--invited" : "admin-status-pill--active"}`}>
                          {role.isSystem ? "Sistem" : "Özel"}
                        </span>
                      </div>
                      <div className="admin-record-item__meta">
                        <span>{role.key}</span>
                        <span>{role.permissionKeys.length} yetki</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-record-editor">
                <RoleForm
                  draft={roleDraft}
                  permissions={management?.permissions ?? []}
                  isCreateMode={roleIsCreateMode}
                  isReadOnly={roleIsReadOnly}
                  saving={saving}
                  onDraftChange={setRoleDraft}
                  onTogglePermission={toggleRolePermission}
                  onSave={() => void saveRole()}
                />
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function StaffUserForm({
  draft,
  roles,
  isCreateMode,
  isSelf,
  saving,
  onDraftChange,
  onToggleRole,
  onSave
}: {
  draft: UserDraft;
  roles: AdminStaffRole[];
  isCreateMode: boolean;
  isSelf: boolean;
  saving: boolean;
  onDraftChange: (draft: UserDraft) => void;
  onToggleRole: (roleKey: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="admin-subpanel">
      <div>
        <span className="admin-badge">{isCreateMode ? "Yeni hesap" : "Personel düzenleme"}</span>
        <h2>{isCreateMode ? "Yeni personel oluştur" : "Personel hesabını güncelle"}</h2>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Ad</span>
          <input
            className="admin-input"
            value={draft.firstName}
            onChange={(event) => onDraftChange({ ...draft, firstName: event.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Soyad</span>
          <input
            className="admin-input"
            value={draft.lastName}
            onChange={(event) => onDraftChange({ ...draft, lastName: event.target.value })}
          />
        </label>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>E-posta</span>
          <input
            className="admin-input"
            type="email"
            value={draft.email}
            onChange={(event) => onDraftChange({ ...draft, email: event.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Durum</span>
          <select
            className="admin-input admin-select"
            value={draft.status}
            disabled={isSelf}
            onChange={(event) =>
              onDraftChange({ ...draft, status: event.target.value as AdminStaffStatus })
            }
          >
            <option value="ACTIVE">Aktif</option>
            <option value="INVITED">Davetli</option>
            <option value="SUSPENDED">Askıda</option>
          </select>
        </label>
      </div>

      <label className="admin-field">
        <span>{isCreateMode ? "Geçici şifre" : "Şifre yenileme"}</span>
        <input
          className="admin-input"
          type="password"
          placeholder={isCreateMode ? "En az 8 karakter" : "Boş bırakırsan değişmez"}
          value={draft.password}
          onChange={(event) => onDraftChange({ ...draft, password: event.target.value })}
        />
      </label>

      <div className="admin-subpanel">
        <strong>Rol atamaları</strong>
        {isSelf ? (
          <div className="admin-message admin-message--success">
            Güvenlik için kendi rol atamalarınızı bu ekrandan değiştiremezsiniz.
          </div>
        ) : null}
        <div className="admin-permission-grid">
          {roles.map((role) => (
            <label key={role.key} className="admin-check-card">
              <input
                type="checkbox"
                checked={draft.roleKeys.includes(role.key)}
                disabled={isSelf}
                onChange={() => onToggleRole(role.key)}
              />
              <span>
                <strong>{role.name}</strong>
                <small>{role.description || role.key}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button className="admin-button" type="button" disabled={saving} onClick={onSave}>
        {saving ? "Kaydediliyor..." : isCreateMode ? "Personeli Oluştur" : "Personeli Kaydet"}
      </button>
    </section>
  );
}

function RoleForm({
  draft,
  permissions,
  isCreateMode,
  isReadOnly,
  saving,
  onDraftChange,
  onTogglePermission,
  onSave
}: {
  draft: RoleDraft;
  permissions: AdminPermission[];
  isCreateMode: boolean;
  isReadOnly: boolean;
  saving: boolean;
  onDraftChange: (draft: RoleDraft) => void;
  onTogglePermission: (permissionKey: string) => void;
  onSave: () => void;
}) {
  const permissionGroups = groupPermissions(permissions);

  return (
    <section className="admin-subpanel">
      <div>
        <span className="admin-badge">{isCreateMode ? "Yeni rol" : isReadOnly ? "Sistem rolü" : "Özel rol"}</span>
        <h2>{isCreateMode ? "Özel rol oluştur" : "Rol yetkilerini incele"}</h2>
      </div>

      {isReadOnly ? (
        <div className="admin-message admin-message--success">
          Korunan roller düzenlenemez. Yeni ihtiyaçlar için özel rol tanımlayın.
        </div>
      ) : null}

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Rol anahtarı</span>
          <input
            className="admin-input"
            value={draft.key}
            disabled={!isCreateMode || isReadOnly}
            placeholder="ornek-rol"
            onChange={(event) => onDraftChange({ ...draft, key: event.target.value.toLowerCase() })}
          />
        </label>
        <label className="admin-field">
          <span>Rol adı</span>
          <input
            className="admin-input"
            value={draft.name}
            disabled={isReadOnly}
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Açıklama</span>
        <textarea
          className="admin-input admin-textarea admin-textarea--compact"
          value={draft.description}
          disabled={isReadOnly}
          onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
        />
      </label>

      <div className="admin-stack">
        {permissionGroups.map(([groupName, groupPermissionsList]) => (
          <div className="admin-subpanel" key={groupName}>
            <strong>{formatPermissionGroup(groupName)}</strong>
            <div className="admin-permission-grid">
              {groupPermissionsList.map((permission) => (
                <label key={permission.key} className="admin-check-card">
                  <input
                    type="checkbox"
                    checked={draft.permissionKeys.includes(permission.key)}
                    disabled={isReadOnly}
                    onChange={() => onTogglePermission(permission.key)}
                  />
                  <span>
                    <strong>{permission.name}</strong>
                    <small>{permission.key}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="admin-button" type="button" disabled={saving || isReadOnly} onClick={onSave}>
        {saving ? "Kaydediliyor..." : isCreateMode ? "Rol Oluştur" : "Rolü Kaydet"}
      </button>
    </section>
  );
}

function toUserDraft(user: AdminStaffUser): UserDraft {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    password: "",
    roleKeys: user.roleKeys
  };
}

function toRoleDraft(role: AdminStaffRole): RoleDraft {
  return {
    key: role.key,
    name: role.name,
    description: role.description ?? "",
    permissionKeys: role.permissionKeys
  };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function validateUserDraft(draft: UserDraft, isCreateMode: boolean) {
  if (!draft.firstName.trim() || !draft.lastName.trim()) {
    return "Ad ve soyad zorunludur.";
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim())) {
    return "Geçerli bir e-posta girin.";
  }

  if (isCreateMode && draft.password.trim().length < 8) {
    return "Yeni personel için en az 8 karakterli geçici şifre gerekli.";
  }

  if (!isCreateMode && draft.password.trim() && draft.password.trim().length < 8) {
    return "Yeni şifre en az 8 karakter olmalı.";
  }

  if (draft.roleKeys.length === 0) {
    return "En az bir rol seçin.";
  }

  return "";
}

function validateRoleDraft(draft: RoleDraft, isCreateMode: boolean) {
  if (isCreateMode && !/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(draft.key.trim())) {
    return "Rol anahtarı küçük harf, rakam ve tire içermeli. Örnek: operasyon-sorumlusu";
  }

  if (!draft.name.trim()) {
    return "Rol adı zorunludur.";
  }

  if (draft.permissionKeys.length === 0) {
    return "En az bir yetki seçin.";
  }

  return "";
}

function groupPermissions(permissions: AdminPermission[]) {
  const groups = permissions.reduce<Record<string, AdminPermission[]>>((accumulator, permission) => {
    const groupName = permission.key.split(".")[0] || "other";
    accumulator[groupName] = [...(accumulator[groupName] ?? []), permission];
    return accumulator;
  }, {});

  return Object.entries(groups).sort(([left], [right]) => left.localeCompare(right, "tr"));
}

function formatPermissionGroup(groupName: string) {
  const labels: Record<string, string> = {
    audit: "Denetim",
    cms: "İçerik",
    coupons: "Kupon",
    dashboard: "Kontrol Merkezi",
    integrations: "Entegrasyon",
    lms: "LMS",
    maintenance: "Bakım",
    orders: "Sipariş",
    payments: "Ödeme",
    pricing: "Fiyat",
    products: "Ürün",
    reports: "Rapor",
    roles: "Rol",
    settings: "Ayar",
    staff: "Personel",
    users: "Öğrenci",
    whatsapp: "Lead / WhatsApp"
  };

  return labels[groupName] ?? groupName;
}

function formatStatus(status: AdminStaffStatus) {
  if (status === "ACTIVE") {
    return "Aktif";
  }

  if (status === "INVITED") {
    return "Davetli";
  }

  return "Askıda";
}
