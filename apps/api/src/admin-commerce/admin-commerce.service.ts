import {
  AuditActorType,
  ContentStatus,
  Currency,
  EnrollmentStatus,
  ExternalProvider,
  ExternalProviderOrderStatus,
  OrderStatus,
  PERMISSION_KEYS,
  PaymentAttemptStatus,
  PaymentAttemptType,
  PaymentStatus,
  Prisma
} from "@ega/db";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import {
  RecordManualReviewDto,
  SaveCatalogDocumentDto,
  SaveProductFeatureDto,
  SaveProductCategoryDto,
  SaveProductDto,
  UpdateOrderNoteDto,
  UpdateOrderStatusDto
} from "./dto/admin-commerce.dto";

const CATALOG_SUPER_ADMIN_MESSAGE = "Paket kataloğunu yalnızca Super Admin yönetebilir.";
const CATEGORY_CTA_HREF_MESSAGE =
  "Kategori hedefi yalnızca site içi rota veya güvenli HTTPS adresi olabilir.";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const VALID_ACCENT_COLORS = new Set(["blue", "teal", "amber"]);
const CATALOG_REVALIDATION = {
  revalidateRoutes: ["/", "/paketlerimiz"],
  revalidateTags: ["navigation", "public-layout", "public-commerce-catalog"]
} as const;

const catalogCategoryInclude = {
  parentCategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      parentCategoryId: true
    }
  },
  childCategories: {
    select: {
      id: true
    }
  },
  products: {
    select: {
      id: true
    }
  }
} satisfies Prisma.ProductCategoryInclude;

const catalogProductInclude = {
  category: {
    include: {
      parentCategory: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true
        }
      }
    }
  },
  variants: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  },
  features: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  },
  externalProviderLinks: {
    where: {
      isActive: true
    },
    orderBy: [{ createdAt: "asc" }]
  }
} satisfies Prisma.ProductInclude;

const adminOrderInclude = {
  user: {
    select: {
      email: true
    }
  },
  items: {
    orderBy: [{ createdAt: "asc" }],
    include: {
      variant: {
        select: {
          title: true,
          sku: true
        }
      },
      product: {
        select: {
          slug: true
        }
      }
    }
  },
  payments: {
    orderBy: [{ createdAt: "asc" }]
  },
  externalOrders: {
    orderBy: [{ createdAt: "asc" }]
  }
} satisfies Prisma.OrderInclude;

