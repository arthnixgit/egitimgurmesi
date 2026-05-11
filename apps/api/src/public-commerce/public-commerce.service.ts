import { ContentStatus, Prisma } from "@ega/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const publicCategoryInclude = {
  childCategories: {
    where: {
      isActive: true
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.ProductCategoryInclude;

const publicProductInclude = {
  category: {
    include: {
      parentCategory: true
    }
  },
  variants: {
    where: {
      isActive: true
    },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  },
  features: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.ProductInclude;

@Injectable()
export class PublicCommerceService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog() {
    const [categories, products] = await Promise.all([
      this.prisma.productCategory.findMany({
        where: {
          parentCategoryId: null,
          isActive: true
        },
        include: publicCategoryInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }),
      this.prisma.product.findMany({
        where: {
          publishStatus: ContentStatus.PUBLISHED
        },
        include: publicProductInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      })
    ]);

    return {
      categories: categories.map((category) => ({
        id: category.slug,
        label: category.name,
        description: category.description,
        subcategories: category.childCategories.map((subcategory) => ({
          id: extractSubcategoryFilterId(subcategory) ?? subcategory.slug,
          label: subcategory.name,
          description: subcategory.description
        }))
      })),
      products: products.map(normalizePublicProduct)
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: publicProductInclude
    });

    if (!product || product.publishStatus !== ContentStatus.PUBLISHED) {
      throw new NotFoundException("Product not found.");
    }

    return normalizePublicProduct(product);
  }
}

function normalizePublicProduct(
  product: Prisma.ProductGetPayload<{ include: typeof publicProductInclude }>
) {
  const defaultVariant = product.variants[0] ?? null;
  const rootCategory = product.category?.parentCategory ?? product.category;
  const subcategory = product.category?.parentCategory ? product.category : null;

  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    subtitle: product.shortDescription ?? product.description ?? "",
    price:
      defaultVariant?.billingLabel ??
      `${defaultVariant?.price.toFixed(2) ?? "0.00"} ${defaultVariant?.currency ?? "TRY"}`,
    badge: mapProductBadge(product.type, product.provider),
    features: product.features.map((feature) => feature.title),
    tone: normalizeTone(product.accentColor),
    categoryId: rootCategory?.slug ?? product.category?.slug ?? "",
    subcategoryId: subcategory ? extractSubcategoryFilterId(subcategory) ?? subcategory.slug : "",
    provider: product.provider === "UNIKAZAN" ? "redirect" : "local",
    defaultVariantId: defaultVariant?.id ?? null
  };
}

function normalizeTone(value: string | null) {
  if (value === "amber" || value === "teal" || value === "blue") {
    return value;
  }

  return "blue";
}

function mapProductBadge(type: string, provider: string) {
  if (provider === "UNIKAZAN") {
    return "Koçluk paketi";
  }

  if (type === "DIGITAL_RESOURCE") {
    return "Dijital kaynak";
  }

  if (type === "HYBRID_PACKAGE") {
    return "Hibrit paket";
  }

  return "Video paketi";
}

function extractSubcategoryFilterId(category: {
  ctaHref: string | null;
  slug: string;
}) {
  if (!category.ctaHref) {
    return null;
  }

  const search = category.ctaHref.includes("?")
    ? category.ctaHref.slice(category.ctaHref.indexOf("?") + 1)
    : "";
  const params = new URLSearchParams(search);

  return params.get("alt");
}
