import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AuthActorType,
  ContentStatus,
  Currency,
  ExternalProvider,
  PERMISSION_KEYS,
  ProductType
} from "@ega/db";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { AdminCommerceService } from "./admin-commerce.service";
import type { SaveCatalogDocumentDto, SaveProductCategoryDto, SaveProductDto } from "./dto/admin-commerce.dto";

const catalogForbiddenMessage = "Paket kataloğunu yalnızca Super Admin yönetebilir.";

describe("AdminCommerceService catalog authorization", () => {
  it("blocks every catalog editor method for branch admin even with legacy catalog permissions", async () => {
    const service = new AdminCommerceService({} as never);
    const calls: Array<() => Promise<unknown>> = [
      () => service.getCatalogDocument(branchAdminAuth),
      () => service.listCategories(branchAdminAuth),
      () => service.createCategory(categoryPayload(), branchAdminAuth),
      () => service.updateCategory("category_1", categoryPayload(), branchAdminAuth),
      () => service.deleteCategory("category_1", branchAdminAuth),
      () => service.listProducts(branchAdminAuth),
      () => service.getProduct("product_1", branchAdminAuth),
      () => service.createProduct(productPayload(), branchAdminAuth),
      () => service.updateProduct("product_1", productPayload(), branchAdminAuth),
      () => service.deleteProduct("product_1", branchAdminAuth),
      () => service.saveCatalogDocument({ categories: [], products: [] } as SaveCatalogDocumentDto, branchAdminAuth)
    ];

    for (const call of calls) {
      await assert.rejects(call, (error: unknown) => {
        assert.ok(error instanceof ForbiddenException);
        assert.equal(error.getStatus(), 403);
        assert.equal(error.message, catalogForbiddenMessage);
        return true;
      });
    }
  });
});

describe("AdminCommerceService category hierarchy validation", () => {
  it("rejects creating a subcategory below another subcategory", async () => {
    const service = new AdminCommerceService({
      productCategory: {
        findUnique: async () => ({
          id: "child_category",
          slug: "online-kocluk--yks",
          parentCategoryId: "root_category"
        })
      }
    } as never);

    await assertBadRequest(
      () =>
        service.createCategory(
          categoryPayload({
            parentSlug: "online-kocluk--yks"
          }),
          superAdminAuth
        ),
      "Bir alt kategori başka bir alt kategorinin altında oluşturulamaz."
    );
  });

  it("rejects self-parent category updates", async () => {
    const service = new AdminCommerceService({
      productCategory: {
        findUnique: async (args: { where: { id?: string; slug?: string } }) => {
          if (args.where.id) {
            return categoryRecord({ id: "category_1", slug: "online-kocluk" });
          }

          return {
            id: "category_1",
            slug: "online-kocluk",
            parentCategoryId: null
          };
        }
      }
    } as never);

    await assertBadRequest(
      () =>
        service.updateCategory(
          "category_1",
          categoryPayload({ slug: "online-kocluk", parentSlug: "online-kocluk" }),
          superAdminAuth
        ),
      "Kategori kendi altına bağlanamaz."
    );
  });

  it("rejects moving a root with children under another root", async () => {
    const service = new AdminCommerceService({
      productCategory: {
        findUnique: async (args: { where: { id?: string; slug?: string } }) => {
          if (args.where.id) {
            return categoryRecord({
              id: "online_root",
              slug: "online-kocluk",
              childCategories: [{ id: "online_yks" }]
            });
          }

          return {
            id: "face_root",
            slug: "yuz-yuze-kocluk",
            parentCategoryId: null
          };
        }
      }
    } as never);

    await assertBadRequest(
      () =>
        service.updateCategory(
          "online_root",
          categoryPayload({ slug: "online-kocluk", parentSlug: "yuz-yuze-kocluk" }),
          superAdminAuth
        ),
      "Alt kategorisi olan bir kategori başka bir kategoriye bağlanamaz."
    );
  });

  it("rejects deleting a root category with children", async () => {
    const service = new AdminCommerceService({
      productCategory: {
        findUnique: async () =>
          categoryRecord({
            id: "online_root",
            slug: "online-kocluk",
            childCategories: [{ id: "online_yks" }]
          })
      }
    } as never);

    await assertBadRequest(
      () => service.deleteCategory("online_root", superAdminAuth),
      "Bu kategoriye bağlı alt kategoriler bulunuyor."
    );
  });

  it("rejects deleting a subcategory with products", async () => {
    const service = new AdminCommerceService({
      productCategory: {
        findUnique: async () =>
          categoryRecord({
            id: "online_yks",
            slug: "online-kocluk--yks",
            parentCategoryId: "online_root",
            parentCategory: { id: "online_root", slug: "online-kocluk", name: "Online Koçluk", parentCategoryId: null },
            products: [{ id: "product_1" }]
          })
      }
    } as never);

    await assertBadRequest(
      () => service.deleteCategory("online_yks", superAdminAuth),
      "Bu alt kategoriye bağlı paketler bulunuyor."
    );
  });
});