const adminOrderDetailInclude = {
  user: {
    select: {
      id: true,
      email: true
    }
  },
  coupon: {
    select: {
      code: true
    }
  },
  items: {
    orderBy: [{ createdAt: "asc" }],
    include: {
      variant: {
        select: {
          title: true,
          sku: true,
          billingLabel: true
        }
      },
      product: {
        select: {
          id: true,
          slug: true,
          name: true
        }
      }
    }
  },
  payments: {
    orderBy: [{ createdAt: "asc" }],
    include: {
      attempts: {
        orderBy: [{ attemptedAt: "desc" }]
      }
    }
  },
  externalOrders: {
    orderBy: [{ createdAt: "asc" }]
  }
} satisfies Prisma.OrderInclude;

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class AdminCommerceService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalogDocument(auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);

    const [categories, products] = await Promise.all([
      this.prisma.productCategory.findMany({
        include: catalogCategoryInclude,
        orderBy: [{ parentCategoryId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      }),
      this.prisma.product.findMany({
        include: catalogProductInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      })
    ]);

    return {
      categories: categories.map(normalizeCategory),
      products: products.map(normalizeProduct)
    };
  }

  async listCategories(auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);

    const categories = await this.prisma.productCategory.findMany({
      include: catalogCategoryInclude,
      orderBy: [{ parentCategoryId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return categories.map(normalizeCategory);
  }

  async createCategory(payload: SaveProductCategoryDto, auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);

    const parentId = await this.resolveParentCategoryId(payload.parentSlug ?? null, null);
    validateCategoryPayload(payload);

    const created = await this.prisma.productCategory.create({
      data: {
        name: payload.name.trim(),
        slug: payload.slug.trim(),
        parentCategoryId: parentId,
        description: normalizeNullableText(payload.description),
        seoTitle: normalizeNullableText(payload.seoTitle),
        seoDescription: normalizeNullableText(payload.seoDescription),
        ctaHref: normalizeCategoryCtaHref(payload.ctaHref),
        sortOrder: payload.sortOrder ?? 0,
        isActive: payload.isActive ?? true
      },
      include: catalogCategoryInclude
    });

    await recordAuditLog(this.prisma, auth, {
      action: "commerce.category.create",
      entityType: "ProductCategory",
      entityId: created.id,
      summary: `Created category ${created.slug}.`
    });

    return withCatalogRevalidation(normalizeCategory(created));
  }

  async updateCategory(
    categoryId: string,
    payload: SaveProductCategoryDto,
    auth: AuthenticatedRequestContext
  ) {
    requireSuperAdmin(auth);

    const existing = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      include: catalogCategoryInclude
    });

    if (!existing) {
      throw new NotFoundException("Category not found.");
    }

    validateCategoryPayload(payload);
    const parentId = await this.resolveParentCategoryId(payload.parentSlug ?? null, existing);

    const updated = await this.prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        name: payload.name.trim(),
        slug: payload.slug.trim(),
        parentCategoryId: parentId,
        description: normalizeNullableText(payload.description),
        seoTitle: normalizeNullableText(payload.seoTitle),
        seoDescription: normalizeNullableText(payload.seoDescription),
        ctaHref: normalizeCategoryCtaHref(payload.ctaHref),
        sortOrder: payload.sortOrder ?? existing.sortOrder,
        isActive: payload.isActive ?? existing.isActive
      },
      include: catalogCategoryInclude
    });

    await recordAuditLog(this.prisma, auth, {
      action: "commerce.category.update",
      entityType: "ProductCategory",
      entityId: updated.id,
      summary: `Updated category ${updated.slug}.`
    });

    return withCatalogRevalidation(normalizeCategory(updated));
  }

  async deleteCategory(categoryId: string, auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);

    const existing = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      include: catalogCategoryInclude
    });

    if (!existing) {
      throw new NotFoundException("Category not found.");
    }

    if (existing.childCategories.length > 0) {
      throw new BadRequestException("Bu kategoriye bağlı alt kategoriler bulunuyor.");
    }

    if (existing.products.length > 0) {
      throw new BadRequestException(
        existing.parentCategoryId
          ? "Bu alt kategoriye bağlı paketler bulunuyor."
          : "Bu kategoriye bağlı paketler bulunuyor."
      );
    }

    await this.prisma.productCategory.delete({
      where: { id: categoryId }
    });

    await recordAuditLog(this.prisma, auth, {
      action: "commerce.category.delete",
      entityType: "ProductCategory",
      entityId: categoryId,
      summary: `Deleted category ${existing.slug}.`
    });

    return {
      status: "deleted" as const,
      id: categoryId,
      ...CATALOG_REVALIDATION
    };
  }

  async listProducts(auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);

    const products = await this.prisma.product.findMany({
      include: catalogProductInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return products.map(normalizeProduct);
  }

  async getProduct(productId: string, auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: catalogProductInclude
    });

    if (!product) {
      throw new NotFoundException("Product not found.");
    }

    return normalizeProduct(product);
  }

  async createProduct(payload: SaveProductDto, auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);
    await this.validateProductPayload(payload, null);

    const createdId = await this.prisma.$transaction(async (tx) => {
      const categoryId = await this.resolveCategoryIdInTransaction(
        tx,
        payload.categorySlug ?? null,
        payload.publishStatus ?? ContentStatus.DRAFT
      );
      const product = await tx.product.create({
        data: {
          categoryId,
          name: payload.name.trim(),
          slug: payload.slug.trim(),
          shortDescription: normalizeNullableText(payload.shortDescription),
          description: normalizeNullableText(payload.description),
          type: payload.type,
          provider: payload.provider,
          publishStatus: payload.publishStatus ?? ContentStatus.DRAFT,
          isFeatured: payload.isFeatured ?? false,
          sortOrder: payload.sortOrder ?? 0,
          accentColor: normalizeNullableText(payload.accentColor),
          seoTitle: normalizeNullableText(payload.seoTitle),
          seoDescription: normalizeNullableText(payload.seoDescription),
          coverImageUrl: normalizeNullableText(payload.coverImageUrl),
          introVideoSourceType: payload.introVideoSourceType ?? null,
          introVideoUrl: normalizeNullableText(payload.introVideoUrl),
          introVideoPosterUrl: normalizeNullableText(payload.introVideoPosterUrl),
          introVideoTitle: normalizeNullableText(payload.introVideoTitle)
        }
      });

      await this.syncProductChildren(tx, product.id, payload, null);
      return product.id;
    });

    const created = await this.getProduct(createdId, auth);

    await recordAuditLog(this.prisma, auth, {
      action: "commerce.product.create",
      entityType: "Product",
      entityId: createdId,
      summary: `Created product ${created.slug}.`
    });

    return created;
  }

  async updateProduct(
    productId: string,
    payload: SaveProductDto,
    auth: AuthenticatedRequestContext
  ) {
    requireSuperAdmin(auth);

    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      include: catalogProductInclude
    });

    if (!existing) {
      throw new NotFoundException("Product not found.");
    }

    await this.validateProductPayload(payload, productId);

    await this.prisma.$transaction(async (tx) => {
      const categoryId = await this.resolveCategoryIdInTransaction(
        tx,
        payload.categorySlug ?? null,
        payload.publishStatus ?? existing.publishStatus
      );

      await tx.product.update({
        where: { id: productId },
        data: {
          categoryId,
          name: payload.name.trim(),
          slug: payload.slug.trim(),
          shortDescription: normalizeNullableText(payload.shortDescription),
          description: normalizeNullableText(payload.description),
          type: payload.type,
          provider: payload.provider,
          publishStatus: payload.publishStatus ?? existing.publishStatus,
          isFeatured: payload.isFeatured ?? existing.isFeatured,
          sortOrder: payload.sortOrder ?? existing.sortOrder,
          accentColor: normalizeNullableText(payload.accentColor),
          seoTitle: normalizeNullableText(payload.seoTitle),
          seoDescription: normalizeNullableText(payload.seoDescription),
          coverImageUrl: normalizeNullableText(payload.coverImageUrl),
          introVideoSourceType: payload.introVideoSourceType ?? null,
          introVideoUrl: normalizeNullableText(payload.introVideoUrl),
          introVideoPosterUrl: normalizeNullableText(payload.introVideoPosterUrl),
          introVideoTitle: normalizeNullableText(payload.introVideoTitle)
        }
      });

      await this.syncProductChildren(tx, productId, payload, existing);
    });

    const updated = await this.getProduct(productId, auth);

    await recordAuditLog(this.prisma, auth, {
      action: "commerce.product.update",
      entityType: "Product",
      entityId: productId,
      summary: `Updated product ${updated.slug}.`
    });

    return updated;
  }

  async deleteProduct(productId: string, auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);

    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: {
            orderItems: true,
            enrollments: true
          }
        }
      }
    });

    if (!existing) {
      throw new NotFoundException("Product not found.");
    }

    if (existing._count.orderItems > 0 || existing._count.enrollments > 0) {
      throw new BadRequestException(
        "Bu paketin sipariş veya kayıt geçmişi bulunuyor. Paket silinemez; arşivleyerek yayından kaldırabilirsiniz."
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.externalProviderProduct.deleteMany({
        where: { productId }
      });
      await tx.productFeature.deleteMany({
        where: { productId }
      });
      await tx.productVariant.deleteMany({
        where: { productId }
      });
      await tx.product.delete({
        where: { id: productId }
      });
    });

    await recordAuditLog(this.prisma, auth, {
      action: "commerce.product.delete",
      entityType: "Product",
      entityId: productId,
      summary: `Deleted product ${existing.slug}.`
    });

    return {
      status: "deleted" as const,
      id: productId
    };
  }

  async saveCatalogDocument(payload: SaveCatalogDocumentDto, auth: AuthenticatedRequestContext) {
    requireSuperAdmin(auth);

    const orderCount = await this.prisma.order.count();

    if (orderCount > 0) {
      throw new BadRequestException(
        "Sipariş geçmişi bulunduğu için katalog toplu olarak değiştirilemez. Tekil kategori ve paket düzenleyiciyi kullanın."
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.externalProviderProduct.deleteMany();
      await tx.productFeature.deleteMany();
      await tx.productVariant.deleteMany();
      await tx.product.deleteMany();
      await tx.productCategory.deleteMany();

      const categoryIdBySlug = new Map<string, string>();

      const rootCategories = payload.categories.filter((category) => !category.parentSlug);
      const childCategories = payload.categories.filter((category) => category.parentSlug);

      for (let index = 0; index < rootCategories.length; index += 1) {
        const category = rootCategories[index];
        const record = await tx.productCategory.create({
          data: {
            name: category.name,
            slug: category.slug,
            description: category.description,
            seoTitle: category.seoTitle,
            seoDescription: category.seoDescription,
            ctaHref: normalizeCategoryCtaHref(category.ctaHref),
            sortOrder: category.sortOrder ?? (index + 1) * 10,
            isActive: category.isActive ?? true
          }
        });

        categoryIdBySlug.set(category.slug, record.id);
      }

      for (let index = 0; index < childCategories.length; index += 1) {
        const category = childCategories[index];
        const parentId = category.parentSlug
          ? categoryIdBySlug.get(category.parentSlug)
          : null;

        if (!parentId) {
          throw new BadRequestException(
            `Parent category "${category.parentSlug}" was not found while saving catalog.`
          );
        }

        const record = await tx.productCategory.create({
          data: {
            parentCategoryId: parentId,
            name: category.name,
            slug: category.slug,
            description: category.description,
            seoTitle: category.seoTitle,
            seoDescription: category.seoDescription,
            ctaHref: normalizeCategoryCtaHref(category.ctaHref),
            sortOrder: category.sortOrder ?? (index + 1) * 10,
            isActive: category.isActive ?? true
          }
        });

        categoryIdBySlug.set(category.slug, record.id);
      }

      for (let productIndex = 0; productIndex < payload.products.length; productIndex += 1) {
        const product = payload.products[productIndex];
        const categoryId = product.categorySlug
          ? categoryIdBySlug.get(product.categorySlug)
          : undefined;

        if (product.categorySlug && !categoryId) {
          throw new BadRequestException(
            `Category "${product.categorySlug}" was not found while saving product "${product.slug}".`
          );
        }

        const productRecord = await tx.product.create({
          data: {
            categoryId,
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            type: product.type,
            provider: product.provider,
            publishStatus: product.publishStatus ?? ContentStatus.PUBLISHED,
            isFeatured: product.isFeatured ?? false,
            sortOrder: product.sortOrder ?? (productIndex + 1) * 10,
            accentColor: product.accentColor,
            seoTitle: product.seoTitle,
            seoDescription: product.seoDescription,
            coverImageUrl: product.coverImageUrl,
            introVideoSourceType: product.introVideoSourceType ?? null,
            introVideoUrl: product.introVideoUrl ?? null,
            introVideoPosterUrl: product.introVideoPosterUrl ?? null,
            introVideoTitle: product.introVideoTitle ?? null
          }
        });

        await this.syncProductChildren(tx, productRecord.id, product, null);
      }

      await recordAuditLog(tx, auth, {
        action: "commerce.catalog.save",
        entityType: "ProductCatalog",
        entityId: "catalog",
        summary: "Saved catalog categories and products."
      });
    });

    return {
      ...(await this.getCatalogDocument(auth)),
      ...CATALOG_REVALIDATION
    };
  }

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      include: adminOrderInclude,
      orderBy: [{ createdAt: "desc" }]
    });

    return orders.map(normalizeAdminOrderSummary);
  }

  async getOrder(orderNumber: string) {
    const order = await this.getOrderDetailRecord(orderNumber);
    return this.normalizeAdminOrderDetail(order);
  }

  async updateOrderNote(
    orderNumber: string,
    payload: UpdateOrderNoteDto,
    auth: AuthenticatedRequestContext
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, note: true }
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    const nextNote = payload.note?.trim() || null;

    await this.prisma.order.update({
      where: { orderNumber },
      data: {
        note: nextNote
      }
    });

    await recordAuditLog(this.prisma, auth, {
      action: "orders.note.update",
      entityType: "Order",
      entityId: order.id,
      summary: nextNote ? "Updated internal order note." : "Cleared internal order note."
    });

    return this.getOrder(orderNumber);
  }

  async updateOrderStatus(
    orderNumber: string,
    payload: UpdateOrderStatusDto,
    auth: AuthenticatedRequestContext
  ) {
    const order = await this.getOrderDetailRecord(orderNumber);
    validateOrderStatusTransition(order.status, payload.status);

    const primaryPayment = order.payments[0] ?? null;
    const nextPaymentStatus =
      payload.paymentStatus ??
      derivePaymentStatusFromOrderStatus(payload.status, primaryPayment?.status ?? null);
    const changesPaymentState =
      Boolean(primaryPayment) && Boolean(nextPaymentStatus) && nextPaymentStatus !== primaryPayment?.status;
    const changesExternalState = Boolean(payload.externalStatus);
    const changesRefundState =
      payload.status === OrderStatus.REFUNDED || nextPaymentStatus === PaymentStatus.REFUNDED;

    if (
      (changesPaymentState || changesExternalState) &&
      !auth.permissionKeys.includes(PERMISSION_KEYS.paymentsReconcile)
    ) {
      throw new ForbiddenException(
        "Ödeme veya harici provider statüsü değiştirmek için uzlaştırma yetkisi gerekir."
      );
    }

    if (changesRefundState && !auth.permissionKeys.includes(PERMISSION_KEYS.paymentsRefund)) {
      throw new ForbiddenException("İade durumuna geçiş için ödeme iade yetkisi gerekir.");
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const nextNote = payload.note !== undefined ? payload.note.trim() || null : undefined;

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: payload.status,
          note: nextNote,
          placedAt: shouldStampPlacedAt(payload.status, order.placedAt) ? now : undefined,
          paidAt:
            payload.status === OrderStatus.PAID
              ? order.paidAt ?? now
              : payload.status === OrderStatus.REFUNDED
                ? order.paidAt ?? now
                : payload.status === OrderStatus.CANCELLED || payload.status === OrderStatus.FAILED
                  ? null
                  : undefined,
          cancelledAt:
            payload.status === OrderStatus.CANCELLED
              ? order.cancelledAt ?? now
              : order.cancelledAt
                ? null
                : undefined
        }
      });

      if (primaryPayment && nextPaymentStatus) {
        await tx.payment.update({
          where: { id: primaryPayment.id },
          data: {
            status: nextPaymentStatus,
            paidAt:
              nextPaymentStatus === PaymentStatus.PAID
                ? primaryPayment.paidAt ?? now
                : nextPaymentStatus === PaymentStatus.REFUNDED
                  ? primaryPayment.paidAt ?? now
                  : nextPaymentStatus === PaymentStatus.FAILED ||
                      nextPaymentStatus === PaymentStatus.CANCELLED
                    ? null
                    : undefined
          }
        });

        await tx.paymentAttempt.create({
          data: {
            paymentId: primaryPayment.id,
            attemptType: PaymentAttemptType.MANUAL_REVIEW,
            status: PaymentAttemptStatus.SUCCEEDED,
            requestPayload: {
              action: "status_update",
              orderStatus: payload.status,
              paymentStatus: nextPaymentStatus,
              externalStatus: payload.externalStatus ?? null
            },
            responsePayload: {
              note: payload.note ?? null
            },
            completedAt: now
          }
        });
      }

      if (payload.externalStatus) {
        const externalUpdateData = buildExternalOrderUpdateData(payload.externalStatus, now);
        await tx.externalProviderOrder.updateMany({
          where: { orderId: order.id },
          data: externalUpdateData
        });
      }

      await syncOrderEnrollmentsForStatus(tx, {
        userId: order.userId,
        orderId: order.id,
        status: payload.status,
        now
      });
    });

    await recordAuditLog(this.prisma, auth, {
      action: "orders.status.update",
      entityType: "Order",
      entityId: order.id,
      summary: `Changed order status to ${payload.status}.`
    });

    return this.getOrder(orderNumber);
  }

  async recordManualReview(
    orderNumber: string,
    payload: RecordManualReviewDto,
    auth: AuthenticatedRequestContext
  ) {
    const order = await this.getOrderDetailRecord(orderNumber);
    const primaryPayment = order.payments[0] ?? null;

    if (!primaryPayment) {
      throw new BadRequestException("No payment record exists for this order.");
    }

    const note = payload.note.trim();

    if (!note) {
      throw new BadRequestException("Manual review note cannot be empty.");
    }

    const now = new Date();
    const nextNote = [order.note, `[${now.toISOString()}] ${note}`].filter(Boolean).join("\n\n");

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          note: nextNote
        }
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId: primaryPayment.id,
          attemptType: PaymentAttemptType.MANUAL_REVIEW,
          status: PaymentAttemptStatus.SUCCEEDED,
          requestPayload: {
            action: "manual_review_note"
          },
          responsePayload: {
            note
          },
          completedAt: now
        }
      });
    });

    await recordAuditLog(this.prisma, auth, {
      action: "orders.manual_review",
      entityType: "Order",
      entityId: order.id,
      summary: "Added manual review note to order."
    });

    return this.getOrder(orderNumber);
  }

  private async resolveParentCategoryId(
    parentSlug: string | null,
    existing: Prisma.ProductCategoryGetPayload<{ include: typeof catalogCategoryInclude }> | null
  ) {
    if (!parentSlug) {
      if (existing?.parentCategoryId && existing.products.length > 0) {
        throw new BadRequestException("Bu alt kategoriye bağlı paketler bulunuyor.");
      }

      return null;
    }

    const parent = await this.prisma.productCategory.findUnique({
      where: { slug: parentSlug }
    });

    if (!parent) {
      throw new BadRequestException("Alt kategori yalnızca bir ana kategoriye bağlanabilir.");
    }

    if (parent.parentCategoryId) {
      throw new BadRequestException("Bir alt kategori başka bir alt kategorinin altında oluşturulamaz.");
    }

    if (existing) {
      if (parent.id === existing.id) {
        throw new BadRequestException("Kategori kendi altına bağlanamaz.");
      }

      if (existing.childCategories.length > 0) {
        throw new BadRequestException("Alt kategorisi olan bir kategori başka bir kategoriye bağlanamaz.");
      }
    }

    return parent.id;
  }

  private async resolveCategoryIdInTransaction(
    tx: TransactionClient,
    categorySlug: string | null,
    publishStatus: ContentStatus
  ) {
    if (!categorySlug) {
      if (publishStatus === ContentStatus.PUBLISHED) {
        throw new BadRequestException("Yayına almak için ana kategori ve alt kategori seçmelisiniz.");
      }

      return undefined;
    }

    const category = await tx.productCategory.findUnique({
      where: { slug: categorySlug },
      include: {
        parentCategory: true
      }
    });

    if (!category) {
      throw new BadRequestException("Yayına almak için geçerli bir alt kategori seçmelisiniz.");
    }

    if (publishStatus !== ContentStatus.PUBLISHED) {
      return category.id;
    }

    if (!category.parentCategoryId || !category.parentCategory) {
      throw new BadRequestException("Yayına almak için ana kategori ve alt kategori seçmelisiniz.");
    }

    if (!category.isActive || !category.parentCategory.isActive) {
      throw new BadRequestException("Yayına almak için aktif ana kategori ve aktif alt kategori seçmelisiniz.");
    }

    return category.id;
  }

  private async validateProductPayload(product: SaveProductDto, productId: string | null) {
    validateProductBasics(product);

    const duplicateSlug = await this.prisma.product.findFirst({
      where: {
        slug: product.slug.trim(),
        ...(productId ? { id: { not: productId } } : {})
      },
      select: {
        id: true
      }
    });

    if (duplicateSlug) {
      throw new BadRequestException("Bu paket slug değeri başka bir pakette kullanılıyor.");
    }

    const seenSkus = new Set<string>();
    const incomingVariantIds = product.variants
      .map((variant) => variant.id)
      .filter((variantId): variantId is string => Boolean(variantId));

    for (const variant of product.variants) {
      const sku = variant.sku.trim();

      if (!sku) {
        continue;
      }

      if (seenSkus.has(sku)) {
        throw new BadRequestException("Aynı SKU bir pakette birden fazla kez kullanılamaz.");
      }

      seenSkus.add(sku);

      const duplicateSku = await this.prisma.productVariant.findFirst({
        where: {
          sku,
          id: incomingVariantIds.length
            ? {
                notIn: incomingVariantIds
              }
            : undefined
        },
        select: {
          id: true
        }
      });

      if (duplicateSku) {
        throw new BadRequestException("Bu SKU başka bir paket seçeneğinde kullanılıyor.");
      }
    }

    if (product.publishStatus === ContentStatus.PUBLISHED) {
      await this.validatePublishReadiness(product);
    }
  }

  private async validatePublishReadiness(product: SaveProductDto) {
    const category = product.categorySlug
      ? await this.prisma.productCategory.findUnique({
          where: { slug: product.categorySlug },
          include: {
            parentCategory: true
          }
        })
      : null;

    if (!category?.parentCategory) {
      throw new BadRequestException("Yayına almak için ana kategori ve alt kategori seçmelisiniz.");
    }

    if (!category.isActive || !category.parentCategory.isActive) {
      throw new BadRequestException("Yayına almak için aktif ana kategori ve aktif alt kategori seçmelisiniz.");
    }

    const activeVariants = product.variants.filter((variant) => variant.isActive !== false);
    const defaultVariants = activeVariants.filter((variant) => variant.isDefault === true);

    if (activeVariants.length === 0) {
      throw new BadRequestException("Yayına almak için en az bir aktif paket seçeneği gerekir.");
    }

    if (defaultVariants.length !== 1) {
      throw new BadRequestException("Yayına almak için tek bir aktif varsayılan seçenek seçmelisiniz.");
    }

    const defaultVariant = defaultVariants[0];
    const price = parseDecimalInput(defaultVariant.price);
    const compareAtPrice = defaultVariant.compareAtPrice
      ? parseDecimalInput(defaultVariant.compareAtPrice)
      : null;

    if (!price || price <= 0) {
      throw new BadRequestException("Varsayılan seçeneğin fiyatı geçerli olmalıdır.");
    }

    if (compareAtPrice !== null && compareAtPrice <= price) {
      throw new BadRequestException("Eski fiyat, güncel fiyattan büyük olmalıdır.");
    }

    if (defaultVariant.hasInstallments && (!defaultVariant.installmentCount || defaultVariant.installmentCount < 1)) {
      throw new BadRequestException("Taksitli satışta taksit sayısı zorunludur.");
    }

    if (!VALID_ACCENT_COLORS.has(product.accentColor ?? "")) {
      throw new BadRequestException("Kart tonu blue, teal veya amber olmalıdır.");
    }

    if (!product.shortDescription?.trim()) {
      throw new BadRequestException("Yayına almak için kısa açıklama girilmelidir.");
    }

    const normalizedFeatures = normalizeFeaturePayloads(product.features);
    if (normalizedFeatures.length === 0) {
      throw new BadRequestException("Yayına almak için en az bir kart özelliği gerekir.");
    }

    if (product.provider === ExternalProvider.UNIKAZAN) {
      const hasMissingMapping = activeVariants.some((variant) => !variant.externalProductId?.trim());

      if (hasMissingMapping) {
        throw new BadRequestException("Unikazan paketlerinde dış paket eşleşmesi zorunludur.");
      }
    }

    if (product.provider === ExternalProvider.LOCAL && !defaultVariant.sku.trim()) {
      throw new BadRequestException("Yerel paketlerde varsayılan seçenek SKU değeri zorunludur.");
    }

    validateMediaUrl(product.coverImageUrl, "Kapak görsel URL geçerli olmalıdır.");
    validateMediaUrl(product.introVideoPosterUrl, "Video poster URL geçerli olmalıdır.");

    if (product.introVideoUrl?.trim()) {
      validateMediaUrl(product.introVideoUrl, "Video URL geçerli olmalıdır.");

      if (!product.introVideoSourceType) {
        throw new BadRequestException("Video URL girildiğinde kaynak tipi seçilmelidir.");
      }
    }

    if (product.introVideoSourceType && !product.introVideoUrl?.trim()) {
      throw new BadRequestException("Video kaynak tipi seçildiğinde video URL girilmelidir.");
    }
  }

  private async syncProductChildren(
    tx: TransactionClient,
    productId: string,
    payload: SaveProductDto,
    existing: Prisma.ProductGetPayload<{ include: typeof catalogProductInclude }> | null
  ) {
    if (!payload.variants.length) {
      throw new BadRequestException("Each product must contain at least one variant.");
    }

    const existingVariants = existing?.variants ?? [];
    const existingFeatures = existing?.features ?? [];
    const incomingFeatures = normalizeFeaturePayloads(payload.features);
    const existingVariantIdSet = new Set(existingVariants.map((variant) => variant.id));
    const existingFeatureIdSet = new Set(existingFeatures.map((feature) => feature.id));

    const incomingVariantIds = new Set(payload.variants.map((variant) => variant.id).filter(Boolean));
    const incomingFeatureIds = new Set(incomingFeatures.map((feature) => feature.id).filter(Boolean));

    for (const variant of payload.variants) {
      if (variant.id && !existingVariantIdSet.has(variant.id)) {
        throw new BadRequestException("A variant update referenced a record outside this product.");
      }
    }

    for (const feature of incomingFeatures) {
      if (feature.id && !existingFeatureIdSet.has(feature.id)) {
        throw new BadRequestException("A feature update referenced a record outside this product.");
      }
    }

    for (const variant of existingVariants) {
      if (incomingVariantIds.has(variant.id)) {
        continue;
      }

      const orderItemCount = await tx.orderItem.count({
        where: {
          variantId: variant.id
        }
      });

      if (orderItemCount > 0) {
        throw new BadRequestException(
          `Variant "${variant.title}" cannot be removed because order history exists.`
        );
      }

      await tx.externalProviderProduct.deleteMany({
        where: { variantId: variant.id }
      });

      await tx.productVariant.delete({
        where: { id: variant.id }
      });
    }

    for (const feature of existingFeatures) {
      if (incomingFeatureIds.has(feature.id)) {
        continue;
      }

      await tx.productFeature.delete({
        where: { id: feature.id }
      });
    }

    const createdOrUpdatedVariantIds: string[] = [];

    for (let index = 0; index < payload.variants.length; index += 1) {
      const variant = payload.variants[index];
      const variantData = {
        title: variant.title.trim(),
        sku: variant.sku.trim(),
        billingLabel: normalizeNullableText(variant.billingLabel),
        price: normalizeDecimalInput(variant.price),
        compareAtPrice: variant.compareAtPrice
          ? normalizeDecimalInput(variant.compareAtPrice)
          : null,
        currency: variant.currency ?? Currency.TRY,
        isDefault: variant.isDefault ?? index === 0,
        isActive: variant.isActive ?? true,
        hasInstallments: variant.hasInstallments ?? false,
        installmentCount: variant.hasInstallments ? variant.installmentCount : null,
        sortOrder: variant.sortOrder ?? (index + 1) * 10
      };

      const variantRecord = variant.id
        ? await tx.productVariant.update({
            where: { id: variant.id },
            data: variantData
          })
        : await tx.productVariant.create({
            data: {
              productId,
              ...variantData
            }
          });

      createdOrUpdatedVariantIds.push(variantRecord.id);

      await tx.externalProviderProduct.deleteMany({
        where: {
          productId,
          variantId: variantRecord.id
        }
      });

      if (payload.provider === ExternalProvider.UNIKAZAN && variant.externalProductId?.trim()) {
        await tx.externalProviderProduct.create({
          data: {
            productId,
            variantId: variantRecord.id,
            provider: ExternalProvider.UNIKAZAN,
            externalProductId: variant.externalProductId.trim(),
            externalVariantId: normalizeNullableText(variant.externalVariantId),
            isActive: true
          }
        });
      }
    }

    if (payload.provider !== ExternalProvider.UNIKAZAN) {
      await tx.externalProviderProduct.deleteMany({
        where: { productId }
      });
    }

    for (let index = 0; index < incomingFeatures.length; index += 1) {
      const feature = incomingFeatures[index];
      const featureData = {
        title: feature.title.trim(),
        description: normalizeNullableText(feature.description),
        iconKey: normalizeNullableText(feature.iconKey),
        sortOrder: feature.sortOrder ?? (index + 1) * 10
      };

      if (feature.id) {
        await tx.productFeature.update({
          where: { id: feature.id },
          data: featureData
        });
      } else {
        await tx.productFeature.create({
          data: {
            productId,
            ...featureData
          }
        });
      }
    }

    await tx.productVariant.updateMany({
      where: {
        productId,
        id: {
          notIn: createdOrUpdatedVariantIds
        }
      },
      data: {
        isDefault: false
      }
    });
  }

  private async getOrderDetailRecord(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: adminOrderDetailInclude
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return order;
  }

  private async normalizeAdminOrderDetail(
    order: Prisma.OrderGetPayload<{ include: typeof adminOrderDetailInclude }>
  ) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: "Order",
        entityId: order.id
      },
      include: {
        staffActor: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        userActor: {
          select: {
            email: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });

    return {
      ...normalizeAdminOrderSummary(order),
      userId: order.user.id,
      couponCode: order.coupon?.code ?? null,
      taxAmount: order.taxAmount.toFixed(2),
      note: order.note ?? null,
      updatedAt: order.updatedAt.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      payments: order.payments.map((payment) => ({
        id: payment.id,
        provider: payment.provider,
        method: payment.method,
        status: payment.status,
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
        providerReference: payment.providerReference ?? null,
        providerTransactionId: payment.providerTransactionId ?? null,
        failureReason: payment.failureReason ?? null,
        paidAt: payment.paidAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        attempts: payment.attempts.map((attempt) => ({
          id: attempt.id,
          attemptType: attempt.attemptType,
          status: attempt.status,
          errorMessage: attempt.errorMessage ?? null,
          attemptedAt: attempt.attemptedAt.toISOString(),
          completedAt: attempt.completedAt?.toISOString() ?? null,
          requestPayload: attempt.requestPayload ?? null,
          responsePayload: attempt.responsePayload ?? null
        }))
      })),
      externalOrders: order.externalOrders.map((externalOrder) => ({
        id: externalOrder.id,
        provider: externalOrder.provider,
        externalReference: externalOrder.externalReference ?? null,
        externalProductId: externalOrder.externalProductId ?? null,
        externalVariantId: externalOrder.externalVariantId ?? null,
        status: externalOrder.status,
        checkoutUrl: externalOrder.checkoutUrl ?? null,
        redirectedAt: externalOrder.redirectedAt?.toISOString() ?? null,
        returnedAt: externalOrder.returnedAt?.toISOString() ?? null,
        callbackReceivedAt: externalOrder.callbackReceivedAt?.toISOString() ?? null,
        callbackVerified: externalOrder.callbackVerified,
        externalStatus: externalOrder.externalStatus ?? null,
        createdAt: externalOrder.createdAt.toISOString(),
        updatedAt: externalOrder.updatedAt.toISOString()
      })),
      timeline: buildOrderTimeline(order, auditLogs)
    };
  }
}

