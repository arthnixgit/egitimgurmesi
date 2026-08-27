import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContentStatus } from "@ega/db";
import { NotFoundException } from "@nestjs/common";
import { PublicCommerceService } from "./public-commerce.service";

describe("PublicCommerceService catalog hierarchy filtering", () => {
  it("only queries published global products under active subcategories with active roots", async () => {
    let productWhere: unknown = null;
    const service = new PublicCommerceService({
      productCategory: {
        findMany: async () => []
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
