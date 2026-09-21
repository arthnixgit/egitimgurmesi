import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NAVBAR_LOGO_HEIGHT_MAX,
  NAVBAR_LOGO_HEIGHT_MIN,
  SITE_FONT_KEYS,
  normalizeNavbarLogoHeight,
  normalizeSiteFontKey,
  normalizeTextScale,
  shouldShowNavbarWordmark,
  sitePresentationStyle
} from "./site-presentation";

describe("site presentation settings", () => {
  it("pins the curated font keys the API accepts", () => {
    // apps/api/src/admin-content/site-presentation.ts holds the same list.
    assert.deepEqual(SITE_FONT_KEYS, [
      "default",
      "inter",
      "nunito",
      "montserrat",
      "source-sans-3",
      "lora",
      "playfair-display"
    ]);
  });

  it("renders settings saved before these controls existed exactly as before", () => {
    assert.deepEqual(sitePresentationStyle({}), {});
    assert.deepEqual(
      sitePresentationStyle({
        navbarLogoHeight: null,
        fontFamily: null,
        headingFontFamily: "default",
        headingScale: 100,
        bodyScale: null
      }),
      {}
    );
    assert.equal(shouldShowNavbarWordmark({}), true);
    assert.equal(shouldShowNavbarWordmark({ showNavbarWordmark: null }), true);
    assert.equal(shouldShowNavbarWordmark({ showNavbarWordmark: false }), false);
  });

  it("emits custom properties for real choices", () => {
    assert.deepEqual(
      sitePresentationStyle({
        navbarLogoHeight: 72,
        fontFamily: "inter",
        headingFontFamily: "lora",
        headingScale: 115,
        bodyScale: 90
      }),
      {
        "--font-body": '"Inter Variable", "Segoe UI", Arial, sans-serif',
        "--font-display": '"Lora Variable", Georgia, "Times New Roman", serif',
        "--ega-body-scale": "0.9",
        "--ega-heading-scale": "1.15",
        "--ega-navbar-logo-height": "72px"
      }
    );
  });

  it("clamps sizes into the supported range", () => {
    assert.equal(normalizeNavbarLogoHeight(4), NAVBAR_LOGO_HEIGHT_MIN);
    assert.equal(normalizeNavbarLogoHeight(900), NAVBAR_LOGO_HEIGHT_MAX);
    assert.equal(normalizeNavbarLogoHeight("64.4"), 64);
    assert.equal(normalizeNavbarLogoHeight(""), null);
    assert.equal(normalizeNavbarLogoHeight("abc"), null);
    assert.equal(normalizeTextScale(10), 85);
    assert.equal(normalizeTextScale(500), 130);
    assert.equal(normalizeTextScale(Number.NaN), null);
  });

  it("ignores unknown fonts instead of emitting a broken stack", () => {
    assert.equal(normalizeSiteFontKey("Comic Sans"), null);
    assert.equal(normalizeSiteFontKey("default"), null);
    assert.equal(normalizeSiteFontKey("nunito"), "nunito");
    assert.deepEqual(sitePresentationStyle({ fontFamily: "<script>" }), {});
  });
});
