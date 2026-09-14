import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPreviewUrl, pagePathForSlug, resolveSiteUrlFrom } from "./site-url";

describe("public site URL resolution", () => {
  it("prefers an explicitly configured origin", () => {
    assert.equal(
      resolveSiteUrlFrom("https://egitimgurmesi.com/", { protocol: "https:", hostname: "admin.egitimgurmesi.com" }),
      "https://egitimgurmesi.com"
    );
  });

  it("ignores a configured value that is not an absolute URL", () => {
    // NEXT_PUBLIC_SITE_URL is missing from the env examples, so a half-filled
    // value must not produce a broken link.
    assert.equal(resolveSiteUrlFrom("egitimgurmesi.com", { protocol: "https:", hostname: "admin.x.com" }), "https://x.com");
    assert.equal(resolveSiteUrlFrom("   ", { protocol: "https:", hostname: "admin.x.com" }), "https://x.com");
  });

  it("strips the admin subdomain in production", () => {
    assert.equal(
      resolveSiteUrlFrom(null, { protocol: "https:", hostname: "admin.egitimgurmesi.com" }),
      "https://egitimgurmesi.com"
    );
  });

  it("points at the web dev server during local development", () => {
    for (const hostname of ["localhost", "127.0.0.1"]) {
      assert.equal(resolveSiteUrlFrom(null, { protocol: "http:", hostname }), "http://localhost:3000");
    }
  });

  it("falls back to the same origin when there is no admin subdomain", () => {
    assert.equal(resolveSiteUrlFrom(null, { protocol: "https:", hostname: "panel.example.com" }), "https://panel.example.com");
  });

  it("returns null during server rendering instead of guessing a host", () => {
    assert.equal(resolveSiteUrlFrom(null, null), null);
  });
});

describe("preview URLs", () => {
  it("maps page slugs to their public paths", () => {
    assert.equal(pagePathForSlug("home"), "/");
    assert.equal(pagePathForSlug("/"), "/");
    assert.equal(pagePathForSlug(""), "/");
    assert.equal(pagePathForSlug(null), "/");
    assert.equal(pagePathForSlug("hakkimizda"), "/hakkimizda");
    assert.equal(pagePathForSlug("/paketlerimiz/"), "/paketlerimiz");
  });

  it("builds a preview URL carrying the token", () => {
    assert.equal(
      buildPreviewUrl("https://egitimgurmesi.com", "/", "tok", null),
      "https://egitimgurmesi.com/?preview=tok"
    );
  });

  it("adds a cache buster so a saved draft is not shown stale", () => {
    const url = buildPreviewUrl("https://x.com", "/hakkimizda", "tok", 7);

    assert.match(url ?? "", /preview=tok/);
    assert.match(url ?? "", /v=7/);
  });

  it("omits the token when there is none, so the live page still opens", () => {
    assert.equal(buildPreviewUrl("https://x.com", "/", null, null), "https://x.com/");
  });

  it("escapes the token rather than letting it alter the query", () => {
    const url = buildPreviewUrl("https://x.com", "/", "a&b=c", null);

    assert.equal(url, "https://x.com/?preview=a%26b%3Dc");
  });

  it("returns null when the site URL is unknown", () => {
    assert.equal(buildPreviewUrl(null, "/", "tok", 1), null);
  });
});
