const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING: "Ödeme Bekliyor",
  PENDING_PAYMENT: "Ödeme Bekliyor",
  REDIRECT_PENDING: "Ödeme Yönlendirmesi Bekliyor",
  AWAITING_CONFIRMATION: "Onay Bekliyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  CANCELLED: "İptal Edildi",
  CANCELED: "İptal Edildi",
  REFUNDED: "İade Edildi"
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  INITIATED: "Başlatıldı",
  PENDING: "Ödeme Bekliyor",
  AUTHORIZED: "Yetkilendirildi",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  CANCELLED: "İptal Edildi",
  CANCELED: "İptal Edildi",
  REFUNDED: "İade Edildi",
  PARTIALLY_REFUNDED: "Kısmi İade"
};

const EXTERNAL_STATUS_LABELS: Record<string, string> = {
  CREATED: "Oluşturuldu",
  REDIRECT_READY: "Ödeme Sayfası Hazır",
  REDIRECTED: "Ödeme Sayfasına Yönlendirildi",
  RETURNED_SUCCESS: "Dönüş Alındı",
  RETURNED_FAILURE: "Dönüş Başarısız",
  CONFIRMED: "Onaylandı",
  FAILED: "Başarısız",
  CANCELLED: "İptal Edildi",
  CANCELED: "İptal Edildi",
  success: "Başarılı Dönüş",
  failure: "Başarısız Dönüş",
  pending: "İşleniyor"
};

const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  LOCAL_GATEWAY: "PayTR / Online Ödeme",
  PAYTR: "PayTR / Online Ödeme",
  UNIKAZAN: "Unikazan",
  MANUAL: "Manuel Ödeme"
};

function fallbackLabel(value?: string | null) {
  if (!value) {
    return "-";
  }

  return value
    .toLocaleLowerCase("tr-TR")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}

export function getOrderStatusLabel(status?: string | null) {
  return status ? ORDER_STATUS_LABELS[status] ?? fallbackLabel(status) : "-";
}

export function getPaymentStatusLabel(status?: string | null) {
  return status ? PAYMENT_STATUS_LABELS[status] ?? fallbackLabel(status) : "-";
}

export function getExternalOrderStatusLabel(status?: string | null) {
  return status ? EXTERNAL_STATUS_LABELS[status] ?? fallbackLabel(status) : "-";
}

export function getPaymentProviderLabel(provider?: string | null) {
  return provider ? PAYMENT_PROVIDER_LABELS[provider] ?? fallbackLabel(provider) : "-";
}
