import { PrismaClient } from "@prisma/client";
import type {
  PackageCategory,
  PackageFeatureSpec,
  PackageProduct
} from "../../../apps/web/lib/package-catalog";
import type { AcademicStaffGroup } from "../../../apps/web/lib/academic-staff";

const prisma = new PrismaClient();
const PUBLISHED = "PUBLISHED" as const;

type PackageCatalogModule = {
  packageCategories: readonly PackageCategory[];
  packageProducts: readonly PackageProduct[];
};

type AcademicStaffModule = {
  academicStaffGroups: readonly AcademicStaffGroup[];
};

async function loadWebCatalog(): Promise<PackageCatalogModule> {
  const mod = await import("../../../apps/web/lib/package-catalog");
  const source = ("packageCategories" in mod ? mod : mod.default) as PackageCatalogModule;

  if (!source.packageCategories?.length || !source.packageProducts?.length) {
    throw new Error("Public package catalog source is empty.");
  }

  return source;
}

async function loadAcademicStaff(): Promise<AcademicStaffModule> {
  const mod = await import("../../../apps/web/lib/academic-staff");
  const source = ("academicStaffGroups" in mod ? mod : mod.default) as AcademicStaffModule;

  if (!source.academicStaffGroups?.length) {
    throw new Error("Academic staff source is empty.");
  }

  return source;
}

function parseMoney(value: string) {
  const numericValue = value.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");

  if (!numericValue) {
    return "0.00";
  }

  const parsed = Number.parseFloat(numericValue);

  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function toSku(product: PackageProduct) {
  return product.id.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
}

function mapProductType(product: PackageProduct) {
  return product.provider === "redirect" ? "COACHING_PACKAGE" : "VIDEO_PACKAGE";
}

function mapProvider(product: PackageProduct) {
  return product.provider === "redirect" ? "UNIKAZAN" : "LOCAL";
}

function toStaffSlug(id: string) {
  return id.replace(/^(coach|teacher)-/, "");
}

function getFeatureDetails(product: PackageProduct): PackageFeatureSpec[] {
  if (product.featureDetails?.length) {
    return product.featureDetails.map((feature) => ({
      title: feature.title,
      description: feature.description ?? "",
      iconKey: feature.iconKey ?? null
    }));
  }

  return product.features.map((title) => ({
    title,
    description: "",
    iconKey: null
  }));
}

async function upsertPublicCategories(categories: readonly PackageCategory[]) {
  const childCategoryIdByComposite = new Map<string, string>();

  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
    const category = categories[categoryIndex];
    const topCategory = await prisma.productCategory.upsert({
      where: { slug: category.id },
      create: {
        organizationId: null,
        branchId: null,
        parentCategoryId: null,
        name: category.label,
        slug: category.id,
        description: category.description,
        ctaHref: `/paketlerimiz?kategori=${category.id}`,
        sortOrder: (categoryIndex + 1) * 10,
        isActive: true
      },
      update: {
        organizationId: null,
        branchId: null,
        parentCategoryId: null,
        name: category.label,
        description: category.description,
        ctaHref: `/paketlerimiz?kategori=${category.id}`,
        sortOrder: (categoryIndex + 1) * 10,
        isActive: true
      }
    });

    for (let subcategoryIndex = 0; subcategoryIndex < category.subcategories.length; subcategoryIndex += 1) {
      const subcategory = category.subcategories[subcategoryIndex];
      const childCategory = await prisma.productCategory.upsert({
        where: { slug: `${category.id}--${subcategory.id}` },
        create: {
          organizationId: null,
          branchId: null,
          parentCategoryId: topCategory.id,
          name: subcategory.label,
          slug: `${category.id}--${subcategory.id}`,
          description: subcategory.description,
          ctaHref: `/paketlerimiz?kategori=${category.id}&alt=${subcategory.id}`,
          sortOrder: (subcategoryIndex + 1) * 10,
          isActive: true
        },
        update: {
          organizationId: null,
          branchId: null,
          parentCategoryId: topCategory.id,
          name: subcategory.label,
          description: subcategory.description,
          ctaHref: `/paketlerimiz?kategori=${category.id}&alt=${subcategory.id}`,
          sortOrder: (subcategoryIndex + 1) * 10,
          isActive: true
        }
      });

      childCategoryIdByComposite.set(`${category.id}:${subcategory.id}`, childCategory.id);
    }
  }

  return childCategoryIdByComposite;
}

