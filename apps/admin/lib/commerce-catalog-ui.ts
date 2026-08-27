import type { PackageCardProduct, PackTone } from "@ega/ui";
import type { AdminCatalogCategory, AdminCatalogProduct } from "./commerce-client";

export type CommerceTabKey = "categories" | "products" | "orders";

export type CommerceAccessSource = {
  roleKeys?: string[] | null;
  permissionKeys?: string[] | null;
};

export type CategoryTreeNode = {
  category: AdminCatalogCategory;
  subcategories: AdminCatalogCategory[];
  directProductCount: number;
  childProductCount: number;
  totalProductCount: number;
};

export type ReadinessItem = {
  key:
    | "category"
    | "subcategory"
    | "price"
    | "defaultVariant"
    | "cardText"
    | "media"
    | "provider"
    | "publish";
  label: string;
  ready: boolean;
  message: string;
};

const tabOrder: CommerceTabKey[] = ["categories", "products", "orders"];
const validTones = new Set(["blue", "teal", "amber"]);

export function canManageGlobalCatalog(source: CommerceAccessSource | null | undefined) {
  return Boolean(source?.roleKeys?.includes("super-admin"));
}

export function canReadCommerceOrders(source: CommerceAccessSource | null | undefined) {
  return canManageGlobalCatalog(source) || Boolean(source?.permissionKeys?.includes("orders.read"));
}

export function getAvailableCommerceTabs(source: CommerceAccessSource | null | undefined) {
  return tabOrder.filter((tab) => {
    if (tab === "orders") {
      return canReadCommerceOrders(source);
    }

    return canManageGlobalCatalog(source);
  });
}

export function getDefaultCommerceTab(source: CommerceAccessSource | null | undefined): CommerceTabKey | null {
  return getAvailableCommerceTabs(source)[0] ?? null;
}

export function shouldClearStaffSessionForCommerceError(error: { status?: number } | null | undefined) {
  return error?.status === 401;
}

export function buildCategoryTree(
  categories: readonly AdminCatalogCategory[],
  products: readonly AdminCatalogProduct[]
) {
  const roots = categories
    .filter((category) => !category.parentSlug)
    .slice()
    .sort(compareCatalogEntries);

  return roots.map((root) => {
    const subcategories = categories
      .filter((category) => category.parentSlug === root.slug)
      .slice()
      .sort(compareCatalogEntries);
    const childSlugs = new Set(subcategories.map((category) => category.slug));
    const directProductCount = products.filter((product) => product.categorySlug === root.slug).length;
    const childProductCount = products.filter(
      (product) => product.categorySlug !== undefined && product.categorySlug !== null && childSlugs.has(product.categorySlug)
    ).length;

    return {
      category: root,
      subcategories,
      directProductCount,
      childProductCount,
      totalProductCount: directProductCount + childProductCount
    } satisfies CategoryTreeNode;
  });
}

export function getRootCategories(categories: readonly AdminCatalogCategory[]) {
  return categories.filter((category) => !category.parentSlug).slice().sort(compareCatalogEntries);
}

export function getSubcategoriesForRoot(
  categories: readonly AdminCatalogCategory[],
  rootSlug: string | null | undefined,
  includeInactive = false
) {
  return categories
    .filter((category) => category.parentSlug === rootSlug && (includeInactive || category.isActive !== false))
    .slice()
    .sort(compareCatalogEntries);
}

export function getCategoryBySlug(
  categories: readonly AdminCatalogCategory[],
  slug: string | null | undefined
) {
  return categories.find((category) => category.slug === slug) ?? null;
}

export function getRootForCategory(
  categories: readonly AdminCatalogCategory[],
  categorySlug: string | null | undefined
) {
  const category = getCategoryBySlug(categories, categorySlug);

  if (!category) {
    return null;
  }

  return category.parentSlug ? getCategoryBySlug(categories, category.parentSlug) : category;
}

export function getProductCategoryPath(
  product: AdminCatalogProduct,
  categories: readonly AdminCatalogCategory[]
) {
  const category = getCategoryBySlug(categories, product.categorySlug);

  if (!category) {
    return {
      root: null,
      subcategory: null,
      label: "Alt kategori ataması eksik",
      hasMissingSubcategory: true
    };
  }

  if (!category.parentSlug) {
    return {
      root: category,
      subcategory: null,
      label: `${category.name} → Alt kategori ataması eksik`,
      hasMissingSubcategory: true
    };
  }

  const root = getCategoryBySlug(categories, category.parentSlug);

  return {
    root,
    subcategory: category,
    label: `${root?.name ?? category.parentSlug} → ${category.name}`,
    hasMissingSubcategory: false
  };
}

