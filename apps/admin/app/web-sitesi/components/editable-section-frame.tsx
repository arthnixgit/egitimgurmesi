"use client";

import type { ReactNode } from "react";
import type { AdminMarketingPageSection } from "../../../lib/auth-client";
import type { BuilderActions, SectionField } from "../lib/builder-types";
import { getSectionDefinition, readableSectionLabel } from "../lib/section-registry";

export function EditableSectionFrame({
  section,
  selected,
  children,
  actions,
  onInlineField
}: {
  section: AdminMarketingPageSection;
  selected: boolean;
  children: ReactNode;
  actions: BuilderActions;
  onInlineField: (field: SectionField | null) => void;
}) {
  const definition = getSectionDefinition(section);
  const locked = definition.behavior === "locked";

  return (
    <article
      className="admin-editable-frame"
      data-selected={selected}
      data-locked={locked}
      data-inactive={section.isActive === false}
      tabIndex={0}
      aria-label={`${readableSectionLabel(section)} bölümü`}
      onClick={(event) => {
        event.stopPropagation();
        actions.dispatchSelection({ type: "select-area", area: "sayfalar" });
        actions.dispatchSelection({ type: "select-section", sectionKey: section.sectionKey });
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          actions.dispatchSelection({ type: "select-section", sectionKey: section.sectionKey });
        }
      }}
    >
      <div className="admin-editable-frame__chrome">
        <span>{definition.label}</span>
        <div className="admin-editable-frame__tools" role="toolbar" aria-label={`${readableSectionLabel(section)} araçları`}>
          <button type="button" onClick={() => actions.moveSectionTo(section.sectionKey, -1)}>Yukarı</button>
          <button type="button" onClick={() => actions.moveSectionTo(section.sectionKey, 1)}>Aşağı</button>
          <button type="button" disabled={!definition.duplicable} onClick={actions.duplicateSection}>Çoğalt</button>
          <button type="button" onClick={() => actions.toggleSection(section.sectionKey)}>
            {section.isActive === false ? "Göster" : "Gizle"}
          </button>
          <button
            type="button"
            disabled={!definition.removable}
            title={definition.removable ? "Bölümü sil" : "Bu sistem bölümü silinemez."}
            onClick={() => actions.deleteSection(section.sectionKey)}
          >
            Sil
          </button>
        </div>
      </div>

      <div className="admin-editable-frame__body">{children}</div>

      {selected && !locked ? (
        <div className="admin-editable-frame__quick-fields" aria-label="Hızlı düzenleme">
          <button type="button" onClick={() => onInlineField("title")}>Başlığı düzenle</button>
          <button type="button" onClick={() => onInlineField("body")}>Metni düzenle</button>
          <button type="button" onClick={() => onInlineField("media")}>Medya seç</button>
        </div>
      ) : null}
    </article>
  );
}

export function InlineTextControl({
  value,
  multiline = false,
  label,
  editing,
  onStart,
  onCancel,
  onChange
}: {
  value: string;
  multiline?: boolean;
  label: string;
  editing: boolean;
  onStart: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}) {
  if (editing) {
    return multiline ? (
      <textarea
        className="admin-inline-editor"
        aria-label={label}
        value={value}
        autoFocus
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel();
          }
        }}
      />
    ) : (
      <input
        className="admin-inline-editor"
        aria-label={label}
        value={value}
        autoFocus
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCancel();
          }
        }}
      />
    );
  }

  return (
    <button type="button" className="admin-inline-select" onDoubleClick={onStart} onClick={onStart}>
      {value || "Düzenlemek için tıklayın"}
    </button>
  );
}
