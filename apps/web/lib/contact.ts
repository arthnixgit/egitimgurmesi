export const CONTACT_DISPLAY_PHONE = "0 (531) 855 38 27";
export const CONTACT_TEL_HREF = "tel:+905318553827";
export const CONTACT_WHATSAPP_NUMBER = "905318553827";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.";

export function buildWhatsAppHref(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const CONTACT_WHATSAPP_HREF = buildWhatsAppHref();
