import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const prisma = new PrismaClient();

type ProductVideoSourceType = "DIRECT" | "EMBED";
type Currency = "TRY" | "USD" | "EUR";

type LicensedFeature = {
  title: string;
  description?: string | null;
  iconKey?: string | null;
};

type LicensedVariant = {
  title?: string;
  billingLabel?: string | null;
  price?: string | number;
  compareAtPrice?: string | number | null;
  currency?: Currency;
  isDefault?: boolean;
  hasInstallments?: boolean;
  installmentCount?: number | null;
};

type LicensedPackageContent = {
  slug?: string;
  externalProductId?: string;
  name?: string;
  shortDescription?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverImageUrl?: string | null;
  introVideoSourceType?: ProductVideoSourceType | null;
  introVideoUrl?: string | null;
  introVideoPosterUrl?: string | null;
  introVideoTitle?: string | null;
  features?: LicensedFeature[];
  variants?: LicensedVariant[];
  externalProvider?: {
    externalProductId?: string;
    externalVariantId?: string | null;
  };
};

type LicensedContentFile = {
  source?: string;
  products: LicensedPackageContent[];
};

const defaultContentPath = "packages/db/prisma/unikazan-package-content.local.json";

async function main() {
  const inputPath = getInputPath();

  if (!inputPath || process.argv.includes("--help")) {
    printUsage();
    return;
  }

  const file = await readLicensedContentFile(inputPath);

  if (!Array.isArray(file.products) || file.products.length === 0) {
    throw new Error("The licensed content file must contain a non-empty products array.");
  }

  let updatedCount = 0;
  const skippedProducts: string[] = [];

  for (const content of file.products) {
    const matchedProduct = await findProduct(content);
    const label = content.slug ?? content.externalProductId ?? "(missing matcher)";

    if (!matchedProduct) {
      skippedProducts.push(label);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const productData = buildProductUpdate(content);

      if (Object.keys(productData).length > 0) {
        await tx.product.update({
          where: { id: matchedProduct.id },
          data: productData
        });
      }

      if (content.features) {
        await tx.productFeature.deleteMany({
          where: { productId: matchedProduct.id }
        });

        if (content.features.length > 0) {
          await tx.productFeature.createMany({
            data: content.features.map((feature, index) => ({
              productId: matchedProduct.id,
              title: feature.title,
              description: feature.description ?? null,
              iconKey: feature.iconKey ?? null,
              sortOrder: (index + 1) * 10
            }))
          });
        }
      }

      if (content.variants) {
        for (let index = 0; index < content.variants.length; index += 1) {
          const variant = content.variants[index];
          const title = variant.title?.trim() || "Standart";
          const existingVariant = await tx.productVariant.findFirst({
            where: {
              productId: matchedProduct.id,
              title
            }
          });

          const variantData = buildVariantUpdate(variant, index);

          if (existingVariant) {
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: variantData
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: matchedProduct.id,
                title,
                sku: buildSku(matchedProduct.slug, title),
                price: "0.00",
                ...variantData
              }
            });
          }
        }
      }

      if (content.externalProvider?.externalProductId) {
        const defaultVariant = await tx.productVariant.findFirst({
          where: { productId: matchedProduct.id },
          orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }]
        });

        await tx.externalProviderProduct.upsert({
          where: {
            provider_externalProductId_externalVariantId: {
              provider: "UNIKAZAN",
              externalProductId: content.externalProvider.externalProductId,
              externalVariantId: content.externalProvider.externalVariantId ?? "standard"
            }
          },
          update: {
            productId: matchedProduct.id,
            variantId: defaultVariant?.id ?? null,
            isActive: true
          },
          create: {
            productId: matchedProduct.id,
            variantId: defaultVariant?.id ?? null,
            provider: "UNIKAZAN",
            externalProductId: content.externalProvider.externalProductId,
            externalVariantId: content.externalProvider.externalVariantId ?? "standard",
            isActive: true
          }
        });
      }
    });

    updatedCount += 1;
  }

  console.log(`Updated ${updatedCount} package record(s).`);

  if (skippedProducts.length > 0) {
    console.warn(`Skipped ${skippedProducts.length} unmatched package(s): ${skippedProducts.join(", ")}`);
  }
}

function getInputPath() {
  const explicitPathIndex = process.argv.findIndex((argument) => argument === "--file" || argument === "-f");

  if (explicitPathIndex >= 0) {
    return process.argv[explicitPathIndex + 1];
  }

  return process.argv.includes("--help") ? null : defaultContentPath;
}

async function readLicensedContentFile(inputPath: string) {
  const absolutePath = resolve(process.cwd(), inputPath);
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as LicensedContentFile;
}

async function findProduct(content: LicensedPackageContent) {
  if (content.slug) {
    const product = await prisma.product.findUnique({
      where: { slug: content.slug }
    });

    if (product) {
      return product;
    }
  }

  if (!content.externalProductId) {
    return null;
  }

  const externalLink = await prisma.externalProviderProduct.findFirst({
    where: {
      provider: "UNIKAZAN",
      externalProductId: content.externalProductId
    },
    include: {
      product: true
    }
  });

  return externalLink?.product ?? null;
}

function buildProductUpdate(content: LicensedPackageContent) {
  const data: Record<string, string | null> = {};

  assignIfDefined(data, "name", content.name);
  assignIfDefined(data, "shortDescription", content.shortDescription);
  assignIfDefined(data, "description", content.description);
  assignIfDefined(data, "seoTitle", content.seoTitle);
  assignIfDefined(data, "seoDescription", content.seoDescription);
  assignIfDefined(data, "coverImageUrl", content.coverImageUrl);
  assignIfDefined(data, "introVideoSourceType", content.introVideoSourceType);
  assignIfDefined(data, "introVideoUrl", content.introVideoUrl);
  assignIfDefined(data, "introVideoPosterUrl", content.introVideoPosterUrl);
  assignIfDefined(data, "introVideoTitle", content.introVideoTitle);

  return data;
}

function buildVariantUpdate(variant: LicensedVariant, index: number) {
  const data: Record<string, string | number | boolean | null> = {
    sortOrder: (index + 1) * 10
  };

  assignIfDefined(data, "title", variant.title);
  assignIfDefined(data, "billingLabel", variant.billingLabel);
  assignIfDefined(data, "price", normalizeMoney(variant.price));
  assignIfDefined(data, "compareAtPrice", normalizeMoney(variant.compareAtPrice));
  assignIfDefined(data, "currency", variant.currency);
  assignIfDefined(data, "isDefault", variant.isDefault);
  assignIfDefined(data, "hasInstallments", variant.hasInstallments);
  assignIfDefined(data, "installmentCount", variant.installmentCount);

  return data;
}

function assignIfDefined<T extends Record<string, unknown>>(
  target: T,
  key: string,
  value: unknown
) {
  if (value !== undefined) {
    target[key as keyof T] = value as T[keyof T];
  }
}

function normalizeMoney(value: string | number | null | undefined) {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === "number") {
    return value.toFixed(2);
  }

  const normalizedValue = value.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");

  if (!normalizedValue) {
    return "0.00";
  }

  const parsed = Number.parseFloat(normalizedValue);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function buildSku(slug: string, title: string) {
  return `${slug}-${title}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function printUsage() {
  console.log(`
Usage:
  npm --workspace @ega/db run import:licensed-packages
  npm --workspace @ega/db run import:licensed-packages -- --file path/to/licensed-content.json

Default input:
  ${defaultContentPath}

The input file must contain licensed product text/media content supplied by Unikazan or another rights holder.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
