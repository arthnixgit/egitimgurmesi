"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getBetaReadiness,
  getTenancyOverview,
  type BetaReadinessSummary,
  type TenancyOverview
} from "../lib/admin-tenancy-client";
import {
  clearStaffTokens,
  fetchStaffOverview,
  getAdminRequestErrorMessage,
  isStaffSessionError
} from "../lib/auth-client";
import {
  getOperationalDashboard,
  type AnnouncementItem,
  type LiveSessionItem,
  type OperationalDashboard
} from "../lib/operations-client";
import { getStaffDefaultRoute } from "../lib/role-routing";

type RoleDashboardKind = "platform" | "branch" | "instructor" | "coach" | "finance";

type DashboardCopy = {
  eyebrow: string;
  title: string;
  description: string;
  focusLabel: string;
};

const dashboardCopy: Record<RoleDashboardKind, DashboardCopy> = {
  platform: {
    eyebrow: "Platform Genel Bakış",
    title: "Eğitim operasyonunu tek merkezden yönet.",
    description: "Kurumlar, şubeler, satışlar ve günlük operasyon akışını buradan takip edin.",
    focusLabel: "Platform sağlığı"
  },
  branch: {
    eyebrow: "Şube Paneli",
    title: "Şubenin günlük akışını yönetin.",
    description: "Öğrenciler, gruplar, canlı dersler, eğitmenler ve koçlar aynı ekranda.",
    focusLabel: "Şube operasyonu"
  },
  instructor: {
    eyebrow: "Eğitmen Paneli",
    title: "Derslerini ve öğrencilerini takip et.",
    description: "Bugünkü dersler, sınıflar, materyaller ve duyurular için başlangıç alanı.",
    focusLabel: "Ders akışı"
  },
  coach: {
    eyebrow: "Koç Paneli",
    title: "Öğrenci takiplerini düzenli yürüt.",
    description: "Haftalık planlar, görüşme notları ve takip bekleyen öğrenciler için çalışma alanı.",
    focusLabel: "Koçluk takibi"
  },
  finance: {
    eyebrow: "Finans Paneli",
    title: "Ödeme ve sipariş akışını kontrol edin.",
    description: "Siparişler, ödemeler, gelir özeti ve finansal takip için başlangıç ekranı.",
    focusLabel: "Finans özeti"
  }
};

const quickActions: Record<RoleDashboardKind, Array<{ label: string; href: string; body: string; tone: string }>> = {
  platform: [
    { label: "Yeni Şube", href: "/saas/subeler", body: "Kurum yapısına yeni şube ekleyin.", tone: "teal" },
    { label: "Yeni Öğrenci", href: "/saas/ogrenci-uyelikleri", body: "Öğrenciyi şube kapsamına alın.", tone: "green" },
    { label: "Yeni Paket", href: "/ticaret", body: "Paket ve fiyatları düzenleyin.", tone: "blue" },
    { label: "Duyuru Yayınla", href: "/operasyon", body: "Şube veya grup duyurusu oluşturun.", tone: "amber" }
  ],
  branch: [
    { label: "Öğrenci Ekle", href: "/saas/ogrenci-uyelikleri", body: "Öğrenciyi şubeye bağlayın.", tone: "green" },
    { label: "Grup Oluştur", href: "/saas/sinif-gruplar", body: "Sınıf veya çalışma grubu açın.", tone: "teal" },
    { label: "Ders Planla", href: "/operasyon", body: "Canlı ders oturumu oluşturun.", tone: "blue" },
    { label: "Duyuru Yayınla", href: "/operasyon", body: "Öğrenci ve ekip duyurusu gönderin.", tone: "amber" }
  ],
  instructor: [
    { label: "Canlı Dersleri Gör", href: "/operasyon", body: "Yaklaşan ders programını açın.", tone: "blue" },
    { label: "Materyal Ekle", href: "/medya", body: "Ders görseli, PDF veya video ekleyin.", tone: "teal" },
    { label: "Öğrencilerimi Gör", href: "/operasyon", body: "Atandığınız sınıf ve öğrencileri takip edin.", tone: "green" }
  ],
  coach: [
    { label: "Haftalık Plan Oluştur", href: "/operasyon", body: "Öğrenci için çalışma planı hazırlayın.", tone: "teal" },
    { label: "Görüşme Notu Ekle", href: "/operasyon", body: "Koçluk görüşmesi notunu kaydedin.", tone: "amber" },
    { label: "Öğrencilerimi Gör", href: "/operasyon", body: "Atandığınız öğrencileri takip edin.", tone: "green" }
  ],
  finance: [
    { label: "Ödemeleri Gör", href: "/ticaret", body: "Ödeme kayıtları ve durumları inceleyin.", tone: "green" },
    { label: "Siparişleri Gör", href: "/ticaret", body: "Sipariş akışını kontrol edin.", tone: "blue" },
    { label: "Raporlar", href: "/denetim", body: "Kayıt geçmişi ve finans hareketlerini izleyin.", tone: "navy" }
  ]
};

