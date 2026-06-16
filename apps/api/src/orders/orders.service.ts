import {
  AuthActorType,
  ContentStatus,
  Currency,
  EnrollmentStatus,
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
import { RecordOrderReturnDto } from "./dto/record-order-return.dto";
import { PaytrAdapterService } from "./paytr-adapter.service";
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
    private readonly unikazanAdapterService: UnikazanAdapterService,
    private readonly paytrAdapterService: PaytrAdapterService
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
      identityNumber?: string;
      billingAddress?: string;
      billingCity?: string;
      billingDistrict?: string;
      billingZipCode?: string;
      billingCountry?: string;
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
      const localExternalOrder =
        order.externalOrders.find((entry) => entry.provider === ExternalProvider.LOCAL) ?? null;

      if (appPaymentProvider() !== "paytr" || !this.paytrAdapterService.isConfigured()) {
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
          message: "PayTR için canlı anahtarlar henüz yapılandırılmadı.",
          checkoutUrl: null
        };
      }

      const billingProfile = resolveLocalGatewayBillingProfile(order, input);
      const paytrMerchantOrderId = buildPaytrMerchantOrderId(order.orderNumber);
      const checkoutSession = await this.paytrAdapterService.initializeHostedCheckout({
        merchantOrderId: paytrMerchantOrderId,
        email: order.user.email,
        userIp: sanitizeUserIp(input.ipAddress),
        paymentAmount: order.totalAmount.toFixed(2),
        userName: `${billingProfile.firstName} ${billingProfile.lastName}`,
        userAddress: billingProfile.address,
        userPhone: billingProfile.phone,
        okUrl: `${publicAppUrl()}/odeme/durum?order=${encodeURIComponent(order.orderNumber)}&status=success&provider=paytr`,
        failUrl: `${publicAppUrl()}/odeme/durum?order=${encodeURIComponent(order.orderNumber)}&status=failure&provider=paytr`,
        basketItems: order.items.map((item) => ({
          name: item.titleSnapshot,
          unitPrice: item.unitPrice.toFixed(2),
          quantity: item.quantity
        }))
      });

      await this.prisma.$transaction(async (tx) => {
        if (localExternalOrder) {
          await tx.externalProviderOrder.update({
            where: { id: localExternalOrder.id },
            data: {
              status: ExternalProviderOrderStatus.REDIRECT_READY,
              externalReference: paytrMerchantOrderId,
              checkoutUrl: checkoutSession.checkoutUrl,
              redirectToken: checkoutSession.token,
              requestPayload: {
                orderNumber: order.orderNumber,
                paytrMerchantOrderId,
                billingCity: billingProfile.city,
                billingCountry: billingProfile.country
              } as Prisma.InputJsonValue,
              responsePayload: checkoutSession.rawResponse as Prisma.InputJsonValue
            }
          });
        } else {
          await tx.externalProviderOrder.create({
            data: {
              orderId: order.id,
              orderItemId: firstItem.id,
              paymentId: firstPayment.id,
              provider: ExternalProvider.LOCAL,
              externalProductId: firstItem.product.slug,
              externalVariantId: firstItem.variant?.sku ?? firstItem.variantId ?? null,
              externalReference: paytrMerchantOrderId,
              status: ExternalProviderOrderStatus.REDIRECT_READY,
              checkoutUrl: checkoutSession.checkoutUrl,
              redirectToken: checkoutSession.token,
              requestPayload: {
                orderNumber: order.orderNumber,
                paytrMerchantOrderId,
                billingCity: billingProfile.city,
                billingCountry: billingProfile.country
              } as Prisma.InputJsonValue,
              responsePayload: checkoutSession.rawResponse as Prisma.InputJsonValue
            }
          });
        }

        await tx.payment.update({
          where: { id: firstPayment.id },
          data: {
            status: PaymentStatus.PENDING,
            metadata: {
              provider: "paytr",
              paytrMerchantOrderId,
              checkoutToken: checkoutSession.token
            } as Prisma.InputJsonValue
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
              paytrMerchantOrderId,
              provider: "paytr",
              userAgent: input.userAgent ?? null
            },
            responsePayload: checkoutSession.rawResponse as Prisma.InputJsonValue,
            completedAt: new Date()
          }
        });
      });

      return {
        status: "redirect_ready" as const,
        mode: "local_gateway" as const,
        provider: "PAYTR" as const,
        orderNumber: order.orderNumber,
        checkoutUrl: checkoutSession.checkoutUrl,
        redirectUrl: buildPaytrHostedCheckoutPageUrl({
          orderNumber: order.orderNumber,
          token: checkoutSession.token,
          checkoutUrl: checkoutSession.checkoutUrl
        })
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

  async getPublicOrderStatus(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return normalizeReturnSyncResult(order);
  }

  async handlePaytrCallback(
    merchantOrderId: string,
    input: {
      callbackPayload: Record<string, string | undefined>;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const order =
      (await this.prisma.order.findFirst({
        where: {
          externalOrders: {
            some: {
              provider: ExternalProvider.LOCAL,
              externalReference: merchantOrderId
            }
          }
        },
        include: orderInclude
      })) ??
      (await this.prisma.order.findUnique({
        where: { orderNumber: merchantOrderId },
        include: orderInclude
      }));

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    const primaryPayment = order.payments[0] ?? null;
    const externalOrder =
      order.externalOrders.find(
        (entry) =>
          entry.provider === ExternalProvider.LOCAL &&
          (entry.externalReference === merchantOrderId || entry.externalReference === null)
      ) ?? null;

    if (!primaryPayment || !externalOrder) {
      throw new BadRequestException("Bu sipariş PayTR ödeme akışına bağlı değil.");
    }

    const result = this.paytrAdapterService.verifyCallback(input.callbackPayload);
    const expectedTotalAmount = decimalAmountToPaytrKurus(order.totalAmount);
    const receivedTotalAmount = normalizePaytrKurus(result.totalAmount);
    const amountVerified = receivedTotalAmount === expectedTotalAmount;
    const amountMismatch = !amountVerified;
    const paymentSucceeded = result.status === "success" && amountVerified;
    const now = new Date();

    if (
      order.status === OrderStatus.PAID &&
      primaryPayment.status === PaymentStatus.PAID &&
      externalOrder.status === ExternalProviderOrderStatus.CONFIRMED &&
      externalOrder.callbackVerified
    ) {
      return "OK";
    }

    const nextOrderStatus = paymentSucceeded ? OrderStatus.PAID : OrderStatus.FAILED;
    const nextPaymentStatus = paymentSucceeded ? PaymentStatus.PAID : PaymentStatus.FAILED;
    const nextExternalStatus = paymentSucceeded
      ? ExternalProviderOrderStatus.CONFIRMED
      : ExternalProviderOrderStatus.FAILED;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextOrderStatus,
          placedAt: order.placedAt ?? now,
          paidAt: paymentSucceeded ? now : null,
          cancelledAt: null
        }
      });

      await tx.payment.update({
        where: { id: primaryPayment.id },
        data: {
          status: nextPaymentStatus,
          providerReference: result.merchantOrderId,
          providerTransactionId: result.merchantOrderId,
          failureReason: paymentSucceeded
            ? null
            : amountMismatch
              ? "PayTR ödeme tutarı sipariş tutarıyla eşleşmedi."
              : result.failedReasonMessage || "PayTR ödeme başarısız oldu.",
          metadata: {
            ...result,
            orderNumber: order.orderNumber,
            amountVerified,
            expectedTotalAmount,
            receivedTotalAmount
          } as Prisma.InputJsonValue,
          paidAt: paymentSucceeded ? now : null
        }
      });

      await tx.externalProviderOrder.update({
        where: { id: externalOrder.id },
        data: {
          externalReference: result.merchantOrderId,
          status: nextExternalStatus,
          redirectToken: externalOrder.redirectToken,
          redirectedAt: externalOrder.redirectedAt ?? now,
          returnedAt: now,
          callbackReceivedAt: now,
          callbackVerified: amountVerified,
          externalStatus: amountMismatch ? "amount_mismatch" : result.status,
          responsePayload: {
            ...result,
            orderNumber: order.orderNumber,
            amountVerified,
            expectedTotalAmount,
            receivedTotalAmount
          } as Prisma.InputJsonValue,
          callbackPayload: {
            source: "paytr_callback",
            orderNumber: order.orderNumber,
            merchantOrderId: result.merchantOrderId,
            paymentAmount: result.paymentAmount,
            totalAmount: result.totalAmount,
            expectedTotalAmount,
            amountVerified,
            paymentType: result.paymentType,
            userAgent: input.userAgent ?? null,
            userIp: sanitizeUserIp(input.ipAddress),
            recordedAt: now.toISOString()
          } as Prisma.InputJsonValue,
          lastSyncedAt: now
        }
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId: primaryPayment.id,
          attemptType: PaymentAttemptType.WEBHOOK,
          status: paymentSucceeded ? PaymentAttemptStatus.SUCCEEDED : PaymentAttemptStatus.FAILED,
          requestPayload: {
            orderNumber: order.orderNumber,
            merchantOrderId,
            callbackPayload: input.callbackPayload,
            userAgent: input.userAgent ?? null,
            userIp: sanitizeUserIp(input.ipAddress)
          },
          responsePayload: {
            ...result,
            orderNumber: order.orderNumber,
            amountVerified,
            expectedTotalAmount,
            receivedTotalAmount
          } as Prisma.InputJsonValue,
          errorMessage: paymentSucceeded
            ? null
            : amountMismatch
              ? `PayTR amount mismatch. Expected ${expectedTotalAmount}, received ${receivedTotalAmount}.`
              : result.failedReasonMessage ?? "Payment failed",
          completedAt: now
        }
      });

      await syncOrderEnrollmentsForStatus(tx, {
        userId: order.userId,
        orderId: order.id,
        status: nextOrderStatus,
        now
      });
    });

    return "OK";
  }

  async recordProviderReturn(
    orderNumber: string,
    payload: RecordOrderReturnDto,
    input: {
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    const primaryPayment = order.payments[0] ?? null;
    const externalOrder = order.externalOrders[0] ?? null;

    if (!primaryPayment || !externalOrder || externalOrder.provider !== ExternalProvider.UNIKAZAN) {
      throw new BadRequestException("This order is not backed by a Unikazan checkout flow.");
    }

    if (payload.status === "pending") {
      return normalizeReturnSyncResult(order);
    }

    if (
      order.status === OrderStatus.PAID ||
      externalOrder.status === ExternalProviderOrderStatus.CONFIRMED
    ) {
      return normalizeReturnSyncResult(order);
    }

    const now = new Date();
    const isSuccessReturn = payload.status === "success";
    const nextOrderStatus = isSuccessReturn
      ? OrderStatus.AWAITING_CONFIRMATION
      : OrderStatus.FAILED;
    const nextPaymentStatus = isSuccessReturn ? PaymentStatus.PENDING : PaymentStatus.FAILED;
    const nextExternalStatus = isSuccessReturn
      ? ExternalProviderOrderStatus.RETURNED_SUCCESS
      : ExternalProviderOrderStatus.RETURNED_FAILURE;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextOrderStatus,
          placedAt: order.placedAt ?? now,
          paidAt: isSuccessReturn ? order.paidAt : null,
          cancelledAt: null
        }
      });

      await tx.payment.update({
        where: { id: primaryPayment.id },
        data: {
          status: nextPaymentStatus,
          paidAt: null,
          failureReason: isSuccessReturn ? null : "Provider returned failure status."
        }
      });

      await tx.externalProviderOrder.update({
        where: { id: externalOrder.id },
        data: {
          status: nextExternalStatus,
          externalReference: payload.externalReference ?? externalOrder.externalReference,
          externalStatus: payload.rawStatus ?? payload.status,
          returnedAt: externalOrder.returnedAt ?? now,
          callbackPayload: {
            source: "return_url",
            status: payload.status,
            rawStatus: payload.rawStatus ?? null,
            userAgent: input.userAgent ?? null,
            userIp: sanitizeUserIp(input.ipAddress),
            recordedAt: now.toISOString()
          } as Prisma.InputJsonValue
        }
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId: primaryPayment.id,
          attemptType: PaymentAttemptType.REDIRECT_RETURN,
          status: isSuccessReturn
            ? PaymentAttemptStatus.SUCCEEDED
            : PaymentAttemptStatus.FAILED,
          requestPayload: {
            orderNumber,
            status: payload.status,
            externalReference: payload.externalReference ?? null,
            userAgent: input.userAgent ?? null,
            userIp: sanitizeUserIp(input.ipAddress)
          },
          responsePayload: {
            rawStatus: payload.rawStatus ?? null
          },
          errorMessage: isSuccessReturn ? null : "Provider returned failure status.",
          completedAt: now
        }
      });

      await syncOrderEnrollmentsForStatus(tx, {
        userId: order.userId,
        orderId: order.id,
        status: nextOrderStatus,
        now
      });
    });

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: orderInclude
    });

    if (!updatedOrder) {
      throw new NotFoundException("The updated order could not be reloaded.");
    }

    return normalizeReturnSyncResult(updatedOrder);
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

