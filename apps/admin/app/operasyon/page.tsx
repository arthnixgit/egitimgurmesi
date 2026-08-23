"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listBranches,
  listStudents,
  type TenancyBranch,
  type TenancyStudentSearchItem
} from "../../lib/admin-tenancy-client";
import {
  assignmentCandidateGuidance,
  isAssignmentSubmitDisabled,
  keepSelectedAssignmentCandidate,
  type AssignmentCandidateKind
} from "../../lib/operations-assignment-ui";
import {
  addStudentToClassGroup,
  assignCoachToClassGroup,
  assignInstructorToClassGroup,
  createAnnouncement,
  createCoachingNote,
  createCoachingPlan,
  createLiveSession,
  getClassGroupAssignmentCandidates,
  getClassGroupRoster,
  getOperationalDashboard,
  updateLiveSessionStatus,
  type ClassGroupAssignmentCandidates,
  type ClassGroupRoster,
  type OperationalDashboard
} from "../../lib/operations-client";

type SessionForm = {
  title: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  branchId: string;
  classGroupId: string;
  instructorStaffUserId: string;
  coachStaffUserId: string;
};

type AnnouncementForm = {
  title: string;
  body: string;
  branchId: string;
  classGroupId: string;
  audience: string;
};

type CoachingForm = {
  userId: string;
  branchId: string;
  coachStaffUserId: string;
  title: string;
  summary: string;
  noteTitle: string;
  noteBody: string;
};

const emptySessionForm: SessionForm = {
  title: "",
  startsAt: "",
  endsAt: "",
  meetingUrl: "",
  branchId: "",
  classGroupId: "",
  instructorStaffUserId: "",
  coachStaffUserId: ""
};

const emptyAnnouncementForm: AnnouncementForm = {
  title: "",
  body: "",
  branchId: "",
  classGroupId: "",
  audience: "ALL"
};

const emptyCoachingForm: CoachingForm = {
  userId: "",
  branchId: "",
  coachStaffUserId: "",
  title: "",
  summary: "",
  noteTitle: "",
  noteBody: ""
};

