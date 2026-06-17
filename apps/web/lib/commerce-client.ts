"use client";

import {
  ApiRequestError,
  clearUserTokens,
  getUserAccessToken,
  isAuthFailure,
  refreshUserToken
} from "./auth-client";
import { resolveApiBaseUrl } from "./api-base-url";

const API_BASE_URL = resolveApiBaseUrl();

type ApiErrorPayload = {
  message?: string;
};

export type UserOrder = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotalAmount: string;
  discountAmount: string;
  totalAmount: string;
  placedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  payment: {
    provider: string;
    method: string;
    status: string;
    amount: string;
  } | null;
  items: Array<{
    id: string;
    titleSnapshot: string;
    skuSnapshot: string | null;
    quantity: number;
    unitPrice: string;
    totalAmount: string;
    provider: string;
    productSlug: string;
    variantTitle: string | null;
    billingLabel: string | null;
  }>;
  externalOrders: Array<{
    id: string;
    provider: string;
    status: string;
    externalProductId: string | null;
    externalVariantId: string | null;
    checkoutUrl: string | null;
  }>;
};

export type StartCheckoutPayload = {
  identityNumber?: string;
  billingAddress?: string;
  billingCity?: string;
  billingDistrict?: string;
  billingZipCode?: string;
  billingCountry?: string;
};

export type StartCheckoutResponse =
  | {
      status: "gateway_pending";
      mode: "local";
      orderNumber: string;
      paymentProvider: string;
      message: string;
      checkoutUrl: null;
    }
  | {
      status: "redirect_ready";
      mode: "local_gateway";
      provider: "PAYTR";
      orderNumber: string;
      checkoutUrl: string;
      redirectUrl: string;
    }
  | {
      status:
        | "link_required"
        | "mapping_required"
        | "provider_not_configured"
        | "profile_incomplete";
      mode: "external_redirect";
      provider: "UNIKAZAN";
      orderNumber: string;
      message: string;
    }
  | {
      status: "redirect_ready";
      mode: "external_redirect";
      provider: "UNIKAZAN";
      orderNumber: string;
      redirectUrl: string;
    };

async function parseError(response: Response): Promise<never> {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  throw new ApiRequestError(
    normalizeCommerceErrorMessage(payload?.message, response.status),
    response.status
  );
}

function normalizeCommerceErrorMessage(message: string | undefined, status: number) {
  const normalizedMessage = (message ?? "").toLocaleLowerCase("tr-TR");

  if (status === 401) {
    return "Önce öğrenci hesabına giriş yapmalısın.";
  }

  if (status === 403) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }

  if (
    status === 404 ||
    normalizedMessage.includes("variant") ||
    normalizedMessage.includes("product") ||
    normalizedMessage.includes("selected variants") ||
    normalizedMessage.includes("not available for checkout")
  ) {
    return "Paket bilgisi bulunamadı.";
  }

  if (normalizedMessage.includes("order not found") || normalizedMessage.includes("order is missing")) {
    return "Sipariş bilgisi bulunamadı.";
  }

  if (status >= 500) {
    return "İşlem sırasında bir sorun oluştu. Lütfen tekrar deneyin.";
  }

  return message || "İstek işlenemedi.";
}

async function fetchWithToken(path: string, init: RequestInit, accessToken: string) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {})
    }
  });
}

async function requestUserApi<T>(path: string, init: RequestInit) {
  const accessToken = getUserAccessToken();

  if (!accessToken) {
    throw new ApiRequestError("Önce öğrenci hesabına giriş yapmalısın.", 401);
  }

  const firstResponse = await fetchWithToken(path, init, accessToken);

  if (firstResponse.ok) {
    return (await firstResponse.json()) as T;
  }

  if (firstResponse.status !== 401) {
    await parseError(firstResponse);
  }

  let refreshedAccessToken: string;

  try {
    const refreshed = await refreshUserToken();
    refreshedAccessToken = refreshed.accessToken;
  } catch (error) {
    if (isAuthFailure(error)) {
      clearUserTokens();
    }

    throw error;
  }

  const retryResponse = await fetchWithToken(path, init, refreshedAccessToken);

  if (retryResponse.status === 401) {
    clearUserTokens();
  }

  if (!retryResponse.ok) {
    await parseError(retryResponse);
  }

  return (await retryResponse.json()) as T;
}

export function createCheckoutOrder(variantId: string, couponCode?: string) {
  return requestUserApi<UserOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      items: [{ variantId, quantity: 1 }],
      ...(couponCode ? { couponCode } : {})
    })
  });
}

export function startOrderCheckout(orderNumber: string, payload?: StartCheckoutPayload) {
  return requestUserApi<StartCheckoutResponse>(
    `/orders/my/${encodeURIComponent(orderNumber)}/checkout`,
    {
      method: "POST",
      body: JSON.stringify(payload ?? {})
    }
  );
}

export function linkUnikazanAccount(email: string, password: string) {
  return requestUserApi<{
    status: "linked";
    provider: "UNIKAZAN";
    externalEmail: string | null;
    linkedAt: string;
  }>("/orders/integrations/unikazan/link", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function fetchMyOrders() {
  return requestUserApi<UserOrder[]>("/orders/my", {
    method: "GET"
  });
}
