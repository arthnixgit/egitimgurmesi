"use client";

import { useEffect, useMemo, useState } from "react";
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
const downloadTypes = new Set(["DOWNLOAD", "PDF"]);
const countdownTypes = new Set(["COUNTDOWN", "TOOL"]);
const externalTypes = new Set(["EXTERNAL_LINK", "EXTERNAL"]);
const internalTypes = new Set(["INTERNAL_PAGE", "LINK", "GUIDANCE", "BLOG", "CALCULATOR", "SIMULATION", "SYSTEM_TOOL"]);

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
  const [categorySearch, setCategorySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(Boolean(selectedItem));

  useEffect(() => {
    if (selectedItem) {
      setEditorOpen(true);
    }
  }, [selectedItem]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEditorOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const visibleCategories = useMemo(() => {
    const search = normalizeSearch(categorySearch);
    const filtered = materials.categories.filter((category) => {
      const matchesFilter = matchesStatus(category.publishStatus, statusFilter);
      const matchesSearch = !search || normalizeSearch(`${category.label} ${category.description ?? ""}`).includes(search);
      return matchesFilter && matchesSearch;
    });
    if (selectedCategory && !filtered.some((category) => category.key === selectedCategory.key)) {
      return [selectedCategory, ...filtered];
    }
    return filtered;
  }, [categorySearch, materials.categories, selectedCategory, statusFilter]);

  const categoryItems = selectedCategory?.items ?? [];
  const visibleItems = useMemo(() => {
    const search = normalizeSearch(itemSearch);
    const filtered = categoryItems.filter((item) => {
      const matchesFilter = matchesStatus(item.publishStatus, statusFilter);
      const matchesSearch = !search || normalizeSearch(`${item.title} ${item.summary ?? ""} ${item.slug ?? ""}`).includes(search);
      return matchesFilter && matchesSearch;
    });
    if (selectedItem && !filtered.some((item) => getMaterialIdentity(item) === getMaterialIdentity(selectedItem))) {
      return [selectedItem, ...filtered];
    }
    return filtered;
  }, [categoryItems, itemSearch, selectedItem, statusFilter]);

  const selectedItemIdentity = getMaterialIdentity(selectedItem);
  const categoryHasCards = Boolean(selectedCategory?.items.length);
  const itemDeleteDisabled = Boolean(selectedItem && protectedToolTypes.has(selectedItem.itemType));

  return (
    <div className="admin-free-material-workspace" data-editor-open={editorOpen}>
      <aside className="admin-free-material-workspace__categories" aria-label="Materyal kategorileri">
        <div className="admin-free-material-workspace__panel-head">
          <div>
            <h2>Kategoriler</h2>
            <p>{materials.categories.length} kategori</p>
          </div>
          <button className="admin-button--compact" type="button" onClick={actions.addMaterialCategory}>
            Yeni Kategori
          </button>
        </div>

        <label className="admin-builder-search">
          <span>Kategori ara</span>
          <input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} />
        </label>

        <StatusFilters value={statusFilter} onChange={setStatusFilter} />

        <div className="admin-free-material-category-list" role="listbox" aria-label="Kategori listesi">
          {visibleCategories.map((category) => {
            const counts = categoryCounts(category);
            const active = selectedCategory?.key === category.key;
            return (
              <button
                key={category.key}
                type="button"
                className="admin-free-material-category-row"
                data-active={active}
                role="option"
                aria-selected={active}
                onClick={() => actions.dispatchSelection({ type: "select-material-category", categoryKey: category.key })}
              >
                <strong>{category.label}</strong>
                <span>{category.description || "Açıklama eklenmemiş"}</span>
                <small>
                  {counts.total} kart · {counts.published} yayında · {counts.draft} taslak · {counts.archived} arşiv
                </small>
                <StatusBadge status={category.publishStatus} />
              </button>
            );
          })}
        </div>

        {visibleCategories.length === 0 ? <div className="admin-empty-state">Bu filtrede kategori bulunmuyor.</div> : null}
      </aside>

      <section className="admin-free-material-workspace__list" aria-label="Materyal kartları">
        <div className="admin-free-material-workspace__panel-head admin-free-material-workspace__panel-head--stacked">
          <div>
            <h2>{selectedCategory?.label ?? "Materyal Kartları"}</h2>
            <p>{selectedCategory?.description || "Kategori seçildiğinde kartlar burada yönetilir."}</p>
          </div>
          <div className="admin-free-material-workspace__actions">
            <button className="admin-button--compact" type="button" onClick={actions.addMaterialCard} disabled={!selectedCategory}>
              Yeni Kart
            </button>
            <button className="admin-button--compact admin-button--ghost" type="button" onClick={actions.duplicateMaterialCard} disabled={!selectedItem}>
              Çoğalt
            </button>
          </div>
        </div>

        <label className="admin-builder-search">
          <span>Kart ara</span>
          <input value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} />
        </label>

        {selectedCategory ? (
          <div className="admin-free-material-card-list" role="listbox" aria-label="Kart listesi">
            {visibleItems.map((item) => {
              const identity = getMaterialIdentity(item);
              const active = identity === selectedItemIdentity;
              const readiness = materialReadiness(item);
              return (
                <article
                  key={identity || item.title}
                  className="admin-free-material-card-row"
                  data-active={active}
                  data-testid="material-card-row"
                  data-material-id={identity}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      actions.dispatchSelection({ type: "select-material-item", slug: identity });
                      setEditorOpen(true);
                    }}
                  >
                    <span className="admin-free-material-card-row__icon" aria-hidden="true">{iconLabel(item)}</span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.summary || "Özet eklenmemiş"}</small>
                    </span>
                  </button>
                  <div className="admin-free-material-card-row__meta">
                    <StatusBadge status={item.publishStatus} />
                    <ReadinessBadge readiness={readiness} />
                    <small>{typeLabel(item.itemType)} · sıra {item.sortOrder ?? 0}</small>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty-state">Önce kategori seçin.</div>
        )}

        {selectedCategory && visibleItems.length === 0 ? (
          <div className="admin-empty-state">Bu filtrede materyal kartı bulunmuyor.</div>
        ) : null}
      </section>

      <aside className="admin-free-material-workspace__editor" aria-label="Materyal düzenleyici">
        <div className="admin-free-material-workspace__panel-head">
          <div>
            <h2>Düzenleyici</h2>
            <p>{selectedItem ? selectedItem.title : "Kart seçilmedi"}</p>
          </div>
          <button className="admin-button--compact admin-button--ghost" type="button" onClick={() => setEditorOpen(false)} aria-expanded={editorOpen}>
            Kapat
          </button>
        </div>

        {selectedCategory ? (
          <CategoryEditor
            category={selectedCategory}
            categoryHasCards={categoryHasCards}
            actions={actions}
          />
        ) : null}

        {selectedItem ? (
          <MaterialItemEditor
            item={selectedItem}
            materials={materials}
            itemDeleteDisabled={itemDeleteDisabled}
            actions={actions}
          />
        ) : (
          <div className="admin-empty-state">Düzenlemek için bir materyal kartı seçin.</div>
        )}
      </aside>
    </div>
  );
}

