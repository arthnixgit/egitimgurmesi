"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@ega/ui";
import type { ResourceLink } from "../lib/free-materials";
import { FreeMaterialTiles } from "./free-material-tiles";
import type { ExplorerMaterial } from "./free-materials-explorer";

export type FreeHubTone =
  | "amber"
  | "blue"
  | "teal"
  | "violet"
  | "green"
  | "orange"
  | "pink"
  | "navy"
  | "gold";

export type FreeHubCard = {
  id: string;
  title: string;
  summary: string;
  badge: string;
  tone: FreeHubTone;
  previewLabel: string;
  /** Where the card and its button lead. Absent for the materials card. */
  href?: string;
  buttonLabel?: string;
  opensInNewTab?: boolean;
  optionGroups?: readonly { title: string; items: readonly ResourceLink[] }[];
  /** The card whose button reveals the editor's material cards below the board. */
  revealsMaterials?: boolean;
};

/** Anchor of the revealed material cards; also opens them when present in the URL. */
export const FREE_MATERIAL_CARDS_ANCHOR = "ucretsiz-materyal-kartlari";

/** Below this width the preview sits between the two stacks, off-screen from most cards. */
const STACKED_LAYOUT_QUERY = "(max-width: 1100px)";
const CARDS_PER_SIDE = 5;

/**
 * The Ücretsiz Materyaller hub: tool cards in two columns of five with the
 * clicked card shown in the middle — the page's original design, restored on
 * the customer's request. The middle card changes only on a click: no hover
 * preview and no automatic rotation, so it never changes under the reader.
 *
 * One card is the downloadable materials. Its preview button reveals the
 * cards managed in the admin panel under the board and scrolls to them, so
 * the hub stays compact until a visitor asks for the files.
 */
