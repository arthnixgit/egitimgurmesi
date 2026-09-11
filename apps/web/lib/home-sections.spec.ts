import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_FEATURE_HIGHLIGHTS_TITLE,
  DEFAULT_VIDEO_SHOWCASE_TITLE,
  PHONE_HREF_TOKEN,
  WHATSAPP_HREF_TOKEN,
  defaultContactCta,
  defaultFeatureHighlights,
  defaultLogoRailItems,
  defaultVideoCards,
  findHomeSection,
  readContactCta,
  readFeatureHighlights,
  readLogoRail,
  readVideoShowcase,
  resolveCtaHref
} from "./home-sections";
import type { MarketingPageSection } from "./public-content-api";

function section(overrides: Partial<MarketingPageSection>): MarketingPageSection {
  return {
    sectionKey: "test",
    eyebrow: null,
    title: null,
    body: null,
    variantKey: null,
    payload: null,
    sortOrder: 10,
    isActive: true,
    ...overrides
  } as MarketingPageSection;
}

describe("homepage section binding", () => {
  it("falls back to the shipped copy when no section exists", () => {
    // An empty database must render the site exactly as it looked before the
    // content moved into the CMS, never a blank homepage.
    assert.deepEqual(readLogoRail(null).items, [...defaultLogoRailItems]);
    assert.deepEqual(readVideoShowcase(null).items, [...defaultVideoCards]);
    assert.equal(readVideoShowcase(null).title, DEFAULT_VIDEO_SHOWCASE_TITLE);
    assert.deepEqual(readFeatureHighlights(null).items, [...defaultFeatureHighlights]);
    assert.equal(readFeatureHighlights(null).title, DEFAULT_FEATURE_HIGHLIGHTS_TITLE);
    assert.deepEqual(readContactCta(null), defaultContactCta);
  });

  it("uses edited content once the section carries a payload", () => {
    const result = readVideoShowcase(
      section({
        title: "Yeni Başlık",
        payload: {
          items: [
            {
              id: "custom",
              title: "Özel Ders",
              category: "TYT",
              duration: "10 dk",
              teacher: "Ekip",
              summary: "Kısa özet",
              tone: "teal"
            }
          ]
        }
      })
    );

    assert.equal(result.title, "Yeni Başlık");
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].title, "Özel Ders");
    assert.equal(result.items[0].tone, "teal");
  });

  it("drops malformed entries but keeps the valid ones", () => {
    const result = readFeatureHighlights(
      section({
        payload: {
          items: [
            { label: "Geçerli", title: "Başlık", body: "Metin", tone: "blue" },
            { title: "Etiketsiz giriş" },
            "not an object",
            null
          ]
        }
      })
    );

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].label, "Geçerli");
  });

  it("falls back rather than rendering an empty section when every entry is invalid", () => {
    const result = readLogoRail(section({ payload: { items: [{ alt: "no src" }] } }));

    assert.deepEqual(result.items, [...defaultLogoRailItems]);
  });

  it("normalizes an unknown tone instead of leaking it into the markup", () => {
    const result = readVideoShowcase(
      section({ payload: { items: [{ title: "Ders", tone: "neon-pink" }] } })
    );

    assert.equal(result.items[0].tone, "amber");
  });

  it("resolves CTA tokens against live site settings", () => {
    const settings = { whatsappHref: "https://wa.me/905318553827", telHref: "tel:+905318553827" };

    assert.equal(resolveCtaHref(WHATSAPP_HREF_TOKEN, settings), settings.whatsappHref);
    assert.equal(resolveCtaHref(PHONE_HREF_TOKEN, settings), settings.telHref);
    assert.equal(resolveCtaHref("/kayit", settings), "/kayit");
    // A missing setting must not render a broken "undefined" link.
    assert.equal(resolveCtaHref(WHATSAPP_HREF_TOKEN, {}), "#");
  });

  it("reads CTA actions and rejects entries missing a label or href", () => {
    const result = readContactCta(
      section({
        eyebrow: "Bize Ulaşın",
        payload: {
          actions: [
            { label: "Ara", href: "tel:+900000000000", variant: "primary" },
            { label: "Etiketsiz" },
            { href: "/only-href" }
          ]
        }
      })
    );

    assert.equal(result.eyebrow, "Bize Ulaşın");
    assert.equal(result.actions.length, 1);
    assert.equal(result.actions[0].variant, "primary");
    assert.equal(result.actions[0].openInNewTab, false);
  });

  it("matches sections by key or variant and skips deactivated ones", () => {
    const sections = [
      section({ sectionKey: "logo-rail", isActive: false }),
      section({ sectionKey: "home-videos", variantKey: "video-showcase" })
    ];

    assert.equal(findHomeSection(sections, "logo-rail"), null);
    assert.equal(findHomeSection(sections, "video-showcase")?.sectionKey, "home-videos");
    assert.equal(findHomeSection(undefined, "video-showcase"), null);
  });
});
