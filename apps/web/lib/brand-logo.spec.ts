import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getBrandLogoRenderMode,
  isRemoteCmsBrandAsset,
  resolveBrandLogoSource
} from "./brand-logo";

const fallback = "/branding/ega-logo-official.png";

describe("brand logo source classification", () => {
  it("keeps local static branding on the normal Next Image path", () => {
    assert.equal(isRemoteCmsBrandAsset("/branding/ega-logo-official.png"), false);
    assert.equal(isRemoteCmsBrandAsset("/branding/ega-mark-transparent.png"), false);
    assert.equal(getBrandLogoRenderMode("/branding/ega-logo-official.png"), "next-image");
  });

  it("bypasses the optimizer for validated CMS HTTPS assets", () => {
    const asset = "https://api.egitimgurmesi.com/v1/media/assets/28fe668f-c711-45c3-9e54-cf4aa647fafd/file";

    assert.equal(isRemoteCmsBrandAsset(asset), true);
    assert.equal(getBrandLogoRenderMode(asset), "native-image");
    assert.equal(getBrandLogoRenderMode("https://media.example.org/branding/logo.png"), "native-image");
  });

  it("rejects unsafe protocols before a branding image is rendered", () => {
    for (const unsafe of ["javascript:alert(1)", "data:image/png;base64,AA==", "file:///logo.png", "ftp://cdn.example.com/logo.png"]) {
      assert.equal(isRemoteCmsBrandAsset(unsafe), false);
      assert.equal(resolveBrandLogoSource(unsafe, fallback), fallback);
    }
  });
});
