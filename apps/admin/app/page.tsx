"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchAdminAuditLogs, type AdminAuditLogSummary } from "../lib/audit-client";
import {
  clearStaffTokens,
  fetchAdminFreeMaterialsDocument,
  fetchAdminMarketingPages,
  fetchAdminNavigationMenu,
  fetchAdminStaffProfilesDocument,
  fetchAdminSuccessStoriesDocument,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  logoutStaff,
  type AdminNavigationItem
} from "../lib/auth-client";
import { fetchAdminCatalogDocument, fetchAdminOrders } from "../lib/commerce-client";
import { fetchAdminLeads } from "../lib/engagement-client";
import { fetchAdminMedia } from "../lib/media-client";

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;

type DashboardSnapshot = {
  navigationItems: number | null;
  marketingPages: number | null;
  marketingSections: number | null;
  staffProfiles: number | null;
  successStories: number | null;
  freeMaterials: number | null;
  products: number | null;
  publishedProducts: number | null;
  categories: number | null;
  orders: number | null;
  openOrders: number | null;
  paidOrders: number | null;
  leads: number | null;
  newLeads: number | null;
  mediaAssets: number | null;
  videoAssets: number | null;
  auditTotal: number | null;
  recentAuditLogs: AdminAuditLogSummary[];
};

type DashboardLoadResult<T> = {
  label: string;
  value: T | null;
  error: string | null;
};

const emptyDashboard: DashboardSnapshot = {
  navigationItems: null,
  marketingPages: null,
  marketingSections: null,
  staffProfiles: null,
  successStories: null,
  freeMaterials: null,
  products: null,
  publishedProducts: null,
  categories: null,
  orders: null,
  openOrders: null,
  paidOrders: null,
  leads: null,
  newLeads: null,
  mediaAssets: null,
  videoAssets: null,
  auditTotal: null,
  recentAuditLogs: []
};

const quickActions = [
  {
    href: "/medya",
    label: "Medya ekle",
    title: "Görsel, PDF veya video bağlantısı hazırla",
    body: "Google Drive, YouTube, Vimeo veya cloud streamer linkini normalize edip içerikte kullan.",
    tone: "amber"
  },
  {
    href: "/icerik",
    label: "İçeriği düzenle",
    title: "Sayfa, banner ve ücretsiz materyalleri güncelle",
    body: "Önce sayfayı seç, sonra ilgili bölümü düzenle ve public website önizlemesinde kontrol et.",
    tone: "teal"
  },
  {
    href: "/ticaret",
    label: "Ürünleri yönet",
    title: "Paket, kategori, fiyat ve sipariş akışını kontrol et",
    body: "Paket kartları, tanıtım videoları, varyant fiyatları ve sipariş durumları aynı modülde.",
    tone: "blue"
  },
  {
    href: "/leadler",
    label: "Lead takibi",
    title: "Ön görüşme taleplerini hızlıca işle",
    body: "Yeni talepleri ara, durumunu güncelle ve operasyon takibini açık tut.",
    tone: "green"
  },
  {
    href: "/personel",
    label: "Personel ve rol",
    title: "Personel hesaplarını ve yetkileri yönet",
    body: "Ekip üyelerini oluşturun, rollerini atayın ve erişimleri düzenli tutun.",
    tone: "navy"
  },
  {
    href: "/denetim",
    label: "Denetim",
    title: "Son değişiklikleri ve işlem geçmişini incele",
    body: "Kim hangi kaydı değiştirdi, ne zaman değiştirdi ve hangi modül etkilendi gör.",
    tone: "navy"
  },
  {
    href: "/guncellemeler",
    label: "Güncelleme",
    title: "VDS yayınını GitHub üzerinden güvenli güncelle",
    body: "Yeni sürüm hazırsa workflow başlatın, sunucu kurulumunu ve son yayın geçmişini kontrol edin.",
    tone: "blue"
  }
] as const;