function requireSuperAdmin(auth: AuthenticatedRequestContext) {
  if (!auth.isSuperAdmin) {
    throw new ForbiddenException(CATALOG_SUPER_ADMIN_MESSAGE);
  }
}

function validateCategoryPayload(category: SaveProductCategoryDto) {
  if (!category.name?.trim()) {
    throw new BadRequestException("Kategori adı zorunludur.");
  }

  if (!SLUG_PATTERN.test(category.slug?.trim() ?? "")) {
    throw new BadRequestException("Kategori slug değeri geçerli olmalıdır.");
  }
}

function validateProductBasics(product: SaveProductDto) {
  if (!product.name?.trim()) {
    throw new BadRequestException("Paket adı zorunludur.");
  }

  if (!SLUG_PATTERN.test(product.slug?.trim() ?? "")) {
    throw new BadRequestException("Paket slug değeri geçerli olmalıdır.");
  }

  if (!product.variants.length) {
    throw new BadRequestException("Her paket en az bir seçenek içermelidir.");
  }

  for (const variant of product.variants) {
    if (!variant.title?.trim()) {
      throw new BadRequestException("Paket seçeneği başlığı zorunludur.");
    }

    if (!variant.sku?.trim()) {
      throw new BadRequestException("Paket seçeneği SKU değeri zorunludur.");
    }

    if (parseDecimalInput(variant.price) === null) {
      throw new BadRequestException("Paket seçeneği fiyatı geçerli olmalıdır.");
    }

    if (variant.compareAtPrice && parseDecimalInput(variant.compareAtPrice) === null) {
      throw new BadRequestException("Eski fiyat geçerli olmalıdır.");
    }
  }

  const featureTitles = new Set<string>();

  for (const feature of normalizeFeaturePayloads(product.features)) {
    const key = feature.title.trim().toLocaleLowerCase("tr-TR");

    if (featureTitles.has(key)) {
      throw new BadRequestException("Aynı kart özelliği birden fazla kez eklenemez.");
    }

    featureTitles.add(key);
  }
}

