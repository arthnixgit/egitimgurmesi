import {
  CONTACT_DISPLAY_PHONE,
  CONTACT_TEL_HREF,
  CONTACT_WHATSAPP_HREF
} from "../lib/contact";

export function FooterContactLinks({ whatsappHref = CONTACT_WHATSAPP_HREF }: { whatsappHref?: string }) {
  return (
    <div className="ega-footer__contact" aria-label="İletişim bilgileri">
      <span className="ega-footer__contact-label">İletişime Geçin</span>
      <a className="ega-footer__contact-phone" href={CONTACT_TEL_HREF} title="Bizi Arayın">
        Bizi Arayın
        <strong>{CONTACT_DISPLAY_PHONE}</strong>
      </a>
      <a
        className="ega-footer__contact-whatsapp"
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        title="WhatsApp ile iletişime geçin"
      >
        WhatsApp ile Yazın
      </a>
    </div>
  );
}
