"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { FreeMaterialCard } from "./free-material-card";
import {
  FREE_MATERIALS_EMPTY_CATEGORY_MESSAGE,
  FreeMaterialsState
} from "./free-materials-state";
import type { ResourceLink } from "../lib/free-materials";

export type FreeMaterialsDirectoryCategoryTone =
  | "amber"
  | "blue"
  | "teal"
  | "violet"
  | "green"
  | "orange"
  | "pink"
  | "navy"
  | "gold";

export type FreeMaterialsDirectoryCategory = {
  id: string;
  title: string;
  summary: string;
  badge: string;
  href: string;
  buttonLabel?: string;
  opensInNewTab?: boolean;
  links: readonly ResourceLink[];
  optionGroups?: readonly {
    title: string;
    items: readonly ResourceLink[];
  }[];
  tone: FreeMaterialsDirectoryCategoryTone;
  previewLabel?: string;
};

type FreeMaterialsDirectoryShowcaseProps = {
  categories: readonly FreeMaterialsDirectoryCategory[];
};

export function FreeMaterialsDirectoryShowcase({
  categories
}: FreeMaterialsDirectoryShowcaseProps) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const orderedIds = useMemo(() => categories.map((category) => category.id), [categories]);

  useEffect(() => {
    setActiveId((current) => (orderedIds.includes(current) ? current : orderedIds[0] ?? ""));
  }, [orderedIds]);

  const activeCategory = categories.find((category) => category.id === activeId) ?? categories[0] ?? null;

  if (!activeCategory) {
    return null;
  }

  const activeIndex = Math.max(orderedIds.indexOf(activeCategory.id), 0);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!orderedIds.length) {
      return;
    }

    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? orderedIds.length - 1
          : event.key === "ArrowRight"
            ? (index + 1) % orderedIds.length
            : (index - 1 + orderedIds.length) % orderedIds.length;
    setActiveId(orderedIds[nextIndex]);
    window.requestAnimationFrame(() => {
      document.getElementById(`free-material-tab-${orderedIds[nextIndex]}`)?.focus();
    });
  }

  return (
    <section className="ega-free-directory-surface ega-container">
      <div className="ega-free-directory-head">
        <span className="ega-eyebrow">Kaynak merkezi</span>
        <h1>Ücretsiz Materyaller</h1>
        <p>Yayındaki kategorileri seç, kartları karşılaştır ve ihtiyacın olan materyale doğrudan ulaş.</p>
      </div>

      <div className="ega-free-directory-tabs" role="tablist" aria-label="Ücretsiz materyal kategorileri">
        {categories.map((category, index) => (
          <button
            id={`free-material-tab-${category.id}`}
            key={category.id}
            type="button"
            role="tab"
            aria-selected={activeCategory.id === category.id}
            aria-controls={`free-material-panel-${category.id}`}
            className="ega-free-directory-category"
            data-active={activeCategory.id === category.id}
            data-tone={category.tone}
            onClick={() => setActiveId(category.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            <strong>{category.title}</strong>
            <span>{category.links.length} materyal</span>
          </button>
        ))}
      </div>

      <article
        id={`free-material-panel-${activeCategory.id}`}
        className="ega-free-directory-panel"
        role="tabpanel"
        aria-labelledby={`free-material-tab-${activeCategory.id}`}
        data-tone={activeCategory.tone}
        data-count={activeCategory.links.length}
      >
        <div className="ega-free-directory-panel__head">
          <div>
            <span className="ega-free-directory-preview__badge">{activeCategory.badge}</span>
            <h2>{activeCategory.title}</h2>
            <p>{activeCategory.summary}</p>
          </div>
          <Link
            className="ega-button ega-button--ghost"
            href={activeCategory.href}
            target={activeCategory.opensInNewTab ? "_blank" : undefined}
            rel={activeCategory.opensInNewTab ? "noreferrer" : undefined}
          >
            {activeCategory.buttonLabel ?? "Kategoriye Git"}
          </Link>
        </div>

        {activeCategory.links.length === 0 ? (
          <FreeMaterialsState title={activeCategory.title} message={FREE_MATERIALS_EMPTY_CATEGORY_MESSAGE} />
        ) : (
          <div className="ega-free-material-grid" data-count={activeCategory.links.length}>
            {activeCategory.links.map((item) => (
              <FreeMaterialCard key={item.id ?? item.slug ?? item.href ?? item.title} item={item} />
            ))}
          </div>
        )}

        <p className="ega-free-directory-panel__meta" aria-live="polite">
          {activeIndex + 1} / {categories.length} kategori gösteriliyor.
        </p>
      </article>
    </section>
  );
}
