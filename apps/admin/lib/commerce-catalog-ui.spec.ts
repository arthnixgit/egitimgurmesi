import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCategoryTree,
  buildPackageCardPreviewProduct,
  canManageGlobalCatalog,
  getAvailableCommerceTabs,
  getCardContentWarnings,
  getCanonicalCategoryHref,
  getProductCategoryPath,
  getPublishReadiness,
  getSubcategoriesForRoot,
  normalizeCategoryForSave,
  shouldClearStaffSessionForCommerceError
} from "./commerce-catalog-ui";
import type { AdminCatalogCategory, AdminCatalogProduct } from "./commerce-client";

describe("commerce catalog admin UI helpers", () => {
  it("exposes catalog tabs only to super admin while preserving order access", () => {
    assert.deepEqual(
      getAvailableCommerceTabs({ roleKeys: ["super-admin"], permissionKeys: [] }),
      ["categories", "products", "orders"]
    );

    assert.equal(
      canManageGlobalCatalog({
        roleKeys: ["branch-admin"],
        permissionKeys: ["products.manage", "pricing.manage", "coupons.manage", "orders.read"]
      }),
      false
    );
    assert.deepEqual(
      getAvailableCommerceTabs({
        roleKeys: ["branch-admin"],
        permissionKeys: ["products.manage", "pricing.manage", "orders.read"]
      }),
      ["orders"]
    );
    assert.deepEqual(
      getAvailableCommerceTabs({ roleKeys: ["instructor"], permissionKeys: [] }),
      []
    );
  });

  it("keeps controlled 403 responses from clearing a staff session", () => {
    assert.equal(shouldClearStaffSessionForCommerceError({ status: 403 }), false);
    assert.equal(shouldClearStaffSessionForCommerceError({ status: 401 }), true);
  });

  it("builds the two-level public catalog hierarchy from dynamic categories", () => {
    const tree = buildCategoryTree(sampleCategories, sampleProducts);

    assert.deepEqual(
      tree.map((entry) => entry.category.name),
      [
        "Online Koçluk",
        "Yüz Yüze Koçluk",
        "Yazılı Kampı (Hazırlık)",
        "Özel Ders",
        "Deneme Kulübü",
        "Tekrar Kampı"
      ]
    );
    assert.deepEqual(
      tree[0].subcategories.map((entry) => entry.name),
      ["YKS", "LGS", "9. ve 10. Sınıflar", "11. Sınıf", "KPSS"]
    );
    assert.deepEqual(
      tree.find((entry) => entry.category.slug === "deneme-kulubu")?.subcategories.map((entry) => entry.name),
      ["Basılı Kargo", "Gerçek Mekan"]
    );
    assert.equal(tree[0].directProductCount, 1);
    assert.equal(tree[0].childProductCount, 1);
    assert.equal(tree[0].totalProductCount, 2);
  });

  it("filters subcategories by selected root and active state", () => {
    assert.deepEqual(
      getSubcategoriesForRoot(sampleCategories, "ozel-ders").map((entry) => entry.name),
      ["Online"]
    );
    assert.deepEqual(
      getSubcategoriesForRoot(sampleCategories, "ozel-ders", true).map((entry) => entry.name),
      ["Online", "Yüz Yüze"]
    );
  });

  it("surfaces root-assigned packages as repair-needed records", () => {
    const rootAssigned = sampleProducts.find((product) => product.slug === "legacy-root-package");
    assert.ok(rootAssigned);

    const path = getProductCategoryPath(rootAssigned, sampleCategories);

    assert.equal(path.label, "Online Koçluk → Alt kategori ataması eksik");
    assert.equal(path.hasMissingSubcategory, true);
  });

  it("derives canonical public links without exposing raw query-string work", () => {
    const child = category({
      slug: "online-kocluk--lgs",
      name: "LGS",
      parentSlug: "online-kocluk",
      ctaHref: null
    });

    assert.equal(getCanonicalCategoryHref(child), "/paketlerimiz?kategori=online-kocluk&alt=lgs");
    assert.equal(
      normalizeCategoryForSave(child).ctaHref,
      "/paketlerimiz?kategori=online-kocluk&alt=lgs"
    );
  });

  it("creates a PackageCard-compatible preview model with readiness and warnings", () => {
    const product = productDraft({
      categorySlug: "online-kocluk--yks",
      shortDescription: "Kısa ve net açıklama",
      variants: [
        variant({
          title: "Standart",
          sku: "YKS-STD",
          price: "1200",
          compareAtPrice: "1500",
          billingLabel: "₺1.200",
          hasInstallments: true,
          installmentCount: 6,
          isDefault: true
        })
      ],
      features: [
        { title: "Haftalık koç görüşmesi", description: "Plan ve takip", iconKey: "coach", sortOrder: 10 }
      ]
    });

    const preview = buildPackageCardPreviewProduct(product);
    const readiness = getPublishReadiness(product, sampleCategories);

    assert.equal(preview.title, product.name);
    assert.equal(preview.price, "₺1.200");
    assert.equal(preview.compareAtPrice, "1500 TRY");
    assert.equal(preview.installmentLabel, "6 Aya Varan Taksit");
    assert.deepEqual(preview.features, ["Haftalık koç görüşmesi"]);
    assert.equal(readiness.every((item) => item.ready), true);
  });

  it("warns when card content can degrade the public package card layout", () => {
    const warnings = getCardContentWarnings(
      productDraft({
        name: "Çok uzun paket başlığı ".repeat(5),
        shortDescription: "Kısa açıklama ".repeat(20),
        features: Array.from({ length: 9 }, (_, index) => ({
          title: index === 0 ? "Çok uzun özellik ".repeat(10) : `Özellik ${index}`,
          description: null,
          iconKey: null,
          sortOrder: index
        }))
      })
    );

    assert.ok(warnings.includes("Paket başlığı kart görünümü için uzun olabilir."));
    assert.ok(warnings.includes("Kısa açıklama kart yüksekliğini artırabilir."));
    assert.ok(warnings.includes("Çok sayıda özellik kartlar arasında yükseklik farkı oluşturabilir."));
    assert.ok(warnings.includes("Uzun özellik metni kart görünümünde satır sayısını artırabilir."));
  });
});

