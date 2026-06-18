"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchDeploymentStatus, type DeploymentStatus } from "../lib/deploy-client";
import { fetchStaffOverview } from "../lib/auth-client";
import {
  getPrimaryRoleLabel,
  isAccountantRole,
  isBranchAdminRole,
  isCoachRole,
  isInstructorRole,
  isSuperAdminRole
} from "../lib/role-routing";

type StaffOverview = Awaited<ReturnType<typeof fetchStaffOverview>>;

type AdminModule = {
  href: string;
  icon: string;
  label: string;
  description: string;
  group: "Günlük Panel" | "Operasyon" | "İçerik ve Satış" | "Sistem";
  visibleFor: (overview: StaffOverview | null) => boolean;
};

const isSuperOrAdmin = (overview: StaffOverview | null) => isSuperAdminRole(overview?.roleKeys);
const isBranchAdmin = (overview: StaffOverview | null) => isBranchAdminRole(overview?.roleKeys);
const isInstructor = (overview: StaffOverview | null) => isInstructorRole(overview?.roleKeys);
const isCoach = (overview: StaffOverview | null) => isCoachRole(overview?.roleKeys);
const isAccountant = (overview: StaffOverview | null) => isAccountantRole(overview?.roleKeys);
const hasPermission = (overview: StaffOverview | null, permission: string) =>
  Boolean(overview?.permissionKeys.includes(permission));

const adminModules: AdminModule[] = [
  {
    href: "/platform",
    icon: "PL",
    label: "Genel Bakış",
    description: "Platform sağlığı ve hızlı işlemler",
    group: "Günlük Panel",
    visibleFor: (overview) => isSuperOrAdmin(overview)
  },
  {
    href: "/sube",
    icon: "ŞB",
    label: "Şube Paneli",
    description: "Şube öğrencileri, grupları ve dersleri",
    group: "Günlük Panel",
    visibleFor: (overview) => isBranchAdmin(overview)
  },
  {
    href: "/egitmen",
    icon: "EĞ",
    label: "Eğitmen Paneli",
    description: "Dersler, sınıflar ve öğrenciler",
    group: "Günlük Panel",
    visibleFor: (overview) => isInstructor(overview)
  },
  {
    href: "/koc",
    icon: "KO",
    label: "Koç Paneli",
    description: "Takipler, planlar ve görüşme notları",
    group: "Günlük Panel",
    visibleFor: (overview) => isCoach(overview)
  },
  {
    href: "/finans",
    icon: "FN",
    label: "Finans Paneli",
    description: "Ödemeler, siparişler ve gelir özeti",
    group: "Günlük Panel",
    visibleFor: (overview) => isAccountant(overview) || isSuperOrAdmin(overview)
  },
  {
    href: "/saas",
    icon: "KŞ",
    label: "Kurum ve Şube Yönetimi",
    description: "Organizasyon, merkez, şube ve yetki kapsamı",
    group: "Operasyon",
    visibleFor: (overview) =>
      isSuperOrAdmin(overview) || isBranchAdmin(overview) || hasPermission(overview, "organizations.manage")
  },
  {
    href: "/operasyon",
    icon: "CD",
    label: "Canlı Ders ve Duyurular",
    description: "Ders planı, gruplar, koçluk ve duyurular",
    group: "Operasyon",
    visibleFor: (overview) =>
      isSuperOrAdmin(overview) ||
      isBranchAdmin(overview) ||
      isInstructor(overview) ||
      isCoach(overview)
  },
  {
    href: "/leadler",
    icon: "ÖG",
    label: "Ön Görüşme Talepleri",
    description: "Ziyaretçi talepleri ve iletişim kayıtları",
    group: "Operasyon",
    visibleFor: (overview) => isSuperOrAdmin(overview) || hasPermission(overview, "leads.manage")
  },
  {
    href: "/ticaret",
    icon: "PS",
    label: "Paketler ve Satış",
    description: "Paketler, fiyatlar, siparişler ve harici siparişler",
    group: "İçerik ve Satış",
    visibleFor: (overview) =>
      isSuperOrAdmin(overview) || isBranchAdmin(overview) || isAccountant(overview) || hasPermission(overview, "products.manage")
  },
  {
    href: "/icerik",
    icon: "İÇ",
    label: "İçerik Yönetimi",
    description: "Sayfalar, menüler, kadro ve materyaller",
    group: "İçerik ve Satış",
    visibleFor: (overview) => isSuperOrAdmin(overview) || hasPermission(overview, "cms.manage")
  },
  {
    href: "/medya",
    icon: "MK",
    label: "Medya Kütüphanesi",
    description: "Görsel, doküman ve video bağlantıları",
    group: "İçerik ve Satış",
    visibleFor: (overview) => isSuperOrAdmin(overview) || hasPermission(overview, "cms.manage")
  },
  {
    href: "/personel",
    icon: "PR",
    label: "Personel ve Roller",
    description: "Ekip hesapları, roller ve erişimler",
    group: "Sistem",
    visibleFor: (overview) => isSuperOrAdmin(overview) || isBranchAdmin(overview) || hasPermission(overview, "staff.manage")
  },
  {
    href: "/beta-readiness",
    icon: "KK",
    label: "Kurulum Kontrolü",
    description: "Onboarding ve beta hazırlık durumu",
    group: "Sistem",
    visibleFor: (overview) => isSuperOrAdmin(overview)
  },
  {
    href: "/denetim",
    icon: "SK",
    label: "Sistem Kayıtları",
    description: "İşlem geçmişi ve gelişmiş denetim",
    group: "Sistem",
    visibleFor: (overview) => isSuperOrAdmin(overview) || hasPermission(overview, "audit.read")
  },
  {
    href: "/guncellemeler",
    icon: "YG",
    label: "Yayın ve Güncelleme",
    description: "Sürüm durumu ve yayın akışı",
    group: "Sistem",
    visibleFor: (overview) => isSuperOrAdmin(overview) || hasPermission(overview, "maintenance.manage")
  }
];