function normalizeNullableText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCategoryCtaHref(value?: string | null) {
  const normalized = normalizeNullableText(value);

  if (!normalized) {
    return null;
  }

  if (!isSafeCategoryHref(normalized)) {
    throw new BadRequestException(CATEGORY_CTA_HREF_MESSAGE);
  }

  return normalized;
}

function isSafeCategoryHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !/[\u0000-\u001f]/.test(value);
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function withCatalogRevalidation<T extends Record<string, unknown>>(payload: T) {
  return {
    ...payload,
    ...CATALOG_REVALIDATION
  };
}

function normalizeFeaturePayloads(features: SaveProductFeatureDto[]) {
  return features
    .map((feature) => ({
      ...feature,
      title: feature.title?.trim() ?? "",
      description: normalizeNullableText(feature.description) ?? undefined,
      iconKey: normalizeNullableText(feature.iconKey) ?? undefined
    }))
    .filter((feature) => feature.title.length > 0);
}

function parseDecimalInput(value: string) {
  const normalized = normalizeDecimalInput(value);
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function validateMediaUrl(value: string | null | undefined, message: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return;
  }

  try {
    const parsed = new URL(normalized);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new BadRequestException(message);
  }
}

function normalizeCategory(
  category: Prisma.ProductCategoryGetPayload<{ include: typeof catalogCategoryInclude }>
) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    parentSlug: category.parentCategory?.slug ?? null,
    parentName: category.parentCategory?.name ?? null,
    description: category.description,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    ctaHref: category.ctaHref,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    childCategoryCount: category.childCategories.length,
    productCount: category.products.length
  };
}

