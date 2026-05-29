"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchDeploymentStatus, type DeploymentStatus } from "../lib/deploy-client";

const adminModules = [
  {
    href: "/",
    icon: "⌂",
    label: "Kontrol Merkezi",
    description: "Genel durum ve hızlı başlangıç"
  },
  {
    href: "/saas",
    icon: "SA",
    label: "SaaS Yönetimi",
    description: "Organizasyon, merkez, şube ve kapsam"
  },
  {
    href: "/operasyon",
    icon: "OP",
    label: "Operasyon Merkezi",
    description: "Şube, ders, koçluk ve duyurular"
  },
  {
    href: "/beta-readiness",
    icon: "BR",
    label: "Beta Hazırlık",
    description: "Pazartesi öncesi veri ve operasyon kontrolü"
  },
  {
    href: "/icerik",
    icon: "✎",
    label: "İçerik Yönetimi",
    description: "Menü, sayfalar, kadro, başarılar, materyaller"
  },
  {
    href: "/ticaret",
    icon: "◈",
    label: "Ürün ve Sipariş",
    description: "Paketler, kategoriler, fiyatlar, siparişler"
  },
  {
    href: "/medya",
    icon: "▣",
    label: "Medya Kütüphanesi",
    description: "Görsel, PDF, video ve Google Drive linkleri"
  },
  {
    href: "/leadler",
    icon: "☏",
    label: "Başvuru Talepleri",
    description: "Ücretsiz ön görüşme ve WhatsApp leadleri"
  },
  {
    href: "/personel",
    icon: "RB",
    label: "Personel ve Roller",
    description: "Admin hesapları, roller ve yetkiler"
  },
  {
    href: "/denetim",
    icon: "✓",
    label: "Denetim Kayıtları",
    description: "Kim neyi değiştirdi takibi"
  },
  {
    href: "/guncellemeler",
    icon: "UP",
    label: "Güncellemeler",
    description: "GitHub üzerinden VDS yayını"
  }
] as const;

const unframedRoutes = ["/giris", "/kurulum"];

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const isUnframed = unframedRoutes.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isUnframed) {
      return;
    }

    let active = true;

    fetchDeploymentStatus()
      .then((status) => {
        if (active) {
          setDeploymentStatus(status);
        }
      })
      .catch(() => {
        if (active) {
          setDeploymentStatus(null);
        }
      });

    return () => {
      active = false;
    };
  }, [isUnframed, pathname]);

  if (isUnframed) {
    return <>{children}</>;
  }

  const activeModule = adminModules.find((module) =>
    module.href === "/" ? pathname === "/" : pathname?.startsWith(module.href)
  );

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
        aria-label="Yönetim modülleri"
        aria-hidden={!sidebarOpen}
      >
        <Link className="admin-app-sidebar__brand" href="/">
          <span className="admin-app-sidebar__logo">EGA</span>
          <span>
            <strong>Eğitim Gurmesi</strong>
            <small>Yönetim Paneli</small>
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

        <div className="admin-app-sidebar__section">
          <span>Modüller</span>
          <nav className="admin-app-nav">
            {adminModules.map((module) => (
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

        <div className="admin-app-sidebar__help">
          <strong>Basit kullanım sırası</strong>
          <span>1. Soldan modül seç</span>
          <span>2. İçeride sayfa veya kayıt seç</span>
          <span>3. Alanları güncelle ve Kaydet</span>
        </div>

        <a className="admin-app-sidebar__site-link" href="http://localhost:3000" target="_blank" rel="noreferrer">
          Website önizlemesini aç
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
              <span className="admin-app-header__eyebrow">Aktif modül</span>
              <h1>{activeModule?.label ?? "Yönetim Paneli"}</h1>
              <p>{activeModule?.description ?? "Yönetim araçları ve operasyon ekranları."}</p>
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
