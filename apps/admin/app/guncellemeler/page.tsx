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

  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const response = await fetchDeploymentStatus();
      setStatus(response);
      setDeployRef((current) => current || response.github.branch);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Güncelleme durumu okunamadı.");
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
    setMessage("");

    try {
      const response: TriggerDeploymentResponse = await triggerDeployment(deployRef || status?.github.branch);
      setMessage(`GitHub deployment workflow kuyruğa alındı: ${response.ref}`);
      await loadStatus();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Deployment başlatılamadı.");
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
              onClick={handleTriggerDeployment}
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

      {error ? <div className="admin-message admin-message--error">{error}</div> : null}
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
            <div className="admin-message admin-message--error">{status.github.error}</div>
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
    </main>
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