function normalizeProduct(
  product: Prisma.ProductGetPayload<{ include: typeof catalogProductInclude }>
) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    categorySlug: product.category?.slug ?? null,
    categoryName: product.category?.name ?? null,
    rootCategorySlug: product.category?.parentCategory?.slug ?? product.category?.slug ?? null,
    rootCategoryName: product.category?.parentCategory?.name ?? product.category?.name ?? null,
    categoryIsRoot: product.category ? !product.category.parentCategory : false,
    categoryIsActive: product.category?.isActive ?? null,
    rootCategoryIsActive: product.category?.parentCategory?.isActive ?? product.category?.isActive ?? null,
    shortDescription: product.shortDescription,
    description: product.description,
    type: product.type,
    provider: product.provider,
    publishStatus: product.publishStatus,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    accentColor: product.accentColor,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    coverImageUrl: product.coverImageUrl,
    introVideoSourceType: product.introVideoSourceType,
    introVideoUrl: product.introVideoUrl,
    introVideoPosterUrl: product.introVideoPosterUrl,
    introVideoTitle: product.introVideoTitle,
    variants: product.variants.map((variant) => {
      const externalLink = product.externalProviderLinks.find(
        (link) => link.variantId === variant.id
      );

      return {
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        billingLabel: variant.billingLabel,
        price: variant.price.toFixed(2),
        compareAtPrice: variant.compareAtPrice?.toFixed(2) ?? null,
        currency: variant.currency,
        isDefault: variant.isDefault,
        isActive: variant.isActive,
        hasInstallments: variant.hasInstallments,
        installmentCount: variant.installmentCount,
        sortOrder: variant.sortOrder,
        externalProductId: externalLink?.externalProductId ?? null,
        externalVariantId: externalLink?.externalVariantId ?? null
      };
    }),
    features: product.features.map((feature) => ({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      iconKey: feature.iconKey,
      sortOrder: feature.sortOrder
    }))
  };
}

