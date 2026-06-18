"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchDeploymentStatus,
  triggerDeployment,
  type DeploymentStatus,
  type TriggerDeploymentResponse
} from "../../lib/deploy-client";

export default function DeploymentPage() {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [deployRef, setDeployRef] = useState("");
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [technicalError, setTechnicalError] = useState("");
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError("");
    setTechnicalError("");
    setShowErrorDetails(false);

    try {
      const response = await fetchDeploymentStatus();
      setStatus(response);
      setDeployRef((current) => current || response.github.branch);
    } catch (requestError) {
      setError("Güncelleme kontrolü sırasında teknik bir sorun oluştu.");
      setTechnicalError(getTechnicalErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function handleTriggerDeployment() {
    setTriggering(true);
    setError("");
    setTechnicalError("");
    setShowErrorDetails(false);
    setMessage("");

    try {
      const response: TriggerDeploymentResponse = await triggerDeployment(deployRef || status?.github.branch);
      setMessage(`GitHub deployment workflow kuyruğa alındı: ${response.ref}`);
      setConfirmOpen(false);
      setConfirmText("");
      await loadStatus();
    } catch (requestError) {
      setError("Güncelleme başlatılırken teknik bir sorun oluştu.");
      setTechnicalError(getTechnicalErrorMessage(requestError));
    } finally {
      setTriggering(false);
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-dashboard-hero admin-deploy-hero">
        <div>
          <span className="admin-badge admin-badge--warm">Yayın ve Güncelleme</span>
          <h1>VDS güncellemesini güvenli şekilde başlatın.</h1>
          <p>
            Yayın işlemleri GitHub Actions üzerinden tetiklenir; sunucuda güvenli güncelleme akışı çalışır.
          </p>

          <div className="admin-dashboard-hero__actions">
            <button
              className="admin-button"
              type="button"
              disabled={!status?.canTrigger || triggering}
              onClick={() => {
                setConfirmText("");
                setConfirmOpen(true);
              }}
            >
              {triggering ? "Güncelleme başlatılıyor..." : "Güncellemeyi Başlat"}
            </button>
            <button className="admin-button--ghost" type="button" onClick={loadStatus} disabled={loading}>
              Durumu Yenile
            </button>
            <Link className="admin-button--ghost" href="/denetim">
              Sistem Kayıtları
            </Link>
          </div>
        </div>

        <div className="admin-deploy-hero__status">
          <span>Genel Durum</span>
          <strong>{loading ? "Kontrol ediliyor" : status?.updateAvailable ? "Güncelleme var" : "Güncel"}</strong>
          <small>{status?.checkedAt ? `Son kontrol: ${formatDate(status.checkedAt)}` : "Kontrol bekleniyor"}</small>
        </div>
      </section>

      {error ? (
        <TechnicalErrorMessage
          message={error}
          details={technicalError}
          showDetails={showErrorDetails}
          onToggleDetails={() => setShowErrorDetails((current) => !current)}
        />
      ) : null}
      {message ? <div className="admin-message admin-message--success">{message}</div> : null}

      <section className="admin-deploy-grid">
        <article className="admin-card">
          <span className="admin-badge">Sürüm Durumu</span>
          <div className="admin-deploy-version-grid">
            <VersionBox
              label="Sunucuda Çalışan"
              sha={status?.currentVersion.shortSha}
              branch={status?.currentVersion.branch}
              detail={status?.currentVersion.sha}
            />
            <VersionBox
              label="GitHub Son Commit"
              sha={status?.github.latestCommit?.shortSha}
              branch={status?.github.branch}
              detail={status?.github.latestCommit?.message}
              href={status?.github.latestCommit?.url ?? undefined}
            />
          </div>

          <div className="admin-form">
            <label className="admin-field">
              <span>Deploy edilecek branch / tag / commit</span>
              <input
                className="admin-input"
                value={deployRef}
                onChange={(event) => setDeployRef(event.target.value)}
                placeholder={status?.github.branch ?? "production"}
              />
            </label>
          </div>
        </article>

        <aside className="admin-card">
          <span className="admin-badge">Kurulum Kontrolü</span>
          <div className="admin-dashboard-mini-list admin-deploy-config-list">
            <div>
              <span>Admin trigger</span>
              <strong>{status?.enabled ? "Açık" : "Kapalı"}</strong>
            </div>
            <div>
              <span>Repository</span>
              <strong>{status?.github.repository ?? "-"}</strong>
            </div>
            <div>
              <span>Workflow</span>
              <strong>{status?.github.workflowId ?? "-"}</strong>
            </div>
          </div>

          {status?.missingConfig.length ? (
            <div className="admin-message admin-message--error">
              Eksik ayarlar: {status.missingConfig.join(", ")}
            </div>
          ) : null}

          {status?.github.error ? (
            <TechnicalErrorMessage
              message="GitHub bağlantısı kontrol edilirken teknik bir sorun oluştu."
              details={status.github.error}
              showDetails={showErrorDetails}
              onToggleDetails={() => setShowErrorDetails((current) => !current)}
            />
          ) : null}
        </aside>
      </section>

      <section className="admin-card">
        <div className="admin-dashboard-section-head">
          <div>
            <span className="admin-badge">GitHub Workflow Geçmişi</span>
            <h2>Son deployment denemeleri</h2>
          </div>
        </div>

        <div className="admin-dashboard-activity-list">
          {status?.github.recentRuns.length ? (
            status.github.recentRuns.map((run) => (
              <a key={run.id} href={run.url} target="_blank" rel="noreferrer">
                <div>
                  <strong>{run.name ?? "Deploy to VDS"}</strong>
                  <span>
                    {run.shortSha} · {run.status ?? "unknown"} · {run.conclusion ?? "devam ediyor"}
                  </span>
                </div>
                <time>{formatDate(run.updatedAt)}</time>
              </a>
            ))
          ) : (
            <div className="admin-list__item">
              {loading ? "Workflow geçmişi yükleniyor..." : "Güncelleme geçmişi bulunmuyor."}
            </div>
          )}
        </div>
      </section>

      {confirmOpen ? (
        <div className="admin-session-modal" role="alertdialog" aria-modal="true" aria-labelledby="deploy-confirm-title">
          <div className="admin-session-modal__card">
            <span className="admin-session-modal__badge">Yayın Onayı</span>
            <h2 id="deploy-confirm-title">VDS güncellemesini başlatmak üzeresiniz.</h2>
            <p>
              Bu işlem GitHub Actions üzerinden sunucuda yeni sürümü çeker, build ve servis yeniden
              başlatma adımlarını tetikleyebilir. İşleme devam etmek için aşağıya GUNCELLE yazın.
            </p>
            <label className="admin-field" style={{ marginTop: "18px" }}>
              <span>Onay metni</span>
              <input
                className="admin-input"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="GUNCELLE"
              />
            </label>
            <div className="admin-session-modal__actions">
              <button
                className="admin-button"
                type="button"
                disabled={triggering || confirmText.trim().toUpperCase() !== "GUNCELLE"}
                onClick={() => void handleTriggerDeployment()}
              >
                {triggering ? "Başlatılıyor..." : "Onayla ve Başlat"}
              </button>
              <button
                className="admin-button--ghost"
                type="button"
                disabled={triggering}
                onClick={() => setConfirmOpen(false)}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function TechnicalErrorMessage({
  message,
  details,
  showDetails,
  onToggleDetails
}: {
  message: string;
  details: string;
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  return (
    <div className="admin-message admin-message--error">
      <strong>{message}</strong>
      {details ? (
        <>
          <button className="admin-button--ghost" type="button" onClick={onToggleDetails}>
            {showDetails ? "Teknik detayı gizle" : "Teknik detayı göster"}
          </button>
          {showDetails ? <pre style={{ whiteSpace: "pre-wrap" }}>{details}</pre> : null}
        </>
      ) : null}
    </div>
  );
}

function VersionBox({
  label,
  sha,
  branch,
  detail,
  href
}: {
  label: string;
  sha?: string | null;
  branch?: string | null;
  detail?: string | null;
  href?: string;
}) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{sha ?? "-"}</strong>
      <small>{branch ?? "-"}</small>
      {detail ? <p>{detail}</p> : null}
    </>
  );

  if (href) {
    return (
      <a className="admin-deploy-version" href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <div className="admin-deploy-version">{content}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getTechnicalErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Teknik detay alınamadı.";
}
