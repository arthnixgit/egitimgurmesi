"use client";

import { useId, useState } from "react";
import {
  uploadAdminMedia,
  type AdminMediaAsset
} from "../../../lib/media-client";
import { formatBytes, validateClientMediaFile } from "../lib/builder-media";
import type { MediaFieldIntent } from "../lib/builder-types";
import { MediaPickerDialog } from "./media-picker-dialog";

export function MediaField({
  intent,
  value,
  altText,
  onChange,
  onAltTextChange
}: {
  intent: MediaFieldIntent;
  value?: string | null;
  altText?: string | null;
  onChange: (value: string, asset?: AdminMediaAsset | null) => void;
  onAltTextChange?: (value: string) => void;
}) {
  const inputId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [lastAsset, setLastAsset] = useState<AdminMediaAsset | null>(null);

  async function uploadFile(file: File) {
    const validationError = validateClientMediaFile(file, intent.kind);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError("");
    try {
      const asset = await uploadAdminMedia({
        file,
        kind: intent.kind,
        title: file.name,
        altText: altText || undefined
      });
      setLastAsset(asset);
      onChange(asset.publicUrl || asset.url || "", asset);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Dosya yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  const previewUrl = value || intent.fallbackUrl || "";
  const isImagePreview = previewUrl && intent.kind !== "DOCUMENT" && intent.kind !== "AUDIO";

  return (
    <div
      className="admin-media-field"
      data-drag-active={dragActive}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files[0];
        if (file) {
          void uploadFile(file);
        }
      }}
    >
      <div className="admin-media-field__preview">
        {isImagePreview ? <img src={previewUrl} alt={altText || intent.label} /> : <span>{intent.kind}</span>}
      </div>

      <div className="admin-media-field__body">
        <div>
          <strong>{intent.label}</strong>
          <p>{intent.description}</p>
          {intent.recommendedDimensions || intent.recommendedAspectRatio ? (
            <small>
              {[intent.recommendedDimensions, intent.recommendedAspectRatio].filter(Boolean).join(" · ")}
            </small>
          ) : null}
          {lastAsset ? (
            <small>
              {lastAsset.originalFileName || lastAsset.title} · {lastAsset.mimeType || "Dosya"} · {formatBytes(lastAsset.sizeBytes)}
            </small>
          ) : null}
        </div>

        <div className="admin-media-field__actions">
          <input
            id={inputId}
            type="file"
            className="admin-visually-hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadFile(file);
              }
              event.currentTarget.value = "";
            }}
          />
          <label className="admin-button--compact" htmlFor={inputId}>
            {uploading ? "Yükleniyor..." : "Dosya Yükle"}
          </label>
          {value ? (
            <label className="admin-button--compact admin-button--ghost" htmlFor={inputId}>
              Değiştir
            </label>
          ) : null}
          <button type="button" className="admin-button--compact" onClick={() => setPickerOpen(true)}>
            Medya Kütüphanesinden Seç
          </button>
          {previewUrl ? (
            <a className="admin-button--compact admin-button--ghost" href={previewUrl} target="_blank" rel="noreferrer">
              Önizle
            </a>
          ) : null}
          {value ? (
            <button type="button" className="admin-button--compact admin-button--ghost" onClick={() => onChange("", null)}>
              Kaldır
            </button>
          ) : null}
          {intent.fallbackUrl && value !== intent.fallbackUrl ? (
            <button type="button" className="admin-button--compact admin-button--ghost" onClick={() => onChange(intent.fallbackUrl || "", null)}>
              Varsayılana Dön
            </button>
          ) : null}
        </div>

        {onAltTextChange ? (
          <label className="admin-builder-field">
            <span>Alt metin</span>
            <input value={altText ?? ""} onChange={(event) => onAltTextChange(event.target.value)} />
          </label>
        ) : null}

        {intent.allowExternalUrl ? (
          <details className="admin-builder-advanced">
            <summary>Gelişmiş · Harici Medya Bağlantısı</summary>
            <label className="admin-builder-field">
              <span>Harici medya URL</span>
              <input value={value ?? ""} onChange={(event) => onChange(event.target.value, null)} placeholder="https://..." />
            </label>
          </details>
        ) : null}

        {error ? <div className="admin-alert admin-alert--danger" role="alert">{error}</div> : null}
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        kind={intent.kind}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          setLastAsset(asset);
          onChange(asset.publicUrl || asset.url || "", asset);
        }}
      />
    </div>
  );
}
