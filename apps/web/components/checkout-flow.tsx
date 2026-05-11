"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { PackageProduct } from "../lib/package-catalog";
import { fetchCurrentUser } from "../lib/auth-client";
import {
  createCheckoutOrder,
  linkUnikazanAccount,
  startOrderCheckout,
  type StartCheckoutResponse,
  type UserOrder
} from "../lib/commerce-client";

type CheckoutFlowProps = {
  product: PackageProduct;
};

export function CheckoutFlow({ product }: CheckoutFlowProps) {
  const pathname = usePathname();
  const authRedirectHref = useMemo(
    () => `/giris?redirect=${encodeURIComponent(pathname || `/checkout/${product.slug}`)}`,
    [pathname, product.slug]
  );

  const [authState, setAuthState] = useState<
    | { status: "loading" }
    | { status: "authenticated"; user: Awaited<ReturnType<typeof fetchCurrentUser>>["user"] }
    | { status: "unauthenticated"; message?: string }
  >({ status: "loading" });
  const [order, setOrder] = useState<UserOrder | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [unikazanCredentials, setUnikazanCredentials] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetchCurrentUser();

        if (!active) {
          return;
        }

        setAuthState({ status: "authenticated", user: response.user });
      } catch (requestError) {
        if (!active) {
          return;
        }

        setAuthState({
          status: "unauthenticated",
          message:
            requestError instanceof Error && !requestError.message.includes("Oturum")
              ? requestError.message
              : undefined
        });
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  async function handleCheckoutStart() {
    if (!product.defaultVariantId) {
      setError("Bu ürün için varsayılan varyant tanımı eksik. Yönetim panelinden katalog eşleşmesini kontrol et.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const ensuredOrder =
        order ??
        (await createCheckoutOrder(product.defaultVariantId, couponCode.trim() || undefined));

      setOrder(ensuredOrder);

      const checkoutResponse = await startOrderCheckout(ensuredOrder.orderNumber);
      handleCheckoutResponse(checkoutResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ödeme akışı başlatılırken beklenmeyen bir hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCheckoutResponse(response: StartCheckoutResponse) {
    if (response.status === "redirect_ready") {
      setRedirectUrl(response.redirectUrl);
      setMessage("Ödeme sayfasına yönlendiriliyorsun...");
      window.location.assign(response.redirectUrl);
      return;
    }

    if (response.status === "link_required") {
      setShowLinkForm(true);
      setMessage(response.message);
      return;
    }

    if (response.status === "gateway_pending") {
      setMessage(response.message);
      return;
    }

    setError(response.message);
  }

  async function handleLinkAndRetry() {
    if (!unikazanCredentials.email || !unikazanCredentials.password) {
      setError("Unikazan hesabı bağlantısı için e-posta ve şifre gerekli.");
      return;
    }

    if (!order) {
      setError("Önce sipariş oluşturulmalı.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await linkUnikazanAccount(unikazanCredentials.email, unikazanCredentials.password);
      const checkoutResponse = await startOrderCheckout(order.orderNumber);
      handleCheckoutResponse(checkoutResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unikazan hesabı bağlanırken bir hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ega-section ega-container">
      <div className="ega-checkout-layout">
        <aside className="ega-auth-card ega-checkout-summary">
          <div className="ega-pill ega-pill--warm">Sipariş Özeti</div>
          <h1>{product.title}</h1>
          <p>{product.subtitle}</p>

          <div className="ega-checkout-summary__price">{product.price}</div>

          <ul className="ega-pack-card__features ega-pack-card__features--detail">
            {product.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>

          <div className="ega-checkout-summary__meta">
            <div className="ega-summary-row">
              <strong>Akış</strong>
              <span>{product.provider === "redirect" ? "Unikazan yönlendirme" : "Yerel ödeme hazırlığı"}</span>
            </div>
            <div className="ega-summary-row">
              <strong>Ürün</strong>
              <span>{product.badge}</span>
            </div>
            {order ? (
              <div className="ega-summary-row">
                <strong>Sipariş</strong>
                <span>{order.orderNumber}</span>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="ega-auth-card ega-checkout-panel">
          <div className="ega-pill">Ödeme Akışı</div>
          <h2>Satın alma adımlarını bu ekrandan başlat</h2>
          <p>
            Öğrenci hesabı zorunludur. Koçluk paketlerinde sipariş kaydı burada oluşur,
            ödeme ise Unikazan tarafına yönlendirilir. Yerel ürünlerde bu ekran ödeme
            altyapısının temelini test eder.
          </p>

          {authState.status === "loading" ? (
            <div className="ega-message ega-message--success">Öğrenci oturumu kontrol ediliyor...</div>
          ) : null}

          {authState.status === "unauthenticated" ? (
            <div className="ega-status-stack">
              <div className="ega-message ega-message--error">
                Satın alma akışına devam etmek için önce öğrenci hesabına giriş yapmalısın.
              </div>
              {authState.message ? (
                <div className="ega-message ega-message--error">{authState.message}</div>
              ) : null}
              <div className="ega-actions">
                <Link className="ega-button" href={authRedirectHref}>
                  Giriş Yap / Kayıt Ol
                </Link>
                <Link className="ega-button ega-button--ghost" href={`/paketlerimiz/${product.slug}`}>
                  Ürüne Dön
                </Link>
              </div>
            </div>
          ) : null}

          {authState.status === "authenticated" ? (
            <div className="ega-status-stack">
              <div className="ega-auth-summary">
                <div className="ega-summary-row">
                  <strong>Öğrenci</strong>
                  <span>
                    {authState.user.profile?.firstName} {authState.user.profile?.lastName}
                  </span>
                </div>
                <div className="ega-summary-row">
                  <strong>E-posta</strong>
                  <span>{authState.user.email}</span>
                </div>
                <div className="ega-summary-row">
                  <strong>Sınıf / Alan</strong>
                  <span>
                    {authState.user.studentProfile?.gradeLevel || "Eksik"} /{" "}
                    {authState.user.studentProfile?.studyTrack || "Eksik"}
                  </span>
                </div>
              </div>

              <div className="ega-field">
                <label htmlFor="couponCode">Kupon kodu (opsiyonel)</label>
                <input
                  id="couponCode"
                  className="ega-input"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Varsa kupon kodunu gir"
                />
              </div>

              {message ? <div className="ega-message ega-message--success">{message}</div> : null}
              {error ? <div className="ega-message ega-message--error">{error}</div> : null}

              <div className="ega-actions">
                <button className="ega-button" type="button" onClick={handleCheckoutStart} disabled={submitting}>
                  {submitting ? "Akış hazırlanıyor..." : "Siparişi Oluştur ve Devam Et"}
                </button>
                <Link className="ega-button ega-button--ghost" href="/hesabim">
                  Öğrenci Paneli
                </Link>
              </div>

              {product.provider === "redirect" ? (
                <div className="ega-checkout-note">
                  Koçluk ürünlerinde Unikazan hesabı bağlantısı ve sınıf/alan bilgisi
                  tamamlanmış olmalıdır.
                </div>
              ) : null}

              {showLinkForm ? (
                <div className="ega-checkout-linkbox">
                  <h3>Unikazan hesabını bağla</h3>
                  <p>
                    Bu koçluk paketi için mevcut Unikazan öğrenci hesabınla bağlantı
                    kurulmalı. Buradaki bilgiler sadece yönlendirme oturumu oluşturmak için
                    kullanılır.
                  </p>

                  <div className="ega-form-grid ega-form-grid--compact">
                    <div className="ega-field">
                      <label htmlFor="unikazan-email">Unikazan E-posta</label>
                      <input
                        id="unikazan-email"
                        className="ega-input"
                        type="email"
                        value={unikazanCredentials.email}
                        onChange={(event) =>
                          setUnikazanCredentials((current) => ({
                            ...current,
                            email: event.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="ega-field">
                      <label htmlFor="unikazan-password">Unikazan Şifre</label>
                      <input
                        id="unikazan-password"
                        className="ega-input"
                        type="password"
                        value={unikazanCredentials.password}
                        onChange={(event) =>
                          setUnikazanCredentials((current) => ({
                            ...current,
                            password: event.target.value
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="ega-actions">
                    <button className="ega-button" type="button" onClick={handleLinkAndRetry} disabled={submitting}>
                      {submitting ? "Bağlanıyor..." : "Bağla ve Yönlendir"}
                    </button>
                  </div>
                </div>
              ) : null}

              {redirectUrl ? (
                <div className="ega-checkout-note">
                  Yönlendirme otomatik başlamadıysa <a href={redirectUrl}>buraya tıklayarak</a> devam edebilirsin.
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
