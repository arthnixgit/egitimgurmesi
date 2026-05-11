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

type PackagesDirectoryProps = {
  categories: readonly PackageCategory[];
  products: readonly PackageProduct[];
};

export function PackagesDirectory({ categories, products }: PackagesDirectoryProps) {
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

    router.push(href === "/paketlerimiz" ? pathname : href);
  }

  return (
    <PublicPageLayout>
      <section className="ega-page-banner ega-page-banner--packages">
        <div className="ega-container ega-page-banner__inner">
          <div className="ega-page-banner__copy">
            <span className="ega-eyebrow">Paket Kataloğu</span>
            <h1>Paketleri kategori ve alt kategoriye göre filtreleyip doğrudan incele.</h1>
            <p>
              Bu sayfa artık ana sayfadaki bölüme bağlı değil. Menüden gelen ziyaretçi doğrudan ürün kataloğuna
              düşer, kategori seçer, alt başlık daraltır ve kartlar üzerinden inceleme ya da satın alma akışına geçer.
            </p>
          </div>

          <div className="ega-page-banner__panel">
            <span>Aktif görünüm</span>
            <strong>{activeCategory?.label ?? "Hepsi"}</strong>
            <p>{activeSubcategory?.label ?? "Tüm paket ve koçluk kartları birlikte listeleniyor."}</p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <SectionHeading
          eyebrow="Filtreleme"
          title="Tüm paketleri tek sayfada gez, istersen başlığa göre daralt"
          description="Üst satır ana kategorileri, ikinci satır seçilen kategorinin alt başlıklarını kontrol eder. Hiçbir seçim yapılmazsa Hepsi görünümü açık kalır."
        />

        <div className="ega-filter-shell ega-filter-shell--directory">
          <div className="ega-filter-shell__mode ega-filter-shell__mode--directory">
            <button
              type="button"
              className="ega-filter-mode"
              data-active={!activeCategory}
              onClick={() => setFilter(null, null)}
            >
              Hepsi
            </button>

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
              <button
                type="button"
                className="ega-filter-option ega-filter-option--compact"
                data-active={!activeSubcategory}
                onClick={() => setFilter(activeCategory.id, null)}
              >
                <strong>Hepsi</strong>
                <span>{activeCategory.label} içindeki tüm alt başlıklar</span>
              </button>

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

        <div className="ega-filter-summary">
          <strong>{visibleProducts.length} kart listeleniyor</strong>
          <span>
            {activeCategory
              ? `${activeCategory.label}${activeSubcategory ? ` / ${activeSubcategory.label}` : ""}`
              : "Hepsi görünümü"}
          </span>
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
            <p>Başka bir kategori seçerek devam edebilir veya Hepsi görünümüne dönebilirsin.</p>
          </div>
        )}
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