const publishChecklist = [
  "Ana sayfa bannerları ve hızlı aksiyonlar kontrol edildi.",
  "Paket kartları, fiyatlar, video linkleri ve kategori filtreleri güncel.",
  "Ücretsiz materyaller, countdown sayfaları, PDF ve linkler doğru sayfalara gidiyor.",
  "PayTR canlı bilgileri, e-posta gönderimi ve medya URL domainleri canlı ortamda doğrulandı."
] as const;

export default function AdminHomePage() {
  const router = useRouter();
  const [bootstrapRequired, setBootstrapRequired] = useState<boolean | null>(null);
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSnapshot>(emptyDashboard);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const bootstrapStatus = await fetchBootstrapStatus();

        if (!active) {
          return;
        }

        setBootstrapRequired(bootstrapStatus.requiresBootstrap);

        if (bootstrapStatus.requiresBootstrap) {
          setLoading(false);
          return;
        }

        const [staffResponse, overviewResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview()
        ]);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);

        const { snapshot, loadWarnings } = await loadDashboardSnapshot();

        if (!active) {
          return;
        }

        setDashboard(snapshot);
        setWarnings(loadWarnings);
        setError("");
      } catch (requestError) {
        if (!active) {
          return;
        }

        clearStaffTokens();
        setStaff(null);
        setOverview(null);
        setDashboard(emptyDashboard);
        setWarnings([]);
        setError(requestError instanceof Error ? requestError.message : "Yönetim verileri yüklenemedi.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const allowedAreaCount = useMemo(
    () => overview?.permissionKeys.length ?? 0,
    [overview?.permissionKeys.length]
  );

  const healthCards = useMemo(
    () => [
      {
        label: "Yeni lead",
        value: dashboard.newLeads,
        detail: `${formatCount(dashboard.leads)} toplam talep`,
        href: "/leadler",
        tone: (dashboard.newLeads ?? 0) > 0 ? "warning" : "good"
      },
      {
        label: "Açık sipariş",
        value: dashboard.openOrders,
        detail: `${formatCount(dashboard.paidOrders)} ödemesi tamamlanan`,
        href: "/ticaret",
        tone: (dashboard.openOrders ?? 0) > 0 ? "warning" : "good"
      },
      {
        label: "Yayındaki ürün",
        value: dashboard.publishedProducts,
        detail: `${formatCount(dashboard.products)} toplam paket`,
        href: "/ticaret",
        tone: "neutral"
      },
      {
        label: "Medya varlığı",
        value: dashboard.mediaAssets,
        detail: `${formatCount(dashboard.videoAssets)} video / embed`,
        href: "/medya",
        tone: "neutral"
      },
      {
        label: "İçerik sayfası",
        value: dashboard.marketingPages,
        detail: `${formatCount(dashboard.marketingSections)} sayfa bölümü`,
        href: "/icerik",
        tone: "neutral"
      },
      {
        label: "Denetim kaydı",
        value: dashboard.auditTotal,
        detail: "Son işlemler takipte",
        href: "/denetim",
        tone: "neutral"
      }
    ],
    [dashboard]
  );

  const contentSummary = useMemo<Array<[string, number | null]>>(
    () => [
      ["Navbar öğesi", dashboard.navigationItems],
      ["Kadro profili", dashboard.staffProfiles],
      ["Başarı hikayesi", dashboard.successStories],
      ["Ücretsiz materyal", dashboard.freeMaterials],
      ["Kategori", dashboard.categories],
      ["Sipariş", dashboard.orders]
    ],
    [dashboard]
  );

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  return (
    <main className="admin-shell">
      <section className="admin-dashboard-hero">
        <div>
          <span className="admin-badge admin-badge--warm">Kontrol Merkezi</span>
          <h1>Yönetim Kontrol Merkezi</h1>
          <p>
            İçerik, operasyon, ticaret ve ekip yönetimine hızlıca ulaşın.
          </p>

          <div className="admin-dashboard-hero__actions">
            <Link className="admin-button" href="/icerik">
              İçerik yönetimine git
            </Link>
            <Link className="admin-button--ghost" href="/medya">
              Medya kütüphanesini aç
            </Link>
            <a className="admin-button--ghost" href="http://localhost:3000" target="_blank" rel="noreferrer">
              Website önizle
            </a>
          </div>
        </div>

        <div className="admin-welcome-card__profile">
          {loading ? (
            <span>Oturum ve dashboard verileri kontrol ediliyor...</span>
          ) : staff?.staffUser ? (
            <>
              <strong>
                {staff.staffUser.firstName} {staff.staffUser.lastName}
              </strong>
              <span>{staff.staffUser.email}</span>
              <small>{allowedAreaCount} yetki aktif</small>
              <button className="admin-button--ghost" type="button" onClick={handleLogout}>
                Çıkış yap
              </button>
            </>
          ) : bootstrapRequired ? (
            <Link className="admin-button" href="/kurulum">
              İlk super-admin kurulumunu aç
            </Link>
          ) : (
            <Link className="admin-button" href="/giris">
              Personel girişi
            </Link>
          )}
        </div>
      </section>

      {error ? <div className="admin-message admin-message--error">{error}</div> : null}

      {warnings.length > 0 ? (
        <section className="admin-dashboard-warning">
          <strong>Bazı dashboard kutuları yüklenemedi.</strong>
          <span>{warnings.join(" · ")}</span>
        </section>
      ) : null}

      <section className="admin-dashboard-kpi-grid" aria-label="Operasyon özeti">
        {healthCards.map((card) => (
          <Link
            key={card.label}
            className="admin-dashboard-kpi"
            data-tone={card.tone}
            href={card.href}
          >
            <span>{card.label}</span>
            <strong>{loading ? "..." : formatCount(card.value)}</strong>
            <small>{card.detail}</small>
          </Link>
        ))}
      </section>

      <div className="admin-dashboard-layout">
        <section className="admin-card">
          <div className="admin-dashboard-section-head">
            <div>
              <span className="admin-badge">Modüller</span>
              <h2>Panelde yapılacak işi seç</h2>
            </div>
            <small>Her kart doğrudan ilgili yönetim ekranına gider.</small>
          </div>

          <div className="admin-dashboard-action-grid">
            {quickActions.map((action) => (
              <Link key={action.href} className="admin-dashboard-action-card" data-tone={action.tone} href={action.href}>
                <span>{action.label}</span>
                <strong>{action.title}</strong>
                <p>{action.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <aside className="admin-card admin-dashboard-side">
          <span className="admin-badge">İçerik ve ticaret sayıları</span>
          <div className="admin-dashboard-mini-list">
            {contentSummary.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{loading ? "..." : formatCount(value)}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="admin-dashboard-layout admin-dashboard-layout--lower">
        <section className="admin-card">
          <div className="admin-dashboard-section-head">
            <div>
              <span className="admin-badge">Son işlemler</span>
              <h2>Yönetim panelinde en son ne değişti?</h2>
            </div>
            <Link className="admin-button--ghost" href="/denetim">
              Tüm denetim kayıtları
            </Link>
          </div>

          <div className="admin-dashboard-activity-list">
            {loading ? (
              <div className="admin-list__item">Son işlemler yükleniyor...</div>
            ) : dashboard.recentAuditLogs.length > 0 ? (
              dashboard.recentAuditLogs.map((log) => (
                <article key={log.id}>
                  <div>
                    <strong>{log.summary || log.action}</strong>
                    <span>
                      {log.actor.name} · {log.entityType}
                    </span>
                  </div>
                  <time>{formatDate(log.createdAt)}</time>
                </article>
              ))
            ) : (
              <div className="admin-list__item">Henüz denetim kaydı bulunmuyor.</div>
            )}
          </div>
        </section>

        <aside className="admin-card admin-dashboard-side">
          <span className="admin-badge">Canlıya çıkış kontrolü</span>
          <h2>Eksik kalmaması gerekenler</h2>
          <div className="admin-dashboard-checklist">
            {publishChecklist.map((item) => (
              <div key={item}>
                <span>✓</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

async function safeLoad<T>(label: string, loader: () => Promise<T>): Promise<DashboardLoadResult<T>> {
  try {
    return {
      label,
      value: await loader(),
      error: null
    };
  } catch (error) {
    return {
      label,
      value: null,
      error: error instanceof Error ? error.message : "Yüklenemedi."
    };
  }
}

async function loadDashboardSnapshot() {
  const [
    navigationResult,
    marketingResult,
    staffResult,
    successResult,
    freeMaterialsResult,
    catalogResult,
    ordersResult,
    leadsResult,
    mediaResult,
    auditResult
  ] = await Promise.all([
    safeLoad("Navigasyon", () => fetchAdminNavigationMenu("primary")),
    safeLoad("Sayfa içerikleri", fetchAdminMarketingPages),
    safeLoad("Akademik kadro", fetchAdminStaffProfilesDocument),
    safeLoad("Başarı hikayeleri", fetchAdminSuccessStoriesDocument),
    safeLoad("Ücretsiz materyaller", fetchAdminFreeMaterialsDocument),
    safeLoad("Ürün kataloğu", fetchAdminCatalogDocument),
    safeLoad("Siparişler", fetchAdminOrders),
    safeLoad("Leadler", () => fetchAdminLeads()),
    safeLoad("Medya", () => fetchAdminMedia()),
    safeLoad("Denetim kayıtları", () => fetchAdminAuditLogs({ take: 5 }))
  ]);

  const marketingPages = marketingResult.value ?? [];
  const catalog = catalogResult.value;
  const orders = ordersResult.value ?? [];
  const leads = leadsResult.value;
  const media = mediaResult.value ?? [];
  const freeMaterials = freeMaterialsResult.value;
  const audit = auditResult.value;

  return {
    snapshot: {
      navigationItems: navigationResult.value ? countNavigationItems(navigationResult.value.items) : null,
      marketingPages: marketingResult.value ? marketingPages.length : null,
      marketingSections: marketingResult.value
        ? marketingPages.reduce((total, page) => total + page.sections.length, 0)
        : null,
      staffProfiles: staffResult.value
        ? staffResult.value.groups.reduce((total, group) => total + group.profiles.length, 0)
        : null,
      successStories: successResult.value ? successResult.value.stories.length : null,
      freeMaterials: freeMaterials ? freeMaterials.categories.reduce((total, category) => total + category.items.length, 0) : null,
      products: catalog ? catalog.products.length : null,
      publishedProducts: catalog
        ? catalog.products.filter((product) => product.publishStatus !== "DRAFT").length
        : null,
      categories: catalog ? catalog.categories.length : null,
      orders: ordersResult.value ? orders.length : null,
      openOrders: ordersResult.value
        ? orders.filter((order) => !["COMPLETED", "CANCELLED", "REFUNDED"].includes(order.status)).length
        : null,
      paidOrders: ordersResult.value
        ? orders.filter((order) => order.paymentStatus === "PAID").length
        : null,
      leads: leads ? leads.total : null,
      newLeads: leads ? leads.counts.NEW ?? 0 : null,
      mediaAssets: mediaResult.value ? media.length : null,
      videoAssets: mediaResult.value ? media.filter((asset) => asset.kind === "VIDEO").length : null,
      auditTotal: audit ? audit.total : null,
      recentAuditLogs: audit?.logs ?? []
    } satisfies DashboardSnapshot,
    loadWarnings: [
      navigationResult,
      marketingResult,
      staffResult,
      successResult,
      freeMaterialsResult,
      catalogResult,
      ordersResult,
      leadsResult,
      mediaResult,
      auditResult
    ]
      .filter((result) => result.error)
      .map((result) => result.label)
  };
}

function countNavigationItems(items: AdminNavigationItem[]): number {
  return items.reduce((total, item) => total + 1 + countNavigationItems(item.children ?? []), 0);
}

function formatCount(value: number | null) {
  return value === null ? "-" : new Intl.NumberFormat("tr-TR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
