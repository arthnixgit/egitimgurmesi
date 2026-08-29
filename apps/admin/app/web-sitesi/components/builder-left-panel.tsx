"use client";

import { useMemo, useState } from "react";
import type { AdminMarketingPage } from "../../../lib/auth-client";
import type { BuilderActions, LeftPanelMode, WebsiteArea, WebsiteSelection } from "../lib/builder-types";
import { canPlaceWidget, getWidgetsByCategory, type WidgetDefinition } from "../lib/widget-registry";
import { getSectionDefinition, lockedRouteInventory, pageLabel, readableSectionLabel } from "../lib/section-registry";

export function BuilderLeftPanel({
  areas,
  pages,
  selection,
  actions
}: {
  areas: Array<{ key: WebsiteArea; label: string; description: string }>;
  pages: AdminMarketingPage[];
  selection: WebsiteSelection;
  actions: BuilderActions;
}) {
  const [search, setSearch] = useState("");
  const currentPage = pages.find((page) => page.key === selection.selectedPageKey) ?? pages[0] ?? null;

  return (
    <aside className="admin-website-builder__left" aria-label="Sayfa ve bileşen gezgini">
      <div className="admin-builder-panel-tabs" role="tablist" aria-label="Sol panel modu">
        {(["sayfalar", "bolumler", "bilesenler"] as LeftPanelMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={selection.leftPanelMode === mode}
            data-active={selection.leftPanelMode === mode}
            onClick={() => actions.dispatchSelection({ type: "set-left-panel-mode", mode })}
          >
            {mode === "sayfalar" ? "Sayfalar" : mode === "bolumler" ? "Bölümler" : "Bileşenler"}
          </button>
        ))}
      </div>

      <label className="admin-builder-search">
        <span>Ara</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sayfa, bölüm veya bileşen" />
      </label>

      {selection.leftPanelMode === "sayfalar" ? (
        <PageTree areas={areas} pages={pages} selection={selection} actions={actions} search={search} />
      ) : null}
      {selection.leftPanelMode === "bolumler" ? (
        <SectionTree currentPage={currentPage} selection={selection} actions={actions} search={search} />
      ) : null}
      {selection.leftPanelMode === "bilesenler" ? (
        <WidgetLibrary currentPage={currentPage} selection={selection} actions={actions} search={search} />
      ) : null}
    </aside>
  );
}

