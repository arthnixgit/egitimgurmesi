"use client";

import { useMemo, useState } from "react";
import type {
  AdminFreeMaterialCategory,
  AdminFreeMaterialItem,
  AdminFreeMaterialsDocument
} from "../../../lib/auth-client";
import type { BuilderActions } from "../lib/builder-types";
import { MediaField } from "./media-field";

type MaterialStatusFilter = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

const materialFilters: Array<{ key: MaterialStatusFilter; label: string }> = [
  { key: "ALL", label: "Tümü" },
  { key: "PUBLISHED", label: "Yayında" },
  { key: "DRAFT", label: "Taslak" },
  { key: "ARCHIVED", label: "Arşivlenmiş" }
];

const protectedToolTypes = new Set(["COUNTDOWN", "CALCULATOR", "SIMULATION", "SYSTEM_TOOL", "TOOL"]);

export function FreeMaterialEditor({
  materials,
  selectedCategory,
  selectedItem,
  actions
}: {
  materials: AdminFreeMaterialsDocument;
  selectedCategory: AdminFreeMaterialCategory | null;
  selectedItem: AdminFreeMaterialItem | null;
  actions: BuilderActions;
}) {
  const [statusFilter, setStatusFilter] = useState<MaterialStatusFilter>("ALL");

  const visibleCategories = useMemo(() => {
    const filtered = materials.categories.filter((category) => matchesStatus(category.publishStatus, statusFilter));
    if (selectedCategory && !filtered.some((category) => category.key === selectedCategory.key)) {
      return [selectedCategory, ...filtered];
    }
    return filtered;
  }, [materials.categories, selectedCategory, statusFilter]);

  const categoryItems = selectedCategory?.items ?? [];
  const visibleItems = useMemo(() => {
    const filtered = categoryItems.filter((item) => matchesStatus(item.publishStatus, statusFilter));
    if (selectedItem && !filtered.some((item) => getMaterialIdentity(item) === getMaterialIdentity(selectedItem))) {
      return [selectedItem, ...filtered];
    }
    return filtered;
  }, [categoryItems, selectedItem, statusFilter]);

  const selectedItemIdentity = getMaterialIdentity(selectedItem);
  const categoryHasCards = Boolean(selectedCategory?.items.length);
  const itemDeleteDisabled = Boolean(selectedItem && protectedToolTypes.has(selectedItem.itemType));

  return (
    <div className="admin-free-material-editor">
      <div className="admin-builder-segment" role="tablist" aria-label="Materyal durum filtresi">
        {materialFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            data-testid={`material-filter-${filter.key.toLowerCase()}`}
            data-active={statusFilter === filter.key}
            onClick={() => setStatusFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="admin-builder-action-row">
        <button className="admin-button--compact" type="button" onClick={actions.addMaterialCategory}>
          Yeni Kategori
        </button>
        <button className="admin-button--compact" type="button" onClick={actions.addMaterialCard} disabled={!selectedCategory}>
          Yeni Kart
        </button>
        <button className="admin-button--compact" type="button" onClick={actions.duplicateMaterialCard} disabled={!selectedItem}>
          Çoğalt
        </button>
      </div>

      <label className="admin-builder-field">
        <span>Kategori</span>
        <select
          value={selectedCategory?.key ?? ""}
          onChange={(event) => actions.dispatchSelection({ type: "select-material-category", categoryKey: event.target.value })}
        >
          {visibleCategories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label} · {statusLabel(category.publishStatus)}
            </option>
          ))}
        </select>
      </label>

      {selectedCategory ? (
        <fieldset>
          <legend>
            Kategori bilgileri <StatusBadge status={selectedCategory.publishStatus} />
          </legend>
          <label className="admin-builder-field">
            <span>Kategori adı</span>
            <input value={selectedCategory.label} onChange={(event) => actions.updateMaterialCategory({ label: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Açıklama</span>
            <textarea value={selectedCategory.description ?? ""} onChange={(event) => actions.updateMaterialCategory({ description: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Sıra</span>
            <input
              type="number"
              value={selectedCategory.sortOrder ?? 0}
              onChange={(event) => actions.updateMaterialCategory({ sortOrder: Number(event.target.value) })}
            />
          </label>
          <div className="admin-builder-action-row">
            <button className="admin-button--compact admin-button--ghost" type="button" onClick={() => void actions.saveMaterialCategoryStatus("DRAFT", "draft")}>
              Taslak Olarak Kaydet
            </button>
            <button className="admin-button--compact" type="button" onClick={() => void actions.saveMaterialCategoryStatus("PUBLISHED", "publish")}>
              Yayınla
            </button>
            {selectedCategory.publishStatus === "ARCHIVED" ? (
              <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-category-restore" onClick={() => void actions.restoreMaterialCategory()}>
                Arşivden Çıkar
              </button>
            ) : (
              <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-category-archive" onClick={() => void actions.archiveMaterialCategory()}>
                Arşivle
              </button>
            )}
            <button
              className="admin-button--compact admin-button--danger"
              type="button"
              data-testid="material-category-delete"
              onClick={() => void actions.deleteMaterialCategory()}
              disabled={categoryHasCards}
            >
              Sil
            </button>
          </div>
          {categoryHasCards ? (
            <p className="admin-website-builder__hint">
              Bu kategoriye bağlı materyal kartları bulunuyor. Önce kartları taşıyın, arşivleyin veya silin.
            </p>
          ) : null}
        </fieldset>
      ) : (
        <div className="admin-empty-state">Bu filtrede kategori bulunmuyor.</div>
      )}

      {selectedCategory ? (
        <label className="admin-builder-field">
          <span>Kart</span>
          <select
            value={selectedItemIdentity}
            onChange={(event) => actions.dispatchSelection({ type: "select-material-item", slug: event.target.value })}
          >
            {visibleItems.map((item) => (
              <option key={getMaterialIdentity(item) || item.title} value={getMaterialIdentity(item)}>
                {item.title} · {statusLabel(item.publishStatus)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedCategory && visibleItems.length === 0 ? (
        <div className="admin-empty-state">Bu filtrede materyal kartı bulunmuyor.</div>
      ) : null}

      {selectedItem ? (
        <fieldset>
          <legend>
            Materyal kartı <StatusBadge status={selectedItem.publishStatus} />
          </legend>
          <div className="admin-builder-action-row">
            <button className="admin-icon-button" type="button" data-testid="material-card-move-up" aria-label="Yukarı taşı" onClick={() => void actions.moveMaterialCard(-1)}>
              ↑
            </button>
            <button className="admin-icon-button" type="button" data-testid="material-card-move-down" aria-label="Aşağı taşı" onClick={() => void actions.moveMaterialCard(1)}>
              ↓
            </button>
            <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-card-save-draft" onClick={() => void actions.saveMaterialCardStatus("DRAFT", "draft")}>
              Taslak Olarak Kaydet
            </button>
            <button className="admin-button--compact" type="button" data-testid="material-card-publish" onClick={() => void actions.saveMaterialCardStatus("PUBLISHED", "publish")}>
              Yayınla
            </button>
            <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-card-unpublish" onClick={() => void actions.saveMaterialCardStatus("DRAFT", "publish")}>
              Yayından Kaldır
            </button>
            {selectedItem.publishStatus === "ARCHIVED" ? (
              <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-card-restore" onClick={() => void actions.restoreMaterialCard()}>
                Arşivden Çıkar
              </button>
            ) : (
              <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-card-archive" onClick={() => void actions.archiveMaterialCard()}>
                Arşivle
              </button>
            )}
            <button
              className="admin-button--compact admin-button--danger"
              type="button"
              data-testid="material-card-delete"
              onClick={() => void actions.deleteMaterialCard()}
              disabled={itemDeleteDisabled}
            >
              Sil
            </button>
            <button
              className="admin-button--compact admin-button--ghost"
              type="button"
              data-testid="material-card-revisions"
              onClick={() => {
                void actions.loadRevisions();
                actions.dispatchSelection({ type: "select-area", area: "gecmis" });
              }}
            >
              Revizyonu Gör
            </button>
          </div>

          {itemDeleteDisabled ? (
            <div className="admin-alert" role="status">
              Bu kart bir sistem aracını gösterir. Kartı arşivleyebilirsiniz; alttaki hesaplama, simülasyon veya sayaç rotası silinmez.
            </div>
          ) : null}

          <label className="admin-builder-field">
            <span>Başlık</span>
            <input value={selectedItem.title} onChange={(event) => actions.updateMaterialItem({ title: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Özet</span>
            <textarea value={selectedItem.summary ?? ""} onChange={(event) => actions.updateMaterialItem({ summary: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Tür</span>
            <select value={selectedItem.itemType} onChange={(event) => actions.updateMaterialItem({ itemType: event.target.value })}>
              <option value="DOWNLOAD">İndirilebilir dosya</option>
              <option value="INTERNAL_PAGE">Site içi sayfa</option>
              <option value="EXTERNAL_LINK">Harici bağlantı</option>
              <option value="COUNTDOWN">Geri sayım</option>
              <option value="CALCULATOR">Puan hesaplayıcı</option>
              <option value="BLOG">Blog</option>
              <option value="SIMULATION">Simülasyon</option>
              <option value="SYSTEM_TOOL">Sistem aracı</option>
              <option value="PDF">PDF</option>
              <option value="LINK">Bağlantı</option>
              <option value="TOOL">Araç</option>
            </select>
          </label>
          <label className="admin-builder-field">
            <span>Buton etiketi</span>
            <input value={selectedItem.buttonLabel ?? ""} onChange={(event) => actions.updateMaterialItem({ buttonLabel: event.target.value })} />
          </label>

          <MediaField
            intent={{
              kind: ["DOWNLOAD", "PDF"].includes(selectedItem.itemType) ? "DOCUMENT" : "IMAGE",
              label: ["DOWNLOAD", "PDF"].includes(selectedItem.itemType) ? "İndirilecek dosya" : "Kart görseli",
              description: "Ziyaretçiye raw URL gösterilmez; kart aksiyonu güvenli hedefi kullanır.",
              recommendedDimensions: ["DOWNLOAD", "PDF"].includes(selectedItem.itemType) ? "PDF veya doküman" : "1200x800 px",
              allowExternalUrl: false
            }}
            value={["DOWNLOAD", "PDF"].includes(selectedItem.itemType) ? selectedItem.downloadUrl : selectedItem.coverImageUrl}
            onChange={(value, asset) => {
              if (["DOWNLOAD", "PDF"].includes(selectedItem.itemType)) {
                actions.updateMaterialItem({
                  downloadUrl: value,
                  mediaAssetId: asset?.id ?? selectedItem.mediaAssetId ?? null,
                  displayFilename: asset?.originalFileName ?? selectedItem.displayFilename ?? null,
                  mimeType: asset?.mimeType ?? selectedItem.mimeType ?? null,
                  fileSizeBytes: asset?.sizeBytes ?? selectedItem.fileSizeBytes ?? null
                });
              } else {
                actions.updateMaterialItem({
                  coverImageUrl: value,
                  mediaAssetId: asset?.id ?? selectedItem.mediaAssetId ?? null
                });
              }
            }}
          />

          <label className="admin-builder-field">
            <span>Hedef bağlantı</span>
            <input value={selectedItem.href ?? ""} onChange={(event) => actions.updateMaterialItem({ href: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Erişilebilir buton etiketi</span>
            <input value={selectedItem.accessibilityLabel ?? ""} onChange={(event) => actions.updateMaterialItem({ accessibilityLabel: event.target.value })} />
          </label>
          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              checked={selectedItem.publishStatus === "PUBLISHED"}
              onChange={(event) => actions.updateMaterialItem({ publishStatus: event.target.checked ? "PUBLISHED" : "DRAFT" })}
            />
            Yayında
          </label>

          <details className="admin-builder-advanced">
            <summary>Gelişmiş teknik alanlar</summary>
            <label className="admin-builder-field">
              <span>Slug</span>
              <input value={selectedItem.slug ?? ""} onChange={(event) => actions.updateMaterialItem({ slug: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>Harici indirme URL</span>
              <input value={selectedItem.downloadUrl ?? ""} onChange={(event) => actions.updateMaterialItem({ downloadUrl: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>Medya Asset ID</span>
              <input value={selectedItem.mediaAssetId ?? ""} onChange={(event) => actions.updateMaterialItem({ mediaAssetId: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>MIME tipi</span>
              <input value={selectedItem.mimeType ?? ""} onChange={(event) => actions.updateMaterialItem({ mimeType: event.target.value })} />
            </label>
          </details>
        </fieldset>
      ) : null}
    </div>
  );
}

function getMaterialIdentity(item?: AdminFreeMaterialItem | null) {
  return item?.id || item?.slug || "";
}

function matchesStatus(status: string | undefined, filter: MaterialStatusFilter) {
  return filter === "ALL" || (status ?? "DRAFT") === filter;
}

function statusLabel(status: string | undefined) {
  if (status === "PUBLISHED") {
    return "Yayında";
  }
  if (status === "ARCHIVED") {
    return "Arşivlenmiş";
  }
  return "Taslak";
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className="admin-status-pill" data-testid="material-status-badge" data-status={status ?? "DRAFT"}>
      {statusLabel(status)}
    </span>
  );
}
