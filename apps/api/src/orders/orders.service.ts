import {
  AuthActorType,
  ContentStatus,
  Currency,
  ExternalProvider,
  ExternalProviderOrderStatus,
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentAttemptStatus,
  PaymentAttemptType,
  PaymentStatus,
  Prisma
} from "@ega/db";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { appEnv } from "../config/env";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { CreateOrderDto } from "./dto/create-order.dto";
import { LinkUnikazanAccountDto } from "./dto/link-unikazan-account.dto";
import { UnikazanAdapterService } from "./unikazan-adapter.service";

const orderInclude = {
  items: {
    orderBy: [{ createdAt: "asc" }],
    include: {
      product: {
        select: {
          slug: true
        }
      },
      variant: {
        select: {
          title: true,
          sku: true,
          billingLabel: true
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

const checkoutOrderInclude = {
  user: {
    include: {
      profile: true,
      studentProfile: true,
      externalAccounts: true
    }
  },
  items: {
    orderBy: [{ createdAt: "asc" }],
    include: {
      product: {
        include: {
          category: {
            include: {
              parentCategory: true
            }
          },
          externalProviderLinks: {
            where: {
              isActive: true
            }
          }
        }
      },
      variant: true
    }
  },
  payments: {
    orderBy: [{ createdAt: "asc" }]
  },
  externalOrders: {
    orderBy: [{ createdAt: "asc" }]
  }
} satisfies Prisma.OrderInclude;

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unikazanAdapterService: UnikazanAdapterService
  ) {}

  async createOrder(auth: AuthenticatedRequestContext, payload: CreateOrderDto) {
    ensureUserActor(auth);

    const normalizedItems = mergeDuplicateItems(payload.items);
    const variantIds = normalizedItems.map((item) => item.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds
        },
        isActive: true
      },
      include: {
        product: {
          include: {
            externalProviderLinks: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException("One or more selected variants could not be found.");
    }

    for (const variant of variants) {
      if (variant.product.publishStatus !== ContentStatus.PUBLISHED) {
        throw new BadRequestException(
          `The product "${variant.product.name}" is not available for checkout.`
        );
      }
    }

    const providerSet = new Set(variants.map((variant) => variant.product.provider));

    if (providerSet.size > 1) {
      throw new BadRequestException(
        "Mixed-provider checkout is not supported in the current order core."
      );
    }

    const provider = variants[0]?.product.provider ?? ExternalProvider.LOCAL;

    const coupon = payload.couponCode
      ? await this.resolveCoupon(payload.couponCode, variants.map((variant) => variant.product.id))
      : null;

    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tx);
      const subtotalAmount = normalizedItems.reduce((total, item) => {
        const variant = variants.find((entry) => entry.id === item.variantId)!;
        return total.add(variant.price.mul(item.quantity));
      }, new Prisma.Decimal(0));

      const discountAmount = calculateDiscountAmount(coupon, subtotalAmount);
      const totalAmount = subtotalAmount.sub(discountAmount);

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: auth.actorId,
          couponId: coupon?.id,
          status:
            provider === ExternalProvider.UNIKAZAN
              ? OrderStatus.REDIRECT_PENDING
              : OrderStatus.PENDING_PAYMENT,
          currency: Currency.TRY,
          subtotalAmount,
          discountAmount,
          taxAmount: new Prisma.Decimal(0),
          totalAmount
        }
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider:
            provider === ExternalProvider.UNIKAZAN
              ? PaymentProvider.UNIKAZAN
              : PaymentProvider.LOCAL_GATEWAY,
          method:
            provider === ExternalProvider.UNIKAZAN
              ? PaymentMethod.EXTERNAL_REDIRECT
              : PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.INITIATED,
          amount: totalAmount,
          currency: Currency.TRY
        }
      });

      for (const item of normalizedItems) {
        const variant = variants.find((entry) => entry.id === item.variantId)!;
        const itemTotal = variant.price.mul(item.quantity);

        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: variant.productId,
            variantId: variant.id,
            titleSnapshot: variant.product.name,
            skuSnapshot: variant.sku,
            quantity: item.quantity,
            unitPrice: variant.price,
            discountAmount: new Prisma.Decimal(0),
            totalAmount: itemTotal,
            currency: Currency.TRY,
            provider: variant.product.provider
          }
        });

        if (variant.product.provider === ExternalProvider.UNIKAZAN) {
          const externalLink =
            variant.product.externalProviderLinks.find((link) => link.variantId === variant.id) ??
            variant.product.externalProviderLinks[0] ??
            null;

          await tx.externalProviderOrder.create({
            data: {
              orderId: order.id,
              orderItemId: orderItem.id,
              paymentId: payment.id,
              provider: ExternalProvider.UNIKAZAN,
              externalProductId: externalLink?.externalProductId ?? null,
              externalVariantId: externalLink?.externalVariantId ?? null,
              status: "CREATED"
            }
          });
        }
      }

      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usageCount: {
              increment: 1
            }
          }
        });
      }

      const createdOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: orderInclude
      });

      if (!createdOrder) {
        throw new NotFoundException("The created order could not be reloaded.");
      }

      return normalizeOrder(createdOrder);
    });
  }

  async listMyOrders(auth: AuthenticatedRequestContext) {
    ensureUserActor(auth);

    const orders = await this.prisma.order.findMany({
      where: {
        userId: auth.actorId
      },
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }]
    });

    return orders.map(normalizeOrder);
  }

  async getMyOrder(auth: AuthenticatedRequestContext, orderNumber: string) {
    ensureUserActor(auth);

    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        userId: auth.actorId
      },
      include: orderInclude
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return normalizeOrder(order);
  }

  async linkUnikazanAccount(
    auth: AuthenticatedRequestContext,
    payload: LinkUnikazanAccountDto
  ) {
    ensureUserActor(auth);

    const unikazanLogin = await this.unikazanAdapterService.login(
      payload.email,
      payload.password
    );

    const link = await this.prisma.externalAccountLink.upsert({
      where: {
        userId_provider: {
          userId: auth.actorId,
          provider: ExternalProvider.UNIKAZAN
        }
      },
      create: {
        userId: auth.actorId,
        provider: ExternalProvider.UNIKAZAN,
        externalUserId: unikazanLogin.user?.id ? String(unikazanLogin.user.id) : undefined,
        externalEmail: unikazanLogin.user?.email ?? payload.email.toLowerCase(),
        refreshToken: unikazanLogin.refreshToken,
        metadata: unikazanLogin.user ?? undefined,
        linkedAt: new Date()
      },
      update: {
        externalUserId: unikazanLogin.user?.id ? String(unikazanLogin.user.id) : undefined,
        externalEmail: unikazanLogin.user?.email ?? payload.email.toLowerCase(),
        refreshToken: unikazanLogin.refreshToken,
        metadata: unikazanLogin.user ?? undefined,
        linkedAt: new Date()
      }
    });

    return {
      status: "linked" as const,
      provider: ExternalProvider.UNIKAZAN,
      externalEmail: link.externalEmail,
      linkedAt: link.linkedAt.toISOString()
    };
  }

  async startCheckout(
    auth: AuthenticatedRequestContext,
    orderNumber: string,
    input: {
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    ensureUserActor(auth);

    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        userId: auth.actorId
      },
      include: checkoutOrderInclude
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException("This order is already marked as paid.");
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException("This order cannot be checked out anymore.");
    }

    const firstItem = order.items[0] ?? null;
    const firstPayment = order.payments[0] ?? null;

    if (!firstItem || !firstPayment) {
      throw new BadRequestException("Order is missing checkout records.");
    }

    if (firstItem.provider === ExternalProvider.LOCAL) {
      await this.prisma.paymentAttempt.create({
        data: {
          paymentId: firstPayment.id,
          attemptType: PaymentAttemptType.CHECKOUT_INITIATED,
          status: PaymentAttemptStatus.PENDING,
          requestPayload: {
            provider: appPaymentProvider(),
            userAgent: input.userAgent ?? null
          }
        }
      });

      await this.prisma.payment.update({
        where: { id: firstPayment.id },
        data: {
          status: PaymentStatus.PENDING
        }
      });

      return {
        status: "gateway_pending" as const,
        mode: "local" as const,
        orderNumber: order.orderNumber,
        paymentProvider: appPaymentProvider(),
        message:
          "Local payment gateway foundation is ready, but the hosted gateway flow is not configured yet.",
        checkoutUrl: null
      };
    }

    const externalLink = order.user.externalAccounts.find(
      (entry) => entry.provider === ExternalProvider.UNIKAZAN
    );

    if (!externalLink) {
      return {
        status: "link_required" as const,
        mode: "external_redirect" as const,
        provider: ExternalProvider.UNIKAZAN,
        orderNumber: order.orderNumber,
        message:
          "Unikazan coaching checkout requires the student to link an existing Unikazan account first."
      };
    }

    const externalOrder = order.externalOrders[0] ?? null;

    if (!externalOrder) {
      throw new BadRequestException("External redirect record is missing for this order.");
    }

    if (
      externalOrder.checkoutUrl &&
      externalOrder.status === ExternalProviderOrderStatus.REDIRECT_READY
    ) {
      return {
        status: "redirect_ready" as const,
        mode: "external_redirect" as const,
        provider: ExternalProvider.UNIKAZAN,
        orderNumber: order.orderNumber,
        redirectUrl: externalOrder.checkoutUrl
      };
    }

    const packageId = externalOrder.externalProductId;

    if (!packageId) {
      return {
        status: "mapping_required" as const,
        mode: "external_redirect" as const,
        provider: ExternalProvider.UNIKAZAN,
        orderNumber: order.orderNumber,
        message:
          "This coaching variant is not mapped to a Unikazan package yet. Set externalProductId in the catalog."
      };
    }

    if (!/^\d+$/.test(packageId)) {
      return {
        status: "mapping_required" as const,
        mode: "external_redirect" as const,
        provider: ExternalProvider.UNIKAZAN,
        orderNumber: order.orderNumber,
        message:
          "This coaching variant is not mapped to a numeric Unikazan package id yet."
      };
    }

    if (!this.unikazanAdapterService.isConfigured()) {
      return {
        status: "provider_not_configured" as const,
        mode: "external_redirect" as const,
        provider: ExternalProvider.UNIKAZAN,
        orderNumber: order.orderNumber,
        message: "Unikazan integration keys are not configured in the API environment."
      };
    }

    let checkoutSession: Awaited<
      ReturnType<UnikazanAdapterService["createCheckoutSession"]>
    >;

    try {
      checkoutSession = await this.unikazanAdapterService.createCheckoutSession({
        refreshToken: externalLink.refreshToken,
        packageId,
        okUrl: `${publicAppUrl()}/odeme/durum?order=${encodeURIComponent(order.orderNumber)}&status=success`,
        failUrl: `${publicAppUrl()}/odeme/durum?order=${encodeURIComponent(order.orderNumber)}&status=failure`,
        userIp: sanitizeUserIp(input.ipAddress),
        studentDetail: {
          gradeLevel: order.user.studentProfile?.gradeLevel,
          studyTrack: order.user.studentProfile?.studyTrack,
          inferredStudyTrack: inferStudyTrackFromOrder(order)
        }
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        return {
          status: "profile_incomplete" as const,
          mode: "external_redirect" as const,
          provider: ExternalProvider.UNIKAZAN,
          orderNumber: order.orderNumber,
          message: error.message
        };
      }

      throw error;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.externalAccountLink.update({
        where: {
          userId_provider: {
            userId: order.userId,
            provider: ExternalProvider.UNIKAZAN
          }
        },
        data: {
          refreshToken: checkoutSession.refreshToken,
          linkedAt: new Date()
        }
      });

      await tx.externalProviderOrder.update({
        where: { id: externalOrder.id },
        data: {
          externalReference: checkoutSession.externalReference,
          status: ExternalProviderOrderStatus.REDIRECT_READY,
          checkoutUrl: checkoutSession.checkoutUrl,
          responsePayload: checkoutSession.rawResponse as Prisma.InputJsonValue
        }
      });

      await tx.payment.update({
        where: { id: firstPayment.id },
        data: {
          status: PaymentStatus.PENDING
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.AWAITING_CONFIRMATION
        }
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId: firstPayment.id,
          attemptType: PaymentAttemptType.REDIRECT_CREATED,
          status: PaymentAttemptStatus.SUCCEEDED,
          requestPayload: {
            orderNumber: order.orderNumber,
            packageId,
            userAgent: input.userAgent ?? null
          },
          responsePayload: checkoutSession.rawResponse as Prisma.InputJsonValue,
          completedAt: new Date()
        }
      });
    });

    return {
      status: "redirect_ready" as const,
      mode: "external_redirect" as const,
      provider: ExternalProvider.UNIKAZAN,
      orderNumber: order.orderNumber,
      redirectUrl: checkoutSession.checkoutUrl
    };
  }

  private async resolveCoupon(code: string, productIds: string[]) {
    const coupon = await this.prisma.coupon.findUnique({
      where: {
        code: code.trim().toUpperCase()
      },
      include: {
        productLinks: true
      }
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException("Coupon could not be applied.");
    }

    const now = new Date();

    if ((coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now)) {
      throw new BadRequestException("Coupon is not active right now.");
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException("Coupon usage limit has been reached.");
    }

    if (!coupon.appliesToAllProducts) {
      const allowedProductIds = new Set(coupon.productLinks.map((link) => link.productId));
      const hasUnsupportedProduct = productIds.some((productId) => !allowedProductIds.has(productId));

      if (hasUnsupportedProduct) {
        throw new BadRequestException("Coupon does not apply to the selected products.");
      }
    }

    return coupon;
  }
}