export function RoleDashboardPage({ kind }: { kind: RoleDashboardKind }) {
  const router = useRouter();
  const [operations, setOperations] = useState<OperationalDashboard | null>(null);
  const [tenancy, setTenancy] = useState<TenancyOverview | null>(null);
  const [readiness, setReadiness] = useState<BetaReadinessSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const overview = await fetchStaffOverview();
        const defaultRoute = getStaffDefaultRoute({
          roleKeys: overview.roleKeys,
          permissionKeys: overview.permissionKeys
        });

        if (!active) {
          return;
        }

        if (!isDashboardAllowed(kind, defaultRoute, overview.roleKeys)) {
          router.replace(defaultRoute);
          return;
        }

        const [operationsResult, tenancyResult, readinessResult] = await Promise.allSettled([
          getOperationalDashboard(),
          getTenancyOverview(),
          kind === "platform" ? getBetaReadiness() : Promise.resolve(null)
        ]);

        if (!active) {
          return;
        }

        setOperations(operationsResult.status === "fulfilled" ? operationsResult.value : null);
        setTenancy(tenancyResult.status === "fulfilled" ? tenancyResult.value : null);
        setReadiness(readinessResult.status === "fulfilled" ? readinessResult.value : null);

        const failures = [operationsResult, tenancyResult, readinessResult].filter(
          (result) => result.status === "rejected"
        );
        setError(failures.length ? "Bazı panel özetleri şu anda alınamadı." : "");
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (isStaffSessionError(requestError)) {
          clearStaffTokens();
          router.replace("/giris");
          return;
        }

        setError(
          getAdminRequestErrorMessage(requestError, {
            forbidden: "Bu panel için yetkiniz bulunmuyor.",
            network: "Panel verileri alınamadı. Bağlantınızı kontrol edin.",
            server: "Panel servisi şu anda yanıt vermiyor.",
            fallback: "Panel verileri yüklenemedi."
          })
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
  }, [kind, router]);

  const copy = dashboardCopy[kind];
  const statCards = useMemo(() => buildStats(kind, operations, tenancy, readiness), [kind, operations, readiness, tenancy]);
  const sessions = operations?.upcomingSessions ?? [];
  const announcements = operations?.announcements ?? [];

  return (
    <main className="admin-shell">
      <section className="admin-dashboard-hero">
        <div>
          <span className="admin-badge admin-badge--warm">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>

        <div className="admin-welcome-card__profile">
          <strong>{copy.focusLabel}</strong>
          <span>{loading ? "Özet hazırlanıyor..." : "Günlük işlemler hazır"}</span>
          <small>{operations?.actor.email ?? "Yetki kapsamı kontrol edildi"}</small>
        </div>
      </section>

      {error ? <div className="admin-message">{error}</div> : null}

      <section className="admin-dashboard-kpi-grid" aria-label="Panel özeti">
        {statCards.map((card) => (
          <Link key={card.label} className="admin-dashboard-kpi" data-tone={card.tone} href={card.href}>
            <span>{card.label}</span>
            <strong>{loading ? "..." : formatCount(card.value)}</strong>
            <small>{card.detail}</small>
          </Link>
        ))}
      </section>

      <section className="admin-card">
        <div className="admin-dashboard-section-head">
          <div>
            <span className="admin-badge">Hızlı İşlemler</span>
            <h2>Bugün nereden başlamak istiyorsun?</h2>
          </div>
        </div>

        <div className="admin-dashboard-action-grid">
          {quickActions[kind].map((action) => (
            <Link key={action.label} className="admin-dashboard-action-card" data-tone={action.tone} href={action.href}>
              <span>{action.label}</span>
              <strong>{action.body}</strong>
            </Link>
          ))}
        </div>
      </section>

      <div className="admin-dashboard-layout admin-dashboard-layout--lower">
        <DashboardList
          badge="Yaklaşan Canlı Dersler"
          title="Program"
          items={sessions.slice(0, 5)}
          emptyText="Yaklaşan canlı ders bulunmuyor."
          renderItem={(session) => (
            <>
              <div>
                <strong>{session.title}</strong>
                <span>{session.classGroup?.name || session.branch?.name || "Genel oturum"}</span>
              </div>
              <time>{formatDate(session.startsAt)}</time>
            </>
          )}
        />

        <DashboardList
          badge="Duyurular"
          title="Son Bildirimler"
          items={announcements.slice(0, 5)}
          emptyText="Yayınlanmış duyuru bulunmuyor."
          renderItem={(announcement) => (
            <>
              <div>
                <strong>{announcement.title}</strong>
                <span>{announcement.body}</span>
              </div>
              <time>{formatDate(announcement.createdAt)}</time>
            </>
          )}
        />
      </div>
    </main>
  );
}