function StatusFilters({ value, onChange }: { value: MaterialStatusFilter; onChange: (value: MaterialStatusFilter) => void }) {
  return (
    <div className="admin-builder-segment" role="tablist" aria-label="Materyal durum filtresi">
      {materialFilters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          data-testid={`material-filter-${filter.key.toLowerCase()}`}
          data-active={value === filter.key}
          onClick={() => onChange(filter.key)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function CategoryEditor({
  category,
  categoryHasCards,
  actions
}: {
  category: AdminFreeMaterialCategory;
  categoryHasCards: boolean;
  actions: BuilderActions;
}) {
  return (
    <section className="admin-free-material-editor-section">
      <h3>Kategori</h3>
      <label className="admin-builder-field">
        <span>Kategori adı</span>
        <input value={category.label} onChange={(event) => actions.updateMaterialCategory({ label: event.target.value })} />
      </label>
      <label className="admin-builder-field">
        <span>Açıklama</span>
        <textarea value={category.description ?? ""} onChange={(event) => actions.updateMaterialCategory({ description: event.target.value })} />
      </label>
      <label className="admin-builder-field">
        <span>Sıra</span>
        <input
          type="number"
          value={category.sortOrder ?? 0}
          onChange={(event) => actions.updateMaterialCategory({ sortOrder: Number(event.target.value) })}
        />
      </label>
      <div className="admin-free-material-editor-section__actions">
        <button className="admin-button--compact admin-button--ghost" type="button" onClick={() => void actions.saveMaterialCategoryStatus("DRAFT", "draft")}>
          Taslak Olarak Kaydet
        </button>
        <button className="admin-button--compact" type="button" onClick={() => void actions.saveMaterialCategoryStatus("PUBLISHED", "publish")}>
          Yayınla
        </button>
        {category.publishStatus === "ARCHIVED" ? (
          <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-category-restore" onClick={() => void actions.restoreMaterialCategory()}>
            Arşivden Çıkar
          </button>
        ) : (
          <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-category-archive" onClick={() => void actions.archiveMaterialCategory()}>
            Arşivle
          </button>
        )}
        <button className="admin-button--compact admin-button--danger" type="button" data-testid="material-category-delete" onClick={() => void actions.deleteMaterialCategory()} disabled={categoryHasCards}>
          Sil
        </button>
      </div>
      {categoryHasCards ? (
        <p className="admin-website-builder__hint">Bu kategoriye bağlı materyal kartları bulunuyor. Önce kartları taşıyın, arşivleyin veya silin.</p>
      ) : null}
    </section>
  );
}

function MaterialItemEditor({
  item,
  materials,
  itemDeleteDisabled,
  actions
}: {
  item: AdminFreeMaterialItem;
  materials: AdminFreeMaterialsDocument;
  itemDeleteDisabled: boolean;
  actions: BuilderActions;
}) {
  const readiness = materialReadiness(item);

  function updateItemType(itemType: string) {
    const patch: Partial<AdminFreeMaterialItem> = { itemType };
    if (downloadTypes.has(itemType)) {
      Object.assign(patch, { href: null, opensInNewTab: false, iconKey: itemType === "PDF" ? "pdf" : item.iconKey ?? "download" });
    } else {
      Object.assign(patch, { downloadUrl: null, mediaAssetId: null, displayFilename: null, mimeType: null, fileSizeBytes: null });
    }
    if (!countdownTypes.has(itemType)) {
      patch.countdownPageSlug = null;
    }
    actions.updateMaterialItem(patch);
  }

  return (
    <div className="admin-free-material-editor-form">
      <section className="admin-free-material-editor-section">
        <div className="admin-free-material-editor-section__title">
          <h3>Temel Bilgiler</h3>
          <StatusBadge status={item.publishStatus} />
        </div>
        <label className="admin-builder-field">
          <span>Başlık</span>
          <input value={item.title} onChange={(event) => actions.updateMaterialItem({ title: event.target.value })} />
        </label>
        <label className="admin-builder-field">
          <span>Özet</span>
          <textarea value={item.summary ?? ""} onChange={(event) => actions.updateMaterialItem({ summary: event.target.value })} />
        </label>
        <label className="admin-builder-field">
          <span>Tür</span>
          <select value={item.itemType} onChange={(event) => updateItemType(event.target.value)}>
            <option value="DOWNLOAD">İndirilebilir dosya</option>
            <option value="PDF">PDF</option>
            <option value="INTERNAL_PAGE">Site içi sayfa</option>
            <option value="EXTERNAL_LINK">Harici bağlantı</option>
            <option value="COUNTDOWN">Geri sayım</option>
            <option value="CALCULATOR">Puan hesaplayıcı</option>
            <option value="BLOG">Blog</option>
            <option value="SIMULATION">Simülasyon</option>
            <option value="SYSTEM_TOOL">Sistem aracı</option>
            <option value="LINK">Bağlantı</option>
            <option value="TOOL">Araç</option>
          </select>
        </label>
        <div className="admin-builder-inline-grid">
          <label className="admin-builder-field">
            <span>Rozet</span>
            <input value={item.badgeLabel ?? ""} onChange={(event) => actions.updateMaterialItem({ badgeLabel: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>İkon</span>
            <input value={item.iconKey ?? ""} onChange={(event) => actions.updateMaterialItem({ iconKey: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Ton</span>
            <input value={item.tone ?? ""} onChange={(event) => actions.updateMaterialItem({ tone: event.target.value })} />
          </label>
        </div>
      </section>

      <section className="admin-free-material-editor-section">
        <div className="admin-free-material-editor-section__title">
          <h3>Hedef / Dosya</h3>
          <ReadinessBadge readiness={readiness} />
        </div>
        <DestinationEditor item={item} materials={materials} actions={actions} />
      </section>

      <section className="admin-free-material-editor-section">
        <h3>Görünüm</h3>
        <MediaField
          intent={{
            kind: "IMAGE",
            label: "Kart görseli",
            description: "Kartta kullanılacak kapak görseli.",
            recommendedDimensions: "1200x800 px",
            allowExternalUrl: false
          }}
          value={item.coverImageUrl}
          onChange={(value) => actions.updateMaterialItem({ coverImageUrl: value || null })}
        />
        <label className="admin-builder-field">
          <span>Buton etiketi</span>
          <input value={item.buttonLabel ?? ""} onChange={(event) => actions.updateMaterialItem({ buttonLabel: event.target.value })} />
        </label>
        <label className="admin-checkbox-row">
          <input type="checkbox" checked={Boolean(item.isFeatured)} onChange={(event) => actions.updateMaterialItem({ isFeatured: event.target.checked })} />
          Öne çıkar
        </label>
      </section>

      <section className="admin-free-material-editor-section">
        <h3>Erişilebilirlik</h3>
        <label className="admin-builder-field">
          <span>Erişilebilir buton etiketi</span>
          <input value={item.accessibilityLabel ?? ""} onChange={(event) => actions.updateMaterialItem({ accessibilityLabel: event.target.value })} />
        </label>
        {!downloadTypes.has(item.itemType) ? (
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={Boolean(item.opensInNewTab)} onChange={(event) => actions.updateMaterialItem({ opensInNewTab: event.target.checked })} />
            Yeni sekmede aç
          </label>
        ) : null}
      </section>

      <section className="admin-free-material-editor-section admin-free-material-editor-section--sticky-actions" aria-live="polite">
        <div className="admin-free-material-editor-section__title">
          <h3>Yayın</h3>
          <ReadinessBadge readiness={readiness} />
        </div>
        {itemDeleteDisabled ? (
          <div className="admin-alert" role="status">
            Bu kart bir sistem aracını gösterir. Kartı arşivleyebilirsiniz; alttaki hesaplama, simülasyon veya sayaç rotası silinmez.
          </div>
        ) : null}
        <div className="admin-free-material-editor-section__actions">
          <button className="admin-icon-button" type="button" data-testid="material-card-move-up" aria-label="Yukarı taşı" onClick={() => void actions.moveMaterialCard(-1)}>
            ↑
          </button>
          <button className="admin-icon-button" type="button" data-testid="material-card-move-down" aria-label="Aşağı taşı" onClick={() => void actions.moveMaterialCard(1)}>
            ↓
          </button>
          <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-card-save-draft" onClick={() => void actions.saveMaterialCardStatus("DRAFT", "draft")}>
            Taslak Olarak Kaydet
          </button>
          <button className="admin-button--compact" type="button" data-testid="material-card-publish" onClick={() => void actions.saveMaterialCardStatus("PUBLISHED", "publish")} disabled={readiness.kind !== "READY"}>
            Yayınla
          </button>
          <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-card-unpublish" onClick={() => void actions.saveMaterialCardStatus("DRAFT", "publish")}>
            Yayından Kaldır
          </button>
          {item.publishStatus === "ARCHIVED" ? (
            <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-card-restore" onClick={() => void actions.restoreMaterialCard()}>
              Arşivden Çıkar
            </button>
          ) : (
            <button className="admin-button--compact admin-button--ghost" type="button" data-testid="material-card-archive" onClick={() => void actions.archiveMaterialCard()}>
              Arşivle
            </button>
          )}
          <button className="admin-button--compact admin-button--danger" type="button" data-testid="material-card-delete" onClick={() => void actions.deleteMaterialCard()} disabled={itemDeleteDisabled}>
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
      </section>

      <details className="admin-free-material-editor-section admin-builder-advanced">
        <summary>Gelişmiş</summary>
        <label className="admin-builder-field">
          <span>Slug</span>
          <input value={item.slug ?? ""} onChange={(event) => actions.updateMaterialItem({ slug: event.target.value })} />
        </label>
        <div className="admin-free-material-tech-grid">
          <span>ID</span>
          <code>{item.id ?? "Taslak"}</code>
          <span>MIME</span>
          <code>{item.mimeType ?? "-"}</code>
          <span>Medya Asset ID</span>
          <code>{item.mediaAssetId ?? "-"}</code>
        </div>
      </details>
    </div>
  );
}

function DestinationEditor({
  item,
  materials,
  actions
}: {
  item: AdminFreeMaterialItem;
  materials: AdminFreeMaterialsDocument;
  actions: BuilderActions;
}) {
  if (downloadTypes.has(item.itemType)) {
    return (
      <div className="admin-free-material-destination">
        <MediaField
          intent={{
            kind: "DOCUMENT",
            label: "İndirilecek dosya",
            description: "PDF veya doküman seçildiğinde public kart güvenli indirme uç noktasını kullanır.",
            recommendedDimensions: "PDF veya doküman",
            allowExternalUrl: false
          }}
          value={item.downloadUrl}
          onChange={(value, asset) => {
            actions.updateMaterialItem({
              downloadUrl: asset ? null : value || null,
              mediaAssetId: asset?.id ?? null,
              displayFilename: asset?.originalFileName ?? item.displayFilename ?? null,
              mimeType: asset?.mimeType ?? item.mimeType ?? null,
              fileSizeBytes: asset?.sizeBytes ?? item.fileSizeBytes ?? null,
              href: null,
              opensInNewTab: false
            });
          }}
        />
        <div className="admin-builder-inline-grid">
          <label className="admin-builder-field">
            <span>Dosya adı</span>
            <input value={item.displayFilename ?? ""} onChange={(event) => actions.updateMaterialItem({ displayFilename: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Harici HTTPS indirme URL</span>
            <input value={item.downloadUrl ?? ""} onChange={(event) => actions.updateMaterialItem({ downloadUrl: event.target.value, mediaAssetId: null, href: null })} placeholder="https://" />
          </label>
        </div>
      </div>
    );
  }

  if (countdownTypes.has(item.itemType)) {
    return (
      <label className="admin-builder-field">
        <span>Geri sayım sayfası</span>
        <select value={item.countdownPageSlug ?? ""} onChange={(event) => actions.updateMaterialItem({ countdownPageSlug: event.target.value, href: event.target.value ? `/ucretsiz-materyaller/${event.target.value}` : null })}>
          <option value="">Geri sayım seçin</option>
          {materials.countdownPages.map((page) => (
            <option key={page.slug} value={page.slug}>
              {page.title} · {page.publishStatus ?? "DRAFT"}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (externalTypes.has(item.itemType)) {
    return (
      <label className="admin-builder-field">
        <span>Harici HTTPS bağlantı</span>
        <input value={item.href ?? ""} onChange={(event) => actions.updateMaterialItem({ href: event.target.value, downloadUrl: null, mediaAssetId: null })} placeholder="https://" />
      </label>
    );
  }

  if (internalTypes.has(item.itemType)) {
    return (
      <label className="admin-builder-field">
        <span>Site içi hedef sayfa</span>
        <select value={item.href ?? ""} onChange={(event) => actions.updateMaterialItem({ href: event.target.value, downloadUrl: null, mediaAssetId: null })}>
          <option value="">Sayfa seçin</option>
          <option value="/ucretsiz-materyaller">Ücretsiz Materyaller</option>
          <option value="/ucretsiz-materyaller/pdf-dokumanlar">PDF Dokümanlar</option>
          <option value="/ucretsiz-materyaller/faydali-linkler">Faydalı Linkler</option>
          <option value="/ucretsiz-materyaller/blog">Blog</option>
          <option value="/ucretsiz-materyaller/puan-hesapla">Puan Hesapla</option>
          <option value="/ucretsiz-materyaller/yks-atlas">YKS Atlas</option>
          <option value="/ucretsiz-materyaller/maarif-simulasyonlari">Maarif Simülasyonları</option>
          <option value="/ucretsiz-materyaller/turkiye-geneli-deneme">Türkiye Geneli Deneme</option>
        </select>
      </label>
    );
  }

  return (
    <label className="admin-builder-field">
      <span>Hedef bağlantı</span>
      <input value={item.href ?? ""} onChange={(event) => actions.updateMaterialItem({ href: event.target.value })} />
    </label>
  );
}

function getMaterialIdentity(item?: AdminFreeMaterialItem | null) {
  return item?.id || item?.slug || "";
}

function matchesStatus(status: string | undefined, filter: MaterialStatusFilter) {
  return filter === "ALL" || (status ?? "DRAFT") === filter;
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
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

function typeLabel(type: string | undefined) {
  const labels: Record<string, string> = {
    DOWNLOAD: "Dosya",
    PDF: "PDF",
    INTERNAL_PAGE: "Site içi",
    EXTERNAL_LINK: "Harici",
    COUNTDOWN: "Geri sayım",
    CALCULATOR: "Hesaplayıcı",
    BLOG: "Blog",
    SIMULATION: "Simülasyon",
    SYSTEM_TOOL: "Sistem aracı",
    LINK: "Bağlantı",
    TOOL: "Araç",
    GUIDANCE: "Rehberlik",
    EXTERNAL: "Harici"
  };

  return labels[type ?? ""] ?? type ?? "Kart";
}

function categoryCounts(category: AdminFreeMaterialCategory) {
  return category.items.reduce(
    (counts, item) => {
      counts.total += 1;
      if (item.publishStatus === "PUBLISHED") counts.published += 1;
      else if (item.publishStatus === "ARCHIVED") counts.archived += 1;
      else counts.draft += 1;
      return counts;
    },
    { total: 0, published: 0, draft: 0, archived: 0 }
  );
}

function materialReadiness(item: AdminFreeMaterialItem): { kind: "READY" | "MISSING_FILE" | "MISSING_TARGET" | "DRAFT" | "ARCHIVED"; label: string } {
  if (item.publishStatus === "ARCHIVED") {
    return { kind: "ARCHIVED", label: "Arşivlenmiş" };
  }
  if (downloadTypes.has(item.itemType) && !item.mediaAssetId && !item.downloadUrl) {
    return { kind: "MISSING_FILE", label: "Dosya Eksik" };
  }
  if (countdownTypes.has(item.itemType) && !item.countdownPageSlug) {
    return { kind: "MISSING_TARGET", label: "Hedef Eksik" };
  }
  if (!downloadTypes.has(item.itemType) && !countdownTypes.has(item.itemType) && !item.href) {
    return { kind: "MISSING_TARGET", label: "Hedef Eksik" };
  }
  if (item.publishStatus !== "PUBLISHED") {
    return { kind: "DRAFT", label: "Taslak" };
  }
  return { kind: "READY", label: "Hazır" };
}

function iconLabel(item: AdminFreeMaterialItem) {
  if (item.iconKey) {
    return item.iconKey.slice(0, 3).toUpperCase();
  }
  if (downloadTypes.has(item.itemType)) {
    return "PDF";
  }
  if (countdownTypes.has(item.itemType)) {
    return "DAY";
  }
  return "URL";
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className="admin-status-pill" data-testid="material-status-badge" data-status={status ?? "DRAFT"}>
      {statusLabel(status)}
    </span>
  );
}

function ReadinessBadge({ readiness }: { readiness: ReturnType<typeof materialReadiness> }) {
  return (
    <span className="admin-readiness-pill" data-readiness={readiness.kind}>
      {readiness.label}
    </span>
  );
}
