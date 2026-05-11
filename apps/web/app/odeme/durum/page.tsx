import Link from "next/link";
import { PublicPageLayout } from "../../../components/public-page-layout";

type PaymentStatusPageProps = {
  searchParams: Promise<{
    order?: string;
    status?: string;
  }>;
};

export default async function PaymentStatusPage({ searchParams }: PaymentStatusPageProps) {
  const params = await searchParams;
  const orderNumber = params.order ?? null;
  const status = params.status ?? "pending";
  const isSuccess = status === "success";
  const isFailure = status === "failure";

  return (
    <PublicPageLayout>
      <main className="ega-auth-shell">
        <section className="ega-auth-card">
          <div className="ega-pill ega-pill--warm">Ödeme Durumu</div>
          <h1>{isSuccess ? "Ödeme dönüşü alındı" : isFailure ? "Ödeme tamamlanamadı" : "Ödeme durumu bekleniyor"}</h1>
          <p>
            Bu sayfa sağlayıcı dönüş ekranıdır. Nihai ödeme doğrulaması webhook veya
            sağlayıcı durum senkronizasyonu tamamlandığında kesinleşir.
          </p>

          <div className={`ega-message ${isFailure ? "ega-message--error" : "ega-message--success"}`}>
            {isSuccess
              ? "Sağlayıcı başarılı dönüş verdi. Sipariş doğrulaması tamamlanırken öğrenci panelinden durumu takip edebilirsin."
              : isFailure
                ? "Sağlayıcı başarısız dönüş verdi. Gerekirse siparişi tekrar başlatabilirsin."
                : "Sağlayıcı dönüşü bekleniyor veya eksik."}
          </div>

          {orderNumber ? (
            <div className="ega-auth-summary">
              <div className="ega-summary-row">
                <strong>Sipariş Numarası</strong>
                <span>{orderNumber}</span>
              </div>
              <div className="ega-summary-row">
                <strong>Dönüş Durumu</strong>
                <span>{status}</span>
              </div>
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
