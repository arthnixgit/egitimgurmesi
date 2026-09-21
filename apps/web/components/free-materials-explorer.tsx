"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { resolveMaterialTone } from "@ega/ui";
import type { ResourceLink } from "../lib/free-materials";
import { splitIntoColumns } from "../lib/material-column";

export type ExplorerMaterial = ResourceLink & {
  /** The category this material was filed under, shown as its kicker. */
  categoryLabel: string;
};

/**
 * Free materials as two flanking stacks of colour-coded cards with the detail
 * pane between them.
 *
 * This restores the pick-and-read layout the page originally had. Every card
 * carries its own colour, so the selected one is marked by a ring and a lift
 * rather than by being the only coloured thing on screen.
 *
 * One DOM order serves both layouts. Above 1080px the three children become
 * three grid columns — cards, pane, cards. Below it the two stacks collapse to
 * `display: contents`, so their cards become a single column in reading order
 * and the detail expands under whichever card was tapped. A side pane cannot
 * work at phone width, and a layout that pretends otherwise just pushes the
 * content off-screen.
 */
export function FreeMaterialsExplorer({ materials }: { materials: readonly ExplorerMaterial[] }) {
  const entries = useMemo(
    () =>
      materials.map((material, index) => ({
        material,
        key: material.id || material.slug || `${material.title}-${index}`,
        tone: resolveMaterialTone(material.tone, index)
      })),
    [materials]
  );

  const [activeKey, setActiveKey] = useState(entries[0]?.key ?? "");

  // Resolved rather than synced through an effect: a material can disappear
  // while the page is open (unpublished in the panel), and falling back here
  // handles that without a second render pass.
  const activeIndex = Math.max(
    entries.findIndex((entry) => entry.key === activeKey),
    0
  );
  const active = entries[activeIndex] ?? null;

  if (!active) {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];

    if (!keys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    const last = entries.length - 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : event.key === "ArrowDown"
            ? Math.min(activeIndex + 1, last)
            : Math.max(activeIndex - 1, 0);

    setActiveKey(entries[next]?.key ?? activeKey);
  }

  const { left, right } = splitIntoColumns(entries);

  function renderStack(stack: typeof entries, side: "left" | "right") {
    return (
      <div className="ega-materials-explorer__stack" data-side={side}>
        {stack.map((entry) => {
          const index = entries.indexOf(entry);
          const selected = entry.key === active.key;

          return (
            <div key={entry.key} className="ega-materials-explorer__row">
              <button
                type="button"
                role="tab"
                id={`material-tab-${entry.key}`}
                aria-selected={selected}
                aria-controls={`material-panel-${entry.key}`}
                tabIndex={selected ? 0 : -1}
                className="ega-materials-explorer__item"
                data-tone={entry.tone}
                data-active={selected}
                onClick={() => setActiveKey(entry.key)}
                onKeyDown={handleKeyDown}
              >
                <span className="ega-materials-explorer__item-text">
                  <strong>{entry.material.title}</strong>
                  <small>{entry.material.categoryLabel}</small>
                </span>
              </button>

              {/* Narrow layout: the detail belongs with the card that opened it. */}
              {selected ? (
                <div className="ega-materials-explorer__inline">
                  <MaterialDetail entry={entry} index={index} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="ega-materials-explorer"
      role="tablist"
      aria-orientation="vertical"
      aria-label="Ücretsiz materyaller"
    >
      {renderStack(left, "left")}

      <div className="ega-materials-explorer__stage">
        <MaterialDetail entry={active} index={activeIndex} />
      </div>

      {renderStack(right, "right")}
    </div>
  );
}

function MaterialDetail({
  entry,
  index
}: {
  entry: { material: ExplorerMaterial; key: string; tone: string };
  index: number;
}) {
  const { material, tone } = entry;
  const isDownload = material.destinationMode === "DOWNLOAD" || Boolean(material.downloadHref);
  const href = isDownload ? material.downloadHref ?? material.href : material.href;
  const label = material.buttonLabel ?? (isDownload ? "Dosyayı İndir" : "İçeriği Aç");
  const ariaLabel = material.accessibilityLabel ?? (isDownload ? `${material.title} dosyasını indir` : label);
  const opensInNewTab = !isDownload && (material.opensInNewTab || href.startsWith("http"));
  const fileLine = [material.displayFilename, material.mimeType, formatBytes(material.fileSizeBytes)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="ega-material-stage"
      data-tone={tone}
      role="tabpanel"
      id={`material-panel-${entry.key}`}
      aria-labelledby={`material-tab-${entry.key}`}
    >
      <div className="ega-material-stage__media">
        {material.coverImageUrl ? (
          <img src={material.coverImageUrl} alt="" className="ega-material-stage__cover" />
        ) : (
          <div className="ega-material-stage__placeholder">
            <span className="ega-material-stage__badge">{material.type}</span>
            <strong>{material.title}</strong>
            <span className="ega-material-stage__index">{String(index + 1).padStart(2, "0")}</span>
          </div>
        )}
      </div>

      <div className="ega-material-stage__copy">
        <span className="ega-material-stage__kicker">{material.categoryLabel}</span>
        <h3>{material.title}</h3>

        {/* Scrolls on its own so a long summary cannot stretch the pane, and
            the download button below stays in view instead of being pushed
            off the bottom by the text. */}
        <div className="ega-material-stage__body">
          <p>{material.summary}</p>
          {fileLine ? <small className="ega-material-stage__file">{fileLine}</small> : null}
        </div>

        <a
          className="ega-button ega-material-stage__action"
          href={href}
          aria-label={ariaLabel}
          download={isDownload ? material.displayFilename || true : undefined}
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

function formatBytes(value?: number) {
  if (!value || value <= 0) {
    return "";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size >= 10 || unit === 0 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`;
}
