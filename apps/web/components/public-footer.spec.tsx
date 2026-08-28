import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FreeMaterialCard } from "./free-material-card";
import { PublicFooter } from "./public-footer";
import { fallbackSiteSettings } from "../lib/contact";
import type { ResourceLink } from "../lib/free-materials";

describe("PublicFooter", () => {
  it("renders the shared three-column footer with corrected contact links", () => {
    const html = renderToStaticMarkup(createElement(PublicFooter, { settings: fallbackSiteSettings }));

    assert.equal((html.match(/class="ega-footer"/g) ?? []).length, 1);
    assert.match(html, /class="ega-footer__brand"/);
    assert.match(html, /Hızlı Erişim/);
    assert.match(html, /İletişim/);
    assert.match(html, /href="\/paketlerimiz"/);
    assert.match(html, /href="\/ucretsiz-materyaller"/);
    assert.match(html, /href="\/hakkimizda"/);
    assert.match(html, /href="\/giris"/);
    assert.match(html, /\+90 531 855 38 27/);
    assert.match(html, /href="tel:\+905318553827"/);
    assert.match(html, /href="https:\/\/wa\.me\/905318553827\?text=/);
    assert.ok(html.indexOf("ega-footer__brand") < html.indexOf("ega-footer__links"));
    assert.ok(html.indexOf("ega-footer__links") < html.indexOf("ega-footer__contact"));
  });

  it("uses edited footer settings without losing required quick links", () => {
    const html = renderToStaticMarkup(
      createElement(PublicFooter, {
        settings: {
          ...fallbackSiteSettings,
          footerBrandDescription: "Güncel açıklama",
          footerContactTitle: "Bize Ulaşın",
          footerQuickLinks: [{ label: "Ekstra", href: "/ekstra" }]
        }
      })
    );

    assert.match(html, /Güncel açıklama/);
    assert.match(html, /Bize Ulaşın/);
    assert.match(html, /href="\/ekstra"/);
    assert.match(html, /href="\/paketlerimiz"/);
    assert.match(html, /href="\/giris"/);
  });
});

describe("FreeMaterialCard", () => {
  it("renders downloads as accessible card actions without showing raw file URLs", () => {
    const html = renderToStaticMarkup(
      createElement(FreeMaterialCard, {
        compact: true,
        item: downloadResource
      })
    );

    assert.match(html, /TYT Plan/);
    assert.match(html, /aria-label="TYT Plan dosyasını indir"/);
    assert.match(html, /download="tyt-plan.pdf"/);
    assert.match(html, /href="\/v1\/public\/free-materials\/item_1\/download"/);
    assert.doesNotMatch(html, /cdn\.example\.com\/hidden-plan\.pdf/);
  });
});

const downloadResource: ResourceLink = {
  id: "item_1",
  slug: "tyt-plan",
  title: "TYT Plan",
  type: "PDF",
  itemType: "DOWNLOAD",
  summary: "Haftalık çalışma planı",
  href: "/v1/public/free-materials/item_1/download",
  downloadHref: "/v1/public/free-materials/item_1/download",
  buttonLabel: "Dosyayı İndir",
  accessibilityLabel: "TYT Plan dosyasını indir",
  displayFilename: "tyt-plan.pdf",
  mimeType: "application/pdf",
  fileSizeBytes: 4096
};
