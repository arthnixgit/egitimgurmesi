"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  fetchAdminLead,
  fetchAdminLeads,
  type AdminLeadDetail,
  type AdminLeadStatus,
  type AdminLeadSummary,
  updateAdminLeadStatus
} from "../../lib/engagement-client";

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;

const leadStatusOptions: Array<AdminLeadStatus | "ALL"> = [
  "ALL",
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CLOSED"
];

export default function AdminLeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [leads, setLeads] = useState<AdminLeadSummary[]>([]);
  const [counts, setCounts] = useState<Record<AdminLeadStatus, number>>({
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    CLOSED: 0
  });
  const [sourcePages, setSourcePages] = useState<Array<{ value: string; count: number }>>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedLead, setSelectedLead] = useState<AdminLeadDetail | null>(null);
  const [statusDraft, setStatusDraft] = useState<AdminLeadStatus>("NEW");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminLeadStatus | "ALL">("ALL");
  const [sourcePageFilter, setSourcePageFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const bootstrap = await fetchBootstrapStatus();

        if (!active) {
          return;
        }

        if (bootstrap.requiresBootstrap) {
          router.replace("/kurulum");
          return;
        }

        const [staffResponse, overviewResponse, leadsResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview(),
          fetchAdminLeads()
        ]);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);
        setLeads(leadsResponse.leads);
        setCounts(leadsResponse.counts);
        setSourcePages(leadsResponse.sourcePages);

        if (leadsResponse.leads[0]) {
          const detail = await fetchAdminLead(leadsResponse.leads[0].id);

          if (!active) {
            return;
          }

          setSelectedLeadId(detail.id);
          setSelectedLead(detail);
          setStatusDraft(detail.status);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (isStaffSessionError(requestError)) {
          clearStaffTokens();
          router.replace("/giris");
          return;
        }

        setError(
          getAdminRequestErrorMessage(requestError, {
            forbidden: "Başvuru talepleri için yetkiniz bulunmuyor.",
            server: "Başvuru servisine ulaşılamadı.",
            fallback: "Başvuru talepleri yüklenemedi."
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

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  async function handleApplyFilters() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetchAdminLeads({
        q: search,
        status: statusFilter,
        sourcePage: sourcePageFilter === "ALL" ? "" : sourcePageFilter
      });

      setLeads(response.leads);
      setCounts(response.counts);
      setSourcePages(response.sourcePages);

      if (!response.leads.length) {
        setSelectedLeadId("");
        setSelectedLead(null);
        return;
      }

      const nextSelectedId = response.leads.some((lead) => lead.id === selectedLeadId)
        ? selectedLeadId
        : response.leads[0].id;
      const detail = await fetchAdminLead(nextSelectedId);
      setSelectedLeadId(detail.id);
      setSelectedLead(detail);
      setStatusDraft(detail.status);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Lead kayıtları filtrelenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectLead(leadId: string) {
    setSelectedLeadId(leadId);
    setDetailLoading(true);
    setError("");
    setSuccess("");

    try {
      const detail = await fetchAdminLead(leadId);
      setSelectedLead(detail);
      setStatusDraft(detail.status);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Lead detayları alınamadı."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleUpdateStatus() {
    if (!selectedLead) {
      return;
    }

    setUpdatingStatus(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateAdminLeadStatus(selectedLead.id, statusDraft);
      setSelectedLead(updated);
      setLeads((current) =>
        current.map((lead) =>
          lead.id === updated.id
            ? {
                ...lead,
                status: updated.status,
                handledAt: updated.handledAt,
                handledBy: updated.handledBy ?? null
              }
            : lead
        )
      );
      setSuccess("Lead durumu güncellendi.");
      await handleApplyFilters();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Lead durumu güncellenemedi."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  const selectedLeadSummary = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">LEAD</div>
          <div>
            <strong style={{ display: "block" }}>Ücretsiz Ön Görüşme Talepleri</strong>
            <span style={{ color: "var(--admin-muted)" }}>
              Homepage ve diğer yüzeylerden gelen danışma talepleri
            </span>
          </div>
        </div>

        <div className="admin-actions">
          <Link className="admin-button--ghost" href="/">
            Kontrol Merkezi
          </Link>
          <Link className="admin-button--ghost" href="/icerik">
            İçerik Stüdyosu
          </Link>
          <Link className="admin-button--ghost" href="/ticaret">
            Ticaret Merkezi
          </Link>
          <button className="admin-button" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="admin-panel-grid">
        <aside className="admin-card admin-sidebar">
          <span className="admin-badge">Ön Görüşme Talepleri</span>
          <h2 style={{ marginTop: 18 }}>Ön Görüşme Talepleri</h2>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            Başvuru taleplerini takip edin, filtreleyin ve ekibe atayın.
          </p>

          <div className="admin-summary">
            <div className="admin-list__item">
              <strong>
                {staff?.staffUser.firstName} {staff?.staffUser.lastName}
              </strong>
              <div>{staff?.staffUser.email}</div>
            </div>
            <div className="admin-list__item">
              <strong>Roller</strong>
              <div>{staff?.staffUser.roleKeys.join(", ") || "Tanımsız"}</div>
            </div>
            <div className="admin-list__item">
              <strong>Lead Yetkisi</strong>
              <div>
                {overview?.permissionKeys.includes("whatsapp.read")
                  ? "whatsapp.read aktif"
                  : "Yetki bulunamadı"}
              </div>
            </div>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi">
              <strong>{counts.NEW}</strong>
              <span>Yeni</span>
            </div>
            <div className="admin-kpi">
              <strong>{counts.CONTACTED}</strong>
              <span>İletişime geçildi</span>
            </div>
            <div className="admin-kpi">
              <strong>{counts.QUALIFIED}</strong>
              <span>Nitelikli</span>
            </div>
            <div className="admin-kpi">
              <strong>{counts.CLOSED}</strong>
              <span>Kapatıldı</span>
            </div>
          </div>

          <div className="admin-form">
            <div className="admin-field">
              <label>Arama</label>
              <input
                className="admin-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="İsim, telefon, e-posta, not"
              />
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Durum</label>
                <select
                  className="admin-input admin-select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as AdminLeadStatus | "ALL")
                  }
                >
                  {leadStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label>Kaynak Sayfa</label>
                <select
                  className="admin-input admin-select"
                  value={sourcePageFilter}
                  onChange={(event) => setSourcePageFilter(event.target.value)}
                >
                  <option value="ALL">ALL</option>
                  {sourcePages.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="admin-button" type="button" onClick={handleApplyFilters}>
              Filtreleri Uygula
            </button>
          </div>
        </aside>

        <section className="admin-editor-panel">
          <div className="admin-card">
            <div className="admin-editor-header">
              <div>
                <span className="admin-badge">Lead Listesi</span>
                <h1 style={{ marginBottom: 8 }}>Ziyaretçi talepleri</h1>
                <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
                  Yeni talepleri inceleyin, detayları açın ve durumu operasyon aşamasına göre güncelleyin.
                </p>
              </div>

              {selectedLeadSummary ? (
                <div className="admin-list__item">
                  <strong>{selectedLeadSummary.fullName ?? "İsimsiz kayıt"}</strong>
                  <div>{selectedLeadSummary.phoneSnapshot || "Telefon yok"}</div>
                </div>
              ) : null}
            </div>

            {loading ? (
              <div className="admin-message admin-message--success">Lead kayıtları yükleniyor...</div>
            ) : null}
            {error ? <div className="admin-message admin-message--error">{error}</div> : null}
            {success ? <div className="admin-message admin-message--success">{success}</div> : null}

            <div className="admin-lead-layout">
              <div className="admin-lead-list">
                {leads.map((lead) => (
                  <button
                    key={lead.id}
                    className={`admin-lead-card${selectedLeadId === lead.id ? " admin-lead-card--active" : ""}`}
                    type="button"
                    onClick={() => handleSelectLead(lead.id)}
                  >
                    <div className="admin-lead-card__top">
                      <strong>{lead.fullName ?? "İsimsiz talep"}</strong>
                      <span className={`admin-status-pill admin-status-pill--${lead.status.toLowerCase()}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="admin-lead-card__meta">
                      <span>{lead.phoneSnapshot ?? "Telefon yok"}</span>
                      <span>{lead.sourcePage ?? "Kaynak yok"}</span>
                    </div>
                    {lead.preview ? <p>{lead.preview}</p> : null}
                  </button>
                ))}

                {!loading && !leads.length ? (
                  <div className="admin-list__item">Bu filtrelerle eşleşen lead kaydı bulunamadı.</div>
                ) : null}
              </div>

              <div className="admin-card admin-lead-detail">
                {detailLoading ? (
                  <div className="admin-message admin-message--success">Lead detayı yükleniyor...</div>
                ) : null}

                {!detailLoading && selectedLead ? (
                  <>
                    <div className="admin-editor-header">
                      <div>
                        <span className="admin-badge">Lead Detayı</span>
                        <h2 style={{ margin: "14px 0 8px" }}>
                          {selectedLead.structuredFields.find((field) => field.label === "Ad Soyad")?.value ??
                            "Ziyaretçi talebi"}
                        </h2>
                        <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
                          Kaynak: {selectedLead.sourcePage ?? "Belirtilmemiş"} · Oluşturulma:{" "}
                          {formatDateTime(selectedLead.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="admin-detail-grid">
                      <div className="admin-list__item">
                        <strong>Telefon</strong>
                        <div>{selectedLead.phoneSnapshot ?? "Belirtilmemiş"}</div>
                      </div>
                      <div className="admin-list__item">
                        <strong>E-posta</strong>
                        <div>
                          {selectedLead.structuredFields.find((field) => field.label === "E-posta")?.value ??
                            selectedLead.user?.email ??
                            "Belirtilmemiş"}
                        </div>
                      </div>
                      <div className="admin-list__item">
                        <strong>Ürün</strong>
                        <div>{selectedLead.product?.name ?? "Bağlı ürün yok"}</div>
                      </div>
                      <div className="admin-list__item">
                        <strong>İlgilenen Personel</strong>
                        <div>{selectedLead.handledBy?.fullName ?? "Atama bekliyor"}</div>
                      </div>
                    </div>

                    {selectedLead.structuredFields.length ? (
                      <div className="admin-list">
                        {selectedLead.structuredFields.map((field) => (
                          <div key={field.label} className="admin-list__item">
                            <strong>{field.label}</strong>
                            <div>{field.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {selectedLead.message ? (
                      <div className="admin-field" style={{ marginTop: 18 }}>
                        <label>Ham Mesaj</label>
                        <textarea
                          className="admin-input admin-textarea admin-textarea--compact"
                          value={selectedLead.message}
                          readOnly
                        />
                      </div>
                    ) : null}

                    <div className="admin-form-grid" style={{ marginTop: 18 }}>
                      <div className="admin-field">
                        <label>Durum</label>
                        <select
                          className="admin-input admin-select"
                          value={statusDraft}
                          onChange={(event) => setStatusDraft(event.target.value as AdminLeadStatus)}
                        >
                          {leadStatusOptions
                            .filter((option): option is AdminLeadStatus => option !== "ALL")
                            .map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="admin-field">
                        <label>UTM Kaynağı</label>
                        <input
                          className="admin-input"
                          value={selectedLead.utmSource ?? ""}
                          readOnly
                          placeholder="Belirtilmemiş"
                        />
                      </div>
                    </div>

                    <div className="admin-actions" style={{ marginTop: 18 }}>
                      <button
                        className="admin-button"
                        type="button"
                        onClick={handleUpdateStatus}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? "Kaydediliyor..." : "Durumu Güncelle"}
                      </button>
                    </div>
                  </>
                ) : null}

                {!detailLoading && !selectedLead ? (
                  <div className="admin-list__item">Detay görmek için soldan bir lead seçin.</div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
