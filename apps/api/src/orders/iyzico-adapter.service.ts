import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import Iyzipay from "iyzipay";
import { appEnv } from "../config/env";

type InitializeHostedCheckoutInput = {
  conversationId: string;
  basketId: string;
  price: string;
  paidPrice: string;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    gsmNumber: string;
    identityNumber: string;
    registrationAddress: string;
    city: string;
    country: string;
    zipCode: string;
    ip: string;
    registrationDate: string;
    lastLoginDate: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    category2?: string;
    itemType: "VIRTUAL" | "PHYSICAL";
    price: string;
  }>;
};

type IyzicoInitializeResult = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  paymentPageUrl?: string;
  token?: string;
  conversationId?: string;
  [key: string]: unknown;
};

type IyzicoRetrieveResult = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: string;
  paymentId?: string;
  fraudStatus?: string | number;
  token?: string;
  conversationId?: string;
  paidPrice?: string;
  [key: string]: unknown;
};

@Injectable()
export class IyzicoAdapterService {
  private readonly client = new Iyzipay({
    apiKey: appEnv.paymentApiKey(),
    secretKey: appEnv.paymentSecretKey(),
    uri: appEnv.paymentBaseUrl()
  });

  isConfigured() {
    const provider = appEnv.paymentProvider().trim().toLowerCase();
    const apiKey = appEnv.paymentApiKey().trim();
    const secretKey = appEnv.paymentSecretKey().trim();
    const baseUrl = appEnv.paymentBaseUrl().trim();

    return (
      provider === "iyzico" &&
      apiKey.length > 0 &&
      secretKey.length > 0 &&
      baseUrl.length > 0 &&
      !apiKey.includes("placeholder") &&
      !secretKey.includes("placeholder")
    );
  }

  async initializeHostedCheckout(input: InitializeHostedCheckoutInput) {
    this.ensureConfigured();

    const request = {
      locale: this.client.LOCALE.TR,
      conversationId: input.conversationId,
      price: input.price,
      paidPrice: input.paidPrice,
      currency: this.client.CURRENCY.TRY,
      basketId: input.basketId,
      paymentGroup: this.client.PAYMENT_GROUP.PRODUCT,
      callbackUrl: input.callbackUrl,
      enabledInstallments: [1],
      buyer: input.buyer,
      billingAddress: input.billingAddress,
      basketItems: input.basketItems
    };

    const result = await new Promise<IyzicoInitializeResult>((resolve, reject) => {
      this.client.checkoutFormInitialize.create(
        request,
        (error: Error | null, response: IyzicoInitializeResult) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(response);
        }
      );
    });

    if (result.status !== "success" || !result.paymentPageUrl || !result.token) {
      throw new BadRequestException(
        result.errorMessage || "Ödeme sayfası başlatılamadı. Lütfen tekrar dene."
      );
    }

    return {
      checkoutUrl: result.paymentPageUrl,
      token: result.token,
      rawResponse: result
    };
  }

  async retrieveCheckoutResult(input: { conversationId: string; token: string }) {
    this.ensureConfigured();

    const result = await new Promise<IyzicoRetrieveResult>((resolve, reject) => {
      this.client.checkoutForm.retrieve(
        {
          locale: this.client.LOCALE.TR,
          conversationId: input.conversationId,
          token: input.token
        },
        (error: Error | null, response: IyzicoRetrieveResult) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(response);
        }
      );
    });

    if (result.status !== "success") {
      throw new BadRequestException(
        result.errorMessage || "Ödeme sonucu doğrulanamadı. Lütfen destek ile iletişime geç."
      );
    }

    return result;
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw new InternalServerErrorException(
        "iyzico ödeme sağlayıcısı için gerekli API ayarları eksik."
      );
    }
  }
}
