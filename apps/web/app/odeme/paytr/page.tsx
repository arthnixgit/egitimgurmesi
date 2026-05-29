import Link from "next/link";
import { PublicPageLayout } from "../../../components/public-page-layout";

type PaytrCheckoutPageProps = {
  searchParams: Promise<{
    order?: string;
    token?: string;
  }>;
};

export default async function PaytrCheckoutPage({ searchParams }: PaytrCheckoutPageProps) {
  if (process.env.NEXT_STATIC_EXPORT === "1") {
    return (
      <PublicPageLayout>
        <main className="ega-auth-shell ega-auth-shell--wide">
          <section className="ega-auth-card">
            <h1>Güvenli ödeme VPS yayınıyla açılacak</h1>
            <p>
              Bu statik cPanel ön izlemesinde PayTR oturumu başlatılmaz. Ödeme akışı API ve VPS
              yayını aktif olduğunda çalışır.
            </p>
            <div className="ega-actions">
              <Link className="ega-button ega-button--ghost" href="/paketlerimiz">
                Paketlere Dön
              </Link>
            </div>
          </section>
        </main>
      </PublicPageLayout>
    );
  }

  const params = await searchParams;
  const orderNumber = params.order ?? null;
  const token = params.token ?? null;

  return (
    <PublicPageLayout>
      <main className="ega-auth-shell ega-auth-shell--wide">
        <section className="ega-auth-card">
          <h1>Güvenli ödeme ekranı</h1>
          <p>Ödemen bu ekranda PayTR altyapısı üzerinden tamamlanır.</p>

          {token ? (
            <iframe
              title="PayTR Güvenli Ödeme"
              src={`https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}`}
              style={{
                width: "100%",
                minHeight: "720px",
                border: "0",
                borderRadius: "24px",
                background: "rgba(255,255,255,0.92)"
              }}
            />
          ) : (
            <div className="ega-message ega-message--error">
              Ödeme oturumu başlatılamadı. Lütfen siparişi yeniden başlat.
            </div>
          )}

          <div className="ega-actions">
            {orderNumber ? (
              <Link
                className="ega-button ega-button--ghost"
                href={`/odeme/durum?order=${encodeURIComponent(orderNumber)}&status=pending&provider=paytr`}
              >
                Sipariş durumunu kontrol et
              </Link>
            ) : null}
            <Link className="ega-button ega-button--ghost" href="/paketlerimiz">
              Paketlere Dön
            </Link>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}
