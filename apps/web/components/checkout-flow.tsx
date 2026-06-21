"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { PackageProduct } from "../lib/package-catalog";
import {
  ApiRequestError,
  fetchCurrentUser,
  getUserFacingErrorMessage,
  isAuthFailure,
  isNotFoundFailure,
  isPermissionFailure
} from "../lib/auth-client";
import {
  createCheckoutOrder,
  fetchMyOrders,
  linkUnikazanAccount,
  startOrderCheckout,
  type StartCheckoutPayload,
  type StartCheckoutResponse,
  type UserOrder
} from "../lib/commerce-client";

type CheckoutFlowProps = {
  product: PackageProduct;
};

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: Awaited<ReturnType<typeof fetchCurrentUser>>["user"] }
  | { status: "unauthenticated"; message?: string }
  | { status: "error"; message: string };

function validateBillingDetails(details: StartCheckoutPayload) {
  const identityNumber = details.identityNumber?.trim() ?? "";

  if (!identityNumber) {
    return "T.C. kimlik numaranızı girmeniz gerekiyor.";
  }

  if (!/^\d{11}$/.test(identityNumber)) {
    return "T.C. kimlik numarası 11 haneli olmalıdır.";
  }

  if (!details.billingCity?.trim()) {
    return "İl alanı zorunludur.";
  }

  if (!details.billingDistrict?.trim()) {
    return "İlçe alanı zorunludur.";
  }

  if (!details.billingAddress?.trim()) {
    return "Fatura adresi zorunludur.";
  }

  return null;
}

function normalizeCheckoutErrorMessage(error: unknown) {
  if (isPermissionFailure(error)) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }

  if (isNotFoundFailure(error)) {
    return "Paket bilgisi bulunamadı.";
  }

  if (error instanceof ApiRequestError && error.status && error.status >= 500) {
    return "İşlem sırasında bir sorun oluştu. Lütfen tekrar deneyin.";
  }

  if (error instanceof TypeError) {
    return "İşlem sırasında bir sorun oluştu. Lütfen tekrar deneyin.";
  }

  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLocaleLowerCase("tr-TR");

  if (!message) {
    return "Ödeme başlatılırken bir sorun oluştu. Lütfen tekrar deneyin.";
  }

  if (normalizedMessage.includes("merchant_oid") || normalizedMessage.includes("paytr")) {
    return "Ödeme başlatılırken bir sorun oluştu. Lütfen tekrar deneyin.";
  }

  if (
    normalizedMessage.includes("variant") ||
    normalizedMessage.includes("product") ||
    normalizedMessage.includes("selected variants") ||
    normalizedMessage.includes("not available for checkout") ||
    normalizedMessage.includes("paket bilgisi")
  ) {
    return "Paket bilgisi bulunamadı.";
  }

  if (normalizedMessage.includes("order not found") || normalizedMessage.includes("sipariş bilgisi")) {
    return "Sipariş bilgisi bulunamadı.";
  }

  if (normalizedMessage.includes("kimlik")) {
    return normalizedMessage.includes("11")
      ? "T.C. kimlik numarası 11 haneli olmalıdır."
      : "T.C. kimlik numaranızı girmeniz gerekiyor.";
  }

  if (normalizedMessage.includes("fatura adres")) {
    return "Fatura adresi zorunludur.";
  }

  if (normalizedMessage.includes("ilçe")) {
    return "İlçe alanı zorunludur.";
  }

  if (normalizedMessage.includes("il alan") || normalizedMessage.includes("il bilgisi")) {
    return "İl alanı zorunludur.";
  }

  if (normalizedMessage.includes("posta kod")) {
    return "Posta kodu zorunludur.";
  }

  return message;
}

