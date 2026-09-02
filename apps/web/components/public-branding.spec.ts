import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const navbarSource = readFileSync(resolve(here, "public-navbar.tsx"), "utf8");
const footerSource = readFileSync(resolve(here, "public-footer.tsx"), "utf8");
const layoutSource = readFileSync(resolve(here, "../app/layout.tsx"), "utf8");
const homepageSource = readFileSync(resolve(here, "../app/page.tsx"), "utf8");
const authPageSource = readFileSync(resolve(here, "../app/giris/auth-page-client.tsx"), "utf8");

describe("public branding consumers", () => {
  it("keeps PublicNavbar off the hardcoded primary logo path", () => {
    assert.doesNotMatch(navbarSource, /src="\/branding\/ega-logo-official\.png"/);
    assert.match(navbarSource, /siteSettings\.logoPrimaryUrl/);
    assert.match(navbarSource, /siteSettings\.logoCompactUrl/);
    assert.match(navbarSource, /siteSettings\.logoAltText/);
  });

  it("maps footer and metadata to their dedicated settings fields", () => {
    assert.match(footerSource, /logoFooterUrl/);
    assert.match(layoutSource, /settings\.faviconUrl/);
    assert.match(layoutSource, /settings\.defaultSocialImageUrl/);
  });

  it("maps mark and light/dark variants to intended public surfaces", () => {
    assert.match(homepageSource, /siteSettings\.logoLightUrl/);
    assert.match(authPageSource, /siteSettings\.logoDarkUrl/);
  });
});