function normalizeDecimalInput(value: string) {
  const cleaned = value.replace(/[^0-9,.-]/g, "").trim();

  if (!cleaned) {
    return "0.00";
  }

  const lastCommaIndex = cleaned.lastIndexOf(",");
  const lastDotIndex = cleaned.lastIndexOf(".");
  const decimalSeparatorIndex = Math.max(lastCommaIndex, lastDotIndex);

  const normalized =
    decimalSeparatorIndex >= 0
      ? `${cleaned.slice(0, decimalSeparatorIndex).replace(/[.,]/g, "")}.${cleaned
          .slice(decimalSeparatorIndex + 1)
          .replace(/[.,]/g, "")}`
      : cleaned.replace(/[.,]/g, "");

  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed)) {
    return "0.00";
  }

  return parsed.toFixed(2);
}

function normalizeAdminOrderSummary(
  order: Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>
) {
  const payment = order.payments[0] ?? null;
  const redirectMode = order.externalOrders.length > 0;
  const latestExternalOrder = order.externalOrders[0] ?? null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userEmail: order.user.email,
    status: order.status,
    currency: order.currency,
    subtotalAmount: order.subtotalAmount.toFixed(2),
    discountAmount: order.discountAmount.toFixed(2),
    totalAmount: order.totalAmount.toFixed(2),
    placedAt: order.placedAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    note: order.note ?? null,
    paymentStatus: payment?.status ?? PaymentStatus.INITIATED,
    paymentProvider: payment?.provider ?? null,
    redirectMode,
    externalOrderStatus: latestExternalOrder?.status ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      titleSnapshot: item.titleSnapshot,
      skuSnapshot: item.skuSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalAmount: item.totalAmount.toFixed(2),
      provider: item.provider,
      variantTitle: item.variant?.title ?? null,
      productSlug: item.product.slug
    })),
    externalOrders: order.externalOrders.map((externalOrder) => ({
      id: externalOrder.id,
      provider: externalOrder.provider,
      externalReference: externalOrder.externalReference,
      externalProductId: externalOrder.externalProductId,
      externalVariantId: externalOrder.externalVariantId,
      status: externalOrder.status,
      checkoutUrl: externalOrder.checkoutUrl
    }))
  };
}

function validateOrderStatusTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) {
    return;
  }

  if (current === OrderStatus.CANCELLED) {
    throw new BadRequestException("Cancelled orders cannot be reopened from this panel.");
  }

  if (current === OrderStatus.REFUNDED) {
    throw new BadRequestException("Refunded orders cannot be changed from this panel.");
  }

  if (current === OrderStatus.PAID && next !== OrderStatus.REFUNDED) {
    throw new BadRequestException("Paid orders can only move to refunded.");
  }

  if (next === OrderStatus.REFUNDED && current !== OrderStatus.PAID) {
    throw new BadRequestException("Only paid orders can be marked as refunded.");
  }
}

function derivePaymentStatusFromOrderStatus(
  orderStatus: OrderStatus,
  currentPaymentStatus: PaymentStatus | null
) {
  switch (orderStatus) {
    case OrderStatus.PAID:
      return PaymentStatus.PAID;
    case OrderStatus.REFUNDED:
      return PaymentStatus.REFUNDED;
    case OrderStatus.CANCELLED:
      return PaymentStatus.CANCELLED;
    case OrderStatus.FAILED:
      return PaymentStatus.FAILED;
    case OrderStatus.PENDING_PAYMENT:
    case OrderStatus.REDIRECT_PENDING:
    case OrderStatus.AWAITING_CONFIRMATION:
      return PaymentStatus.PENDING;
    case OrderStatus.DRAFT:
    default:
      return currentPaymentStatus;
  }
}

function shouldStampPlacedAt(orderStatus: OrderStatus, placedAt: Date | null) {
  if (placedAt) {
    return false;
  }

  return orderStatus !== OrderStatus.DRAFT;
}

function buildExternalOrderUpdateData(status: ExternalProviderOrderStatus, now: Date) {
  const data: Prisma.ExternalProviderOrderUpdateManyMutationInput = {
    status,
    updatedAt: now
  };

  if (status === ExternalProviderOrderStatus.REDIRECTED) {
    data.redirectedAt = now;
  }

  if (
    status === ExternalProviderOrderStatus.RETURNED_SUCCESS ||
    status === ExternalProviderOrderStatus.RETURNED_FAILURE
  ) {
    data.returnedAt = now;
  }

  if (status === ExternalProviderOrderStatus.CONFIRMED) {
    data.callbackReceivedAt = now;
    data.callbackVerified = true;
    data.lastSyncedAt = now;
  }

  if (
    status === ExternalProviderOrderStatus.FAILED ||
    status === ExternalProviderOrderStatus.CANCELLED
  ) {
    data.lastSyncedAt = now;
  }

  return data;
}

