import type {
  PackageCategory,
  PackageFeatureSpec,
  PackageProduct,
  PackTone
} from "./package-catalog";
import { resolveApiBaseUrl } from "./api-base-url";
import {
  packageCategories as fallbackCategories,
  packageProducts as fallbackProducts
} from "./package-catalog";

type PublicCommerceCategoryResponse = {
  id: string;
  label: string;
  description?: string | null;
  subcategories: Array<{
    id: string;
    label: string;
    description?: string | null;
  }>;
};

type PublicCommerceProductResponse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: string;
  compareAtPrice?: string | null;
  hasInstallments?: boolean;
  installmentLabel?: string | null;
  badge: string;
  features: string[];
  featureDetails?: Array<{
    title: string;
    description?: string | null;
    iconKey?: string | null;
  }>;
  tone: string;
  categoryId: string;
  subcategoryId: string;
  provider: "local" | "redirect";
  defaultVariantId?: string | null;
  introVideoSourceType?: "DIRECT" | "EMBED" | null;
  introVideoUrl?: string | null;
  introVideoPosterUrl?: string | null;
  introVideoTitle?: string | null;
};

type PublicCommerceCatalogResponse = {
  categories: PublicCommerceCategoryResponse[];
  products: PublicCommerceProductResponse[];
};

async function requestJson<T>(path: string) {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Public commerce request failed for "${path}" with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function normalizeTone(tone: string): PackTone {
  if (tone === "amber" || tone === "teal" || tone === "blue") {
    return tone;
  }

  return "blue";
}

function normalizeCategory(category: PublicCommerceCategoryResponse): PackageCategory {
  return {
    id: category.id as PackageCategory["id"],
    label: category.label,
    description: category.description ?? "",
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id as PackageCategory["subcategories"][number]["id"],
      label: subcategory.label,
      description: subcategory.description ?? ""
    }))
  };
}

function normalizeProduct(product: PublicCommerceProductResponse): PackageProduct {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    hasInstallments: product.hasInstallments ?? false,
    installmentLabel: product.installmentLabel ?? null,
    badge: product.badge,
    features: product.features,
    featureDetails: product.featureDetails?.map(
      (feature) =>
        ({
          title: feature.title,
          description: feature.description ?? undefined,
          iconKey: feature.iconKey ?? null
        }) satisfies PackageFeatureSpec
    ),
    tone: normalizeTone(product.tone),
    categoryId: product.categoryId as PackageProduct["categoryId"],
    subcategoryId: product.subcategoryId as PackageProduct["subcategoryId"],
    provider: product.provider,
    defaultVariantId: product.defaultVariantId ?? null,
    introVideoSourceType: product.introVideoSourceType ?? null,
    introVideoUrl: product.introVideoUrl ?? null,
    introVideoPosterUrl: product.introVideoPosterUrl ?? null,
    introVideoTitle: product.introVideoTitle ?? null
  };
}

export async function getPackageCatalogContent(): Promise<{
  categories: readonly PackageCategory[];
  products: readonly PackageProduct[];
}> {
  try {
    const payload = await requestJson<PublicCommerceCatalogResponse>("/public-commerce/catalog");
    const categories = payload.categories.map(normalizeCategory);
    const products = payload.products.map(normalizeProduct);

    return {
      categories: categories.length > 0 ? categories : fallbackCategories,
      products: products.length > 0 ? products : fallbackProducts
    };
  } catch {
    return {
      categories: fallbackCategories,
      products: fallbackProducts
    };
  }
}

export async function getPackageProductBySlug(slug: string) {
  try {
    const payload = await requestJson<PublicCommerceProductResponse>(
      `/public-commerce/products/${encodeURIComponent(slug)}`
    );

    return normalizeProduct(payload);
  } catch {
    return fallbackProducts.find((product) => product.slug === slug) ?? null;
  }
}
