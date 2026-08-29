"use client";

import type { AdminWebsiteRevision } from "../../../lib/auth-client";

export function RevisionPanel({
  revisions,
  saving,
  loadRevisions,
  restoreRevision
}: {
  revisions: AdminWebsiteRevision[];
  saving: boolean;
  loadRevisions: () => Promise<void>;
  restoreRevision: (revisionId: string) => Promise<void>;
}) {
  return (
    <div className="admin-website-builder__form">
      <button className="admin-button--ghost" type="button" onClick={() => void loadRevisions()}>
        Revizyonları Yükle
      </button>
      <div className="admin-website-builder__revision-list">
        {revisions.map((revision) => (
          <article key={revision.id}>
            <strong>{revision.entityType}</strong>
            <span>{revision.action}</span>
            <small>{new Date(revision.createdAt).toLocaleString("tr-TR")}</small>
            <p>{revision.summary}</p>
            <button className="admin-button--compact" type="button" disabled={saving} onClick={() => void restoreRevision(revision.id)}>
              Geri Yükle
            </button>
          </article>
        ))}
        {revisions.length === 0 ? <p className="admin-website-builder__hint">Revizyonları görmek için listeyi yükleyin.</p> : null}
      </div>
    </div>
  );
}