export function getCanonicalCategoryHref(category: AdminCatalogCategory) {
  if (!category.slug) {
    return "";
  }

  if (!category.parentSlug) {
    return `/paketlerimiz?kategori=${encodeURIComponent(category.slug)}`;
  }

  return `/paketlerimiz?kategori=${encodeURIComponent(category.parentSlug)}&alt=${encodeURIComponent(
    getPublicSubcategoryFilterId(category)
  )}`;
}

export function getPublicSubcategoryFilterId(category: AdminCatalogCategory) {
  const existing = extractQueryParam(category.ctaHref, "alt");

  if (existing) {
    return existing;
  }

  return category.parentSlug && category.slug.startsWith(`${category.parentSlug}--`)
    ? category.slug.slice(category.parentSlug.length + 2)
    : category.slug;
}

export function normalizeCategoryForSave(category: AdminCatalogCategory) {
  const nextCategory = {
    ...category,
    slug: category.slug.trim(),
    name: category.name.trim(),
    parentSlug: category.parentSlug || null,
    description: category.description?.trim() || null,
    seoTitle: category.seoTitle?.trim() || null,
    seoDescription: category.seoDescription?.trim() || null,
    ctaHref: category.ctaHref?.trim() || null
  };

  return {
    ...nextCategory,
    ctaHref: nextCategory.ctaHref || getCanonicalCategoryHref(nextCategory)
  };
}

export function normalizeProductForSave(product: AdminCatalogProduct, publishStatus?: string) {
  return {
    ...product,
    publishStatus: publishStatus ?? product.publishStatus ?? "DRAFT",
    slug: product.slug.trim(),
    name: product.name.trim(),
    categorySlug: product.categorySlug || null,
    shortDescription: product.shortDescription?.trim() || null,
    description: product.description?.trim() || null,
    seoTitle: product.seoTitle?.trim() || null,
    seoDescription: product.seoDescription?.trim() || null,
    coverImageUrl: product.coverImageUrl?.trim() || null,
    introVideoSourceType: product.introVideoUrl?.trim()
      ? (product.introVideoSourceType ?? "EMBED")
      : null,
    introVideoUrl: product.introVideoUrl?.trim() || null,
    introVideoPosterUrl: product.introVideoPosterUrl?.trim() || null,
    introVideoTitle: product.introVideoTitle?.trim() || null,
    variants: product.variants.map((variant, index) => ({
      ...variant,
      title: variant.title.trim(),
      sku: variant.sku.trim(),
      billingLabel: variant.billingLabel?.trim() || null,
      compareAtPrice: variant.compareAtPrice?.trim() || null,
      externalProductId: variant.externalProductId?.trim() || null,
      externalVariantId: variant.externalVariantId?.trim() || null,
      isDefault: variant.isDefault ?? index === 0
    })),
    features: product.features
      .map((feature) => ({
        ...feature,
        title: feature.title.trim(),
        description: feature.description?.trim() || null,
        iconKey: feature.iconKey?.trim() || null
      }))
      .filter((feature) => feature.title.length > 0)
  };
}

export function buildPackageCardPreviewProduct(product: AdminCatalogProduct): PackageCardProduct {
  const defaultVariant =
    product.variants.find((variant) => variant.isActive !== false && variant.isDefault) ??
    product.variants.find((variant) => variant.isActive !== false) ??
    product.variants[0];
  const price = defaultVariant?.billingLabel?.trim()
    ? defaultVariant.billingLabel.trim()
    : `${defaultVariant?.price || "0.00"} ${defaultVariant?.currency || "TRY"}`;
  const compareAtPrice = defaultVariant?.compareAtPrice?.trim()
    ? `${defaultVariant.compareAtPrice.trim()} ${defaultVariant.currency || "TRY"}`
    : null;
  const installmentLabel = defaultVariant?.hasInstallments
    ? `${defaultVariant.installmentCount || 12} Aya Varan Taksit`
    : null;
  const featureDetails = product.features
    .filter((feature) => feature.title.trim())
    .map((feature) => ({
      title: feature.title.trim(),
      description: feature.description?.trim() || undefined,
      iconKey: feature.iconKey?.trim() || null
    }));

  return {
    id: product.id ?? product.slug ?? "admin-preview-product",
    slug: product.slug || "admin-preview",
    title: product.name || "Paket adı",
    subtitle: product.shortDescription || "Kısa açıklama",
    price,
    compareAtPrice,
    hasInstallments: defaultVariant?.hasInstallments ?? false,
    installmentLabel,
    badge: product.provider === "UNIKAZAN" ? "Koçluk paketi" : "Video paketi",
    features: featureDetails.map((feature) => feature.title),
    featureDetails,
    tone: normalizeTone(product.accentColor),
    introVideoSourceType: product.introVideoSourceType ?? null,
    introVideoUrl: product.introVideoUrl ?? null,
    introVideoPosterUrl: product.introVideoPosterUrl ?? null,
    introVideoTitle: product.introVideoTitle ?? null
  };
}

