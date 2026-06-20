import type { ReactNode } from "react";
import Image from "next/image";
import { FooterContactLinks } from "./footer-contact-links";
import { PublicNavbar } from "./public-navbar";
import { CONTACT_WHATSAPP_HREF } from "../lib/contact";

type PublicPageLayoutProps = {
  children: ReactNode;
  contactHref?: string;
};

export function PublicPageLayout({
  children,
  contactHref = CONTACT_WHATSAPP_HREF
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
            <FooterContactLinks whatsappHref={contactHref} />
          </div>
        </div>
      </footer>

      <a
        className="ega-contact-bookmark"
        href={contactHref}
        aria-label="WhatsApp ile iletişime geçin"
        title="WhatsApp ile iletişime geçin"
        target="_blank"
        rel="noreferrer"
      >
        <span>WhatsApp ile Yazın</span>
      </a>
    </main>
  );
}
