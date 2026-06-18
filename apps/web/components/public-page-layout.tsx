import type { ReactNode } from "react";
import Image from "next/image";
import { PublicNavbar } from "./public-navbar";

type PublicPageLayoutProps = {
  children: ReactNode;
  contactHref?: string;
};

export function PublicPageLayout({
  children,
  contactHref = "https://wa.me/905000000000?text=Merhaba%2C%20bilgi%20almak%20istiyorum."
}: PublicPageLayoutProps) {
  return (
    <main className="ega-page">
      <PublicNavbar />
      {children}

      <footer className="ega-footer">
        <div className="ega-footer__inner">
          <div className="ega-footer__brand">
            <Image
              src="/branding/ega-logo-official.png"
              alt="Eğitim Gurmesi Akademi"
              width={229}
              height={121}
              className="ega-footer__logo"
            />
            <p>
              Eğitim Gurmesi Akademi; kayıtlı video paketlerini, koçluk yönlendirme mantığını ve öğrenci hesap
              disiplinini tek çatı altında birleştiren yeni nesil bir eğitim satış platformu olarak kurgulanıyor.
            </p>
          </div>

          <div className="ega-footer__links">
            <a href="/paketlerimiz">Paketler</a>
            <a href="/ucretsiz-materyaller">Ücretsiz Materyaller</a>
            <a href="/hakkimizda">Hakkımızda</a>
            <a href="/giris">Öğrenci Girişi</a>
          </div>
        </div>
      </footer>

      <a
        className="ega-contact-bookmark"
        href={contactHref}
        aria-label="İletişime geç"
        target="_blank"
        rel="noreferrer"
      >
        <span>Bize Ulaşın</span>
      </a>
    </main>
  );
}