describe("AdminCommerceService publish-readiness validation", () => {
  it("rejects publishing without a subcategory", async () => {
    const service = new AdminCommerceService({
      product: {
        findFirst: async () => null
      },
      productVariant: {
        findFirst: async () => null
      }
    } as never);

    await assertBadRequest(
      () =>
        service.createProduct(
          productPayload({
            categorySlug: undefined,
            publishStatus: ContentStatus.PUBLISHED
          }),
          superAdminAuth
        ),
      "Yayına almak için ana kategori ve alt kategori seçmelisiniz."
    );
  });

  it("rejects publishing a package assigned directly to a root category", async () => {
    const service = new AdminCommerceService({
      product: {
        findFirst: async () => null
      },
      productVariant: {
        findFirst: async () => null
      },
      productCategory: {
        findUnique: async () => ({
          id: "online_root",
          slug: "online-kocluk",
          parentCategoryId: null,
          parentCategory: null,
          isActive: true
        })
      }
    } as never);

    await assertBadRequest(
      () =>
        service.createProduct(
          productPayload({
            categorySlug: "online-kocluk",
            publishStatus: ContentStatus.PUBLISHED
          }),
          superAdminAuth
        ),
      "Yayına almak için ana kategori ve alt kategori seçmelisiniz."
    );
  });

  it("rejects duplicate card feature rows before saving", async () => {
    const service = new AdminCommerceService({} as never);

    await assertBadRequest(
      () =>
        service.createProduct(
          productPayload({
            features: [
              { title: "Haftalık takip", sortOrder: 10 },
              { title: "haftalık takip", sortOrder: 20 }
            ]
          }),
          superAdminAuth
        ),
      "Aynı kart özelliği birden fazla kez eklenemez."
    );
  });

  it("rejects multiple active default variants", async () => {
    const service = new AdminCommerceService({
      product: {
        findFirst: async () => null
      },
      productVariant: {
        findFirst: async () => null
      },
      productCategory: {
        findUnique: async () => ({
          id: "online_yks",
          slug: "online-kocluk--yks",
          parentCategoryId: "online_root",
          parentCategory: { id: "online_root", isActive: true },
          isActive: true
        })
      }
    } as never);

    await assertBadRequest(
      () =>
        service.createProduct(
          productPayload({
            publishStatus: ContentStatus.PUBLISHED,
            variants: [
              variantPayload({ id: "variant_1", sku: "YKS-1", isDefault: true }),
              variantPayload({ id: "variant_2", sku: "YKS-2", isDefault: true })
            ]
          }),
          superAdminAuth
        ),
      "Yayına almak için tek bir aktif varsayılan seçenek seçmelisiniz."
    );
  });
});

async function assertBadRequest(call: () => Promise<unknown>, message: string) {
  await assert.rejects(call, (error: unknown) => {
    assert.ok(error instanceof BadRequestException);
    assert.equal(error.getStatus(), 400);
    assert.equal(error.message, message);
    return true;
  });
}