const sampleCategories: AdminCatalogCategory[] = [
  category({ slug: "online-kocluk", name: "Online Koçluk", sortOrder: 10 }),
  category({ slug: "yuz-yuze-kocluk", name: "Yüz Yüze Koçluk", sortOrder: 20 }),
  category({ slug: "yazili-kampi", name: "Yazılı Kampı (Hazırlık)", sortOrder: 30 }),
  category({ slug: "ozel-ders", name: "Özel Ders", sortOrder: 40 }),
  category({ slug: "deneme-kulubu", name: "Deneme Kulübü", sortOrder: 50 }),
  category({ slug: "tekrar-kampi", name: "Tekrar Kampı", sortOrder: 60 }),
  category({ slug: "online-kocluk--yks", name: "YKS", parentSlug: "online-kocluk", sortOrder: 10 }),
  category({ slug: "online-kocluk--lgs", name: "LGS", parentSlug: "online-kocluk", sortOrder: 20 }),
  category({ slug: "online-kocluk--9-10-sinif", name: "9. ve 10. Sınıflar", parentSlug: "online-kocluk", sortOrder: 30 }),
  category({ slug: "online-kocluk--11-sinif", name: "11. Sınıf", parentSlug: "online-kocluk", sortOrder: 40 }),
  category({ slug: "online-kocluk--kpss", name: "KPSS", parentSlug: "online-kocluk", sortOrder: 50 }),
  category({ slug: "deneme-kulubu--basili-kargo", name: "Basılı Kargo", parentSlug: "deneme-kulubu", sortOrder: 10 }),
  category({ slug: "deneme-kulubu--gercek-mekan", name: "Gerçek Mekan", parentSlug: "deneme-kulubu", sortOrder: 20 }),
  category({ slug: "ozel-ders--online", name: "Online", parentSlug: "ozel-ders", sortOrder: 10 }),
  category({ slug: "ozel-ders--yuz-yuze", name: "Yüz Yüze", parentSlug: "ozel-ders", sortOrder: 20, isActive: false })
];

const sampleProducts: AdminCatalogProduct[] = [
  productDraft({ slug: "published-yks", name: "YKS Paketi", categorySlug: "online-kocluk--yks" }),
  productDraft({ slug: "legacy-root-package", name: "Eski Root Paket", categorySlug: "online-kocluk" })
];

function category(input: Partial<AdminCatalogCategory>): AdminCatalogCategory {
  return {
    id: input.id ?? `cat_${input.slug}`,
    slug: input.slug ?? "category",
    name: input.name ?? "Kategori",
    parentSlug: input.parentSlug ?? null,
    description: input.description ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    ctaHref: input.ctaHref ?? null,
    sortOrder: input.sortOrder ?? 10,
    isActive: input.isActive ?? true
  };
}

function productDraft(input: Partial<AdminCatalogProduct>): AdminCatalogProduct {
  return {
    id: input.id ?? `prod_${input.slug ?? "package"}`,
    slug: input.slug ?? "package",
    name: input.name ?? "YKS Koçluk Paketi",
    categorySlug: input.categorySlug ?? "online-kocluk--yks",
    shortDescription: input.shortDescription ?? "Kısa açıklama",
    description: input.description ?? null,
    type: input.type ?? "COACHING",
    provider: input.provider ?? "LOCAL",
    publishStatus: input.publishStatus ?? "DRAFT",
    isFeatured: input.isFeatured ?? false,
    sortOrder: input.sortOrder ?? 10,
    accentColor: input.accentColor ?? "blue",
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    coverImageUrl: input.coverImageUrl ?? null,
    introVideoSourceType: input.introVideoSourceType ?? null,
    introVideoUrl: input.introVideoUrl ?? null,
    introVideoPosterUrl: input.introVideoPosterUrl ?? null,
    introVideoTitle: input.introVideoTitle ?? null,
    variants: input.variants ?? [variant({ isDefault: true })],
    features: input.features ?? [{ title: "Özellik", description: null, iconKey: null, sortOrder: 10 }]
  };
}

function variant(input: Partial<AdminCatalogProduct["variants"][number]>): AdminCatalogProduct["variants"][number] {
  return {
    id: input.id ?? "variant_1",
    title: input.title ?? "Standart",
    sku: input.sku ?? "SKU-1",
    billingLabel: input.billingLabel ?? null,
    price: input.price ?? "1000",
    compareAtPrice: input.compareAtPrice ?? null,
    currency: input.currency ?? "TRY",
    isDefault: input.isDefault ?? false,
    isActive: input.isActive ?? true,
    hasInstallments: input.hasInstallments ?? false,
    installmentCount: input.installmentCount ?? null,
    sortOrder: input.sortOrder ?? 10,
    externalProductId: input.externalProductId ?? null,
    externalVariantId: input.externalVariantId ?? null
  };
}