function buildPaytrHostedCheckoutPageUrl(input: {
  orderNumber: string;
  token: string;
  checkoutUrl: string;
}) {
  const params = new URLSearchParams({
    order: input.orderNumber,
    token: input.token,
    checkoutUrl: input.checkoutUrl
  });

  return `${publicAppUrl()}/odeme/paytr?${params.toString()}`;
}

function decimalAmountToPaytrKurus(amount: Prisma.Decimal) {
  const fixed = amount.toFixed(2);
  const match = /^(\d+)\.(\d{2})$/.exec(fixed);

  if (!match) {
    throw new BadRequestException("Geçersiz sipariş tutarı.");
  }

  return normalizePaytrKurus(`${match[1]}${match[2]}`);
}

function normalizePaytrKurus(value: string) {
  const normalized = value.trim();

  if (!/^\d+$/.test(normalized)) {
    throw new BadRequestException("PayTR ödeme tutarı geçersiz.");
  }

  return normalized.replace(/^0+(?=\d)/, "");
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

function normalizeReturnSyncResult(
  order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>
) {
  const payment = order.payments[0] ?? null;
  const externalOrder = order.externalOrders[0] ?? null;

  if (
    order.status === OrderStatus.PAID ||
    externalOrder?.status === ExternalProviderOrderStatus.CONFIRMED
  ) {
    return {
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentStatus: payment?.status ?? null,
      externalStatus: externalOrder?.status ?? null,
      verified: Boolean(externalOrder?.callbackVerified),
      result: "confirmed" as const,
      message: "Ödeme doğrulandı. Sipariş aktif olarak işleniyor."
    };
  }

  if (
    order.status === OrderStatus.FAILED ||
    externalOrder?.status === ExternalProviderOrderStatus.RETURNED_FAILURE
  ) {
    return {
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentStatus: payment?.status ?? null,
      externalStatus: externalOrder?.status ?? null,
      verified: Boolean(externalOrder?.callbackVerified),
      result: "failed" as const,
      message: "Ödeme tamamlanamadı. Siparişi yeniden başlatabilir veya destek alabilirsin."
    };
  }

  if (
    order.status === OrderStatus.AWAITING_CONFIRMATION ||
    externalOrder?.status === ExternalProviderOrderStatus.RETURNED_SUCCESS ||
    externalOrder?.status === ExternalProviderOrderStatus.REDIRECT_READY
  ) {
    return {
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentStatus: payment?.status ?? null,
      externalStatus: externalOrder?.status ?? null,
      verified: Boolean(externalOrder?.callbackVerified),
      result: "awaiting_confirmation" as const,
      message: "Ödeme sağlayıcısından dönüş alındı. Kesin ödeme doğrulaması bekleniyor."
    };
  }

  return {
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: payment?.status ?? null,
    externalStatus: externalOrder?.status ?? null,
    verified: Boolean(externalOrder?.callbackVerified),
    result: "pending" as const,
    message: "Ödeme durumu işleniyor. Lütfen kısa süre sonra tekrar kontrol et."
  };
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
          courseLinks: true
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

function resolveLocalGatewayBillingProfile(
  order: Prisma.OrderGetPayload<{ include: typeof checkoutOrderInclude }>,
  input: {
    identityNumber?: string;
    billingAddress?: string;
    billingCity?: string;
    billingDistrict?: string;
    billingZipCode?: string;
    billingCountry?: string;
  }
) {
  const firstName = order.user.profile?.firstName?.trim();
  const lastName = order.user.profile?.lastName?.trim();

  if (!firstName || !lastName) {
    throw new BadRequestException("Ödeme için öğrenci ad ve soyad bilgisi gerekli.");
  }

  const identityNumber = input.identityNumber?.replace(/\D+/g, "") ?? "";

  if (!identityNumber) {
    throw new BadRequestException("T.C. kimlik numaranızı girmeniz gerekiyor.");
  }

  if (identityNumber.length !== 11) {
    throw new BadRequestException("T.C. kimlik numarası 11 haneli olmalıdır.");
  }

  const address = input.billingAddress?.trim();
  const city = input.billingCity?.trim() || order.user.profile?.city?.trim() || "";
  const district = input.billingDistrict?.trim() || order.user.profile?.district?.trim() || "";
  const country = input.billingCountry?.trim() || "Türkiye";
  const zipCode = input.billingZipCode?.trim() || "34000";
  const phoneCandidate =
    order.user.phone?.trim() || order.user.profile?.parentPhone?.trim() || "";

  if (!address) {
    throw new BadRequestException("Fatura adresi zorunludur.");
  }

  if (!city) {
    throw new BadRequestException("İl alanı zorunludur.");
  }

  if (!district) {
    throw new BadRequestException("İlçe alanı zorunludur.");
  }

  const phone = normalizePhoneForGateway(phoneCandidate);

  if (!phone) {
    throw new BadRequestException("Ödeme için geçerli telefon numarası gereklidir.");
  }

  return {
    firstName,
    lastName,
    identityNumber,
    address: district ? `${address}, ${district}` : address,
    city,
    country,
    zipCode,
    phone
  };
}

function buildPaytrMerchantOrderId(orderNumber: string) {
  const merchantOrderId = orderNumber.replace(/[^a-z0-9]/gi, "").toUpperCase();

  if (!merchantOrderId) {
    throw new BadRequestException("Ödeme başlatılırken bir sorun oluştu. Lütfen tekrar deneyin.");
  }

  return merchantOrderId;
}

function normalizePhoneForGateway(phone: string) {
  const digits = phone.replace(/\D+/g, "");

  if (digits.length === 10) {
    return `+90${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+90${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith("90")) {
    return `+${digits}`;
  }

  return null;
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



