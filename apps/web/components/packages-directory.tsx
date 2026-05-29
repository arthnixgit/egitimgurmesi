"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SectionHeading } from "@ega/ui";
import { PackageCard } from "./package-card";
import { PublicPageLayout } from "./public-page-layout";
import {
  buildPackagesPageHref,
  type PackageCategory,
  type PackageProduct
} from "../lib/package-catalog";
import type { MarketingPageSection } from "../lib/public-content-api";

type PackagesDirectoryProps = {
  categories: readonly PackageCategory[];
  products: readonly PackageProduct[];
  ribbonSection?: MarketingPageSection | null;
  introSection?: MarketingPageSection | null;
};

const comparisonRows = [
  {
    feature: "Fiyatlandırma",
    gurmesi: "Esnek ve ulaşılabilir paket yapısı",
    classic: "Yüksek yıllık maliyet",
    others: "Değişken fiyat politikası"
  },
  {
    feature: "Birebir Koçluk",
    gurmesi: "Düzenli görüşme ve takip",
    classic: "Genelde yok",
    others: "Seyrek görüşme"
  },
  {
    feature: "Kişiye Özel Program",
    gurmesi: "Öğrencinin seviyesine göre güncellenen plan",
    classic: "Genel sınıf programı",
    others: "Sınırlı özelleştirme"
  },
  {
    feature: "Program Takibi",
    gurmesi: "Koç ve panel üzerinden görünür ilerleme",
    classic: "Çoğu zaman yapılmaz",
    others: "Sınırlı takip"
  },
  {
    feature: "Motivasyon Desteği",
    gurmesi: "Görüşme, görev ve analizle sürdürülen süreç",
    classic: "Standart ders akışı",
    others: "Kısıtlı destek"
  },
  {
    feature: "Yapay Zeka Desteği",
    gurmesi: "Analiz, soru çözüm ve ödev önerisi",
    classic: "Bulunmaz",
    others: "Genelde yok"
  },
  {
    feature: "Canlı Dersler",
    gurmesi: "Seçili yayın ve ders erişimi",
    classic: "Kalabalık sınıf yapısı",
    others: "Sabit ders yapısı"
  },
  {
    feature: "Esnek Paket Seçeneği",
    gurmesi: "Aylık, dönemlik ve kamp odaklı seçenekler",
    classic: "Genelde yıllık kayıt",
    others: "Kısıtlı seçenek"
  },
  {
    feature: "İade Güvencesi",
    gurmesi: "İlk görüşmeden memnun kalmazsan iade",
    classic: "Çoğunlukla yok",
    others: "Değişken politika"
  }
] as const;