function publicAppUrl() {
  return appEnv.publicAppUrl().replace(/\/+$/, "");
}

function appPaymentProvider() {
  return appEnv.paymentProvider();
}

function ensureUserActor(auth: AuthenticatedRequestContext) {
  if (auth.actorType !== AuthActorType.USER) {
    throw new ForbiddenException("This operation is only available for student accounts.");
  }
}

function mergeDuplicateItems(items: CreateOrderDto["items"]) {
  const quantityByVariantId = new Map<string, number>();

  for (const item of items) {
    quantityByVariantId.set(item.variantId, (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity);
  }

  return Array.from(quantityByVariantId.entries()).map(([variantId, quantity]) => ({
    variantId,
    quantity
  }));
}

function calculateDiscountAmount(
  coupon: {
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: Prisma.Decimal;
  } | null,
  subtotalAmount: Prisma.Decimal
) {
  if (!coupon) {
    return new Prisma.Decimal(0);
  }

  if (coupon.discountType === "PERCENTAGE") {
    return subtotalAmount.mul(coupon.discountValue).div(100);
  }

  return coupon.discountValue.greaterThan(subtotalAmount)
    ? subtotalAmount
    : coupon.discountValue;
}

async function generateOrderNumber(tx: TransactionClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0")
    ].join("");
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    const candidate = `EGA-${stamp}-${suffix}`;
    const existing = await tx.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new BadRequestException("A unique order number could not be generated.");
}

