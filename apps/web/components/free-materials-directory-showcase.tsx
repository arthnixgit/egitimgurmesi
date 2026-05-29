"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@ega/ui";
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
  const [isPaused, setIsPaused] = useState(false);

  const orderedIds = useMemo(() => categories.map((category) => category.id), [categories]);

  useEffect(() => {
    if (!orderedIds.length) {
      return;
    }

    setActiveId((current) => (orderedIds.includes(current) ? current : orderedIds[0]));
  }, [orderedIds]);

  useEffect(() => {
    if (isPaused || orderedIds.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveId((current) => {
        const currentIndex = orderedIds.indexOf(current);
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        return orderedIds[(safeIndex + 1) % orderedIds.length];
      });
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [isPaused, orderedIds]);

  const activeCategory =
    categories.find((category) => category.id === activeId) ?? categories[0] ?? null;
  const leftColumn = categories.slice(0, 5);
  const rightColumn = categories.slice(5);

  if (!activeCategory) {
    return null;
  }

  return (
    <section className="ega-free-directory-surface ega-container">
      <div className="ega-free-directory-head">
        <h1>Ücretsiz Materyaller</h1>
      </div>

      <div
        className="ega-free-directory-board"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <DirectoryColumn
          categories={leftColumn}
          activeId={activeCategory.id}
          onSelect={setActiveId}
        />

        <article
          className="ega-free-directory-preview"
          data-tone={activeCategory.tone}
        >
          <div className="ega-free-directory-preview__top">
            <span className="ega-free-directory-preview__badge">{activeCategory.badge}</span>
            <span className="ega-free-directory-preview__counter">
              {String(orderedIds.indexOf(activeCategory.id) + 1).padStart(2, "0")} /{" "}
              {String(categories.length).padStart(2, "0")}
            </span>
          </div>

          <div className="ega-free-directory-preview__stage">
            <div className="ega-free-directory-preview__media">
              <div className="ega-free-directory-preview__media-shell">
                <span>{activeCategory.previewLabel ?? "İçerik Alanı"}</span>
                <strong>{activeCategory.title}</strong>
              </div>
            </div>

            <div className="ega-free-directory-preview__copy">
              <h2>{activeCategory.title}</h2>
              <p>{activeCategory.summary}</p>

              <div className="ega-free-directory-preview__meta">
                <span>
                  {activeCategory.links.length > 0
                    ? `${activeCategory.links.length} bağlantı`
                    : "Tanıtım sayfası"}
                </span>
                <small>
                  Kartı tıklayarak ilgili sayfaya geçebilir, içerik detayını ayrı ekranda
                  inceleyebilirsin.
                </small>
              </div>

              <div className="ega-free-directory-preview__action">
                <ButtonLink
                  href={activeCategory.href}
                  label={activeCategory.buttonLabel ?? "İçeriği Aç"}
                  target={activeCategory.opensInNewTab ? "_blank" : "_self"}
                  rel={activeCategory.opensInNewTab ? "noreferrer" : undefined}
                />
              </div>
            </div>
          </div>
        </article>

        <DirectoryColumn
          categories={rightColumn}
          activeId={activeCategory.id}
          onSelect={setActiveId}
        />
      </div>
    </section>
  );
}

function DirectoryColumn({
  categories,
  activeId,
  onSelect
}: {
  categories: readonly FreeMaterialsDirectoryCategory[];
  activeId: string;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <div className="ega-free-directory-column">
      {categories.map((category) => (
        <Link
          key={category.id}
          className="ega-free-directory-category"
          data-active={activeId === category.id}
          data-tone={category.tone}
          href={category.href}
          target={category.opensInNewTab ? "_blank" : "_self"}
          rel={category.opensInNewTab ? "noreferrer" : undefined}
          onMouseEnter={() => onSelect(category.id)}
          onFocus={() => onSelect(category.id)}
        >
          <strong>{category.title}</strong>
          <span>{category.badge}</span>
        </Link>
      ))}
    </div>
  );
}
