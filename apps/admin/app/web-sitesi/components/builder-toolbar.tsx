"use client";

import Link from "next/link";
import type { AdminMarketingPage } from "../../../lib/auth-client";
import type { BuilderActions, BuilderStatus, ResponsiveMode, WebsiteArea, WebsiteSelection } from "../lib/builder-types";
import { pageLabel } from "../lib/section-registry";

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
  const currentPage = pages.find((page) => page.key === selection.selectedPageKey) ?? pages[0] ?? null;

  return (
    <div className="admin-builder-toolbar" role="toolbar" aria-label="Web sitesi düzenleme araçları">
      <div className="admin-builder-toolbar__left">
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
        <div className="admin-builder-toolbar__crumb">
          <strong>{selectedAreaLabel}</strong>
          <span>{currentPage ? `${pageLabel(currentPage)} / ${selection.selectedSectionKey || "Bölüm seç"}` : "Alan seç"}</span>
        </div>
        <span className="admin-builder-badge" data-tone={status.isDirty ? "amber" : "teal"}>
          {status.isDirty ? "Kaydedilmemiş değişiklikler" : "Tüm değişiklikler kaydedildi"}
        </span>
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
          disabled={status.saving || !canManage}
          onClick={() => void actions.saveCurrent("draft")}
        >
          Taslağı Kaydet
        </button>
        <button className="admin-button--ghost" type="button" onClick={() => void actions.requestPreviewToken()}>
          Önizle
        </button>
        <button
          className="admin-button"
          type="button"
          disabled={status.saving || !canPublish}
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
