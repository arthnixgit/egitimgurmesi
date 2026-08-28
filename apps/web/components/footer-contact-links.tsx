import React from "react";
import {
  CONTACT_ADDRESS,
  CONTACT_DISPLAY_PHONE,
  CONTACT_TEL_HREF,
  CONTACT_WHATSAPP_HREF,
  normalizePublicSiteSettings,
  type PublicSiteSettings
} from "../lib/contact";

export function FooterContactLinks({
  settings,
  whatsappHref
}: {
  settings?: Partial<PublicSiteSettings> | null;
  whatsappHref?: string;
}) {
  const normalized = normalizePublicSiteSettings(settings);
  const resolvedWhatsappHref = whatsappHref ?? normalized.whatsappHref ?? CONTACT_WHATSAPP_HREF;

  return (
    <address className="ega-footer__contact" aria-label="İletişim bilgileri">
      <span className="ega-footer__contact-label">{normalized.footerContactTitle || "İletişime Geçin"}</span>
      <a className="ega-footer__contact-phone" href={normalized.telHref || CONTACT_TEL_HREF} title="Bizi Arayın">
        Bizi Arayın
        <strong>{normalized.displayPhone || CONTACT_DISPLAY_PHONE}</strong>
      </a>
      <div className="ega-footer__contact-address">
        <span>Adres</span>
        <strong>{normalized.address || CONTACT_ADDRESS}</strong>
      </div>
      {normalized.publicContactEmail ? (
        <a className="ega-footer__contact-email" href={`mailto:${normalized.publicContactEmail}`}>
          {normalized.publicContactEmail}
        </a>
      ) : null}
      <a
        className="ega-footer__contact-whatsapp"
        href={resolvedWhatsappHref}
        target="_blank"
        rel="noreferrer"
        title="WhatsApp ile iletişime geçin"
      >
        WhatsApp ile Yazın
      </a>
    </address>
  );
}