function normalizeOrder(
  order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>
) {
  const payment = order.payments[0] ?? null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    currency: order.currency,
    subtotalAmount: order.subtotalAmount.toFixed(2),
    discountAmount: order.discountAmount.toFixed(2),
    totalAmount: order.totalAmount.toFixed(2),
    placedAt: order.placedAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    payment: payment
      ? {
          provider: payment.provider,
          method: payment.method,
          status: payment.status,
          amount: payment.amount.toFixed(2)
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      titleSnapshot: item.titleSnapshot,
      skuSnapshot: item.skuSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalAmount: item.totalAmount.toFixed(2),
      provider: item.provider,
      productSlug: item.product.slug,
      variantTitle: item.variant?.title ?? null,
      billingLabel: item.variant?.billingLabel ?? null
    })),
    externalOrders: order.externalOrders.map((externalOrder) => ({
      id: externalOrder.id,
      provider: externalOrder.provider,
      status: externalOrder.status,
      externalProductId: externalOrder.externalProductId,
      externalVariantId: externalOrder.externalVariantId,
      checkoutUrl: externalOrder.checkoutUrl
    }))
  };
}

function sanitizeUserIp(ipAddress?: string) {
  if (!ipAddress || ipAddress === "::1" || ipAddress === "127.0.0.1") {
    return "11.111.111.111";
  }

  if (ipAddress.includes(",")) {
    return ipAddress.split(",")[0].trim();
  }

  return ipAddress;
}

function inferStudyTrackFromOrder(
  order: Prisma.OrderGetPayload<{ include: typeof checkoutOrderInclude }>
) {
  const rootCategorySlug =
    order.items[0]?.product.category?.parentCategory?.slug ??
    order.items[0]?.product.category?.slug ??
    "";
  const subcategorySlug = order.items[0]?.product.category?.slug ?? "";

  if (subcategorySlug.includes("lgs") || rootCategorySlug.includes("lgs")) {
    return "LGS";
  }

  if (subcategorySlug.includes("kpss") || rootCategorySlug.includes("kpss")) {
    return "KPSS";
  }

  return null;
}
