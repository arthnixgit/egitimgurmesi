import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContentStatus } from "@ega/db";
import { NotFoundException } from "@nestjs/common";
import { PublicCommerceService } from "./public-commerce.service";

describe("PublicCommerceService catalog hierarchy filtering", () => {
  it("only queries published global products under active subcategories with active roots", async () => {
    let categoryArgs: unknown = null;
    let productWhere: unknown = null;
    const service = new PublicCommerceService({
      productCategory: {
        findMany: async (args: unknown) => {
          categoryArgs = args;
          return [];
        }
      },
      product: {
        findMany: async (args: { where: unknown }) => {
          productWhere = args.where;
          return [];
        }
      }
    } as never);

    const catalog = await service.getCatalog();

    assert.deepEqual(catalog, { categories: [], products: [] });
    assert.deepEqual(categoryArgs, {
      where: {
        parentCategoryId: null,
        isActive: true,
        organizationId: null,
        branchId: null
      },
      include: {
        childCategories: {
          where: {
            isActive: true,
            organizationId: null,
            branchId: null
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    assert.deepEqual(productWhere, {
      publishStatus: ContentStatus.PUBLISHED,
      organizationId: null,
      branchId: null,
      category: {
        is: {
          isActive: true,
          parentCategory: {
            is: {
              isActive: true
            }
          }
        }
      }
    });
  });

  it("returns renamed roots and sorted children from ProductCategory records", async () => {
    const service = new PublicCommerceService({
      productCategory: {
        findMany: async () => [
          categoryRecord({
            slug: "kamp",
            name: "Kamp Programları",
            description: "Kamp açıklaması",
            childCategories: [
              categoryRecord({
                slug: "kamp--hazirlik",
                name: "Hazırlık",
                description: "İlk sıradaki alt kategori",
                ctaHref: "/paketlerimiz?kategori=kamp&alt=hazirlik"
              }),
              categoryRecord({
                slug: "kamp--tekrar",
                name: "Tekrar",
                description: "İkinci alt kategori",
                ctaHref: "/paketlerimiz?kategori=kamp&alt=tekrar"
              })
            ]
          }),
          categoryRecord({
            slug: "online",
            name: "Online Yeni Ad",
            childCategories: []
          })
        ]
      },
      product: {
        findMany: async () => []
      }
    } as never);

    const catalog = await service.getCatalog();

    assert.deepEqual(
      catalog.categories.map((category) => category.label),
      ["Kamp Programları", "Online Yeni Ad"]
    );
    assert.deepEqual(
      catalog.categories[0].subcategories.map((subcategory) => [subcategory.id, subcategory.label]),
      [
        ["hazirlik", "Hazırlık"],
        ["tekrar", "Tekrar"]
      ]
    );
  });

  it("does not resolve a package detail when the product is assigned to a root category", async () => {
    const service = new PublicCommerceService({
      product: {
        findUnique: async () => ({
          id: "product_1",
          publishStatus: ContentStatus.PUBLISHED,
          organizationId: null,
          branchId: null,
          category: {
            isActive: true,
            parentCategory: null
          }
        })
      }
    } as never);

    await assert.rejects(
      () => service.getProductBySlug("legacy-root-package"),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.equal(error.getStatus(), 404);
        return true;
      }
    );
  });

  it("does not resolve a package detail when the parent root category is inactive", async () => {
    const service = new PublicCommerceService({
      product: {
        findUnique: async () => ({
          id: "product_1",
          publishStatus: ContentStatus.PUBLISHED,
          organizationId: null,
          branchId: null,
          category: {
            isActive: true,
            parentCategory: {
              isActive: false
            }
          }
        })
      }
    } as never);

    await assert.rejects(
      () => service.getProductBySlug("inactive-root-package"),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.equal(error.getStatus(), 404);
        return true;
      }
    );
  });
});

function categoryRecord(input: {
  slug: string;
  name: string;
  description?: string | null;
  ctaHref?: string | null;
  childCategories?: Array<Record<string, unknown>>;
}) {
  return {
    id: `category_${input.slug}`,
    organizationId: null,
    branchId: null,
    parentCategoryId: null,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    seoTitle: null,
    seoDescription: null,
    ctaHref: input.ctaHref ?? null,
    sortOrder: 10,
    isActive: true,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    childCategories: input.childCategories ?? []
  };
}
