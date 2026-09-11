"use client";

import { useState } from "react";
import type { AdminMarketingPageSection } from "../../../lib/auth-client";
import type { BuilderActions } from "../lib/builder-types";
import {
  appendPayloadItem,
  duplicatePayloadItem,
  itemHeading,
  movePayloadItem,
  readPayloadItems,
  removePayloadItem,
  updatePayloadItem,
  writePayloadItems,
  type PayloadField,
  type SectionListSpec
} from "../lib/section-content-schema";
import { MediaField } from "./media-field";

/**
 * Schema-driven editor for section payloads that hold a repeatable list.
 *
 * One component serves the logo rail, video showcase, feature highlights and
 * contact CTA, because all four are "a payload key holding an array of
 * records". Binding the next such section is a schema entry, not a new form.
 */
export function SectionListEditor({
  section,
  spec,
  actions
}: {
  section: AdminMarketingPageSection;
  spec: SectionListSpec;
  actions: BuilderActions;
}) {
  const items = readPayloadItems(section, spec);
  const [openIndex, setOpenIndex] = useState<number | null>(items.length > 0 ? 0 : null);

  function commit(next: Record<string, unknown>[]) {
    actions.updateSection({ payload: writePayloadItems(section, spec, next) });
  }

  return (
    <div className="admin-section-list">
      <div className="admin-section-list__head">
        <strong>
          {spec.itemNoun} listesi
          <span className="admin-section-list__count">{items.length}</span>
        </strong>
        <button
          type="button"
          className="admin-button--compact"
          onClick={() => {
            commit(appendPayloadItem(items, spec));
            setOpenIndex(items.length);
          }}
        >
          {spec.addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="admin-section-list__empty">{spec.emptyHint}</p>
      ) : null}

      <ol className="admin-section-list__items">
        {items.map((item, index) => {
          const open = openIndex === index;

          return (
            <li key={String(item.id ?? index)} className="admin-section-list__item" data-open={open}>
              <div className="admin-section-list__row">
                <button
                  type="button"
                  className="admin-section-list__toggle"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  <span className="admin-section-list__index">{index + 1}</span>
                  <span className="admin-section-list__heading">{itemHeading(item, spec, index)}</span>
                </button>

                <div className="admin-section-list__controls">
                  <button
                    type="button"
                    className="admin-icon-button"
                    aria-label={`${spec.itemNoun} yukarı taşı`}
                    disabled={index === 0}
                    onClick={() => commit(movePayloadItem(items, index, -1))}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    aria-label={`${spec.itemNoun} aşağı taşı`}
                    disabled={index === items.length - 1}
                    onClick={() => commit(movePayloadItem(items, index, 1))}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    aria-label={`${spec.itemNoun} kopyala`}
                    onClick={() => commit(duplicatePayloadItem(items, index))}
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button admin-icon-button--danger"
                    aria-label={`${spec.itemNoun} sil`}
                    onClick={() => {
                      if (!window.confirm(`${itemHeading(item, spec, index)} kaldırılsın mı?`)) {
                        return;
                      }
                      commit(removePayloadItem(items, index));
                      setOpenIndex(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {open ? (
                <div className="admin-section-list__fields">
                  {spec.fields.map((field) => (
                    <ListField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      itemNoun={spec.itemNoun}
                      onChange={(value) => commit(updatePayloadItem(items, index, field.key, value))}
                    />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ListField({
  field,
  value,
  itemNoun,
  onChange
}: {
  field: PayloadField;
  value: unknown;
  itemNoun: string;
  onChange: (value: unknown) => void;
}) {
  const text = typeof value === "string" ? value : "";

  if (field.type === "media") {
    return (
      <MediaField
        intent={{
          kind: "IMAGE",
          label: field.label,
          description: `${itemNoun} görseli`,
          allowExternalUrl: true
        }}
        value={text}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="admin-checkbox-row">
        <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.type === "tone") {
    return (
      <label className="admin-builder-field">
        <span>{field.label}</span>
        <select value={text || "amber"} onChange={(event) => onChange(event.target.value)}>
          <option value="amber">Amber</option>
          <option value="teal">Teal</option>
          <option value="blue">Mavi</option>
        </select>
      </label>
    );
  }

  if (field.type === "ctaVariant") {
    return (
      <label className="admin-builder-field">
        <span>{field.label}</span>
        <select value={text || "ghost"} onChange={(event) => onChange(event.target.value)}>
          <option value="primary">Dolu buton</option>
          <option value="ghost">Çerçeveli buton</option>
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="admin-builder-field">
        <span>{field.label}</span>
        <textarea
          value={text}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  return (
    <label className="admin-builder-field">
      <span>{field.label}</span>
      <input
        value={text}
        placeholder={field.placeholder}
        inputMode={field.type === "url" ? "url" : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
