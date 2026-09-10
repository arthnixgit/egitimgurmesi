"use client";

import Link from "next/link";
import type { AdminMarketingPage } from "../../../lib/auth-client";
import type { BuilderActions, BuilderStatus, ResponsiveMode, WebsiteArea, WebsiteSelection } from "../lib/builder-types";
import { pageLabel } from "../lib/section-registry";

/**
 * Three distinct states, which the previous two-state badge collapsed into one
 * and got wrong: unsaved edits in the browser, a saved-but-unpublished draft,
 * and content that matches what visitors see.
 */
function publishStateLabel(status: BuilderStatus) {
  if (status.isDirty) {
    return "Kaydedilmemiş değişiklikler";
  }
  if (status.hasDraft) {
    return status.draftUpdatedAt
      ? `Yayınlanmamış taslak · ${new Date(status.draftUpdatedAt).toLocaleString("tr-TR")}`
      : "Yayınlanmamış taslak";
  }
  return "Yayındaki içerikle aynı";
}

function publishStateTone(status: BuilderStatus) {
  if (status.isDirty) {
    return "amber";
  }
  return status.hasDraft ? "blue" : "teal";
}

export function BuilderToolbar({
  pages,
  selection,
  status,
  selectedAreaLabel,
  canManage,
  canPublish,
  canUndo,
  canRedo,
  actions
}: {
  pages: AdminMarketingPage[];
  selection: WebsiteSelection;
  status: BuilderStatus;
  selectedAreaLabel: string;
  canManage: boolean;
  canPublish: boolean;
  canUndo: boolean;
  canRedo: boolean;
  actions: BuilderActions;
}) {
  const currentPage =
    selection.selectedArea === "ana-sayfa-slideri"
      ? pages.find((page) => page.key === "home") ?? null
      : pages.find((page) => page.key === selection.selectedPageKey) ?? pages[0] ?? null;
  const materialsBlocked =
    selection.selectedArea === "ucretsiz-materyaller" && (!status.materialsLoaded || status.areaLoading);
  const showPageSelector = selection.selectedArea === "sayfalar" && pages.length > 0;

  return (
    <div className="admin-builder-toolbar" role="toolbar" aria-label="Web sitesi düzenleme araçları">
      <div className="admin-builder-toolbar__left">
        {showPageSelector ? (
          <label className="admin-builder-toolbar__page">
            <span>Sayfa</span>
            <select
              value={currentPage?.key ?? ""}
              onChange={(event) => {
                actions.dispatchSelection({ type: "select-area", area: "sayfalar" });
                actions.dispatchSelection({ type: "select-page", pageKey: event.target.value });
              }}
            >
              {pages.map((page) => (
                <option key={page.key} value={page.key}>
                  {pageLabel(page)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="admin-builder-toolbar__page" aria-label="Seçili sayfa">
            <span>Sayfa</span>
            <strong>{selection.selectedArea === "ana-sayfa-slideri" ? "Ana Sayfa" : selectedAreaLabel}</strong>
          </div>
        )}
        <div className="admin-builder-toolbar__crumb">
          <strong>{selectedAreaLabel}</strong>
          <span>{currentPage ? `${pageLabel(currentPage)} / ${selection.selectedSectionKey || "Bölüm seç"}` : "Alan seç"}</span>
        </div>
        <span className="admin-builder-badge" data-tone={publishStateTone(status)}>
          {publishStateLabel(status)}
        </span>
        {status.draftIsStale ? (
          <span className="admin-builder-badge" data-tone="amber" role="status">
            Bu taslak alındıktan sonra yayına yeni bir sürüm çıktı. Yayınlarsanız o sürümün üzerine yazılır.
          </span>
        ) : null}
      </div>

      <div className="admin-builder-toolbar__center">
        <button type="button" className="admin-icon-button" disabled={!canUndo} onClick={actions.undo} aria-label="Geri al">
          ↶
        </button>
        <button type="button" className="admin-icon-button" disabled={!canRedo} onClick={actions.redo} aria-label="İleri al">
          ↷
        </button>
        <div className="admin-builder-segment" role="tablist" aria-label="Önizleme genişliği">
          {(["desktop", "tablet", "mobile"] as ResponsiveMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-selected={selection.responsiveMode === mode}
              data-active={selection.responsiveMode === mode}
              onClick={() => actions.dispatchSelection({ type: "set-responsive-mode", mode })}
            >
              {mode === "desktop" ? "Desktop" : mode === "tablet" ? "Tablet" : "Mobil"}
            </button>
          ))}
        </div>
        <label className="admin-builder-toolbar__zoom">
          <span>Zoom</span>
          <select aria-label="Canvas zoom">
            <option>%100</option>
            <option>%90</option>
            <option>%75</option>
          </select>
        </label>
      </div>

      <div className="admin-builder-toolbar__right">
        <span className="admin-builder-toolbar__saved">
          {status.saving ? "Kaydediliyor..." : status.lastSavedAt ? `Son kayıt ${status.lastSavedAt}` : "Henüz kaydedilmedi"}
        </span>
        <button
          className="admin-button--ghost"
          type="button"
          disabled={status.saving || !canManage || materialsBlocked}
          onClick={() => void actions.saveCurrent("draft")}
        >
          Taslağı Kaydet
        </button>
        <button className="admin-button--ghost" type="button" onClick={() => void actions.requestPreviewToken()}>
          Önizle
        </button>
        {status.hasDraft ? (
          <button
            className="admin-button--ghost"
            type="button"
            disabled={status.saving || !canManage}
            onClick={() => void actions.discardDraft()}
            title="Kaydedilmiş taslağı sil ve yayındaki hale dön"
          >
            Taslağı Sil
          </button>
        ) : null}
        <button
          className="admin-button"
          type="button"
          disabled={status.saving || !canPublish || materialsBlocked}
          onClick={() => void actions.saveCurrent("publish")}
        >
          {status.saving ? "Yayınlanıyor..." : "Yayınla"}
        </button>
        <button
          className="admin-button--ghost"
          type="button"
          onClick={() => actions.dispatchSelection({ type: "select-area", area: "gecmis" as WebsiteArea })}
        >
          Geçmiş
        </button>
        <Link className="admin-button--ghost" href="/" target="_blank">
          Canlı Sayfa
        </Link>
      </div>
    </div>
  );
}
