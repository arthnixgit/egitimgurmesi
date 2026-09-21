"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type {
  AdminStaffProfile,
  AdminStaffProfileGroup,
  AdminStaffProfilesDocument
} from "../../../lib/auth-client";
import type { BuilderActions } from "../lib/builder-types";
import { AssetImage } from "./asset-image";
import { MediaField } from "./media-field";

type StaffEditorProps = {
  document: AdminStaffProfilesDocument;
  setDocument: Dispatch<SetStateAction<AdminStaffProfilesDocument>>;
  actions: BuilderActions;
};

const HIDDEN = "ARCHIVED";

function uniqueSuffix() {
  return Date.now().toString(36);
}

function resequence<T extends { sortOrder?: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, sortOrder: (index + 1) * 10 }));
}

function moveWithin<T>(items: readonly T[], index: number, direction: -1 | 1): T[] | null {
  const target = index + direction;
  if (target < 0 || target >= items.length) {
    return null;
  }
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Problems that would put a blank or half-filled card on the public page.
 * Hidden entries are skipped: they are not shown, so they cannot look broken.
 */
export function listStaffPublishProblems(document: AdminStaffProfilesDocument): string[] {
  const problems: string[] = [];

  for (const group of document.groups) {
    if (group.publishStatus === HIDDEN) {
      continue;
    }

    const groupName = group.label.trim() || group.key;

    if (!group.label.trim()) {
      problems.push(`"${group.key}" grubunun başlığı boş.`);
    }

    for (const profile of group.profiles) {
      if (profile.publishStatus === HIDDEN) {
        continue;
      }

      const profileName = profile.fullName.trim() || "İsimsiz kişi";

      if (!profile.fullName.trim()) {
        problems.push(`${groupName}: bir kişinin adı boş.`);
      }

      if (!profile.title.trim()) {
        problems.push(`${groupName}: ${profileName} için unvan / branş boş.`);
      }
    }
  }

  return problems;
}

/**
 * Akademik Kadro: groups (Koçlarımız, Öğretmenlerimiz, …) and the people in
 * each. Everything the public page shows is editable here.
 */
export function StaffPanel({ document, setDocument, actions }: StaffEditorProps) {
  const [selectedGroupKey, setSelectedGroupKey] = useState(document.groups[0]?.key ?? "");
  const [selectedProfileSlug, setSelectedProfileSlug] = useState<string | null>(null);

  const group = document.groups.find((entry) => entry.key === selectedGroupKey) ?? document.groups[0] ?? null;
  const groupIndex = group ? document.groups.indexOf(group) : -1;
  const profile =
    group?.profiles.find((entry) => entry.slug === selectedProfileSlug) ?? group?.profiles[0] ?? null;
  const profileIndex = group && profile ? group.profiles.indexOf(profile) : -1;
  const problems = listStaffPublishProblems(document);

  function updateGroups(update: (groups: AdminStaffProfileGroup[]) => AdminStaffProfileGroup[]) {
    setDocument((current) => ({ ...current, groups: update(current.groups) }));
  }

  function patchGroup(key: string, patch: Partial<AdminStaffProfileGroup>) {
    updateGroups((groups) => groups.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)));
  }

  function patchProfile(groupKey: string, slug: string, patch: Partial<AdminStaffProfile>) {
    updateGroups((groups) =>
      groups.map((entry) =>
        entry.key === groupKey
          ? {
              ...entry,
              profiles: entry.profiles.map((person) => (person.slug === slug ? { ...person, ...patch } : person))
            }
          : entry
      )
    );
  }

  function addGroup() {
    const key = `kadro-grubu-${uniqueSuffix()}`;
    updateGroups((groups) => [
      ...groups,
      {
        key,
        label: "Yeni Grup",
        eyebrow: "",
        description: "",
        introVideoSourceType: null,
        introVideoUrl: null,
        introVideoPosterUrl: null,
        introVideoTitle: null,
        sortOrder: (groups.length + 1) * 10,
        publishStatus: "PUBLISHED",
        profiles: []
      }
    ]);
    setSelectedGroupKey(key);
    setSelectedProfileSlug(null);
  }

  function moveGroup(direction: -1 | 1) {
    if (groupIndex < 0) {
      return;
    }
    updateGroups((groups) => {
      const moved = moveWithin(groups, groupIndex, direction);
      return moved ? resequence(moved) : groups;
    });
  }

  function removeGroup() {
    if (!group) {
      return;
    }
    const typed = window.prompt(
      `"${group.label || group.key}" grubu ve içindeki ${group.profiles.length} kişi kaldırılacak. Devam etmek için SİL yazın.`
    );
    if (typed !== "SİL") {
      return;
    }
    const remaining = document.groups.filter((entry) => entry.key !== group.key);
    updateGroups((groups) => resequence(groups.filter((entry) => entry.key !== group.key)));
    setSelectedGroupKey(remaining[0]?.key ?? "");
    setSelectedProfileSlug(null);
  }

  function addProfile() {
    if (!group) {
      return;
    }
    const slug = `kadro-${uniqueSuffix()}`;
    patchGroup(group.key, {
      profiles: [
        ...group.profiles,
        {
          slug,
          fullName: "",
          title: "",
          city: "",
          biography: "",
          photoUrl: "",
          sortOrder: (group.profiles.length + 1) * 10,
          publishStatus: "PUBLISHED"
        }
      ]
    });
    setSelectedProfileSlug(slug);
  }

  function moveProfile(direction: -1 | 1) {
    if (!group || profileIndex < 0) {
      return;
    }
    const moved = moveWithin(group.profiles, profileIndex, direction);
    if (moved) {
      patchGroup(group.key, { profiles: resequence(moved) });
    }
  }

  function removeProfile() {
    if (!group || !profile) {
      return;
    }
    const typed = window.prompt(`"${profile.fullName || "İsimsiz kişi"}" kaldırılacak. Devam etmek için SİL yazın.`);
    if (typed !== "SİL") {
      return;
    }
    patchGroup(group.key, { profiles: resequence(group.profiles.filter((entry) => entry.slug !== profile.slug)) });
    setSelectedProfileSlug(null);
  }

  function moveProfileToGroup(targetKey: string) {
    if (!group || !profile || targetKey === group.key) {
      return;
    }
    updateGroups((groups) =>
      groups.map((entry) => {
        if (entry.key === group.key) {
          return { ...entry, profiles: resequence(entry.profiles.filter((person) => person.slug !== profile.slug)) };
        }
        if (entry.key === targetKey) {
          return { ...entry, profiles: resequence([...entry.profiles, profile]) };
        }
        return entry;
      })
    );
    setSelectedGroupKey(targetKey);
  }

  function publish() {
    if (problems.length) {
      return;
    }
    void actions.saveCurrent("publish");
  }

  return (
    <div className="admin-staff-editor">
      <div className="admin-toolbar admin-toolbar--split">
        <div>
          <strong>Akademik Kadro</strong>
          <p>Gruplar sayfada sırayla gösterilir; her grubun kişileri kayan kartlar olarak görünür.</p>
        </div>
        <div className="admin-actions">
          <button className="admin-button--compact admin-button--ghost" type="button" onClick={() => void actions.saveCurrent("draft")}>
            Taslak kaydet
          </button>
          <button className="admin-button--compact" type="button" onClick={publish} disabled={problems.length > 0}>
            Yayınla
          </button>
        </div>
      </div>

      {problems.length ? (
        <div className="admin-alert" role="status">
          <strong>Yayınlamadan önce tamamlayın:</strong>
          <ul>
            {problems.slice(0, 6).map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="admin-staff-editor__section" aria-label="Kadro grupları">
        <div className="admin-staff-editor__head">
          <strong>Gruplar</strong>
          <button className="admin-button--compact admin-button--ghost" type="button" onClick={addGroup}>
            + Grup ekle
          </button>
        </div>
        {document.groups.length === 0 ? (
          <p className="admin-empty-state">Henüz kadro grubu yok. “Grup ekle” ile başlayın.</p>
        ) : (
          <div className="admin-staff-editor__chips" role="tablist" aria-label="Kadro grupları">
            {document.groups.map((entry) => (
              <button
                key={entry.key}
                type="button"
                role="tab"
                aria-selected={entry.key === group?.key}
                data-active={entry.key === group?.key}
                data-hidden={entry.publishStatus === HIDDEN}
                className="admin-staff-editor__chip"
                onClick={() => {
                  setSelectedGroupKey(entry.key);
                  setSelectedProfileSlug(null);
                }}
              >
                {entry.label || "Başlıksız grup"} <small>({entry.profiles.length})</small>
              </button>
            ))}
          </div>
        )}
      </section>

      {group ? (
        <section className="admin-staff-editor__section" aria-label={`${group.label} grup ayarları`}>
          <div className="admin-staff-editor__head">
            <strong>Grup ayarları</strong>
            <div className="admin-actions">
              <button type="button" className="admin-icon-button" aria-label="Grubu yukarı taşı" onClick={() => moveGroup(-1)} disabled={groupIndex <= 0}>
                ↑
              </button>
              <button
                type="button"
                className="admin-icon-button"
                aria-label="Grubu aşağı taşı"
                onClick={() => moveGroup(1)}
                disabled={groupIndex >= document.groups.length - 1}
              >
                ↓
              </button>
              <button type="button" className="admin-button--compact admin-button--ghost" onClick={removeGroup}>
                Grubu kaldır
              </button>
            </div>
          </div>
          <div className="admin-form-grid">
            <label className="admin-builder-field">
              <span>Grup başlığı</span>
              <input value={group.label} onChange={(event) => patchGroup(group.key, { label: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>Üst etiket</span>
              <input
                value={group.eyebrow ?? ""}
                placeholder="Örn. Birebir Takip"
                onChange={(event) => patchGroup(group.key, { eyebrow: event.target.value })}
              />
            </label>
          </div>
          <label className="admin-builder-field">
            <span>Açıklama</span>
            <textarea value={group.description ?? ""} onChange={(event) => patchGroup(group.key, { description: event.target.value })} />
          </label>
          <div className="admin-form-grid">
            <label className="admin-builder-field">
              <span>Tanıtım videosu bağlantısı</span>
              <input
                value={group.introVideoUrl ?? ""}
                placeholder="YouTube / Vimeo bağlantısı veya .mp4 adresi"
                onChange={(event) =>
                  patchGroup(group.key, {
                    introVideoUrl: event.target.value,
                    introVideoSourceType: /\.(mp4|webm|ogg)(\?|$)/i.test(event.target.value.trim()) ? "DIRECT" : event.target.value.trim() ? "EMBED" : null
                  })
                }
              />
            </label>
            <label className="admin-builder-field">
              <span>Video başlığı</span>
              <input value={group.introVideoTitle ?? ""} onChange={(event) => patchGroup(group.key, { introVideoTitle: event.target.value })} />
            </label>
          </div>
          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              checked={group.publishStatus === HIDDEN}
              onChange={(event) => patchGroup(group.key, { publishStatus: event.target.checked ? HIDDEN : "PUBLISHED" })}
            />
            Bu grubu sitede gizle
          </label>
        </section>
      ) : null}

      {group ? (
        <section className="admin-staff-editor__section admin-staff-editor__people" aria-label={`${group.label} kişileri`}>
          <aside className="admin-staff-editor__list">
            <div className="admin-staff-editor__head">
              <strong>Kişiler</strong>
              <button className="admin-button--compact admin-button--ghost" type="button" onClick={addProfile}>
                + Kişi ekle
              </button>
            </div>
            {group.profiles.length === 0 ? (
              <p className="admin-empty-state">Bu grupta kimse yok.</p>
            ) : (
              group.profiles.map((person) => (
                <button
                  key={person.slug}
                  type="button"
                  className="admin-staff-editor__person"
                  data-active={person.slug === profile?.slug}
                  data-hidden={person.publishStatus === HIDDEN}
                  onClick={() => setSelectedProfileSlug(person.slug)}
                >
                  {person.photoUrl ? (
                    <AssetImage src={person.photoUrl} alt="" />
                  ) : (
                    <span className="admin-staff-editor__initials" aria-hidden="true">
                      {initials(person.fullName)}
                    </span>
                  )}
                  <span>
                    <strong>{person.fullName || "İsimsiz kişi"}</strong>
                    <small>{person.title || "Unvan girilmedi"}</small>
                  </span>
                </button>
              ))
            )}
          </aside>

          {profile ? (
            <div className="admin-staff-editor__detail">
              <div className="admin-staff-editor__head">
                <strong>{profile.fullName || "İsimsiz kişi"}</strong>
                <div className="admin-actions">
                  <button type="button" className="admin-icon-button" aria-label="Yukarı taşı" onClick={() => moveProfile(-1)} disabled={profileIndex <= 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    aria-label="Aşağı taşı"
                    onClick={() => moveProfile(1)}
                    disabled={profileIndex >= group.profiles.length - 1}
                  >
                    ↓
                  </button>
                  <button type="button" className="admin-button--compact admin-button--ghost" onClick={removeProfile}>
                    Kaldır
                  </button>
                </div>
              </div>
              <div className="admin-form-grid">
                <label className="admin-builder-field">
                  <span>Ad Soyad</span>
                  <input value={profile.fullName} onChange={(event) => patchProfile(group.key, profile.slug, { fullName: event.target.value })} />
                </label>
                <label className="admin-builder-field">
                  <span>Unvan / Branş</span>
                  <input
                    value={profile.title}
                    placeholder="Örn. Matematik Öğretmeni"
                    onChange={(event) => patchProfile(group.key, profile.slug, { title: event.target.value })}
                  />
                </label>
                <label className="admin-builder-field">
                  <span>Şehir / Not</span>
                  <input value={profile.city ?? ""} onChange={(event) => patchProfile(group.key, profile.slug, { city: event.target.value })} />
                </label>
                {document.groups.length > 1 ? (
                  <label className="admin-builder-field">
                    <span>Grup</span>
                    <select value={group.key} onChange={(event) => moveProfileToGroup(event.target.value)}>
                      {document.groups.map((entry) => (
                        <option key={entry.key} value={entry.key}>
                          {entry.label || entry.key}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <label className="admin-builder-field">
                <span>Kısa biyografi (isteğe bağlı)</span>
                <textarea value={profile.biography ?? ""} onChange={(event) => patchProfile(group.key, profile.slug, { biography: event.target.value })} />
              </label>
              <MediaField
                intent={{
                  kind: "IMAGE",
                  label: "Profil fotoğrafı",
                  description: "Kare fotoğraf önerilir. Fotoğraf yoksa kartta ad baş harfleri gösterilir.",
                  recommendedDimensions: "440x440 px",
                  recommendedAspectRatio: "1:1",
                  allowExternalUrl: true
                }}
                value={profile.photoUrl ?? ""}
                altText={profile.fullName ? `${profile.fullName} profil fotoğrafı` : "Profil fotoğrafı"}
                onChange={(photoUrl) => patchProfile(group.key, profile.slug, { photoUrl })}
              />
              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  checked={profile.publishStatus === HIDDEN}
                  onChange={(event) =>
                    patchProfile(group.key, profile.slug, { publishStatus: event.target.checked ? HIDDEN : "PUBLISHED" })
                  }
                />
                Bu kişiyi sitede gizle
              </label>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase("tr-TR") ?? "")
      .join("") || "?"
  );
}
