"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdminMedia, type AdminMediaAsset, type AdminMediaKind } from "../../../lib/media-client";
import { formatBytes, mediaKindLabel } from "../lib/builder-media";

export function MediaPickerDialog({
  open,
  kind,
  onClose,
  onSelect
}: {
  open: boolean;
  kind: AdminMediaKind;
  onClose: () => void;
  onSelect: (asset: AdminMediaAsset) => void;
}) {
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void fetchAdminMedia(kind, { search, take: 48 })
        .then((response) => {
          if (active) {
            setAssets(response);
          }
        })
        .catch((requestError) => {
          if (active) {
            setError(requestError instanceof Error ? requestError.message : "Medya kütüphanesi yüklenemedi.");
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [kind, open, search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const title = useMemo(() => `${mediaKindLabel(kind)} seç`, [kind]);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-builder-modal" role="dialog" aria-modal="true" aria-labelledby="media-picker-title">
      <button type="button" className="admin-builder-modal__backdrop" aria-label="Medya seçiciyi kapat" onClick={onClose} />
      <div className="admin-builder-modal__panel">
        <header className="admin-builder-modal__header">
          <div>
            <span>Medya Kütüphanesi</span>
            <h2 id="media-picker-title">{title}</h2>
          </div>
          <button type="button" className="admin-icon-button" aria-label="Kapat" onClick={onClose}>
            ×
          </button>
        </header>

        <label className="admin-builder-search">
          <span>Medya ara</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Başlık, dosya adı veya alt metin"
          />
        </label>

        {error ? <div className="admin-alert admin-alert--danger" role="alert">{error}</div> : null}
        {loading ? <div className="admin-empty-state">Medya kütüphanesi yükleniyor...</div> : null}

        {!loading ? (
          <div className="admin-media-picker-grid">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="admin-media-picker-card"
                onClick={() => {
                  onSelect(asset);
                  onClose();
                }}
              >
                <AssetPreview asset={asset} />
                <span>
                  <strong>{asset.title}</strong>
                  <small>{[asset.originalFileName, asset.mimeType, formatBytes(asset.sizeBytes)].filter(Boolean).join(" · ")}</small>
                </span>
              </button>
            ))}
            {assets.length === 0 ? (
              <div className="admin-empty-state">
                <p>Bu filtreyle medya bulunamadı.</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AssetPreview({ asset }: { asset: AdminMediaAsset }) {
  const url = asset.thumbnailUrl || asset.publicUrl || asset.url || "";
  if (asset.kind === "IMAGE" || asset.kind === "BRANDING") {
    return url ? <img src={url} alt={asset.altText || asset.title} /> : <span>IMG</span>;
  }

  if (asset.kind === "DOCUMENT") {
    return <span>PDF</span>;
  }

  if (asset.kind === "VIDEO") {
    return <span>VID</span>;
  }

  return <span>FILE</span>;
}
