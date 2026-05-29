import { requestWithStaffToken } from "./auth-client";

export type AdminCatalogCategory = {
  id?: string;
  slug: string;
  name: string;
  parentSlug?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ctaHref?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type AdminCatalogFeature = {
  id?: string;
  title: string;
  description?: string | null;
  iconKey?: string | null;
  sortOrder?: number;
};

export type AdminCatalogVariant = {
  id?: string;
  title: string;
  sku: string;
  billingLabel?: string | null;
  price: string;
  compareAtPrice?: string | null;
  currency?: string;
  isDefault?: boolean;
  isActive?: boolean;
  hasInstallments?: boolean;
  installmentCount?: number | null;
  sortOrder?: number;
  externalProductId?: string | null;
  externalVariantId?: string | null;
};

export type AdminCatalogProduct = {
  id?: string;
  slug: string;
  name: string;
  categorySlug?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  type: string;
  provider: string;
  publishStatus?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  accentColor?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverImageUrl?: string | null;
  introVideoSourceType?: "DIRECT" | "EMBED" | null;
  introVideoUrl?: string | null;
  introVideoPosterUrl?: string | null;
  introVideoTitle?: string | null;
  variants: AdminCatalogVariant[];
  features: AdminCatalogFeature[];
};

export type AdminCatalogDocument = {
  categories: AdminCatalogCategory[];
  products: AdminCatalogProduct[];
};

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  userEmail: string;
  status: string;
  currency: string;
  subtotalAmount: string;
  discountAmount: string;
  totalAmount: string;
  placedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  note?: string | null;
  paymentStatus: string;
  paymentProvider?: string | null;
  redirectMode: boolean;
  externalOrderStatus?: string | null;
  items: Array<{
    id: string;
    titleSnapshot: string;
    skuSnapshot?: string | null;
    quantity: number;
    unitPrice: string;
    totalAmount: string;
    provider: string;
    variantTitle?: string | null;
    productSlug: string;
  }>;
  externalOrders: Array<{
    id: string;
    provider: string;
    externalReference?: string | null;
    externalProductId?: string | null;
    externalVariantId?: string | null;
    status: string;
    checkoutUrl?: string | null;
  }>;
};

export type AdminOrderDetail = AdminOrderSummary & {
  userId: string;
  couponCode?: string | null;
  taxAmount: string;
  payments: Array<{
    id: string;
    provider: string;
    method: string;
    status: string;
    amount: string;
    currency: string;
    providerReference?: string | null;
    providerTransactionId?: string | null;
    failureReason?: string | null;
    paidAt?: string | null;
    createdAt: string;
    updatedAt: string;
    attempts: Array<{
      id: string;
      attemptType: string;
      status: string;
      errorMessage?: string | null;
      attemptedAt: string;
      completedAt?: string | null;
      requestPayload?: unknown;
      responsePayload?: unknown;
    }>;
  }>;
  externalOrders: Array<{
    id: string;
    provider: string;
    externalReference?: string | null;
    externalProductId?: string | null;
    externalVariantId?: string | null;
    status: string;
    checkoutUrl?: string | null;
    redirectedAt?: string | null;
    returnedAt?: string | null;
    callbackReceivedAt?: string | null;
    callbackVerified: boolean;
    externalStatus?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  timeline: Array<{
    timestamp: string;
    label: string;
    description: string;
    source: "order" | "payment" | "external" | "audit";
    tone: "neutral" | "success" | "warning" | "danger";
  }>;
};

export function fetchAdminCatalogDocument() {
  return requestWithStaffToken<AdminCatalogDocument>("/admin-commerce/catalog");
}

export function fetchAdminCategories() {
  return requestWithStaffToken<AdminCatalogCategory[]>("/admin-commerce/categories");
}

export function createAdminCategory(payload: AdminCatalogCategory) {
  return requestWithStaffToken<AdminCatalogCategory>("/admin-commerce/categories", {
    method: "POST",
    body: payload
  });
}

export function updateAdminCategory(categoryId: string, payload: AdminCatalogCategory) {
  return requestWithStaffToken<AdminCatalogCategory>(
    `/admin-commerce/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      body: payload
    }
  );
}

export function deleteAdminCategory(categoryId: string) {
  return requestWithStaffToken<{ status: "deleted"; id: string }>(
    `/admin-commerce/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "DELETE"
    }
  );
}

export function fetchAdminProducts() {
  return requestWithStaffToken<AdminCatalogProduct[]>("/admin-commerce/products");
}

export function fetchAdminProduct(productId: string) {
  return requestWithStaffToken<AdminCatalogProduct>(
    `/admin-commerce/products/${encodeURIComponent(productId)}`
  );
}

export function createAdminProduct(payload: AdminCatalogProduct) {
  return requestWithStaffToken<AdminCatalogProduct>("/admin-commerce/products", {
    method: "POST",
    body: payload
  });
}

export function updateAdminProduct(productId: string, payload: AdminCatalogProduct) {
  return requestWithStaffToken<AdminCatalogProduct>(
    `/admin-commerce/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      body: payload
    }
  );
}

export function deleteAdminProduct(productId: string) {
  return requestWithStaffToken<{ status: "deleted"; id: string }>(
    `/admin-commerce/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE"
    }
  );
}

export function saveAdminCatalogDocument(payload: AdminCatalogDocument) {
  return requestWithStaffToken<AdminCatalogDocument>("/admin-commerce/catalog", {
    method: "PUT",
    body: payload
  });
}

export function fetchAdminOrders() {
  return requestWithStaffToken<AdminOrderSummary[]>("/admin-commerce/orders");
}

export function fetchAdminOrder(orderNumber: string) {
  return requestWithStaffToken<AdminOrderDetail>(
    `/admin-commerce/orders/${encodeURIComponent(orderNumber)}`
  );
}

export function updateAdminOrderNote(orderNumber: string, payload: { note?: string | null }) {
  return requestWithStaffToken<AdminOrderDetail>(
    `/admin-commerce/orders/${encodeURIComponent(orderNumber)}/note`,
    {
      method: "PATCH",
      body: payload
    }
  );
}

export function updateAdminOrderStatus(
  orderNumber: string,
  payload: {
    status: string;
    note?: string | null;
    paymentStatus?: string | null;
    externalStatus?: string | null;
  }
) {
  return requestWithStaffToken<AdminOrderDetail>(
    `/admin-commerce/orders/${encodeURIComponent(orderNumber)}/status`,
    {
      method: "PATCH",
      body: payload
    }
  );
}

export function recordAdminOrderManualReview(orderNumber: string, payload: { note: string }) {
  return requestWithStaffToken<AdminOrderDetail>(
    `/admin-commerce/orders/${encodeURIComponent(orderNumber)}/manual-review`,
    {
      method: "POST",
      body: payload
    }
  );
}
