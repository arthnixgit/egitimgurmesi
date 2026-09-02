import React from "react";
import type { ResourceLink } from "../lib/free-materials";

export function FreeMaterialCard({
  item,
  compact = false
}: {
  item: ResourceLink;
  compact?: boolean;
}) {
  const isDownload = Boolean(item.downloadHref) || item.itemType === "DOWNLOAD";
  const href = item.downloadHref ?? item.href;
  const label = item.buttonLabel ?? (isDownload ? "Dosyayı İndir" : "İçeriği Aç");
  const ariaLabel = item.accessibilityLabel ?? (isDownload ? `${item.title} dosyasını indir` : label);
  const opensInNewTab = !isDownload && (item.opensInNewTab || href.startsWith("http"));

  return (
    <article className={`ega-free-link-card${compact ? " ega-free-link-card--compact" : ""}`}>
      <div className="ega-free-link-card__topline">
        <span className="ega-free-link-card__icon" aria-hidden="true">
          {iconLabel(item.iconKey, isDownload)}
        </span>
        <span className="ega-free-link-card__type">{item.type}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      {isDownload && (item.displayFilename || item.mimeType || item.fileSizeBytes) ? (
        <small className="ega-free-link-card__file">
          {[item.displayFilename, item.mimeType, formatBytes(item.fileSizeBytes)].filter(Boolean).join(" · ")}
        </small>
      ) : null}
      <div className="ega-pack-card__actions">
        <a
          className="ega-button"
          href={href}
          aria-label={ariaLabel}
          download={isDownload ? item.displayFilename || true : undefined}
          target={opensInNewTab ? "_blank" : undefined}
          rel={opensInNewTab ? "noreferrer" : undefined}
        >
          <span aria-hidden="true">{isDownload ? "↓" : "→"}</span>
          {label}
        </a>
      </div>
    </article>
  );
}

function iconLabel(iconKey: string | undefined, isDownload: boolean) {
  if (iconKey === "calculator") {
    return "CAL";
  }

  if (iconKey === "countdown") {
    return "DAY";
  }

  if (iconKey === "blog") {
    return "TXT";
  }

  if (iconKey === "simulation") {
    return "SIM";
  }

  if (iconKey === "spreadsheet") {
    return "XLS";
  }

  return isDownload ? "PDF" : "LNK";
}

function formatBytes(value: number | undefined) {
  if (!value) {
    return "";
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(value / 1024)} KB`;
}
