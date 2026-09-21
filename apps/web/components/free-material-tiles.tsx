import { resolveMaterialTone } from "@ega/ui";
import type { ExplorerMaterial } from "./free-materials-explorer";

/**
 * The materials editors add in the admin panel, as simple square tiles in the
 * colour picked for each one, with its own download (or open) button.
 */
export function FreeMaterialTiles({ materials }: { materials: readonly ExplorerMaterial[] }) {
  return (
    <div className="ega-free-tiles">
      {materials.map((material, index) => {
        const isDownload = material.destinationMode === "DOWNLOAD" || Boolean(material.downloadHref);
        const href = isDownload ? material.downloadHref ?? material.href : material.href;
        const label = material.buttonLabel ?? (isDownload ? "İndir" : "Aç");
        const ariaLabel =
          material.accessibilityLabel ?? (isDownload ? `${material.title} dosyasını indir` : `${material.title} aç`);
        const opensInNewTab = !isDownload && (material.opensInNewTab || href.startsWith("http"));
        const badge = material.type || (isDownload ? "PDF" : "Bağlantı");

        return (
          <article
            key={material.id || material.slug || `${material.title}-${index}`}
            className="ega-free-tile"
            data-tone={resolveMaterialTone(material.tone, index)}
          >
            <span className="ega-free-tile__badge">{badge}</span>
            <h3>{material.title}</h3>
            {material.summary ? <p>{material.summary}</p> : null}
            <a
              className="ega-free-tile__action"
              href={href}
              aria-label={ariaLabel}
              download={isDownload ? material.displayFilename || true : undefined}
              target={opensInNewTab ? "_blank" : undefined}
              rel={opensInNewTab ? "noreferrer" : undefined}
            >
              <span aria-hidden="true">{isDownload ? "↓" : "→"}</span>
              {label}
            </a>
          </article>
        );
      })}
    </div>
  );
}
