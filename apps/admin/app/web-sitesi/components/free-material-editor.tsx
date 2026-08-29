"use client";

import type {
  AdminFreeMaterialCategory,
  AdminFreeMaterialItem,
  AdminFreeMaterialsDocument
} from "../../../lib/auth-client";
import type { BuilderActions } from "../lib/builder-types";
import { MediaField } from "./media-field";

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
  return (
    <div className="admin-free-material-editor">
      <div className="admin-builder-action-row">
        <button className="admin-button--compact" type="button" onClick={actions.addMaterialCategory}>Yeni Kategori</button>
        <button className="admin-button--compact" type="button" onClick={actions.addMaterialCard} disabled={!selectedCategory}>Yeni Kart</button>
        <button className="admin-button--compact" type="button" onClick={actions.duplicateMaterialCard} disabled={!selectedItem}>Çoğalt</button>
      </div>

      <label className="admin-builder-field">
        <span>Kategori</span>
        <select
          value={selectedCategory?.key ?? ""}
          onChange={(event) => actions.dispatchSelection({ type: "select-material-category", categoryKey: event.target.value })}
        >
          {materials.categories.map((category) => (
            <option key={category.key} value={category.key}>{category.label}</option>
          ))}
        </select>
      </label>

      {selectedCategory ? (
        <fieldset>
          <legend>Kategori bilgileri</legend>
          <label className="admin-builder-field">
            <span>Kategori adı</span>
            <input value={selectedCategory.label} onChange={(event) => actions.updateMaterialCategory({ label: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Açıklama</span>
            <textarea value={selectedCategory.description ?? ""} onChange={(event) => actions.updateMaterialCategory({ description: event.target.value })} />
          </label>
          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              checked={selectedCategory.publishStatus !== "ARCHIVED"}
              onChange={(event) => actions.updateMaterialCategory({ publishStatus: event.target.checked ? "PUBLISHED" : "ARCHIVED" })}
            />
            Kategori aktif
          </label>
        </fieldset>
      ) : null}

      {selectedCategory ? (
        <label className="admin-builder-field">
          <span>Kart</span>
          <select
            value={selectedItem?.slug ?? ""}
            onChange={(event) => actions.dispatchSelection({ type: "select-material-item", slug: event.target.value })}
          >
            {selectedCategory.items.map((item) => (
              <option key={item.slug ?? item.title} value={item.slug ?? ""}>{item.title}</option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedItem ? (
        <fieldset>
          <legend>Materyal kartı</legend>
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
