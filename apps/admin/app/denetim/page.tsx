"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  fetchAdminAuditLog,
  fetchAdminAuditLogs,
  type AdminAuditActorType,
  type AdminAuditLogDetail,
  type AdminAuditLogSummary
} from "../../lib/audit-client";

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;

const actorTypeOptions: Array<AdminAuditActorType | "ALL"> = ["ALL", "STAFF_USER", "USER", "SYSTEM"];

export default function AdminAuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [logs, setLogs] = useState<AdminAuditLogSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedLogId, setSelectedLogId] = useState("");
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogDetail | null>(null);
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [actorTypeFilter, setActorTypeFilter] = useState<AdminAuditActorType | "ALL">("ALL");
  const [error, setError] = useState("");

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

        const [staffResponse, overviewResponse, auditResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview(),
          fetchAdminAuditLogs({ take: 80 })
        ]);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);
        setLogs(auditResponse.logs);
        setTotal(auditResponse.total);

        if (auditResponse.logs[0]) {
          const detail = await fetchAdminAuditLog(auditResponse.logs[0].id);

          if (!active) {
            return;
          }

          setSelectedLogId(detail.id);
          setSelectedLog(detail);
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
            forbidden: "Denetim kayıtları için yetkiniz bulunmuyor.",
            server: "Denetim servisine ulaşılamadı.",
            fallback: "Denetim kayıtları yüklenemedi."
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

    try {
      const auditResponse = await fetchAdminAuditLogs({
        q: search,
        entityType: entityTypeFilter,
        action: actionFilter,
        actorType: actorTypeFilter,
        take: 80
      });

      setLogs(auditResponse.logs);
      setTotal(auditResponse.total);

      if (!auditResponse.logs.length) {
        setSelectedLogId("");
        setSelectedLog(null);
        return;
      }

      const nextSelectedId = auditResponse.logs.some((log) => log.id === selectedLogId)
        ? selectedLogId
        : auditResponse.logs[0].id;
      const detail = await fetchAdminAuditLog(nextSelectedId);
      setSelectedLogId(detail.id);
      setSelectedLog(detail);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Denetim kayıtları filtrelenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectLog(auditLogId: string) {
    setSelectedLogId(auditLogId);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await fetchAdminAuditLog(auditLogId);
      setSelectedLog(detail);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Audit kaydı detayları alınamadı."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">LOG</div>
          <div>
            <strong style={{ display: "block" }}>Denetim ve Değişiklik Kayıtları</strong>
            <span style={{ color: "var(--admin-muted)" }}>
              Yetkili işlemler, içerik değişimleri ve sipariş operasyon zaman çizelgesi
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
          <span className="admin-badge">Denetim</span>
          <h2 style={{ marginTop: 18 }}>İşlem Geçmişi</h2>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            Kritik değişiklikleri, kullanıcı aktivitelerini ve kayıt geçmişini izleyin.
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
              <strong>Audit Yetkisi</strong>
              <div>
                {overview?.permissionKeys.includes("audit.read")
                  ? "audit.read aktif"
                  : "Yetki bulunamadı"}
              </div>
            </div>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi">
              <strong>{total}</strong>
              <span>Filtrelenen kayıt</span>
            </div>
            <div className="admin-kpi">
              <strong>{logs.length}</strong>
              <span>Yüklenen kayıt</span>
            </div>
            <div className="admin-kpi">
              <strong>{selectedLog ? selectedLog.entityType : "-"}</strong>
              <span>Seçili kayıt</span>
            </div>
            <div className="admin-kpi">
              <strong>{selectedLog ? selectedLog.actorType : "-"}</strong>
              <span>Seçili actor</span>
            </div>
          </div>

          <div className="admin-form">
            <div className="admin-field">
              <label>Arama</label>
              <input
                className="admin-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="İşlem, kayıt türü veya özet"
              />
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Kayıt Türü</label>
                <input
                  className="admin-input"
                  value={entityTypeFilter}
                  onChange={(event) => setEntityTypeFilter(event.target.value)}
                  placeholder="Order, Product, MarketingPage"
                />
              </div>
              <div className="admin-field">
                <label>Actor Type</label>
                <select
                  className="admin-input admin-select"
                  value={actorTypeFilter}
                  onChange={(event) =>
                    setActorTypeFilter(event.target.value as AdminAuditActorType | "ALL")
                  }
                >
                  {actorTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label>İşlem</label>
              <input
                className="admin-input"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                placeholder="orders.status.update"
              />
            </div>

            <button className="admin-button" type="button" onClick={handleApplyFilters}>
              Filtreleri Uygula
            </button>
          </div>
        </aside>

        <section className="admin-editor-panel">
          <header className="admin-card admin-editor-header">
            <div>
              <span className="admin-badge">Denetim</span>
              <h1>İşlem Geçmişi</h1>
              <p className="admin-editor-meta__text">
                İçerik, ticaret ve operasyon kayıtlarındaki kritik değişiklikleri izleyin.
              </p>
            </div>
          </header>

          {error ? <div className="admin-message admin-message--error">{error}</div> : null}
          {loading ? (
            <div className="admin-message admin-message--success">Denetim kayıtları yükleniyor...</div>
          ) : null}

          <div className="admin-record-grid admin-record-grid--stackable">
            <section className="admin-card admin-record-list">
              <div className="admin-editor-meta">
                <span className="admin-badge">Kayıt Listesi</span>
                <span className="admin-editor-meta__text">
                  En güncel kayıtlar üstte olacak şekilde sıralanır
                </span>
              </div>

              <div className="admin-record-list__items">
                {logs.length ? (
                  logs.map((log) => (
                    <button
                      key={log.id}
                      className={`admin-record-item ${selectedLogId === log.id ? "admin-record-item--active" : ""}`}
                      type="button"
                      onClick={() => handleSelectLog(log.id)}
                    >
                      <div className="admin-record-item__top">
                        <strong>{log.action}</strong>
                        <span className="admin-order-pill">{log.actorType}</span>
                      </div>
                      <div className="admin-record-item__meta">
                        <span>
                          {log.entityType} / {log.entityId}
                        </span>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                      <div className="admin-record-item__meta">
                        <span>{log.actor.name}</span>
                        <span>{log.summary || "Summary yok"}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="admin-list__item">
                    <strong>Kayıt bulunamadı</strong>
                    <div>Bu filtrelerle eşleşen audit girdisi yok.</div>
                  </div>
                )}
              </div>
            </section>

            <section className="admin-card admin-record-editor">
              {detailLoading ? (
                <div className="admin-message admin-message--success">Kayıt detayı yükleniyor...</div>
              ) : selectedLog ? (
                <div className="admin-form-stack">
                  <div className="admin-toolbar admin-toolbar--split">
                    <div className="admin-editor-meta">
                      <span className="admin-badge">Detay</span>
                      <span className="admin-editor-meta__text">{selectedLog.id}</span>
                    </div>
                    <span className="admin-order-pill">{selectedLog.actorType}</span>
                  </div>

                  <div className="admin-detail-grid">
                    <div className="admin-list__item">
                      <strong>İşlem</strong>
                      <div>{selectedLog.action}</div>
                    </div>
                    <div className="admin-list__item">
                      <strong>Kayıt</strong>
                      <div>
                        {selectedLog.entityType} / {selectedLog.entityId}
                      </div>
                    </div>
                    <div className="admin-list__item">
                      <strong>Actor</strong>
                      <div>{selectedLog.actor.name}</div>
                    </div>
                    <div className="admin-list__item">
                      <strong>E-posta</strong>
                      <div>{selectedLog.actor.email || "-"}</div>
                    </div>
                    <div className="admin-list__item">
                      <strong>Zaman</strong>
                      <div>{formatDateTime(selectedLog.createdAt)}</div>
                    </div>
                    <div className="admin-list__item">
                      <strong>IP</strong>
                      <div>{selectedLog.ipAddress || "-"}</div>
                    </div>
                  </div>

                  <div className="admin-list__item">
                    <strong>Summary</strong>
                    <div>{selectedLog.summary || "Summary bulunmuyor."}</div>
                  </div>

                  <div className="admin-record-grid admin-record-grid--stackable">
                    <div className="admin-subpanel">
                      <div className="admin-editor-meta">
                        <span className="admin-badge">Önce</span>
                      </div>
                      <pre className="admin-code-block">
                        {formatJsonBlock(selectedLog.beforeData)}
                      </pre>
                    </div>

                    <div className="admin-subpanel">
                      <div className="admin-editor-meta">
                        <span className="admin-badge">Sonra</span>
                      </div>
                      <pre className="admin-code-block">
                        {formatJsonBlock(selectedLog.afterData)}
                      </pre>
                    </div>
                  </div>

                  <div className="admin-subpanel">
                    <div className="admin-editor-meta">
                      <span className="admin-badge">Ek Bilgi</span>
                      <span className="admin-editor-meta__text">
                        User-agent ve ek bağlam bilgileri
                      </span>
                    </div>
                    <pre className="admin-code-block">
                      {formatJsonBlock({
                        metadata: selectedLog.metadata,
                        userAgent: selectedLog.userAgent
                      })}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="admin-message admin-message--success">
                  İncelemek için soldan bir audit kaydı seçin.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatJsonBlock(value: unknown) {
  if (!value) {
    return "Veri yok.";
  }

  return JSON.stringify(value, null, 2);
}