function PageTree({
  areas,
  pages,
  selection,
  actions,
  search
}: {
  areas: Array<{ key: WebsiteArea; label: string; description: string }>;
  pages: AdminMarketingPage[];
  selection: WebsiteSelection;
  actions: BuilderActions;
  search: string;
}) {
  const visiblePages = pages.filter((page) => matches(search, pageLabel(page), page.slug, page.title));

  return (
    <div className="admin-builder-tree" role="tree" aria-label="Sayfa ağacı">
      <button
        type="button"
        className="admin-builder-shortcut"
        onClick={() => {
          actions.dispatchSelection({ type: "select-area", area: "sayfalar" });
          actions.dispatchSelection({ type: "select-page", pageKey: "home" });
          actions.dispatchSelection({ type: "select-section", sectionKey: "showcase-hero" });
          actions.dispatchSelection({ type: "set-left-panel-mode", mode: "bolumler" });
        }}
      >
        <strong>Ana Sayfa Sliderı</strong>
        <span>Hero / Slider bölümünü doğrudan düzenle</span>
      </button>

      <div className="admin-builder-tree__group">
        <h2>Global</h2>
        {areas
          .filter((area) => ["genel", "marka", "header", "footer", "ucretsiz-materyaller", "akademik-kadro", "basari-hikayeleri", "gecmis"].includes(area.key))
          .map((area) => (
            <button
              key={area.key}
              type="button"
              role="treeitem"
              aria-selected={selection.selectedArea === area.key}
              className="admin-website-builder__area"
              data-active={selection.selectedArea === area.key}
              onClick={() => actions.dispatchSelection({ type: "select-area", area: area.key })}
            >
              <strong>{area.label}</strong>
              <span>{area.description}</span>
            </button>
          ))}
      </div>

      <div className="admin-builder-tree__group">
        <h2>Sayfalar</h2>
        {visiblePages.map((page) => (
          <button
            key={page.key}
            type="button"
            role="treeitem"
            aria-selected={selection.selectedPageKey === page.key && selection.selectedArea === "sayfalar"}
            className="admin-website-builder__area"
            data-active={selection.selectedPageKey === page.key && selection.selectedArea === "sayfalar"}
            onClick={() => {
              actions.dispatchSelection({ type: "select-area", area: "sayfalar" });
              actions.dispatchSelection({ type: "select-page", pageKey: page.key });
            }}
          >
            <strong>{pageLabel(page)}</strong>
            <span>{page.publishStatus === "PUBLISHED" ? "Yayında" : "Taslak"} · /{page.slug === "home" ? "" : page.slug}</span>
          </button>
        ))}
      </div>

      <div className="admin-builder-tree__group">
        <h2>Kilitli Sistem Rotaları</h2>
        {lockedRouteInventory.map((item) => (
          <article key={item.route} className="admin-builder-locked-node">
            <strong>{item.label}</strong>
            <span>{item.route}</span>
            <small>{item.reason}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function SectionTree({
  currentPage,
  selection,
  actions,
  search
}: {
  currentPage: AdminMarketingPage | null;
  selection: WebsiteSelection;
  actions: BuilderActions;
  search: string;
}) {
  if (!currentPage) {
    return <div className="admin-empty-state">Düzenlenecek sayfa bulunamadı.</div>;
  }

  const sections = currentPage.sections.filter((section) =>
    matches(search, readableSectionLabel(section), section.sectionKey, section.variantKey ?? "")
  );

  return (
    <div className="admin-builder-section-list" role="tree" aria-label={`${pageLabel(currentPage)} bölümleri`}>
      {sections.map((section, index) => {
        const definition = getSectionDefinition(section);
        return (
          <article
            key={section.sectionKey}
            className="admin-builder-section-node"
            data-active={selection.selectedSectionKey === section.sectionKey}
          >
            <button
              type="button"
              role="treeitem"
              aria-selected={selection.selectedSectionKey === section.sectionKey}
              onClick={() => {
                actions.dispatchSelection({ type: "select-area", area: "sayfalar" });
                actions.dispatchSelection({ type: "select-section", sectionKey: section.sectionKey });
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{readableSectionLabel(section)}</strong>
              <small>{definition.behavior === "locked" ? "Kilitli" : section.isActive === false ? "Gizli" : "Aktif"}</small>
            </button>
            <div className="admin-builder-section-node__actions">
              <button type="button" aria-label="Yukarı taşı" onClick={() => actions.moveSectionTo(section.sectionKey, -1)}>↑</button>
              <button type="button" aria-label="Aşağı taşı" onClick={() => actions.moveSectionTo(section.sectionKey, 1)}>↓</button>
              <button type="button" aria-label={section.isActive === false ? "Göster" : "Gizle"} onClick={() => actions.toggleSection(section.sectionKey)}>
                {section.isActive === false ? "Göster" : "Gizle"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function WidgetLibrary({
  currentPage,
  selection,
  actions,
  search
}: {
  currentPage: AdminMarketingPage | null;
  selection: WebsiteSelection;
  actions: BuilderActions;
  search: string;
}) {
  const grouped = useMemo(() => getWidgetsByCategory(), []);

  return (
    <div className="admin-builder-widget-library" aria-label="Bileşen kütüphanesi">
      {Object.entries(grouped).map(([category, widgets]) => {
        const filtered = widgets.filter((widgetDefinition) =>
          matches(search, widgetDefinition.label, widgetDefinition.description, widgetDefinition.category)
        );

        if (!filtered.length) {
          return null;
        }

        return (
          <section key={category}>
            <h2>{category}</h2>
            <div className="admin-builder-widget-grid">
              {filtered.map((widgetDefinition) => (
                <WidgetCard
                  key={widgetDefinition.key}
                  widgetDefinition={widgetDefinition}
                  currentPage={currentPage}
                  selection={selection}
                  actions={actions}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function WidgetCard({
  widgetDefinition,
  currentPage,
  selection,
  actions
}: {
  widgetDefinition: WidgetDefinition;
  currentPage: AdminMarketingPage | null;
  selection: WebsiteSelection;
  actions: BuilderActions;
}) {
  const disabledReason = canPlaceWidget(widgetDefinition, selection.selectedArea, currentPage);
  const disabled = Boolean(disabledReason);

  return (
    <button
      type="button"
      className="admin-builder-widget-card"
      draggable={!disabled}
      aria-disabled={disabled}
      title={disabledReason || widgetDefinition.description}
      onDragStart={(event) => event.dataTransfer.setData("application/x-ega-widget", widgetDefinition.key)}
      onClick={() => {
        if (!disabled) {
          actions.insertWidget(widgetDefinition.key, selection.selectedSectionKey);
        }
      }}
    >
      <span aria-hidden="true">{widgetDefinition.icon}</span>
      <strong>{widgetDefinition.label}</strong>
      <small>{disabledReason || widgetDefinition.description}</small>
    </button>
  );
}

function matches(search: string, ...values: Array<string | null | undefined>) {
  const query = search.trim().toLocaleLowerCase("tr-TR");
  if (!query) {
    return true;
  }

  return values.some((value) => value?.toLocaleLowerCase("tr-TR").includes(query));
}