export function CheckoutFlow({ product }: CheckoutFlowProps) {
  const pathname = usePathname();
  const authRedirectHref = useMemo(
    () => `/giris?redirect=${encodeURIComponent(pathname || `/checkout/${product.slug}`)}`,
    [pathname, product.slug]
  );

  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
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
  const [billingDetails, setBillingDetails] = useState<StartCheckoutPayload>({
    identityNumber: "",
    billingAddress: "",
    billingCity: "",
    billingDistrict: "",
    billingZipCode: "",
    billingCountry: "Türkiye"
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
        setBillingDetails((current) => ({
          ...current,
          billingCity: current.billingCity || response.user.profile?.city || "",
          billingDistrict: current.billingDistrict || response.user.profile?.district || ""
        }));

        try {
          const orders = await fetchMyOrders();
          const reusableOrder = findReusableCheckoutOrder(orders, product.slug);

          if (active && reusableOrder) {
            setOrder(reusableOrder);
          }
        } catch (ordersError) {
          if (active && isAuthFailure(ordersError)) {
            setAuthState({
              status: "unauthenticated",
              message: undefined
            });
          }
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (isAuthFailure(requestError)) {
          setAuthState({
            status: "unauthenticated",
            message:
              requestError instanceof Error && !requestError.message.includes("Oturum")
                ? requestError.message
                : undefined
          });
          return;
        }

        setAuthState({
          status: "error",
          message: getUserFacingErrorMessage(requestError)
        });
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [product.slug]);

  async function handleCheckoutStart() {
    if (!product.defaultVariantId) {
      setError("Paket bilgisi bulunamadı.");
      return;
    }

    if (product.provider === "local") {
      const billingError = validateBillingDetails(billingDetails);

      if (billingError) {
        setError(billingError);
        return;
      }
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const ensuredOrder =
        order ??
        findReusableCheckoutOrder(await fetchMyOrders(), product.slug) ??
        (await createCheckoutOrder(product.defaultVariantId, couponCode.trim() || undefined));

      setOrder(ensuredOrder);

      const checkoutResponse = await startOrderCheckout(
        ensuredOrder.orderNumber,
        product.provider === "local" ? billingDetails : undefined
      );
      handleCheckoutResponse(checkoutResponse);
    } catch (requestError) {
      setError(normalizeCheckoutErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCheckoutResponse(response: StartCheckoutResponse) {
    if (response.status === "redirect_ready") {
      setRedirectUrl(response.redirectUrl);
      setMessage("Ödeme sayfasına yönlendiriliyorsunuz...");
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

    setError(normalizeCheckoutErrorMessage(new Error(response.message)));
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
      setError(normalizeCheckoutErrorMessage(requestError));
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
              <span>{product.provider === "redirect" ? "Unikazan yönlendirme" : "PayTR ödeme sayfası"}</span>
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
          <h2>Satın alma adımlarını güvenle başlat</h2>
          <p>
            Koçluk paketlerinde başvuru kaydı oluşturulur; ödeme adımı güvenli yönlendirme ile tamamlanır.
          </p>

          {authState.status === "loading" ? (
            <div className="ega-message ega-message--success">Öğrenci oturumu kontrol ediliyor...</div>
          ) : null}

          {authState.status === "error" ? (
            <div className="ega-status-stack">
              <div className="ega-message ega-message--error">{authState.message}</div>
              <div className="ega-actions">
                <button className="ega-button" type="button" onClick={() => window.location.reload()}>
                  Tekrar Dene
                </button>
                <Link className="ega-button ega-button--ghost" href={`/paketlerimiz/${product.slug}`}>
                  Ürüne Dön
                </Link>
              </div>
            </div>
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

              {product.provider === "local" ? (
                <div className="ega-checkout-linkbox">
                  <h3>Fatura Bilgileri</h3>
                  <p>PayTR ödeme sayfasına geçmeden önce zorunlu fatura bilgilerini tamamlayın.</p>

                  <div className="ega-form-grid ega-form-grid--compact">
                    <div className="ega-field">
                      <label htmlFor="identityNumber">T.C. Kimlik No *</label>
                      <input
                        id="identityNumber"
                        className="ega-input"
                        inputMode="numeric"
                        maxLength={11}
                        required
                        aria-required="true"
                        value={billingDetails.identityNumber ?? ""}
                        onChange={(event) =>
                          setBillingDetails((current) => ({
                            ...current,
                            identityNumber: event.target.value.replace(/\D+/g, "").slice(0, 11)
                          }))
                        }
                      />
                    </div>

                    <div className="ega-field">
                      <label htmlFor="billingCity">İl *</label>
                      <input
                        id="billingCity"
                        className="ega-input"
                        required
                        aria-required="true"
                        value={billingDetails.billingCity ?? ""}
                        onChange={(event) =>
                          setBillingDetails((current) => ({
                            ...current,
                            billingCity: event.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="ega-field ega-field--full">
                      <label htmlFor="billingAddress">Fatura Adresi *</label>
                      <textarea
                        id="billingAddress"
                        className="ega-textarea"
                        rows={3}
                        required
                        aria-required="true"
                        value={billingDetails.billingAddress ?? ""}
                        onChange={(event) =>
                          setBillingDetails((current) => ({
                            ...current,
                            billingAddress: event.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="ega-field">
                      <label htmlFor="billingDistrict">İlçe *</label>
                      <input
                        id="billingDistrict"
                        className="ega-input"
                        required
                        aria-required="true"
                        value={billingDetails.billingDistrict ?? ""}
                        onChange={(event) =>
                          setBillingDetails((current) => ({
                            ...current,
                            billingDistrict: event.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="ega-field">
                      <label htmlFor="billingZipCode">Posta Kodu (opsiyonel)</label>
                      <input
                        id="billingZipCode"
                        className="ega-input"
                        value={billingDetails.billingZipCode ?? ""}
                        onChange={(event) =>
                          setBillingDetails((current) => ({
                            ...current,
                            billingZipCode: event.target.value
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {message ? <div className="ega-message ega-message--success">{message}</div> : null}
              {error ? <div className="ega-message ega-message--error">{error}</div> : null}

              <div className="ega-actions">
                <button className="ega-button" type="button" onClick={handleCheckoutStart} disabled={submitting}>
                  {submitting ? "İşleniyor..." : "Siparişi Oluştur ve Devam Et"}
                </button>
                <Link className="ega-button ega-button--ghost" href="/hesabim">
                  Öğrenci Paneli
                </Link>
              </div>

              {product.provider === "redirect" ? (
                <div className="ega-checkout-note">
                  Koçluk ürünlerinde Unikazan hesabı bağlantısı ve sınıf/alan bilgisi tamamlanmış olmalıdır.
                </div>
              ) : (
                <div className="ega-checkout-note">
                  Yerel ürünlerde ödeme güvenli PayTR sayfasında tamamlanır.
                </div>
              )}

              {showLinkForm ? (
                <div className="ega-checkout-linkbox">
                  <h3>Unikazan hesabını bağla</h3>
                  <p>
                    Bu koçluk paketi için mevcut Unikazan öğrenci hesabınla bağlantı kurulmalı.
                    Bilgiler güvenli yönlendirme oturumu için kullanılır.
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

function findReusableCheckoutOrder(orders: UserOrder[], productSlug: string) {
  return (
    orders.find(
      (entry) =>
        isCheckoutContinuableOrder(entry) &&
        entry.items.some((item) => item.productSlug === productSlug)
    ) ?? null
  );
}

function isCheckoutContinuableOrder(order: UserOrder) {
  return !["PAID", "CANCELLED", "CANCELED", "REFUNDED", "FAILED"].includes(order.status);
}