const branchAdminAuth: AuthenticatedRequestContext = {
  actorId: "branch_admin",
  email: "branch@example.com",
  actorType: AuthActorType.STAFF,
  sessionFamily: "session",
  roleKeys: ["branch-admin"],
  permissionKeys: [
    PERMISSION_KEYS.productsManage,
    PERMISSION_KEYS.pricingManage,
    PERMISSION_KEYS.couponsManage,
    PERMISSION_KEYS.ordersRead
  ],
  organizationId: "org_1",
  primaryBranchId: "branch_1",
  branchIds: ["branch_1"],
  isSuperAdmin: false,
  branchRoles: []
};

const superAdminAuth: AuthenticatedRequestContext = {
  ...branchAdminAuth,
  actorId: "super_admin",
  email: "super@example.com",
  roleKeys: ["super-admin"],
  permissionKeys: [],
  organizationId: null,
  primaryBranchId: null,
  branchIds: [],
  isSuperAdmin: true
};

function categoryPayload(input: Partial<SaveProductCategoryDto> = {}): SaveProductCategoryDto {
  return {
    slug: input.slug ?? "online-kocluk",
    name: input.name ?? "Online Koçluk",
    parentSlug: input.parentSlug ?? null,
    description: input.description,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    ctaHref: input.ctaHref,
    sortOrder: input.sortOrder ?? 10,
    isActive: input.isActive ?? true
  };
}

function productPayload(input: Partial<SaveProductDto> = {}): SaveProductDto {
  return {
    slug: input.slug ?? "yks-kocluk",
    name: input.name ?? "YKS Koçluk Paketi",
    categorySlug: "categorySlug" in input ? input.categorySlug : "online-kocluk--yks",
    shortDescription: input.shortDescription ?? "Kişisel plan ve takip.",
    description: input.description,
    type: input.type ?? ProductType.COACHING_PACKAGE,
    provider: input.provider ?? ExternalProvider.LOCAL,
    publishStatus: input.publishStatus ?? ContentStatus.DRAFT,
    isFeatured: input.isFeatured ?? false,
    sortOrder: input.sortOrder ?? 10,
    accentColor: input.accentColor ?? "blue",
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    coverImageUrl: input.coverImageUrl,
    introVideoSourceType: input.introVideoSourceType ?? null,
    introVideoUrl: input.introVideoUrl ?? null,
    introVideoPosterUrl: input.introVideoPosterUrl ?? null,
    introVideoTitle: input.introVideoTitle ?? null,
    variants: input.variants ?? [variantPayload({ isDefault: true })],
    features: input.features ?? [{ title: "Haftalık takip", sortOrder: 10 }]
  };
}

function variantPayload(input: Partial<SaveProductDto["variants"][number]> = {}): SaveProductDto["variants"][number] {
  return {
    id: input.id,
    title: input.title ?? "Standart",
    sku: input.sku ?? "YKS-STD",
    billingLabel: input.billingLabel,
    price: input.price ?? "1200",
    compareAtPrice: input.compareAtPrice,
    currency: input.currency ?? Currency.TRY,
    isDefault: input.isDefault ?? false,
    isActive: input.isActive ?? true,
    hasInstallments: input.hasInstallments ?? false,
    installmentCount: input.installmentCount,
    sortOrder: input.sortOrder ?? 10,
    externalProductId: input.externalProductId,
    externalVariantId: input.externalVariantId
  };
}

function categoryRecord(input: {
  id?: string;
  slug?: string;
  name?: string;
  parentCategoryId?: string | null;
  parentCategory?: unknown;
  childCategories?: Array<{ id: string }>;
  products?: Array<{ id: string }>;
}) {
  return {
    id: input.id ?? "category_1",
    slug: input.slug ?? "online-kocluk",
    name: input.name ?? "Online Koçluk",
    parentCategoryId: input.parentCategoryId ?? null,
    parentCategory: input.parentCategory ?? null,
    childCategories: input.childCategories ?? [],
    products: input.products ?? [],
    description: null,
    seoTitle: null,
    seoDescription: null,
    ctaHref: null,
    sortOrder: 10,
    isActive: true
  };
}
