import React from "react";
import { FooterContactLinks } from "./footer-contact-links";
import { normalizePublicSiteSettings, type PublicSiteSettings } from "../lib/contact";

export function PublicFooter({
  settings,
  contactHref
}: {
  settings?: Partial<PublicSiteSettings> | null;
  contactHref?: string;
}) {
  const normalized = normalizePublicSiteSettings(settings);

  return (
    <footer className="ega-footer">
      <div className="ega-footer__inner">
        <div className="ega-footer__brand">
          <img
            src={normalized.logoFooterUrl}
            alt={normalized.logoAltText}
            width={229}
            height={121}
            className="ega-footer__logo"
          />
          <p>{normalized.footerBrandDescription}</p>
          {normalized.socialLinks.length > 0 ? (
            <nav className="ega-footer__social" aria-label="Sosyal bağlantılar">
              {normalized.socialLinks.map((link) => (
                <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>

        <nav className="ega-footer__links" aria-label="Hızlı erişim">
          <h2>Hızlı Erişim</h2>
          {normalized.footerQuickLinks.map((link) => (
            <a key={`${link.label}-${link.href}`} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <FooterContactLinks settings={normalized} whatsappHref={contactHref} />
      </div>
      <div className="ega-footer__copyright">{normalized.copyrightText}</div>
    </footer>
  );
}
