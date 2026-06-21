"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { StudentLmsDashboard } from "../../components/student-lms-dashboard";
import { StudentOperationalOverviewPanel } from "../../components/student-operational-overview";
import {
  fetchCurrentUser,
  getUserFacingErrorMessage,
  isAuthFailure,
  logoutUser,
  updateCurrentUserProfile
} from "../../lib/auth-client";
import {
  fetchMyOrders,
  linkUnikazanAccount,
  startOrderCheckout,
  type UserOrder
} from "../../lib/commerce-client";
import {
  getExternalOrderStatusLabel,
  getOrderStatusLabel,
  getPaymentProviderLabel,
  getPaymentStatusLabel
} from "../../lib/payment-labels";
import { gradeOptions, studyTrackOptions } from "../../lib/student-profile-options";

type CurrentUserResponse = Awaited<ReturnType<typeof fetchCurrentUser>>;

type ProfileFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  gradeLevel: string;
  studyTrack: string;
  schoolName: string;
  targetExamYear: string;
  parentName: string;
  parentPhone: string;
  marketingConsent: boolean;
};

const emptyProfileForm: ProfileFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  district: "",
  gradeLevel: "",
  studyTrack: "",
  schoolName: "",
  targetExamYear: "",
  parentName: "",
  parentPhone: "",
  marketingConsent: false
};

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<CurrentUserResponse | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [linkingAccount, setLinkingAccount] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [unikazanForm, setUnikazanForm] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const userResponse = await fetchCurrentUser();

        if (!active) {
          return;
        }

        setData(userResponse);
        syncProfileForm(userResponse, setProfileForm);
        setUnikazanForm({
          email:
            userResponse.user.externalAccounts.find((entry) => entry.provider === "UNIKAZAN")
              ?.externalEmail ?? userResponse.user.email,
          password: ""
        });

        try {
          const ordersResponse = await fetchMyOrders();

          if (!active) {
            return;
          }

          setOrders(ordersResponse);
          setSelectedOrderNumber((current) => current || ordersResponse[0]?.orderNumber || "");
        } catch (ordersError) {
          if (!active) {
            return;
          }

          setOrders([]);
          setSelectedOrderNumber("");
          setError(getUserFacingErrorMessage(ordersError, "Siparişler şu anda yüklenemedi."));
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setData(null);
        setOrders([]);
        setSelectedOrderNumber("");
        setError(
          isAuthFailure(requestError)
            ? "Öğrenci panelini görüntülemek için giriş yapmalısın."
            : getUserFacingErrorMessage(requestError, "Hesap bilgileri alınamadı.")
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((entry) => entry.orderNumber === selectedOrderNumber) ?? orders[0] ?? null,
    [orders, selectedOrderNumber]
  );

  const unikazanLink =
    data?.user.externalAccounts.find((entry) => entry.provider === "UNIKAZAN") ?? null;

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(profileForm.firstName.trim()),
      Boolean(profileForm.lastName.trim()),
      Boolean(profileForm.phone.trim()),
      Boolean(profileForm.gradeLevel),
      Boolean(profileForm.studyTrack)
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [profileForm]);

  const orderCounts = useMemo(() => {
    return {
      total: orders.length,
      active: orders.filter((order) => canResumeCheckout(order)).length,
      paid: orders.filter((order) => order.status === "PAID").length
    };
  }, [orders]);

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      router.push("/giris");
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      const response = await updateCurrentUserProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone || undefined,
        city: profileForm.city || undefined,
        district: profileForm.district || undefined,
        gradeLevel: profileForm.gradeLevel || undefined,
        studyTrack: profileForm.studyTrack || undefined,
        schoolName: profileForm.schoolName || undefined,
        targetExamYear: profileForm.targetExamYear ? Number(profileForm.targetExamYear) : undefined,
        parentName: profileForm.parentName || undefined,
        parentPhone: profileForm.parentPhone || undefined,
        marketingConsent: profileForm.marketingConsent
      });

      setData(response);
      syncProfileForm(response, setProfileForm);
      setSuccess("Profil bilgileri güncellendi.");
    } catch (saveError) {
      setError(getUserFacingErrorMessage(saveError, "Profil güncellenemedi."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLinkUnikazan() {
    setLinkingAccount(true);
    setError("");
    setSuccess("");

    try {
      await linkUnikazanAccount(unikazanForm.email, unikazanForm.password);
      const refreshed = await fetchCurrentUser();
      setData(refreshed);
      setUnikazanForm({
        email:
          refreshed.user.externalAccounts.find((entry) => entry.provider === "UNIKAZAN")
            ?.externalEmail ?? refreshed.user.email,
        password: ""
      });
      setSuccess("Unikazan hesabı bağlantısı güncellendi.");
    } catch (linkError) {
      setError(getUserFacingErrorMessage(linkError, "Unikazan bağlantısı kurulamadı."));
    } finally {
      setLinkingAccount(false);
    }
  }

  async function handleResumeCheckout(orderNumber: string) {
    const currentOrder =
      orders.find((entry) => entry.orderNumber === orderNumber) ?? selectedOrder ?? null;
    const existingCheckoutUrl = currentOrder ? getReusableCheckoutUrl(currentOrder) : null;

    if (existingCheckoutUrl) {
      window.location.href = existingCheckoutUrl;
      return;
    }

    setCheckoutLoading(true);
    setError("");
    setSuccess("Ödeme bağlantısı yenileniyor...");

    try {
      const response = await startOrderCheckout(orderNumber);

      if (response.status === "redirect_ready") {
        window.location.href = response.redirectUrl;
        return;
      }

      if (response.status === "gateway_pending") {
        setSuccess(response.message);
      } else {
        setError("Ödeme akışı yeniden başlatılamadı.");
      }

      const refreshedOrders = await fetchMyOrders();
      setOrders(refreshedOrders);
      setSelectedOrderNumber(orderNumber);
    } catch (checkoutError) {
      const productSlug = currentOrder?.items[0]?.productSlug;

      if (productSlug) {
        setSuccess("Ödemenizi tamamlamak için güvenli ödeme sayfasına devam edin.");
        router.push(`/checkout/${encodeURIComponent(productSlug)}`);
        return;
      }

      setError(getUserFacingErrorMessage(checkoutError, "Ödeme akışı başlatılamadı."));
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="ega-auth-shell ega-auth-shell--wide">
        <section className="ega-auth-card">
          <div className="ega-pill">Öğrenci paneli</div>
          <h1 style={{ fontFamily: "var(--font-display)" }}>Panel yükleniyor</h1>
          <div className="ega-message ega-message--success">
            Hesap ve sipariş verileri yükleniyor...
          </div>
        </section>
      </main>
    );
  }

  if (!data?.user) {
    return (
      <main className="ega-auth-shell ega-auth-shell--wide">
        <section className="ega-auth-card">
          <div className="ega-pill">Öğrenci paneli</div>
          <h1 style={{ fontFamily: "var(--font-display)" }}>Oturum gerekli</h1>
          {error ? <div className="ega-message ega-message--error">{error}</div> : null}
          <div className="ega-actions">
            <Link className="ega-button" href="/giris">
              Giriş Yap
            </Link>
            <Link className="ega-button ega-button--ghost" href="/">
              Ana sayfaya dön
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="ega-dashboard-shell">
      <section className="ega-dashboard-hero">
        <div className="ega-dashboard-hero__copy">
          <div className="ega-pill ega-pill--warm">Öğrenci paneli</div>
          <h1 className="ega-dashboard-title">
            Hoş geldin, {data.user.profile?.firstName || data.user.email}
          </h1>
          <p className="ega-dashboard-lead">
            Bugünkü programını gör, derslerine devam et ve koçluk sürecini tek yerden takip et.
          </p>
        </div>

        <div className="ega-dashboard-hero__actions">
          <div className="ega-dashboard-completion">
            <strong>%{profileCompletion}</strong>
            <span>Profil tamamlanma oranı</span>
          </div>
          <button className="ega-button ega-button--ghost" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </section>

      {error ? <div className="ega-message ega-message--error">{error}</div> : null}
      {success ? <div className="ega-message ega-message--success">{success}</div> : null}

      <section className="ega-dashboard-kpis">
        <div className="ega-dashboard-kpi">
          <strong>Program</strong>
          <span>Canlı ders ve duyurular</span>
        </div>
        <div className="ega-dashboard-kpi">
          <strong>Derslerim</strong>
          <span>Kurslarına devam et</span>
        </div>
        <div className="ega-dashboard-kpi">
          <strong>{orderCounts.paid}</strong>
          <span>Aktif paket / sipariş</span>
        </div>
      </section>

      <section className="ega-dashboard-card">
        <div className="ega-dashboard-card__head">
          <div>
            <div className="ega-pill">Hızlı Başlangıç</div>
            <h2>Bugün nereden devam etmek istiyorsun?</h2>
          </div>
        </div>
        <div className="ega-actions">
          <Link className="ega-button" href="/derslerim">
            Derse Devam Et
          </Link>
          <Link className="ega-button ega-button--ghost" href="/paketlerimiz">
            Paketlerimi Gör
          </Link>
          <a className="ega-button ega-button--ghost" href="#ogrenci-programi">
            Programımı Gör
          </a>
        </div>
      </section>

      <div id="ogrenci-programi">
        <StudentOperationalOverviewPanel />
      </div>

      <StudentLmsDashboard />

      <section className="ega-dashboard-grid">
        <section className="ega-dashboard-card">
          <div className="ega-dashboard-card__head">
            <div>
              <div className="ega-pill">Profil</div>
              <h2>Öğrenci bilgileri</h2>
            </div>
            <span className="ega-dashboard-status">
              {profileForm.gradeLevel && profileForm.studyTrack ? "Hazır" : "Eksik bilgi var"}
            </span>
          </div>

          <div className="ega-form-grid">
            <div className="ega-field">
              <label>Ad</label>
              <input
                className="ega-input"
                value={profileForm.firstName}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, firstName: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>Soyad</label>
              <input
                className="ega-input"
                value={profileForm.lastName}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, lastName: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>E-posta</label>
              <input className="ega-input" value={data.user.email} disabled />
            </div>
            <div className="ega-field">
              <label>Telefon</label>
              <input
                className="ega-input"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>Şehir</label>
              <input
                className="ega-input"
                value={profileForm.city}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>İlçe</label>
              <input
                className="ega-input"
                value={profileForm.district}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, district: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>Sınıf düzeyi</label>
              <select
                className="ega-select"
                value={profileForm.gradeLevel}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, gradeLevel: event.target.value }))
                }
              >
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ega-field">
              <label>Alan</label>
              <select
                className="ega-select"
                value={profileForm.studyTrack}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, studyTrack: event.target.value }))
                }
              >
                {studyTrackOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ega-field">
              <label>Okul</label>
              <input
                className="ega-input"
                value={profileForm.schoolName}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, schoolName: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>Hedef sınav yılı</label>
              <input
                className="ega-input"
                type="number"
                min={2026}
                value={profileForm.targetExamYear}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, targetExamYear: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>Veli adı</label>
              <input
                className="ega-input"
                value={profileForm.parentName}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, parentName: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>Veli telefonu</label>
              <input
                className="ega-input"
                value={profileForm.parentPhone}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, parentPhone: event.target.value }))
                }
              />
            </div>
          </div>

          <label className="ega-check ega-check--dashboard">
            <input
              type="checkbox"
              checked={profileForm.marketingConsent}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  marketingConsent: event.target.checked
                }))
              }
            />
            <span>Kampanya ve bilgilendirme mesajları almak istiyorum.</span>
          </label>

          <div className="ega-actions">
            <button className="ega-button" type="button" disabled={savingProfile} onClick={handleSaveProfile}>
              {savingProfile ? "Kaydediliyor..." : "Profili Kaydet"}
            </button>
          </div>
        </section>

        <section className="ega-dashboard-card">
          <div className="ega-dashboard-card__head">
            <div>
              <div className="ega-pill">Bağlantılar</div>
              <h2>Unikazan hesabı</h2>
            </div>
            <span className="ega-dashboard-status">
              {unikazanLink ? "Bağlı" : "Bağlantı gerekli olabilir"}
            </span>
          </div>

          <p className="ega-dashboard-note">
            Koçluk ürünlerinde yönlendirmeli ödeme kullanılır. Gerektiğinde mevcut Unikazan
            hesabını güvenle bağlayabilirsin.
          </p>

          <div className="ega-dashboard-linkbox">
            <div className="ega-summary-row">
              <strong>Durum</strong>
              <span>{unikazanLink ? "Bağlı" : "Bağlı değil"}</span>
            </div>
            <div className="ega-summary-row">
              <strong>Hesap</strong>
              <span>{unikazanLink?.externalEmail || "Belirtilmedi"}</span>
            </div>
            <div className="ega-summary-row">
              <strong>Bağlantı tarihi</strong>
              <span>{formatDate(unikazanLink?.linkedAt)}</span>
            </div>
          </div>

          <div className="ega-form-grid">
            <div className="ega-field">
              <label>Unikazan e-posta</label>
              <input
                className="ega-input"
                type="email"
                value={unikazanForm.email}
                onChange={(event) =>
                  setUnikazanForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div className="ega-field">
              <label>Unikazan şifre</label>
              <input
                className="ega-input"
                type="password"
                value={unikazanForm.password}
                onChange={(event) =>
                  setUnikazanForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="ega-actions">
            <button
              className="ega-button"
              type="button"
              disabled={linkingAccount || !unikazanForm.email || !unikazanForm.password}
              onClick={handleLinkUnikazan}
            >
              {linkingAccount
                ? "Bağlanıyor..."
                : unikazanLink
                  ? "Bağlantıyı Güncelle"
                  : "Hesabı Bağla"}
            </button>
          </div>
        </section>
      </section>

      <section className="ega-dashboard-card">
        <div className="ega-dashboard-card__head">
          <div>
            <div className="ega-pill">Siparişlerim</div>
            <h2>Sipariş ve ödeme durumu</h2>
          </div>
        </div>

        {orders.length ? (
          <div className="ega-student-orders">
            <div className="ega-student-orders__list">
              {orders.map((order) => (
                <button
                  key={order.orderNumber}
                  className={`ega-student-order-item ${
                    selectedOrder?.orderNumber === order.orderNumber
                      ? "ega-student-order-item--active"
                      : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedOrderNumber(order.orderNumber)}
                >
                  <div className="ega-student-order-item__top">
                    <strong>{order.orderNumber}</strong>
                    <span className="ega-dashboard-status">
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="ega-student-order-item__meta">
                    <span>
                      {order.totalAmount} {order.currency}
                    </span>
                    <span>{getPaymentStatusLabel(order.payment?.status || "INITIATED")}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="ega-student-orders__detail">
              {selectedOrder ? (
                <>
                  <div className="ega-dashboard-kpis ega-dashboard-kpis--compact">
                    <div className="ega-dashboard-kpi">
                      <strong className="ega-dashboard-kpi__status">
                        {getOrderStatusLabel(selectedOrder.status)}
                      </strong>
                      <span>Sipariş</span>
                    </div>
                    <div className="ega-dashboard-kpi">
                      <strong className="ega-dashboard-kpi__status">
                        {getPaymentStatusLabel(selectedOrder.payment?.status || "INITIATED")}
                      </strong>
                      <span>Ödeme</span>
                    </div>
                    <div className="ega-dashboard-kpi">
                      <strong>
                        {selectedOrder.totalAmount} {selectedOrder.currency}
                      </strong>
                      <span>Tutar</span>
                    </div>
                  </div>

                  <div className="ega-auth-summary">
                    <div className="ega-summary-row">
                      <strong>Oluşturulma</strong>
                      <span>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="ega-summary-row">
                      <strong>Ödeme sağlayıcı</strong>
                      <span>{getPaymentProviderLabel(selectedOrder.payment?.provider)}</span>
                    </div>
                    <div className="ega-summary-row">
                      <strong>Toplam</strong>
                      <span>
                        {selectedOrder.totalAmount} {selectedOrder.currency}
                      </span>
                    </div>
                  </div>

                  <div className="ega-student-order-items">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="ega-student-order-items__card">
                        <strong>{item.titleSnapshot}</strong>
                        <span>{item.variantTitle || item.skuSnapshot || item.productSlug}</span>
                        <span>
                          {item.quantity} x {item.unitPrice} {selectedOrder.currency}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedOrder.externalOrders.length ? (
                    <div className="ega-message ega-message--success">
                      Ödeme yönlendirmesi:{" "}
                      {getExternalOrderStatusLabel(selectedOrder.externalOrders[0]?.status)}
                    </div>
                  ) : null}

                  <div className="ega-actions">
                    <Link
                      className="ega-button ega-button--ghost"
                      href={`/paketlerimiz/${selectedOrder.items[0]?.productSlug || ""}`}
                    >
                      Ürünü İncele
                    </Link>
                    {canResumeCheckout(selectedOrder) ? (
                      <button
                        className="ega-button"
                        type="button"
                        disabled={checkoutLoading}
                        onClick={() => void handleResumeCheckout(selectedOrder.orderNumber)}
                      >
                        {checkoutLoading ? "Ödeme bağlantısı yenileniyor..." : "Ödemeyi Tamamla"}
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="ega-message ega-message--success">
                  İncelemek için bir sipariş seç.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ega-dashboard-empty">
            <p>
              Sipariş bulunmuyor. Paketleri inceleyerek satın alma akışını başlatabilirsin.
            </p>
            <div className="ega-actions">
              <Link className="ega-button" href="/paketlerimiz">
                Paketlerimizi İncele
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function syncProfileForm(
  response: CurrentUserResponse,
  setProfileForm: Dispatch<SetStateAction<ProfileFormState>>
) {
  setProfileForm({
    firstName: response.user.profile?.firstName ?? "",
    lastName: response.user.profile?.lastName ?? "",
    phone: response.user.phone ?? "",
    city: response.user.profile?.city ?? "",
    district: response.user.profile?.district ?? "",
    gradeLevel: response.user.studentProfile?.gradeLevel ?? "",
    studyTrack: response.user.studentProfile?.studyTrack ?? "",
    schoolName: response.user.studentProfile?.schoolName ?? "",
    targetExamYear: response.user.studentProfile?.targetExamYear
      ? String(response.user.studentProfile.targetExamYear)
      : "",
    parentName: response.user.profile?.parentName ?? "",
    parentPhone: response.user.profile?.parentPhone ?? "",
    marketingConsent: response.user.profile?.marketingConsent ?? false
  });
}

function canResumeCheckout(order: UserOrder) {
  return !["PAID", "CANCELLED", "CANCELED", "REFUNDED", "FAILED"].includes(order.status);
}

function getReusableCheckoutUrl(order: UserOrder) {
  return (
    order.externalOrders.find(
      (entry) =>
        entry.checkoutUrl &&
        ["REDIRECT_READY", "REDIRECTED", "RETURNED_FAILURE"].includes(entry.status)
    )?.checkoutUrl ?? null
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
