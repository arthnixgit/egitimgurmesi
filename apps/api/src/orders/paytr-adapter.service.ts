import { createHmac, timingSafeEqual } from "node:crypto";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { appEnv } from "../config/env";

type InitializeHostedCheckoutInput = {
  merchantOrderId: string;
  email: string;
  userIp: string;
  paymentAmount: string;
  userName: string;
  userAddress: string;
  userPhone: string;
  okUrl: string;
  failUrl: string;
  basketItems: Array<{
    name: string;
    unitPrice: string;
    quantity: number;
  }>;
};

type PaytrInitializeResponse = {
  status: "success" | "failed";
  reason?: string;
  token?: string;
  [key: string]: unknown;
};

type PaytrCallbackPayload = {
  merchant_oid?: string;
  status?: string;
  total_amount?: string;
  payment_amount?: string;
  payment_type?: string;
  currency?: string;
  failed_reason_code?: string;
  failed_reason_msg?: string;
  test_mode?: string;
  hash?: string;
};

@Injectable()
export class PaytrAdapterService {
  isConfigured() {
    const provider = appEnv.paymentProvider().trim().toLowerCase();
    const merchantId = appEnv.paymentMerchantId().trim();
    const merchantKey = appEnv.paymentApiKey().trim();
    const merchantSalt = appEnv.paymentSecretKey().trim();

    return (
      provider === "paytr" &&
      merchantId.length > 0 &&
      merchantKey.length > 0 &&
      merchantSalt.length > 0 &&
      !merchantId.includes("placeholder") &&
      !merchantKey.includes("placeholder") &&
      !merchantSalt.includes("placeholder")
    );
  }

  async initializeHostedCheckout(input: InitializeHostedCheckoutInput) {
    this.ensureConfigured();

    const merchantId = appEnv.paymentMerchantId().trim();
    const merchantKey = appEnv.paymentApiKey().trim();
    const merchantSalt = appEnv.paymentSecretKey().trim();
    const baseUrl = appEnv.paymentBaseUrl().trim() || "https://www.paytr.com";
    const testMode = baseUrl.includes("sandbox") ? "1" : "0";
    const basket = Buffer.from(
      JSON.stringify(
        input.basketItems.map((item) => [item.name, item.unitPrice, item.quantity])
      )
    ).toString("base64");
    const paymentAmount = normalizePaymentAmount(input.paymentAmount);

    const hashStr =
      merchantId +
      input.userIp +
      input.merchantOrderId +
      input.email +
      paymentAmount +
      basket +
      "0" +
      "0" +
      "TRY" +
      testMode;

    const paytrToken = createHmac("sha256", merchantKey)
      .update(hashStr + merchantSalt)
      .digest("base64");

    const form = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: input.userIp,
      merchant_oid: input.merchantOrderId,
      email: input.email,
      payment_amount: paymentAmount,
      paytr_token: paytrToken,
      user_basket: basket,
      debug_on: testMode,
      no_installment: "0",
      max_installment: "0",
      user_name: input.userName,
      user_address: input.userAddress,
      user_phone: input.userPhone,
      merchant_ok_url: input.okUrl,
      merchant_fail_url: input.failUrl,
      timeout_limit: "30",
      currency: "TRY",
      test_mode: testMode,
      lang: "tr",
      iframe_v2: "1",
      iframe_v2_dark: "0"
    });

    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/odeme/api/get-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });

    const result = (await response.json()) as PaytrInitializeResponse;

    if (!response.ok || result.status !== "success" || !result.token) {
      throw new BadRequestException(
        result.reason || "PayTR ödeme oturumu başlatılamadı. Lütfen tekrar dene."
      );
    }

    return {
      token: result.token,
      checkoutUrl: `${normalizeBaseUrl(baseUrl)}/odeme/guvenli/${result.token}`,
      rawResponse: result
    };
  }

  verifyCallback(input: PaytrCallbackPayload) {
    this.ensureConfigured();

    const merchantKey = appEnv.paymentApiKey().trim();
    const merchantSalt = appEnv.paymentSecretKey().trim();
    const merchantOrderId = input.merchant_oid ?? "";
    const status = input.status ?? "";
    const totalAmount = input.total_amount ?? "";
    const receivedHash = input.hash ?? "";

    if (!merchantOrderId || !status || !totalAmount || !receivedHash) {
      throw new BadRequestException("PayTR callback payload is incomplete.");
    }

    const calculated = createHmac("sha256", merchantKey)
      .update(merchantOrderId + merchantSalt + status + totalAmount)
      .digest("base64");

    const expectedBuffer = Buffer.from(calculated);
    const receivedBuffer = Buffer.from(receivedHash);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new BadRequestException("PayTR callback signature is invalid.");
    }

    return {
      status,
      merchantOrderId,
      totalAmount,
      paymentAmount: input.payment_amount ?? totalAmount,
      paymentType: input.payment_type ?? null,
      currency: input.currency ?? "TRY",
      failedReasonCode: input.failed_reason_code ?? null,
      failedReasonMessage: input.failed_reason_msg ?? null,
      testMode: input.test_mode === "1",
      rawPayload: input
    };
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw new InternalServerErrorException("PayTR ayarları eksik.");
    }
  }
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePaymentAmount(value: string) {
  const numeric = Number.parseFloat(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new BadRequestException("Geçersiz ödeme tutarı.");
  }

  return String(Math.round(numeric * 100));
}