export function FreeMaterialsHub({
  cards,
  materials
}: {
  cards: readonly FreeHubCard[];
  materials: readonly ExplorerMaterial[];
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(cards[0]?.id ?? "");
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const materialsRef = useRef<HTMLElement | null>(null);
  const scrollPendingRef = useRef(false);

  const orderedIds = useMemo(() => cards.map((card) => card.id), [cards]);
  const activeCard = cards.find((card) => card.id === activeId) ?? cards[0] ?? null;
  const activeIndex = activeCard ? orderedIds.indexOf(activeCard.id) : 0;

  const openMaterials = useCallback(() => {
    const materialsCard = cards.find((card) => card.revealsMaterials);
    if (materialsCard) {
      setActiveId(materialsCard.id);
    }
    scrollPendingRef.current = true;
    setMaterialsOpen(true);
    // Already open: the effect below will not run again, so scroll here.
    if (materialsRef.current) {
      scrollPendingRef.current = false;
      materialsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [cards]);

  // Scroll once the cards are actually in the DOM, not when the click fires.
  useEffect(() => {
    if (!materialsOpen || !scrollPendingRef.current || !materialsRef.current) {
      return;
    }

    scrollPendingRef.current = false;
    materialsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [materialsOpen]);

  // A link to /ucretsiz-materyaller#ucretsiz-materyal-kartlari opens the cards.
  // Deferred a frame: the page must hydrate closed (the server cannot see the
  // hash) before it opens, or React reports a hydration mismatch.
  useEffect(() => {
    if (window.location.hash !== `#${FREE_MATERIAL_CARDS_ANCHOR}`) {
      return;
    }

    const frame = window.requestAnimationFrame(openMaterials);
    return () => window.cancelAnimationFrame(frame);
  }, [openMaterials]);

  if (!activeCard) {
    return null;
  }

  const choose = (id: string) => {
    setActiveId(id);

    // On phones and tablets the preview is far from the tapped card, so a
    // tap does the card's job directly instead of changing an unseen preview.
    if (window.matchMedia(STACKED_LAYOUT_QUERY).matches) {
      const card = cards.find((entry) => entry.id === id);
      if (card?.revealsMaterials) {
        openMaterials();
      } else if (card?.href) {
        router.push(card.href);
      }
    }
  };

  return (
    <section className="ega-free-hub-surface ega-container">
      <div className="ega-free-hub-head">
        <h1>Ücretsiz Materyaller</h1>
      </div>

      <div className="ega-free-hub-board">
        <HubColumn cards={cards.slice(0, CARDS_PER_SIDE)} activeId={activeCard.id} onChoose={choose} />

        <article className="ega-free-hub-preview" data-tone={activeCard.tone} aria-live="polite">
          <div className="ega-free-hub-preview__top">
            <span className="ega-free-hub-preview__badge">{activeCard.badge}</span>
            <span className="ega-free-hub-preview__counter">
              {String(activeIndex + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}
            </span>
          </div>

          <div className="ega-free-hub-preview__stage">
            <div className="ega-free-hub-preview__media">
              <div className="ega-free-hub-preview__media-shell">
                <span>{activeCard.previewLabel}</span>
                <strong>{activeCard.title}</strong>
              </div>
            </div>

            <div className="ega-free-hub-preview__copy">
              <h2>{activeCard.title}</h2>
              <p>{activeCard.summary}</p>

              {activeCard.optionGroups?.length ? (
                <div className="ega-free-hub-options" aria-label={`${activeCard.title} seçenekleri`}>
                  {activeCard.optionGroups.map((group) => (
                    <div key={group.title} className="ega-free-hub-options__group">
                      <strong>{group.title}</strong>
                      <div>
                        {group.items.map((item) => (
                          <Link key={item.href} href={item.href}>
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeCard.revealsMaterials ? (
                <div className="ega-free-hub-preview__meta">
                  <span>{materials.length > 0 ? `${materials.length} ücretsiz materyal` : "Materyaller hazırlanıyor"}</span>
                </div>
              ) : null}

              <div className="ega-free-hub-preview__action">
                {activeCard.revealsMaterials ? (
                  <button
                    type="button"
                    className="ega-button"
                    onClick={openMaterials}
                    disabled={materials.length === 0}
                    aria-expanded={materialsOpen}
                    aria-controls={FREE_MATERIAL_CARDS_ANCHOR}
                  >
                    <span aria-hidden="true">↓</span>
                    {activeCard.buttonLabel ?? "Materyalleri İndir"}
                  </button>
                ) : activeCard.href ? (
                  <ButtonLink
                    href={activeCard.href}
                    label={activeCard.buttonLabel ?? "Sayfayı Aç"}
                    target={activeCard.opensInNewTab ? "_blank" : undefined}
                    rel={activeCard.opensInNewTab ? "noreferrer" : undefined}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </article>

        <HubColumn cards={cards.slice(CARDS_PER_SIDE)} activeId={activeCard.id} onChoose={choose} />
      </div>

      {materialsOpen && materials.length > 0 ? (
        <section
          id={FREE_MATERIAL_CARDS_ANCHOR}
          ref={materialsRef}
          className="ega-free-hub-materials"
          aria-label="İndirilebilir ücretsiz materyaller"
        >
          <div className="ega-free-hub-materials__head">
            <h2>İndirilebilir Materyaller</h2>
            <p>Materyalin üzerindeki butonla dosyayı indirebilirsin.</p>
          </div>
          <FreeMaterialTiles materials={materials} />
        </section>
      ) : null}
    </section>
  );
}

function HubColumn({
  cards,
  activeId,
  onChoose
}: {
  cards: readonly FreeHubCard[];
  activeId: string;
  onChoose: (id: string) => void;
}) {
  return (
    <div className="ega-free-hub-column">
      {cards.map((card) => (
        // Every card only selects: its page opens from the button in the
        // middle card, so a click always shows the card first.
        <button
          key={card.id}
          type="button"
          className="ega-free-hub-category"
          data-active={activeId === card.id}
          data-tone={card.tone}
          aria-pressed={activeId === card.id}
          onClick={() => onChoose(card.id)}
        >
          <strong>{card.title}</strong>
          <span>{card.badge}</span>
        </button>
      ))}
    </div>
  );
}
