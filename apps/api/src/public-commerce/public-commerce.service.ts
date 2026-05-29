import { ContentStatus, ExternalProvider, Prisma } from "@ega/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { appEnv } from "../config/env";
import { PrismaService } from "../database/prisma.service";

const publicCategoryInclude = {
  childCategories: {
    where: {
      isActive: true,
      organizationId: null,
      branchId: null
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
  },
  externalProviderLinks: {
    where: {
      provider: ExternalProvider.UNIKAZAN,
      isActive: true
    }
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
          isActive: true,
          organizationId: null,
          branchId: null
        },
        include: publicCategoryInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }),
      this.prisma.product.findMany({
        where: {
          publishStatus: ContentStatus.PUBLISHED,
          organizationId: null,
          branchId: null
        },
        include: publicProductInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      })
    ]);

    const normalizedProducts = products.map(normalizePublicProduct);

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
      products: await applyUnikazanMediaOverrides(normalizedProducts, products)
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: publicProductInclude
    });

    if (
      !product ||
      product.publishStatus !== ContentStatus.PUBLISHED ||
      product.organizationId ||
      product.branchId
    ) {
      throw new NotFoundException("Product not found.");
    }

    const [normalizedProduct] = await applyUnikazanMediaOverrides(
      [normalizePublicProduct(product)],
      [product]
    );

    return normalizedProduct;
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
    compareAtPrice: defaultVariant?.compareAtPrice
      ? `${formatMoney(defaultVariant.compareAtPrice)} ${defaultVariant.currency}`
      : null,
    hasInstallments: defaultVariant?.hasInstallments ?? false,
    installmentLabel: defaultVariant?.hasInstallments
      ? `${defaultVariant.installmentCount ?? 12} Aya Varan Taksit`
      : null,
    badge: mapProductBadge(product.type, product.provider),
    features: product.features.map((feature) => feature.title),
    featureDetails: product.features.map((feature) => ({
      title: feature.title,
      description: feature.description,
      iconKey: feature.iconKey
    })),
    tone: normalizeTone(product.accentColor),
    categoryId: rootCategory?.slug ?? product.category?.slug ?? "",
    subcategoryId: subcategory ? extractSubcategoryFilterId(subcategory) ?? subcategory.slug : "",
    provider: product.provider === "UNIKAZAN" ? "redirect" : "local",
    defaultVariantId: defaultVariant?.id ?? null,
    introVideoSourceType: product.introVideoSourceType,
    introVideoUrl: product.introVideoUrl,
    introVideoPosterUrl: product.introVideoPosterUrl,
    introVideoTitle: product.introVideoTitle
  };
}

type PublicProductPayload = ReturnType<typeof normalizePublicProduct>;

type UnikazanPackageDetail = {
  id: number;
  video_url?: string | null;
  video_image?: string | null;
};

type UnikazanPackageDetailResponse = {
  success?: boolean;
  data?: UnikazanPackageDetail | null;
};

async function applyUnikazanMediaOverrides(
  products: PublicProductPayload[],
  sourceProducts: Prisma.ProductGetPayload<{ include: typeof publicProductInclude }>[]
) {
  const numericExternalIds = sourceProducts
    .map((product) => product.externalProviderLinks[0]?.externalProductId)
    .filter((externalProductId): externalProductId is string =>
      Boolean(externalProductId && /^\d+$/.test(externalProductId))
    );

  if (numericExternalIds.length === 0) {
    return products;
  }

  const mediaByExternalId = await fetchUnikazanMediaByPackageId(
    Array.from(new Set(numericExternalIds))
  );

  if (mediaByExternalId.size === 0) {
    return products;
  }

  return products.map((product, index) => {
    const externalProductId =
      sourceProducts[index]?.externalProviderLinks[0]?.externalProductId ?? "";
    const media = mediaByExternalId.get(externalProductId);

    if (!media) {
      return product;
    }

    return {
      ...product,
      introVideoSourceType: media.video_url ? "DIRECT" : product.introVideoSourceType,
      introVideoUrl: media.video_url ?? product.introVideoUrl,
      introVideoPosterUrl: media.video_image ?? product.introVideoPosterUrl
    } satisfies PublicProductPayload;
  });
}

async function fetchUnikazanMediaByPackageId(packageIds: string[]) {
  const configs = getUnikazanPublicConfigs();
  const mediaByExternalId = new Map<string, UnikazanPackageDetail>();

  if (configs.length === 0) {
    return mediaByExternalId;
  }

  await Promise.all(
    packageIds.map(async (packageId) => {
      for (const config of configs) {
        try {
          const response = await fetch(
            `${config.baseUrl}/subscription-packages/${encodeURIComponent(packageId)}`,
            {
              headers: {
                "x-api-key": config.apiKey,
                "Content-Type": "application/json"
              }
            }
          );

          if (!response.ok) {
            continue;
          }

          const payload = (await response.json()) as UnikazanPackageDetailResponse;

          if (payload.success && payload.data) {
            mediaByExternalId.set(packageId, payload.data);
            return;
          }
        } catch {
          // Try the next available public catalog credential.
        }
      }
    })
  );

  return mediaByExternalId;
}

function getUnikazanPublicConfigs() {
  const configs: Array<{ baseUrl: string; apiKey: string }> = [];
  const publicBaseUrl =
    process.env.UNIKAZAN_PUBLIC_CATALOG_BASE_URL?.trim().replace(/\/+$/, "") ||
    "https://api.kazanuni.com";
  const publicApiKey =
    process.env.UNIKAZAN_PUBLIC_CATALOG_API_KEY?.trim() ||
    "42Hs25KCsdmYuW4x20Bo81SsboY2dsVS";

  try {
    configs.push({
      baseUrl: appEnv.unikazanBaseUrl().replace(/\/+$/, ""),
      apiKey: appEnv.unikazanApiKey()
    });
  } catch {
    // Public catalog media can still use the public package API key below.
  }

  configs.push({
    baseUrl: publicBaseUrl,
    apiKey: publicApiKey
  });

  return configs.filter(
    (config, index, all) =>
      config.baseUrl &&
      config.apiKey &&
      all.findIndex(
        (candidate) =>
          candidate.baseUrl === config.baseUrl && candidate.apiKey === config.apiKey
      ) === index
  );
}

function formatMoney(value: Prisma.Decimal) {
  return Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
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
