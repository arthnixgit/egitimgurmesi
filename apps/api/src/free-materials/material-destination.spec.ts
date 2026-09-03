import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FreeMaterialItemType } from "@ega/db";
import {
  COUNTDOWN_PAGE_REQUIRED_MESSAGE,
  DOWNLOAD_FILE_REQUIRED_MESSAGE,
  EXTERNAL_LINK_HTTPS_MESSAGE,
  INTERNAL_PAGE_MISSING_MESSAGE,
  resolveFreeMaterialDestination
} from "./material-destination";

describe("free material destination resolver", () => {
  it("resolves PDFs with a media asset to the secure download endpoint", () => {
    const result = resolveFreeMaterialDestination(
      {
        id: "item_1",
        slug: "tyt-plan",
        title: "TYT Plan",
        itemType: FreeMaterialItemType.PDF,
        mediaAssetId: "asset_1"
      },
      { downloadHref: "/v1/public/free-materials/item_1/download" }
    );

    assert.equal(result.ok, true);
    assert.equal(result.ok && result.mode, "DOWNLOAD");
    assert.equal(result.ok && result.href, "/v1/public/free-materials/item_1/download");
    assert.equal(result.ok && result.downloadHref, "/v1/public/free-materials/item_1/download");
  });

  it("rejects PDFs without a media asset or HTTPS download URL", () => {
    const result = resolveFreeMaterialDestination({
      id: "legacy-free-material-pdf-ayt-tekrar-cizelgesi",
      slug: "ayt-tekrar-cizelgesi-pdf",
      title: "AYT Tekrar Çizelgesi PDF",
      itemType: FreeMaterialItemType.PDF,
      href: "/ucretsiz-materyaller/ayt-kac-gun-kaldi"
    });

    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.code, "MISSING_DOWNLOAD_SOURCE");
    assert.equal(!result.ok && result.message, DOWNLOAD_FILE_REQUIRED_MESSAGE);
  });

  it("requires countdown items to target a registered countdown page", () => {
    const result = resolveFreeMaterialDestination(
      {
        slug: "bad-countdown",
        title: "Sayaç",
        itemType: FreeMaterialItemType.COUNTDOWN,
        countdownPageSlug: "bad-countdown"
      },
      { countdownSlugs: ["tyt-kac-gun-kaldi"] }
    );

    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.message, COUNTDOWN_PAGE_REQUIRED_MESSAGE);
  });

  it("rejects unknown internal pages when strict route validation is enabled", () => {
    const result = resolveFreeMaterialDestination({
      slug: "missing-page",
      title: "Eksik hedef",
      itemType: FreeMaterialItemType.INTERNAL_PAGE,
      href: "/ucretsiz-materyaller/olmayan-sayfa"
    });

    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.message, INTERNAL_PAGE_MISSING_MESSAGE);
  });

  it("rejects non-HTTPS external links", () => {
    const result = resolveFreeMaterialDestination({
      slug: "external",
      title: "Dış bağlantı",
      itemType: FreeMaterialItemType.EXTERNAL_LINK,
      href: "http://example.com"
    });

    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.message, EXTERNAL_LINK_HTTPS_MESSAGE);
  });
});