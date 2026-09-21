import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_FONT_KEYS, normalizeSitePresentation } from "./site-presentation";

describe("site presentation validation", () => {
  it("pins the curated font keys the public site can render", () => {
    // packages/ui/src/site-presentation.ts holds the same list.
    assert.deepEqual(
      [...SITE_FONT_KEYS],
      ["default", "inter", "nunito", "montserrat", "source-sans-3", "lora", "playfair-display"]
    );
  });

  it("treats a row saved before these controls as the design default", () => {
    assert.deepEqual(normalizeSitePresentation({}), {
      navbarLogoHeight: null,
      showNavbarWordmark: true,
      fontFamily: null,
      headingFontFamily: null,
      headingScale: null,
      bodyScale: null
    });
  });

  it("clamps and whitelists what the panel sends", () => {
    assert.deepEqual(
      normalizeSitePresentation({
        navbarLogoHeight: 400,
        showNavbarWordmark: false,
        fontFamily: "Comic Sans",
        headingFontFamily: "lora",
        headingScale: 100,
        bodyScale: 10
      }),
      {
        navbarLogoHeight: 96,
        showNavbarWordmark: false,
        fontFamily: null,
        headingFontFamily: "lora",
        headingScale: null,
        bodyScale: 85
      }
    );
  });
});