const unframedRoutes = ["/", "/giris", "/kurulum"];

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const isUnframed = unframedRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname?.startsWith(route)
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isUnframed) {
      return;
    }

    let active = true;

    Promise.allSettled([fetchDeploymentStatus(), fetchStaffOverview()]).then(([deployResult, overviewResult]) => {
      if (!active) {
        return;
      }

      setDeploymentStatus(deployResult.status === "fulfilled" ? deployResult.value : null);
      setOverview(overviewResult.status === "fulfilled" ? overviewResult.value : null);
    });

    return () => {
      active = false;
    };
  }, [isUnframed, pathname]);

  const visibleModules = useMemo(() => {
    const modules = adminModules.filter((module) => module.visibleFor(overview));
    return modules.length ? modules : adminModules.filter((module) => module.group === "Günlük Panel");
  }, [overview]);

  if (isUnframed) {
    return <>{children}</>;
  }

  const activeModule = visibleModules.find((module) =>
    module.href === "/" ? pathname === "/" : pathname?.startsWith(module.href)
  );
  const websiteUrl = resolveWebsiteUrl();
  const groupedModules = groupModules(visibleModules);

  return (
    <div className="admin-app-frame" data-sidebar-open={sidebarOpen}>
      <button
        className="admin-app-sidebar-backdrop"
        type="button"
        aria-label="Menüyü kapat"
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="admin-sidebar"
        className="admin-app-sidebar"
        aria-label="Yönetim alanları"
        aria-hidden={!sidebarOpen}
      >
        <Link className="admin-app-sidebar__brand" href={activeModule?.href ?? "/platform"}>
          <Image
            src="/branding/ega-logo-official.png"
            alt="Eğitim Gurmesi Akademi"
            width={96}
            height={51}
            className="admin-app-sidebar__logo"
            style={{
              background: "rgba(255, 255, 255, 0.94)",
              objectFit: "contain",
              padding: "5px"
            }}
            priority
          />
          <span>
            <strong>Eğitim Gurmesi</strong>
            <small>{getPrimaryRoleLabel(overview?.roleKeys)}</small>
          </span>
        </Link>

        <button
          className="admin-app-sidebar__close"
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setSidebarOpen(false)}
        >
          Kapat
        </button>

        {Object.entries(groupedModules).map(([group, modules]) => (
          <div className="admin-app-sidebar__section" key={group}>
            <span>{group}</span>
            <nav className="admin-app-nav">
              {modules.map((module) => (
                <Link
                  key={module.href}
                  className="admin-app-nav__item"
                  data-active={activeModule?.href === module.href}
                  href={module.href}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="admin-app-nav__icon">{module.icon}</span>
                  <span className="admin-app-nav__text">
                    <strong>{module.label}</strong>
                    <small>{module.description}</small>
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        ))}

        <div className="admin-app-sidebar__help">
          <strong>Hızlı Başlangıç</strong>
          <span>Rolüne uygun paneli aç.</span>
          <span>Günlük işlemlerden devam et.</span>
          <span>Gerekli kayıtları kaydet.</span>
        </div>

        <a className="admin-app-sidebar__site-link" href={websiteUrl} target="_blank" rel="noreferrer">
          Web sitesini aç
        </a>
      </aside>

      <div className="admin-app-main">
        <header className="admin-app-header">
          <div className="admin-app-header__module">
            <button
              className="admin-app-menu-button"
              type="button"
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
              onClick={() => setSidebarOpen((current) => !current)}
            >
              <span>☰</span>
              Menü
            </button>
            <div>
              <span className="admin-app-header__eyebrow">Aktif alan</span>
              <h1>{activeModule?.label ?? "Yönetim Paneli"}</h1>
              <p>{activeModule?.description ?? "Rolüne uygun yönetim alanları."}</p>
            </div>
          </div>
          {deploymentStatus?.updateAvailable ? (
            <Link className="admin-deploy-alert" href="/guncellemeler">
              Güncelleme var
            </Link>
          ) : null}
          <Link className="admin-button--ghost" href="/giris">
            Hesap değiştir
          </Link>
        </header>

        {children}
      </div>
    </div>
  );
}

function groupModules(modules: AdminModule[]) {
  return modules.reduce<Record<AdminModule["group"], AdminModule[]>>(
    (groups, module) => {
      groups[module.group].push(module);
      return groups;
    },
    {
      "Günlük Panel": [],
      Operasyon: [],
      "İçerik ve Satış": [],
      Sistem: []
    }
  );
}

function resolveWebsiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window === "undefined") {
    return "#";
  }

  const { protocol, hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }

  if (hostname.startsWith("admin.")) {
    return `${protocol}//${hostname.replace(/^admin\./, "")}`;
  }

  return `${protocol}//${hostname}`;
}