export function PackagesDirectory({
  categories,
  products,
  ribbonSection,
  introSection
}: PackagesDirectoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedCategoryId = searchParams.get("kategori");
  const requestedSubcategoryId = searchParams.get("alt");

  const categoryFromQuery = getPackageCategoryById(categories, requestedCategoryId);
  const categoryFromSubcategory = getCategoryBySubcategoryId(categories, requestedSubcategoryId);
  const activeCategory = categoryFromQuery ?? categoryFromSubcategory;
  const activeSubcategory =
    activeCategory?.subcategories.find((item) => item.id === requestedSubcategoryId) ??
    getPackageSubcategoryById(categories, requestedSubcategoryId);

  const visibleProducts = useMemo(
    () => getPackagesForFilter(products, activeCategory?.id, activeSubcategory?.id),
    [activeCategory?.id, activeSubcategory?.id, products]
  );

  function setFilter(categoryId?: string | null, subcategoryId?: string | null) {
    const href = buildPackagesPageHref(
      categoryId as Parameters<typeof buildPackagesPageHref>[0],
      subcategoryId as Parameters<typeof buildPackagesPageHref>[1]
    );
    const nextHref = href === "/paketlerimiz" ? pathname : href;
    const currentHref = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    if (nextHref === currentHref) {
      return;
    }

    router.replace(nextHref, { scroll: false });
  }

  return (
    <PublicPageLayout>
      <section className="ega-section ega-container ega-section--packages-directory">
        <SectionHeading
          title={introSection?.title ?? "Sana En Uygun Paketi Seç"}
          description={introSection?.body ?? undefined}
        />

        {ribbonSection?.isActive !== false && ribbonSection?.title ? (
          <div className="ega-guarantee-ribbon" role="note" aria-label="Paket garantisi bilgisi">
            <div className="ega-guarantee-ribbon__badge" aria-hidden="true">
              ✓
            </div>
            <strong>{ribbonSection.title}</strong>
          </div>
        ) : null}

        <div className="ega-filter-shell ega-filter-shell--directory">
          <div className="ega-filter-shell__mode ega-filter-shell__mode--directory">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="ega-filter-mode"
                data-active={activeCategory?.id === category.id}
                onClick={() => setFilter(category.id, null)}
              >
                {category.label}
              </button>
            ))}
          </div>

          {activeCategory ? (
            <div className="ega-filter-shell__subcategories">
              {activeCategory.subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  type="button"
                  className="ega-filter-option ega-filter-option--compact"
                  data-active={activeSubcategory?.id === subcategory.id}
                  onClick={() => setFilter(activeCategory.id, subcategory.id)}
                >
                  <strong>{subcategory.label}</strong>
                  <span>{subcategory.description}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {visibleProducts.length ? (
          <div className="ega-pack-grid">
            {visibleProducts.map((product) => (
              <PackageCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="ega-empty-state">
            <h2>Bu filtrede henüz görünür kart yok.</h2>
            <p>Başka bir kategori ya da alt başlık seçerek devam edebilirsin.</p>
          </div>
        )}

        <section className="ega-why-gurmesi">
          <div className="ega-why-gurmesi__head">
            <h2>Neden Eğitim Gürmesi?</h2>
            <p>
              Eğitim Gürmesi Akademi; paket seçimi, koçluk takibi, canlı ders ve öğrenci panelini
              daha görünür bir sistemde birleştirir.
            </p>
          </div>

          <div
            className="ega-why-gurmesi__table"
            role="table"
            aria-label="Neden Eğitim Gürmesi karşılaştırması"
          >
            <div className="ega-why-gurmesi__row ega-why-gurmesi__row--head" role="row">
              <div className="ega-why-gurmesi__cell ega-why-gurmesi__cell--feature" role="columnheader">
                Özellikler
              </div>
              <div className="ega-why-gurmesi__cell ega-why-gurmesi__cell--brand" role="columnheader">
                Eğitim Gürmesi
              </div>
              <div className="ega-why-gurmesi__cell" role="columnheader">
                Klasik Dershaneler
              </div>
              <div className="ega-why-gurmesi__cell" role="columnheader">
                Diğer Koçluk Sistemleri
              </div>
            </div>

            {comparisonRows.map((row) => (
              <div key={row.feature} className="ega-why-gurmesi__row" role="row">
                <div className="ega-why-gurmesi__cell ega-why-gurmesi__cell--feature" role="cell">
                  {row.feature}
                </div>
                <div className="ega-why-gurmesi__cell ega-why-gurmesi__cell--brand" role="cell">
                  <span className="ega-why-gurmesi__status ega-why-gurmesi__status--good" aria-hidden="true">
                    ✓
                  </span>
                  <span>{row.gurmesi}</span>
                </div>
                <div className="ega-why-gurmesi__cell" role="cell">
                  <span className="ega-why-gurmesi__status ega-why-gurmesi__status--warn" aria-hidden="true">
                    !
                  </span>
                  <span>{row.classic}</span>
                </div>
                <div className="ega-why-gurmesi__cell" role="cell">
                  <span className="ega-why-gurmesi__status ega-why-gurmesi__status--mid" aria-hidden="true">
                    •
                  </span>
                  <span>{row.others}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </PublicPageLayout>
  );
}

function getPackageCategoryById(
  categories: readonly PackageCategory[],
  categoryId: string | null | undefined
) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

function getPackageSubcategoryById(
  categories: readonly PackageCategory[],
  subcategoryId: string | null | undefined
) {
  for (const category of categories) {
    const subcategory = category.subcategories.find((item) => item.id === subcategoryId);

    if (subcategory) {
      return subcategory;
    }
  }

  return null;
}

function getCategoryBySubcategoryId(
  categories: readonly PackageCategory[],
  subcategoryId: string | null | undefined
) {
  for (const category of categories) {
    if (category.subcategories.some((item) => item.id === subcategoryId)) {
      return category;
    }
  }

  return null;
}

function getPackagesForFilter(
  products: readonly PackageProduct[],
  categoryId?: string | null,
  subcategoryId?: string | null
) {
  return products.filter((product) => {
    if (categoryId && product.categoryId !== categoryId) {
      return false;
    }

    if (subcategoryId && product.subcategoryId !== subcategoryId) {
      return false;
    }

    return true;
  });
}