async function upsertPublicProduct(
  product: PackageProduct,
  categoryId: string,
  sortOrder: number
) {
  const featureDetails = getFeatureDetails(product);
  const savedProduct = await prisma.product.upsert({
    where: { slug: product.slug },
    create: {
      organizationId: null,
      branchId: null,
      categoryId,
      name: product.title,
      slug: product.slug,
      shortDescription: product.subtitle,
      description:
        product.description ??
        [product.subtitle, "", ...featureDetails.map((feature) => `- ${feature.title}`)].join("\n"),
      type: mapProductType(product),
      provider: mapProvider(product),
      publishStatus: PUBLISHED,
      isFeatured: sortOrder <= 60,
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
      organizationId: null,
      branchId: null,
      categoryId,
      name: product.title,
      shortDescription: product.subtitle,
      description:
        product.description ??
        [product.subtitle, "", ...featureDetails.map((feature) => `- ${feature.title}`)].join("\n"),
      type: mapProductType(product),
      provider: mapProvider(product),
      publishStatus: PUBLISHED,
      isFeatured: sortOrder <= 60,
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

  if (featureDetails.length > 0) {
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

  if (product.provider === "redirect") {
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
  }
}

async function upsertPublicCatalog() {
  const { packageCategories, packageProducts } = await loadWebCatalog();
  const childCategoryIdByComposite = await upsertPublicCategories(packageCategories);

  for (let index = 0; index < packageProducts.length; index += 1) {
    const product = packageProducts[index];
    const categoryId = childCategoryIdByComposite.get(`${product.categoryId}:${product.subcategoryId}`);

    if (!categoryId) {
      throw new Error(`Public category mapping missing for product "${product.slug}".`);
    }

    await upsertPublicProduct(product, categoryId, (index + 1) * 10);
  }

  return packageProducts.length;
}

async function upsertPublicStaff() {
  const { academicStaffGroups } = await loadAcademicStaff();
  let profileCount = 0;

  for (let groupIndex = 0; groupIndex < academicStaffGroups.length; groupIndex += 1) {
    const group = academicStaffGroups[groupIndex];
    const savedGroup = await prisma.staffProfileGroup.upsert({
      where: { key: group.id },
      create: {
        key: group.id,
        label: group.label,
        eyebrow: group.eyebrow,
        description: group.description,
        introVideoSourceType: group.introVideoSourceType ?? null,
        introVideoUrl: group.introVideoUrl ?? null,
        introVideoPosterUrl: group.introVideoPosterUrl ?? null,
        introVideoTitle: group.introVideoTitle ?? null,
        sortOrder: (groupIndex + 1) * 10,
        publishStatus: PUBLISHED
      },
      update: {
        label: group.label,
        eyebrow: group.eyebrow,
        description: group.description,
        introVideoSourceType: group.introVideoSourceType ?? null,
        introVideoUrl: group.introVideoUrl ?? null,
        introVideoPosterUrl: group.introVideoPosterUrl ?? null,
        introVideoTitle: group.introVideoTitle ?? null,
        sortOrder: (groupIndex + 1) * 10,
        publishStatus: PUBLISHED
      }
    });

    for (let memberIndex = 0; memberIndex < group.members.length; memberIndex += 1) {
      const member = group.members[memberIndex];
      const slug = toStaffSlug(member.id);
      const savedProfile = await prisma.staffProfile.upsert({
        where: { slug },
        create: {
          groupId: savedGroup.id,
          slug,
          fullName: member.name,
          title: member.title,
          city: member.city ?? null,
          photoUrl: member.photoSrc ?? null,
          sortOrder: (memberIndex + 1) * 10,
          publishStatus: PUBLISHED
        },
        update: {
          groupId: savedGroup.id,
          fullName: member.name,
          title: member.title,
          city: member.city ?? null,
          photoUrl: member.photoSrc ?? null,
          sortOrder: (memberIndex + 1) * 10,
          publishStatus: PUBLISHED
        }
      });

      if (member.id !== slug) {
        await prisma.staffProfile.updateMany({
          where: {
            slug: member.id,
            id: {
              not: savedProfile.id
            }
          },
          data: {
            publishStatus: "ARCHIVED"
          }
        });
      }

      profileCount += 1;
    }
  }

  return {
    groupCount: academicStaffGroups.length,
    profileCount
  };
}

async function main() {
  const productCount = await upsertPublicCatalog();
  const staffCounts = await upsertPublicStaff();

  console.log(
    `Public website seed complete: ${productCount} products, ${staffCounts.groupCount} staff groups, ${staffCounts.profileCount} staff profiles.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