export default function OperationsPage() {
  const [dashboard, setDashboard] = useState<OperationalDashboard | null>(null);
  const [branches, setBranches] = useState<TenancyBranch[]>([]);
  const [students, setStudents] = useState<TenancyStudentSearchItem[]>([]);
  const [selectedClassGroupId, setSelectedClassGroupId] = useState("");
  const [roster, setRoster] = useState<ClassGroupRoster | null>(null);
  const [assignmentCandidates, setAssignmentCandidates] =
    useState<ClassGroupAssignmentCandidates | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySessionForm);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>(emptyAnnouncementForm);
  const [coachingForm, setCoachingForm] = useState<CoachingForm>(emptyCoachingForm);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [dashboardResponse, branchResponse, studentResponse] = await Promise.all([
        getOperationalDashboard(),
        listBranches(),
        listStudents({ limit: 80 })
      ]);

      setDashboard(dashboardResponse);
      setBranches(branchResponse);
      setStudents(studentResponse.items);

      const firstBranchId = branchResponse[0]?.id || "";
      setSessionForm((current) => ({ ...current, branchId: current.branchId || firstBranchId }));
      setAnnouncementForm((current) => ({ ...current, branchId: current.branchId || firstBranchId }));
      setCoachingForm((current) => ({ ...current, branchId: current.branchId || firstBranchId }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Operasyon verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setSelectedInstructorId("");
    setSelectedCoachId("");

    if (!selectedClassGroupId) {
      setRoster(null);
      setAssignmentCandidates(null);
      setCandidatesLoading(false);
      return;
    }

    let active = true;
    setCandidatesLoading(true);

    Promise.all([
      getClassGroupRoster(selectedClassGroupId),
      getClassGroupAssignmentCandidates(selectedClassGroupId)
    ])
      .then(([rosterResponse, candidatesResponse]) => {
        if (active) {
          setRoster(rosterResponse);
          setAssignmentCandidates(candidatesResponse);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Grup listesi alınamadı.");
        }
      })
      .finally(() => {
        if (active) {
          setCandidatesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedClassGroupId]);

  const instructors = assignmentCandidates?.instructors ?? [];
  const coaches = assignmentCandidates?.coaches ?? [];
  const canManageBranchOperations = Boolean(
    dashboard?.actor.isSuperAdmin ||
      dashboard?.actor.roles.includes("admin") ||
      dashboard?.capability.branchAdmin
  );
  const canUseCoachTools = Boolean(canManageBranchOperations || dashboard?.capability.coach);
  const canUseInstructorTools = Boolean(dashboard?.capability.instructor);
  const canViewFinance = Boolean(
    dashboard?.actor.isSuperAdmin || dashboard?.capability.branchAdmin || dashboard?.capability.accountant
  );

  async function runAction(label: string, action: () => Promise<unknown>, successMessage?: string) {
    setSaving(label);
    setError("");
    setSuccess("");

    try {
      await action();
      setSuccess(successMessage ?? "İşlem tamamlandı.");
      await load();
      if (selectedClassGroupId) {
        const [rosterResponse, candidatesResponse] = await Promise.all([
          getClassGroupRoster(selectedClassGroupId),
          getClassGroupAssignmentCandidates(selectedClassGroupId)
        ]);
        setRoster(rosterResponse);
        setAssignmentCandidates(candidatesResponse);
        setSelectedInstructorId((current) =>
          keepSelectedAssignmentCandidate(current, candidatesResponse.instructors)
        );
        setSelectedCoachId((current) =>
          keepSelectedAssignmentCandidate(current, candidatesResponse.coaches)
        );
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "İşlem tamamlanamadı.");
    } finally {
      setSaving("");
    }
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-saas-loading">
          <span className="admin-pill">Operasyon Merkezi</span>
          <h1>Operasyon verileri yükleniyor</h1>
          <p>Şube, sınıf, canlı ders ve koçluk kayıtları hazırlanıyor.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell admin-ops-shell">
      <section className="admin-card admin-ops-hero">
        <div>
          <span className="admin-pill">Operasyon Merkezi</span>
          <h1>Şube, ders ve koçluk akışlarını yönetin.</h1>
          <p>
            Sınıflar, canlı dersler, duyurular ve koçluk planları tek merkezde.
          </p>
        </div>
        <div className="admin-ops-role-card">
          <strong>{dashboard?.actor.email}</strong>
          <span>{dashboard?.actor.roles.join(", ") || "Rol yok"}</span>
          <small>{dashboard?.actor.isSuperAdmin ? "Tam platform kapsamı" : "Şube kapsamlı erişim"}</small>
        </div>
      </section>

      {error ? <div className="admin-message admin-message--error">{error}</div> : null}
      {success ? <div className="admin-message admin-message--success">{success}</div> : null}

      <section className="admin-stat-grid admin-ops-stats">
        {[
          ["Şube", dashboard?.totals.branches ?? 0],
          ["Sınıf / Grup", dashboard?.totals.classGroups ?? 0],
          ["Öğrenci", dashboard?.totals.students ?? 0],
          ["Eğitmen", dashboard?.totals.instructors ?? 0],
          ["Koç", dashboard?.totals.coaches ?? 0],
          ["Yaklaşan Ders", dashboard?.totals.upcomingSessions ?? 0]
        ].map(([label, value]) => (
          <article className="admin-stat" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      {canManageBranchOperations ? (
      <section className="admin-ops-grid">
        <article className="admin-card">
          <div className="admin-ops-head">
            <div>
              <span className="admin-pill">Sınıf / Grup</span>
              <h2>Roster ve görevli atamaları</h2>
            </div>
            <select
              className="admin-select"
              value={selectedClassGroupId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedClassGroupId(value);
                setSessionForm((current) => ({ ...current, classGroupId: value }));
                setAnnouncementForm((current) => ({ ...current, classGroupId: value }));
              }}
            >
              <option value="">Grup seç</option>
              {dashboard?.classGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {roster ? (
            <div className="admin-ops-roster">
              <div className="admin-ops-roster__summary">
                <strong>{roster.classGroup.name}</strong>
                <span>{roster.classGroup.branch?.name || "Şube yok"}</span>
                <small>
                  {roster.students.length} öğrenci · {roster.instructors.length} eğitmen · {roster.coaches.length} koç
                </small>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Öğrenci ekle</span>
                  <select
                    className="admin-select"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                  >
                    <option value="">Öğrenci seç</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Eğitmen ata</span>
                  <select
                    className="admin-select"
                    value={selectedInstructorId}
                    onChange={(event) => setSelectedInstructorId(event.target.value)}
                    disabled={candidatesLoading || instructors.length === 0}
                  >
                    <option value="">Eğitmen seç</option>
                    {instructors.map((person) => (
                      <option key={person.staffUserId} value={person.staffUserId}>
                        {person.name} - {person.email}
                      </option>
                    ))}
                  </select>
                  {candidatesLoading ? (
                    <div className="admin-empty-state">Adaylar yükleniyor...</div>
                  ) : instructors.length === 0 ? (
                    <AssignmentCandidateGuidance kind="instructor" />
                  ) : null}
                </label>
                <label className="admin-field">
                  <span>Koç ata</span>
                  <select
                    className="admin-select"
                    value={selectedCoachId}
                    onChange={(event) => setSelectedCoachId(event.target.value)}
                    disabled={candidatesLoading || coaches.length === 0}
                  >
                    <option value="">Koç seç</option>
                    {coaches.map((person) => (
                      <option key={person.staffUserId} value={person.staffUserId}>
                        {person.name} - {person.email}
                      </option>
                    ))}
                  </select>
                  {candidatesLoading ? (
                    <div className="admin-empty-state">Adaylar yükleniyor...</div>
                  ) : coaches.length === 0 ? (
                    <AssignmentCandidateGuidance kind="coach" />
                  ) : null}
                </label>
              </div>

              <div className="admin-toolbar admin-toolbar--split">
                <button
                  className="admin-button"
                  type="button"
                  disabled={!selectedStudentId || Boolean(saving)}
                  onClick={() =>
                    void runAction(
                      "student",
                      () => addStudentToClassGroup(selectedClassGroupId, selectedStudentId),
                      "Öğrenci gruba eklendi."
                    )
                  }
                >
                  {saving === "student" ? "Ekleniyor..." : "Öğrenciyi Gruba Ekle"}
                </button>
                <button
                  className="admin-button admin-button--ghost"
                  type="button"
                  disabled={isAssignmentSubmitDisabled({
                    selectedStaffUserId: selectedInstructorId,
                    saving,
                    candidatesLoading
                  })}
                  onClick={() =>
                    void runAction(
                      "instructor",
                      () => assignInstructorToClassGroup(selectedClassGroupId, selectedInstructorId),
                      "Eğitmen sınıf/gruba atandı."
                    )
                  }
                >
                  {saving === "instructor" ? "Atanıyor..." : "Eğitmen Ata"}
                </button>
                <button
                  className="admin-button admin-button--ghost"
                  type="button"
                  disabled={isAssignmentSubmitDisabled({
                    selectedStaffUserId: selectedCoachId,
                    saving,
                    candidatesLoading
                  })}
                  onClick={() =>
                    void runAction(
                      "coach",
                      () => assignCoachToClassGroup(selectedClassGroupId, selectedCoachId),
                      "Koç sınıf/gruba atandı."
                    )
                  }
                >
                  {saving === "coach" ? "Atanıyor..." : "Koç Ata"}
                </button>
              </div>

              <div className="admin-stack">
                <strong>Atanmış eğitmenler</strong>
                {roster.instructors.length ? (
                  roster.instructors.map((assignment) => (
                    <div className="admin-record-item" key={assignment.id}>
                      <div className="admin-record-item__top">
                        <strong>{assignment.name}</strong>
                        <span>Eğitmen</span>
                      </div>
                      <div className="admin-record-item__meta">
                        <span>{assignment.email}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-state">Bu gruba atanmış eğitmen yok.</div>
                )}
              </div>

              <div className="admin-stack">
                <strong>Atanmış koçlar</strong>
                {roster.coaches.length ? (
                  roster.coaches.map((assignment) => (
                    <div className="admin-record-item" key={assignment.id}>
                      <div className="admin-record-item__top">
                        <strong>{assignment.name}</strong>
                        <span>Koç</span>
                      </div>
                      <div className="admin-record-item__meta">
                        <span>{assignment.email}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-state">Bu gruba atanmış koç yok.</div>
                )}
              </div>

              <div className="admin-stack">
                {roster.students.length ? (
                  roster.students.map((entry) => (
                    <div className="admin-record-item" key={entry.id}>
                      <div className="admin-record-item__top">
                        <strong>{entry.student.name}</strong>
                        <span>{entry.status}</span>
                      </div>
                      <div className="admin-record-item__meta">
                        <span>{entry.student.email}</span>
                        <span>{entry.student.gradeLevel || "Seviye yok"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-state">Bu grupta henüz öğrenci yok.</div>
                )}
              </div>
            </div>
          ) : dashboard?.classGroups.length === 0 ? (
            <div className="admin-empty-state">
              <p>Personel atamadan önce bu şubede bir sınıf veya grup oluşturun.</p>
              <Link className="admin-button admin-button--compact" href="/saas/sinif-gruplar">
                Sınıf / Grup Yönetimi
              </Link>
            </div>
          ) : (
            <div className="admin-empty-state">Roster yönetimi için önce sınıf/grup seç.</div>
          )}
        </article>

        <article className="admin-card">
          <div className="admin-ops-head">
            <div>
              <span className="admin-pill">Canlı Dersler</span>
              <h2>Program oluştur</h2>
            </div>
          </div>
          <div className="admin-form-grid">
            <Field label="Başlık" value={sessionForm.title} onChange={(title) => setSessionForm({ ...sessionForm, title })} />
            <label className="admin-field">
              <span>Şube</span>
              <select
                className="admin-select"
                value={sessionForm.branchId}
                onChange={(event) => setSessionForm({ ...sessionForm, branchId: event.target.value })}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Başlangıç"
              type="datetime-local"
              value={sessionForm.startsAt}
              onChange={(startsAt) => setSessionForm({ ...sessionForm, startsAt })}
            />
            <Field
              label="Bitiş"
              type="datetime-local"
              value={sessionForm.endsAt}
              onChange={(endsAt) => setSessionForm({ ...sessionForm, endsAt })}
            />
            <Field
              label="Toplantı linki"
              value={sessionForm.meetingUrl}
              onChange={(meetingUrl) => setSessionForm({ ...sessionForm, meetingUrl })}
            />
          </div>
          <button
            className="admin-button"
            type="button"
            disabled={!sessionForm.title || !sessionForm.startsAt || !sessionForm.endsAt || saving === "session"}
            onClick={() =>
              void runAction("session", () =>
                createLiveSession({
                  ...sessionForm,
                  classGroupId: sessionForm.classGroupId || undefined,
                  meetingUrl: sessionForm.meetingUrl || undefined
                })
              )
            }
          >
            Canlı Dersi Planla
          </button>

          <div className="admin-stack">
            {dashboard?.upcomingSessions.length ? (
              dashboard.upcomingSessions.map((session) => (
                <div className="admin-record-item" key={session.id}>
                  <div className="admin-record-item__top">
                    <strong>{session.title}</strong>
                    <span>{session.status}</span>
                  </div>
                  <div className="admin-record-item__meta">
                    <span>{formatDate(session.startsAt)}</span>
                    <button
                      className="admin-button admin-button--compact"
                      type="button"
                      onClick={() =>
                        void runAction("sessionStatus", () =>
                          updateLiveSessionStatus(session.id, "COMPLETED")
                        )
                      }
                    >
                      Tamamlandı
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-empty-state">Yaklaşan canlı ders yok.</div>
            )}
          </div>
        </article>
      </section>
      ) : null}

      <section className="admin-ops-grid admin-ops-grid--three">
        {canUseInstructorTools ? (
        <article className="admin-card">
          <span className="admin-pill">Eğitmen Paneli</span>
          <h2>Atanmış sınıf ve öğrenciler</h2>
          <div className="admin-stack">
            {dashboard?.instructor.assignments.length ? (
              dashboard.instructor.assignments.map((assignment) => (
                <div className="admin-record-item" key={assignment.id}>
                  <strong>{assignment.student?.name || assignment.classGroup?.name || "Atama"}</strong>
                  <div className="admin-record-item__meta">
                    <span>{assignment.branch?.name || "Şube yok"}</span>
                    <span>{assignment.student?.email || assignment.classGroup?.name || "Grup yok"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-empty-state">Atama bulunmuyor.</div>
            )}
            {dashboard?.instructor.operationalBoundaries.map((item) => (
              <div className="admin-empty-state" key={item}>
                {item}
              </div>
            ))}
          </div>
        </article>
        ) : null}

        {canManageBranchOperations ? (
        <article className="admin-card">
          <span className="admin-pill">Duyurular</span>
          <h2>Şube / grup duyurusu</h2>
          <Field
            label="Başlık"
            value={announcementForm.title}
            onChange={(title) => setAnnouncementForm({ ...announcementForm, title })}
          />
          <label className="admin-field">
            <span>İçerik</span>
            <textarea
              className="admin-textarea"
              value={announcementForm.body}
              onChange={(event) => setAnnouncementForm({ ...announcementForm, body: event.target.value })}
            />
          </label>
          <button
            className="admin-button"
            type="button"
            disabled={!announcementForm.title || !announcementForm.body || saving === "announcement"}
            onClick={() => void runAction("announcement", () => createAnnouncement(announcementForm))}
          >
            Duyuruyu Yayınla
          </button>
          <div className="admin-stack">
            {dashboard?.announcements.map((announcement) => (
              <div className="admin-record-item" key={announcement.id}>
                <strong>{announcement.title}</strong>
                <p>{announcement.body}</p>
              </div>
            ))}
          </div>
        </article>
        ) : null}

        {canUseCoachTools ? (
        <article className="admin-card">
          <span className="admin-pill">Koçluk</span>
          <h2>Haftalık plan ve takip notu</h2>
          <label className="admin-field">
            <span>Öğrenci</span>
            <select
              className="admin-select"
              value={coachingForm.userId}
              onChange={(event) => setCoachingForm({ ...coachingForm, userId: event.target.value })}
            >
              <option value="">Öğrenci seç</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.email}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Plan başlığı"
            value={coachingForm.title}
            onChange={(title) => setCoachingForm({ ...coachingForm, title })}
          />
          <label className="admin-field">
            <span>Plan özeti</span>
            <textarea
              className="admin-textarea"
              value={coachingForm.summary}
              onChange={(event) => setCoachingForm({ ...coachingForm, summary: event.target.value })}
            />
          </label>
          <button
            className="admin-button"
            type="button"
            disabled={!coachingForm.userId || !coachingForm.title || saving === "plan"}
            onClick={() => void runAction("plan", () => createCoachingPlan(coachingForm))}
          >
            Planı Kaydet
          </button>
          <Field
            label="Not başlığı"
            value={coachingForm.noteTitle}
            onChange={(noteTitle) => setCoachingForm({ ...coachingForm, noteTitle })}
          />
          <label className="admin-field">
            <span>Takip notu</span>
            <textarea
              className="admin-textarea"
              value={coachingForm.noteBody}
              onChange={(event) => setCoachingForm({ ...coachingForm, noteBody: event.target.value })}
            />
          </label>
          <button
            className="admin-button admin-button--ghost"
            type="button"
            disabled={!coachingForm.userId || !coachingForm.noteTitle || !coachingForm.noteBody || saving === "note"}
            onClick={() =>
              void runAction("note", () =>
                createCoachingNote({
                  userId: coachingForm.userId,
                  branchId: coachingForm.branchId,
                  coachStaffUserId: coachingForm.coachStaffUserId || undefined,
                  title: coachingForm.noteTitle,
                  body: coachingForm.noteBody
                })
              )
            }
          >
            Takip Notu Ekle
          </button>
        </article>
        ) : null}

        {canViewFinance ? (
        <article className="admin-card">
          <span className="admin-pill">Muhasebe</span>
          <h2>Finans Özeti</h2>
          <div className="admin-stack">
            {dashboard?.finance.recentOrders.map((order, index) => (
              <div className="admin-record-item" key={String(order.id ?? index)}>
                <strong>{String(order.orderNumber ?? "Sipariş")}</strong>
                <div className="admin-record-item__meta">
                  <span>{String(order.status ?? "-")}</span>
                  <span>{String(order.totalAmount ?? "0")} {String(order.currency ?? "TRY")}</span>
                </div>
              </div>
            ))}
            {dashboard?.finance.placeholders.map((item) => (
              <div className="admin-empty-state" key={item}>
                {item} kayıtları eklendiğinde burada görüntülenir.
              </div>
            ))}
          </div>
        </article>
        ) : null}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        className="admin-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AssignmentCandidateGuidance({ kind }: { kind: AssignmentCandidateKind }) {
  const message = assignmentCandidateGuidance(kind);

  return (
    <div className="admin-empty-state">
      <p>{message}</p>
      <div className="admin-toolbar">
        <Link className="admin-button admin-button--compact" href="/personel">
          Personel ve Roller
        </Link>
        <Link className="admin-button admin-button--ghost admin-button--compact" href="/saas/sinif-gruplar">
          Sınıf / Grup Yönetimi
        </Link>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
