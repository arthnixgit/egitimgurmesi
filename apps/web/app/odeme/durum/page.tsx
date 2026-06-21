import Link from "next/link";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { resolveApiBaseUrl } from "../../../lib/api-base-url";
import {
  getExternalOrderStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel
} from "../../../lib/payment-labels";

type PaymentStatusPageProps = {
  searchParams: Promise<{
    order?: string;
    status?: string;
    provider?: string;
  }>;
};

type ReconciliationResult = {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string | null;
  externalStatus: string | null;
  verified: boolean;
  result: "confirmed" | "awaiting_confirmation" | "failed" | "pending";
  message: string;
};

async function fetchPublicOrderStatus(orderNumber: string): Promise<ReconciliationResult | null> {
  try {
    const response = await fetch(
      `${resolveApiBaseUrl()}/orders/public/${encodeURIComponent(orderNumber)}/status`,
      {
        method: "GET",
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ReconciliationResult;
  } catch {
    return null;
  }
}

async function reconcileOrderReturn(
  orderNumber: string,
  status: string
): Promise<ReconciliationResult | null> {
  const normalizedStatus =
    status === "success" || status === "failure" || status === "pending" ? status : "pending";

  try {
    const response = await fetch(
      `${resolveApiBaseUrl()}/orders/public/${encodeURIComponent(orderNumber)}/return`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: normalizedStatus }),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ReconciliationResult;
  } catch {
    return null;
  }
}

function fallbackState(status: string) {
  if (status === "success") {
    return {
      result: "awaiting_confirmation" as const,
      message: "Ödeme sağlayıcısından başarılı dönüş alındı. Kesin doğrulama bekleniyor."
    };
  }

  if (status === "failure") {
    return {
      result: "failed" as const,
      message: "Ödeme tamamlanamadı. Siparişi yeniden başlatabilir veya destek alabilirsin."
    };
  }

  return {
    result: "pending" as const,
    message: "Ödeme durumu işleniyor. Lütfen kısa süre sonra tekrar kontrol et."
  };
}

export default async function PaymentStatusPage({ searchParams }: PaymentStatusPageProps) {
  if (process.env.NEXT_STATIC_EXPORT === "1") {
    return (
      <PublicPageLayout>
        <main className="ega-auth-shell">
          <section className="ega-auth-card">
            <h1>Ödeme durumu VPS yayınıyla kontrol edilecek</h1>
            <p>
              Bu statik cPanel ön izlemesi ödeme doğrulaması yapmaz. Sipariş ve ödeme kontrolü API
              yayına alındığında aktif çalışır.
            </p>
            <div className="ega-actions">
              <Link className="ega-button" href="/paketlerimiz">
                Paketlere Dön
              </Link>
              <Link className="ega-button ega-button--ghost" href="/">
                Ana Sayfaya Git
              </Link>
            </div>
          </section>
        </main>
      </PublicPageLayout>
    );
  }

  const params = await searchParams;
  const orderNumber = params.order ?? null;
  const status = params.status ?? "pending";
  const provider = params.provider ?? null;

  let reconciliation: ReconciliationResult | null = null;

  if (orderNumber) {
    if (provider === "local_gateway" || provider === "paytr") {
      reconciliation = await fetchPublicOrderStatus(orderNumber);
    } else {
      reconciliation =
        (await reconcileOrderReturn(orderNumber, status)) ??
        (await fetchPublicOrderStatus(orderNumber));
    }
  }

  const state = reconciliation ?? fallbackState(status);
  const isFailure = state.result === "failed";
  const isConfirmed = state.result === "confirmed";

  return (
    <PublicPageLayout>
      <main className="ega-auth-shell">
        <section className="ega-auth-card">
          <h1>
            {isConfirmed
              ? "Ödeme başarıyla tamamlandı"
              : isFailure
                ? "Ödeme tamamlanamadı"
                : "Ödeme durumu işleniyor"}
          </h1>
          <p>
            Sipariş durumunu takip edebilir, öğrenci panelinden erişimlerini kontrol edebilirsin.
          </p>

          <div className={`ega-message ${isFailure ? "ega-message--error" : "ega-message--success"}`}>
            {state.message}
          </div>

          {orderNumber ? (
            <div className="ega-auth-summary">
              <div className="ega-summary-row">
                <strong>Sipariş Numarası</strong>
                <span>{orderNumber}</span>
              </div>
              {reconciliation ? (
                <>
                  <div className="ega-summary-row">
                    <strong>Sipariş Durumu</strong>
                    <span>{getOrderStatusLabel(reconciliation.orderStatus)}</span>
                  </div>
                  <div className="ega-summary-row">
                    <strong>Ödeme Durumu</strong>
                    <span>{getPaymentStatusLabel(reconciliation.paymentStatus)}</span>
                  </div>
                  <div className="ega-summary-row">
                    <strong>Dış Sağlayıcı</strong>
                    <span>{getExternalOrderStatusLabel(reconciliation.externalStatus)}</span>
                  </div>
                </>
              ) : (
                <div className="ega-summary-row">
                  <strong>Dönüş Durumu</strong>
                  <span>{getExternalOrderStatusLabel(status)}</span>
                </div>
              )}
            </div>
          ) : null}

          <div className="ega-actions">
            <Link className="ega-button" href="/hesabim">
              Öğrenci Paneline Git
            </Link>
            <Link className="ega-button ega-button--ghost" href="/paketlerimiz">
              Paketlere Dön
            </Link>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}
