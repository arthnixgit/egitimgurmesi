import type {
  PackageCategory,
  PackageProduct,
  PackTone
} from "./package-catalog";
import {
  packageCategories as fallbackCategories,
  packageProducts as fallbackProducts
} from "./package-catalog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

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
  badge: string;
  features: string[];
  tone: string;
  categoryId: string;
  subcategoryId: string;
  provider: "local" | "redirect";
  defaultVariantId?: string | null;
};

type PublicCommerceCatalogResponse = {
  categories: PublicCommerceCategoryResponse[];
  products: PublicCommerceProductResponse[];
};

async function requestJson<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
    badge: product.badge,
    features: product.features,
    tone: normalizeTone(product.tone),
    categoryId: product.categoryId as PackageProduct["categoryId"],
    subcategoryId: product.subcategoryId as PackageProduct["subcategoryId"],
    provider: product.provider,
    defaultVariantId: product.defaultVariantId ?? null
  };
}

export async function getPackageCatalogContent(): Promise<{
  categories: readonly PackageCategory[];
  products: readonly PackageProduct[];
}> {
  try {
    const payload = await requestJson<PublicCommerceCatalogResponse>("/public-commerce/catalog");

    return {
      categories: payload.categories.map(normalizeCategory),
      products: payload.products.map(normalizeProduct)
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