function isDashboardAllowed(kind: RoleDashboardKind, defaultRoute: string, roleKeys: string[]) {
  const allowedByRoute: Record<RoleDashboardKind, string[]> = {
    platform: ["/platform"],
    branch: ["/sube"],
    instructor: ["/egitmen"],
    coach: ["/koc"],
    finance: ["/finans", "/platform"]
  };

  if (roleKeys.includes("super-admin") || roleKeys.includes("admin")) {
    return kind === "platform" || kind === "finance";
  }

  return allowedByRoute[kind].includes(defaultRoute);
}

function buildStats(
  kind: RoleDashboardKind,
  operations: OperationalDashboard | null,
  tenancy: TenancyOverview | null,
  readiness: BetaReadinessSummary | null
) {
  const totals = operations?.totals;

  if (kind === "platform") {
    return [
      { label: "Şube", value: tenancy?.branchCount ?? totals?.branches ?? null, detail: "Aktif operasyon alanı", href: "/saas/subeler", tone: "neutral" },
      { label: "Öğrenci", value: totals?.students ?? tenancy?.studentMembershipCount ?? null, detail: "Kayıtlı öğrenci kapsamı", href: "/saas/ogrenci-uyelikleri", tone: "neutral" },
      { label: "Sipariş", value: totals?.recentOrders ?? null, detail: "Son ticaret hareketleri", href: "/ticaret", tone: "neutral" },
      { label: "Kurulum", value: readiness?.readinessPercentage ?? null, detail: "Hazırlık yüzdesi", href: "/beta-readiness", tone: "good" }
    ];
  }

  if (kind === "finance") {
    return [
      { label: "Ödeme", value: totals?.recentPayments ?? null, detail: "Son ödeme kayıtları", href: "/ticaret", tone: "neutral" },
      { label: "Sipariş", value: totals?.recentOrders ?? null, detail: "Son siparişler", href: "/ticaret", tone: "neutral" },
      { label: "Şube", value: totals?.branches ?? null, detail: "Gelir kapsamı", href: "/saas/subeler", tone: "neutral" },
      { label: "Duyuru", value: totals?.announcements ?? null, detail: "Operasyon bildirimleri", href: "/operasyon", tone: "neutral" }
    ];
  }

  if (kind === "instructor") {
    return [
      { label: "Ders", value: totals?.upcomingSessions ?? null, detail: "Yaklaşan canlı ders", href: "/operasyon", tone: "neutral" },
      { label: "Sınıf", value: totals?.classGroups ?? null, detail: "Atanmış grup", href: "/operasyon", tone: "neutral" },
      { label: "Öğrenci", value: totals?.students ?? null, detail: "Ders kapsamı", href: "/operasyon", tone: "neutral" },
      { label: "Duyuru", value: totals?.announcements ?? null, detail: "Yayınlanan bildirim", href: "/operasyon", tone: "neutral" }
    ];
  }

  if (kind === "coach") {
    return [
      { label: "Öğrenci", value: totals?.students ?? null, detail: "Takip kapsamı", href: "/operasyon", tone: "neutral" },
      { label: "Plan", value: operations?.coach.plans.length ?? null, detail: "Haftalık plan", href: "/operasyon", tone: "neutral" },
      { label: "Not", value: operations?.coach.notes.length ?? null, detail: "Görüşme notu", href: "/operasyon", tone: "neutral" },
      { label: "Ders", value: totals?.upcomingSessions ?? null, detail: "Yaklaşan oturum", href: "/operasyon", tone: "neutral" }
    ];
  }

  return [
    { label: "Öğrenci", value: totals?.students ?? null, detail: "Şube öğrenci kapsamı", href: "/saas/ogrenci-uyelikleri", tone: "neutral" },
    { label: "Grup", value: totals?.classGroups ?? null, detail: "Aktif sınıf / grup", href: "/saas/sinif-gruplar", tone: "neutral" },
    { label: "Eğitmen", value: totals?.instructors ?? null, detail: "Ders ekibi", href: "/saas/personel-atamalari", tone: "neutral" },
    { label: "Canlı Ders", value: totals?.upcomingSessions ?? null, detail: "Yaklaşan oturum", href: "/operasyon", tone: "neutral" }
  ];
}

function DashboardList<T>({
  badge,
  title,
  items,
  emptyText,
  renderItem
}: {
  badge: string;
  title: string;
  items: T[];
  emptyText: string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <section className="admin-card">
      <div className="admin-dashboard-section-head">
        <div>
          <span className="admin-badge">{badge}</span>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="admin-dashboard-activity-list">
        {items.length ? (
          items.map((item, index) => <article key={index}>{renderItem(item)}</article>)
        ) : (
          <div className="admin-list__item">{emptyText}</div>
        )}
      </div>
    </section>
  );
}

function formatCount(value?: number | null) {
  return value === null || value === undefined ? "-" : new Intl.NumberFormat("tr-TR").format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