async function syncOrderEnrollmentsForStatus(
  tx: TransactionClient,
  input: {
    userId: string;
    orderId: string;
    status: OrderStatus;
    now: Date;
  }
) {
  const orderItems = await tx.orderItem.findMany({
    where: {
      orderId: input.orderId
    },
    include: {
      product: {
        include: {
          courseLinks: {
            include: {
              course: true
            }
          }
        }
      }
    }
  });

  const linkedCourses = orderItems.flatMap((orderItem) =>
    orderItem.product.courseLinks.map((courseLink) => ({
      orderItemId: orderItem.id,
      productId: orderItem.productId,
      courseId: courseLink.courseId
    }))
  );

  if (!linkedCourses.length) {
    return;
  }

  if (input.status === OrderStatus.PAID) {
    for (const link of linkedCourses) {
      const existing = await tx.enrollment.findFirst({
        where: {
          userId: input.userId,
          orderItemId: link.orderItemId,
          courseId: link.courseId
        }
      });

      if (existing) {
        await tx.enrollment.update({
          where: { id: existing.id },
          data: {
            status: EnrollmentStatus.ACTIVE,
            revokedAt: null,
            accessStartsAt: existing.accessStartsAt ?? input.now,
            accessEndsAt: null
          }
        });
      } else {
        await tx.enrollment.create({
          data: {
            userId: input.userId,
            productId: link.productId,
            courseId: link.courseId,
            orderItemId: link.orderItemId,
            status: EnrollmentStatus.ACTIVE,
            progressPercent: 0,
            accessStartsAt: input.now,
            grantedAt: input.now
          }
        });
      }
    }

    return;
  }

  if (
    input.status === OrderStatus.CANCELLED ||
    input.status === OrderStatus.REFUNDED ||
    input.status === OrderStatus.FAILED
  ) {
    await tx.enrollment.updateMany({
      where: {
        userId: input.userId,
        orderItemId: {
          in: linkedCourses.map((entry) => entry.orderItemId)
        },
        status: EnrollmentStatus.ACTIVE
      },
      data: {
        status: EnrollmentStatus.CANCELLED,
        revokedAt: input.now
      }
    });
  }
}

function buildOrderTimeline(
  order: Prisma.OrderGetPayload<{ include: typeof adminOrderDetailInclude }>,
  auditLogs: Array<
    Prisma.AuditLogGetPayload<{
      include: {
        staffActor: {
          select: {
            firstName: true;
            lastName: true;
            email: true;
          };
        };
        userActor: {
          select: {
            email: true;
          };
        };
      };
    }>
  >
) {
  const events: Array<{
    timestamp: string;
    label: string;
    description: string;
    source: "order" | "payment" | "external" | "audit";
    tone: "neutral" | "success" | "warning" | "danger";
  }> = [];

  events.push({
    timestamp: order.createdAt.toISOString(),
    label: "Order created",
    description: `Order ${order.orderNumber} was created.`,
    source: "order",
    tone: "neutral"
  });

  if (order.placedAt) {
    events.push({
      timestamp: order.placedAt.toISOString(),
      label: "Checkout started",
      description: "The order entered a placed/checkout phase.",
      source: "order",
      tone: "neutral"
    });
  }

  if (order.paidAt) {
    events.push({
      timestamp: order.paidAt.toISOString(),
      label: "Payment marked paid",
      description: "The order has a recorded paid timestamp.",
      source: "order",
      tone: "success"
    });
  }

  if (order.cancelledAt) {
    events.push({
      timestamp: order.cancelledAt.toISOString(),
      label: "Order cancelled",
      description: "The order was cancelled.",
      source: "order",
      tone: "danger"
    });
  }

  for (const payment of order.payments) {
    events.push({
      timestamp: payment.createdAt.toISOString(),
      label: `Payment record created (${payment.provider})`,
      description: `Payment opened with status ${payment.status}.`,
      source: "payment",
      tone: "neutral"
    });

    if (payment.paidAt) {
      events.push({
        timestamp: payment.paidAt.toISOString(),
        label: "Payment timestamp",
        description: `Payment status is ${payment.status}.`,
        source: "payment",
        tone: payment.status === PaymentStatus.PAID ? "success" : "neutral"
      });
    }

    for (const attempt of payment.attempts) {
      events.push({
        timestamp: attempt.attemptedAt.toISOString(),
        label: `Payment attempt: ${attempt.attemptType}`,
        description: attempt.errorMessage
          ? `${attempt.status} - ${attempt.errorMessage}`
          : `${attempt.status}`,
        source: "payment",
        tone:
          attempt.status === PaymentAttemptStatus.FAILED
            ? "danger"
            : attempt.status === PaymentAttemptStatus.SUCCEEDED
              ? "success"
              : "warning"
      });
    }
  }

  for (const externalOrder of order.externalOrders) {
    events.push({
      timestamp: externalOrder.createdAt.toISOString(),
      label: `External order created (${externalOrder.provider})`,
      description: `External status: ${externalOrder.status}.`,
      source: "external",
      tone: "neutral"
    });

    if (externalOrder.redirectedAt) {
      events.push({
        timestamp: externalOrder.redirectedAt.toISOString(),
        label: "Redirected to provider",
        description: externalOrder.checkoutUrl
          ? "Customer was sent to the provider payment page."
          : "Provider redirect was recorded.",
        source: "external",
        tone: "warning"
      });
    }

    if (externalOrder.returnedAt) {
      events.push({
        timestamp: externalOrder.returnedAt.toISOString(),
        label: "Returned from provider",
        description: `Provider status is ${externalOrder.status}.`,
        source: "external",
        tone:
          externalOrder.status === ExternalProviderOrderStatus.RETURNED_FAILURE
            ? "danger"
            : "neutral"
      });
    }

    if (externalOrder.callbackReceivedAt) {
      events.push({
        timestamp: externalOrder.callbackReceivedAt.toISOString(),
        label: "Provider callback received",
        description: externalOrder.callbackVerified
          ? "Callback was recorded as verified."
          : "Callback was recorded but not verified.",
        source: "external",
        tone: externalOrder.callbackVerified ? "success" : "warning"
      });
    }
  }

  for (const auditLog of auditLogs) {
    const actorLabel =
      auditLog.staffActor?.email ??
      auditLog.userActor?.email ??
      auditLog.actorType;

    events.push({
      timestamp: auditLog.createdAt.toISOString(),
      label: auditLog.action,
      description: auditLog.summary
        ? `${auditLog.summary} (${actorLabel})`
        : `Audit event recorded by ${actorLabel}.`,
      source: "audit",
      tone: "neutral"
    });
  }

  return events.sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
}

async function recordAuditLog(
  client: PrismaService | TransactionClient,
  auth: AuthenticatedRequestContext,
  payload: {
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
  }
) {
  if (!auth.actorId) {
    return;
  }

  await client.auditLog.create({
    data: {
      actorType: AuditActorType.STAFF_USER,
      staffUserId: auth.actorId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      summary: payload.summary
    }
  });
}
