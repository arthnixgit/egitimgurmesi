import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PackageCard, type PackageCardProduct } from "./package-card";

describe("shared PackageCard", () => {
  it("preserves the public card contract and labels", () => {
    const html = renderToStaticMarkup(createElement(PackageCard, { product: packageProduct }));

    assert.match(html, /class="ega-pack-card"/);
    assert.match(html, /class="ega-pack-card__price"/);
    assert.match(html, /₺1\.200/);
    assert.match(html, /₺1\.500/);
    assert.match(html, /6 Aya Varan Taksit/);
    assert.match(html, /Haftalık koç görüşmesi/);
    assert.match(html, /İncele/);
    assert.match(html, /Satın Al/);
    assert.match(html, /href="\/paketlerimiz\/yks-kocluk"/);
    assert.match(html, /href="\/checkout\/yks-kocluk"/);
  });

  it("renders Admin preview actions without checkout navigation", () => {
    const html = renderToStaticMarkup(
      createElement(PackageCard, { product: packageProduct, previewMode: true })
    );

    assert.match(html, /href="#admin-card-preview"/);
    assert.match(html, /aria-disabled="true"/);
    assert.doesNotMatch(html, /href="\/checkout\/yks-kocluk"/);
  });

  it("uses a stable missing-media placeholder instead of a broken frame", () => {
    const html = renderToStaticMarkup(
      createElement(PackageCard, {
        product: {
          ...packageProduct,
          introVideoUrl: null,
          introVideoPosterUrl: null,
          introVideoTitle: null
        }
      })
    );

    assert.match(html, /data-has-video="false"/);
    assert.match(html, /tanıtım videosu/);
  });
});

const packageProduct: PackageCardProduct = {
  id: "product_1",
  slug: "yks-kocluk",
  title: "YKS Koçluk Paketi",
  subtitle: "Kişisel plan ve haftalık takip.",
  price: "₺1.200",
  compareAtPrice: "₺1.500",
  hasInstallments: true,
  installmentLabel: "6 Aya Varan Taksit",
  badge: "Koçluk paketi",
  features: ["Haftalık koç görüşmesi", "Kişiye özel plan"],
  featureDetails: [
    {
      title: "Haftalık koç görüşmesi",
      description: "Plan, takip ve motivasyon"
    },
    {
      title: "Kişiye özel plan",
      description: "Hedefe göre çalışma takvimi"
    }
  ],
  tone: "blue",
  introVideoSourceType: "EMBED",
  introVideoUrl: "https://www.youtube.com/embed/test-video",
  introVideoPosterUrl: "https://cdn.example.com/poster.jpg",
  introVideoTitle: "Paket tanıtımı"
};
