import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fallbackSiteSettings,
  isValidPublicSiteSettingsSnapshot,
  normalizePublicSiteSettings
} from "./contact";

describe("public site settings normalization", () => {
  it("maps each configured logo setting independently", () => {
    const settings = normalizePublicSiteSettings({
      logoPrimaryUrl: "/media/header.png",
      logoCompactUrl: "/media/mobile.png",
      logoFooterUrl: "/media/footer.png",
      logoMarkUrl: "/media/mark.png",
      logoDarkUrl: "/media/dark.png",
      logoLightUrl: "/media/light.png",
      faviconUrl: "/media/favicon.png",
      defaultSocialImageUrl: "/media/social.png",
      logoAltText: "Custom logo"
    });

    assert.equal(settings.logoPrimaryUrl, "/media/header.png");
    assert.equal(settings.logoCompactUrl, "/media/mobile.png");
    assert.equal(settings.logoFooterUrl, "/media/footer.png");
    assert.equal(settings.logoMarkUrl, "/media/mark.png");
    assert.equal(settings.logoDarkUrl, "/media/dark.png");
    assert.equal(settings.logoLightUrl, "/media/light.png");
    assert.equal(settings.faviconUrl, "/media/favicon.png");
    assert.equal(settings.defaultSocialImageUrl, "/media/social.png");
    assert.equal(settings.logoAltText, "Custom logo");
  });

  it("rejects malformed asset URLs without replacing safe defaults", () => {
    const settings = normalizePublicSiteSettings({
      logoPrimaryUrl: "javascript:alert(1)",
      logoCompactUrl: "//cdn.example.com/logo.png",
      faviconUrl: "http://example.com/favicon.png",
      defaultSocialImageUrl: "https://cdn.example.com/social.png"
    });

    assert.equal(settings.logoPrimaryUrl, fallbackSiteSettings.logoPrimaryUrl);
    assert.equal(settings.logoCompactUrl, fallbackSiteSettings.logoCompactUrl);
    assert.equal(settings.faviconUrl, fallbackSiteSettings.faviconUrl);
    assert.equal(settings.defaultSocialImageUrl, "https://cdn.example.com/social.png");
    assert.equal(isValidPublicSiteSettingsSnapshot(settings), true);
  });
});