export function getPublishReadiness(
  product: AdminCatalogProduct,
  categories: readonly AdminCatalogCategory[]
) {
  const categoryPath = getProductCategoryPath(product, categories);
  const activeVariants = product.variants.filter((variant) => variant.isActive !== false);
  const defaultVariants = activeVariants.filter((variant) => variant.isDefault);
  const defaultVariant = defaultVariants[0];
  const priceReady = Boolean(defaultVariant && Number.parseFloat(defaultVariant.price) > 0);
  const providerReady =
    product.provider === "UNIKAZAN"
      ? activeVariants.length > 0 && activeVariants.every((variant) => Boolean(variant.externalProductId?.trim()))
      : Boolean(defaultVariant?.sku?.trim());
  const mediaReady =
    !product.introVideoUrl?.trim() ||
    Boolean(product.introVideoSourceType && isValidHttpUrl(product.introVideoUrl));

  return [
    {
      key: "category",
      label: "Kategori hazır",
      ready: Boolean(categoryPath.root?.isActive !== false && categoryPath.root),
      message: categoryPath.root ? categoryPath.root.name : "Ana kategori seçilmedi."
    },
    {
      key: "subcategory",
      label: "Alt kategori hazır",
      ready: Boolean(categoryPath.subcategory?.isActive !== false && categoryPath.subcategory),
      message: categoryPath.subcategory ? categoryPath.subcategory.name : "Alt kategori ataması eksik."
    },
    {
      key: "price",
      label: "Fiyat hazır",
      ready: priceReady,
      message: priceReady ? "Varsayılan fiyat geçerli." : "Varsayılan fiyat girilmelidir."
    },
    {
      key: "defaultVariant",
      label: "Varsayılan seçenek hazır",
      ready: defaultVariants.length === 1,
      message:
        defaultVariants.length === 1
          ? defaultVariant?.title || "Varsayılan seçenek seçildi."
          : "Tek bir aktif varsayılan seçenek seçilmelidir."
    },
    {
      key: "cardText",
      label: "Kart metni hazır",
      ready: Boolean(product.name.trim() && product.shortDescription?.trim() && product.features.some((feature) => feature.title.trim())),
      message: "Başlık, kısa açıklama ve özellikler kontrol edilir."
    },
    {
      key: "media",
      label: "Medya hazır",
      ready: mediaReady,
      message: mediaReady ? "Medya alanları uyumlu." : "Video URL ve kaynak tipi uyumlu olmalıdır."
    },
    {
      key: "provider",
      label: "Sağlayıcı bağlantısı hazır",
      ready: providerReady,
      message:
        product.provider === "UNIKAZAN"
          ? "Unikazan dış paket eşleşmeleri kontrol edilir."
          : "Yerel varsayılan seçenek SKU değeri kontrol edilir."
    },
    {
      key: "publish",
      label: "Yayına hazır",
      ready:
        Boolean(product.name.trim()) &&
        Boolean(product.slug.trim()) &&
        Boolean(categoryPath.subcategory) &&
        priceReady &&
        defaultVariants.length === 1 &&
        providerReady &&
        mediaReady,
      message: "Yayınlama öncesi tüm zorunlu alanlar tamamlanmalıdır."
    }
  ] satisfies ReadinessItem[];
}

export function getCardContentWarnings(product: AdminCatalogProduct) {
  const warnings: string[] = [];

  if (product.name.length > 72) {
    warnings.push("Paket başlığı kart görünümü için uzun olabilir.");
  }

  if ((product.shortDescription?.length ?? 0) > 160) {
    warnings.push("Kısa açıklama kart yüksekliğini artırabilir.");
  }

  if (product.features.length > 8) {
    warnings.push("Çok sayıda özellik kartlar arasında yükseklik farkı oluşturabilir.");
  }

  if (product.features.some((feature) => feature.title.length > 96)) {
    warnings.push("Uzun özellik metni kart görünümünde satır sayısını artırabilir.");
  }

  return warnings;
}

function compareCatalogEntries(left: AdminCatalogCategory, right: AdminCatalogCategory) {
  return (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.name.localeCompare(right.name, "tr");
}

function normalizeTone(value?: string | null): PackTone {
  return validTones.has(value ?? "") ? (value as PackTone) : "blue";
}

function extractQueryParam(href: string | null | undefined, key: string) {
  if (!href) {
    return null;
  }

  const search = href.includes("?") ? href.slice(href.indexOf("?") + 1) : href;
  return new URLSearchParams(search).get(key);
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
