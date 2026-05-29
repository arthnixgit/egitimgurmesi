import { PrismaClient } from "@prisma/client";
import {
  packageCategories,
  packageProducts,
  type PackageProduct
} from "../../../apps/web/lib/package-catalog";

const prisma = new PrismaClient();
const TARGET_CATEGORY_ID = "online-coaching";
const TARGET_SUBCATEGORY_ID = "yks";
const TARGET_CHILD_SLUG = `${TARGET_CATEGORY_ID}--${TARGET_SUBCATEGORY_ID}`;

function parseMoney(value: string) {
  const numericValue = value.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");

  if (!numericValue) {
    return "0.00";
  }

  const parsed = Number.parseFloat(numericValue);

  if (!Number.isFinite(parsed)) {
    return "0.00";
  }

  return parsed.toFixed(2);
}

function toSku(product: PackageProduct) {
  return product.id.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
}

async function ensureYksCategory() {
  const topBlueprint = packageCategories.find((category) => category.id === TARGET_CATEGORY_ID);
  const childBlueprint = topBlueprint?.subcategories.find(
    (subcategory) => subcategory.id === TARGET_SUBCATEGORY_ID
  );

  if (!topBlueprint || !childBlueprint) {
    throw new Error("YKS category blueprint was not found in package catalog.");
  }

  const topCategory = await prisma.productCategory.upsert({
    where: { slug: topBlueprint.id },
    create: {
      name: topBlueprint.label,
      slug: topBlueprint.id,
      description: topBlueprint.description,
      ctaHref: `/paketlerimiz?kategori=${topBlueprint.id}`,
      sortOrder: 10,
      isActive: true
    },
    update: {
      name: topBlueprint.label,
      description: topBlueprint.description,
      ctaHref: `/paketlerimiz?kategori=${topBlueprint.id}`,
      isActive: true
    }
  });

  return prisma.productCategory.upsert({
    where: { slug: TARGET_CHILD_SLUG },
    create: {
      parentCategoryId: topCategory.id,
      name: childBlueprint.label,
      slug: TARGET_CHILD_SLUG,
      description: childBlueprint.description,
      ctaHref: `/paketlerimiz?kategori=${topBlueprint.id}&alt=${childBlueprint.id}`,
      sortOrder: 10,
      isActive: true
    },
    update: {
      parentCategoryId: topCategory.id,
      name: childBlueprint.label,
      description: childBlueprint.description,
      ctaHref: `/paketlerimiz?kategori=${topBlueprint.id}&alt=${childBlueprint.id}`,
      isActive: true
    }
  });
}

async function syncProduct(product: PackageProduct, categoryId: string, sortOrder: number) {
  const featureDetails = product.featureDetails?.length
    ? product.featureDetails
    : product.features.map((title) => ({ title, description: "" }));

  const savedProduct = await prisma.product.upsert({
    where: { slug: product.slug },
    create: {
      categoryId,
      name: product.title,
      slug: product.slug,
      shortDescription: product.subtitle,
      description: product.description,
      type: "COACHING_PACKAGE",
      provider: "UNIKAZAN",
      publishStatus: "PUBLISHED",
      isFeatured: true,
      sortOrder,
      accentColor: product.tone,
      seoTitle: product.title,
      seoDescription: product.subtitle,
      introVideoSourceType: product.introVideoSourceType ?? null,
      introVideoUrl: product.introVideoUrl ?? null,
      introVideoPosterUrl: product.introVideoPosterUrl ?? null,
      introVideoTitle: product.introVideoTitle ?? null
    },
    update: {
      categoryId,
      name: product.title,
      shortDescription: product.subtitle,
      description: product.description,
      type: "COACHING_PACKAGE",
      provider: "UNIKAZAN",
      publishStatus: "PUBLISHED",
      isFeatured: true,
      sortOrder,
      accentColor: product.tone,
      seoTitle: product.title,
      seoDescription: product.subtitle,
      introVideoSourceType: product.introVideoSourceType ?? null,
      introVideoUrl: product.introVideoUrl ?? null,
      introVideoPosterUrl: product.introVideoPosterUrl ?? null,
      introVideoTitle: product.introVideoTitle ?? null
    }
  });

  await prisma.productFeature.deleteMany({
    where: { productId: savedProduct.id }
  });

  if (featureDetails.length) {
    await prisma.productFeature.createMany({
      data: featureDetails.map((feature, index) => ({
        productId: savedProduct.id,
        title: feature.title,
        description: feature.description ?? "",
        iconKey: feature.iconKey ?? null,
        sortOrder: (index + 1) * 10
      }))
    });
  }

  const variant = await prisma.productVariant.upsert({
    where: {
      productId_title: {
        productId: savedProduct.id,
        title: "Standart"
      }
    },
    create: {
      productId: savedProduct.id,
      title: "Standart",
      sku: toSku(product),
      billingLabel: product.price,
      price: parseMoney(product.price),
      compareAtPrice: product.compareAtPrice ? parseMoney(product.compareAtPrice) : null,
      currency: "TRY",
      isDefault: true,
      isActive: true,
      hasInstallments: product.hasInstallments ?? false,
      installmentCount: product.hasInstallments ? 12 : null,
      sortOrder: 10
    },
    update: {
      billingLabel: product.price,
      price: parseMoney(product.price),
      compareAtPrice: product.compareAtPrice ? parseMoney(product.compareAtPrice) : null,
      currency: "TRY",
      isDefault: true,
      isActive: true,
      hasInstallments: product.hasInstallments ?? false,
      installmentCount: product.hasInstallments ? 12 : null,
      sortOrder: 10
    }
  });

  await prisma.externalProviderProduct.upsert({
    where: {
      provider_externalProductId_externalVariantId: {
        provider: "UNIKAZAN",
        externalProductId: product.externalProductId ?? product.id,
        externalVariantId: product.externalVariantId ?? "standard"
      }
    },
    create: {
      productId: savedProduct.id,
      variantId: variant.id,
      provider: "UNIKAZAN",
      externalProductId: product.externalProductId ?? product.id,
      externalVariantId: product.externalVariantId ?? "standard",
      isActive: true
    },
    update: {
      productId: savedProduct.id,
      variantId: variant.id,
      isActive: true
    }
  });

  return savedProduct;
}

async function main() {
  const category = await ensureYksCategory();
  const targetProducts = packageProducts.filter(
    (product) =>
      product.categoryId === TARGET_CATEGORY_ID && product.subcategoryId === TARGET_SUBCATEGORY_ID
  );

  if (targetProducts.length === 0) {
    throw new Error("No YKS products were found in the package catalog.");
  }

  await prisma.product.updateMany({
    where: {
      categoryId: category.id,
      provider: "UNIKAZAN",
      slug: {
        notIn: targetProducts.map((product) => product.slug)
      }
    },
    data: {
      publishStatus: "ARCHIVED"
    }
  });

  for (let index = 0; index < targetProducts.length; index += 1) {
    await syncProduct(targetProducts[index], category.id, (index + 1) * 10);
  }

  console.log(`Synced ${targetProducts.length} Unikazan YKS package(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
