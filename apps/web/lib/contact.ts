export const CONTACT_DISPLAY_PHONE = "+90 531 855 38 27";
export const CONTACT_CANONICAL_PHONE = "+905318553827";
export const CONTACT_TEL_HREF = "tel:+905318553827";
export const CONTACT_WHATSAPP_NUMBER = "905318553827";
export const CONTACT_ADDRESS = "Alacaatlı Mah. 4834. Sok. No: 10/8-59 Çankaya/Ankara";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.";

const REQUIRED_FOOTER_QUICK_LINKS = [
  { label: "Paketlerimiz", href: "/paketlerimiz" },
  { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "Öğrenci Girişi", href: "/giris" }
] as const;

export type PublicSiteSettings = {
  siteName: string;
  siteTitle: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  supportWhatsappNumber: string;
  logoPrimaryUrl: string;
  logoCompactUrl: string;
  logoMarkUrl: string;
  logoFooterUrl: string;
  logoDarkUrl: string;
  logoLightUrl: string;
  faviconUrl: string;
  defaultSocialImageUrl: string;
  logoAltText: string;
  displayPhone: string;
  canonicalPhone: string;
  telHref: string;
  whatsappMessage: string;
  whatsappHref: string;
  address: string;
  publicContactEmail?: string | null;
  footerBrandDescription: string;
  footerQuickLinks: Array<{ label: string; href: string }>;
  footerContactTitle: string;
  socialLinks: Array<{ label: string; href: string }>;
  copyrightText: string;
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
};

export const fallbackSiteSettings: PublicSiteSettings = {
  siteName: "Eğitim Gurmesi Akademi",
  siteTitle: "EĞİTİM GURMESİ AKADEMİ",
  supportEmail: "bilgi@egitimgurmesi.com",
  supportPhone: CONTACT_DISPLAY_PHONE,
  supportWhatsappNumber: CONTACT_WHATSAPP_NUMBER,
  logoPrimaryUrl: "/branding/ega-logo-official.png",
  logoCompactUrl: "/branding/ega-mark-transparent.png",
  logoMarkUrl: "/branding/ega-mark-transparent.png",
  logoFooterUrl: "/branding/ega-logo-official.png",
  logoDarkUrl: "/branding/ega-logo-official.png",
  logoLightUrl: "/branding/ega-logo-official.png",
  faviconUrl: "/icon.png",
  defaultSocialImageUrl: "/branding/ega-logo-official.png",
  logoAltText: "Eğitim Gurmesi Akademi",
  displayPhone: CONTACT_DISPLAY_PHONE,
  canonicalPhone: CONTACT_CANONICAL_PHONE,
  telHref: CONTACT_TEL_HREF,
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
  whatsappHref: buildWhatsAppHref(),
  address: CONTACT_ADDRESS,
  publicContactEmail: "bilgi@egitimgurmesi.com",
  footerBrandDescription:
    "Eğitim Gurmesi Akademi; kayıtlı video paketlerini, koçluk yönlendirme mantığını ve öğrenci hesap disiplinini tek çatı altında birleştiren yeni nesil bir eğitim satış platformu olarak kurgulanıyor.",
  footerQuickLinks: [...REQUIRED_FOOTER_QUICK_LINKS],
  footerContactTitle: "İletişim",
  socialLinks: [],
  copyrightText: "© Eğitim Gurmesi Akademi. Tüm hakları saklıdır.",
  defaultSeoTitle: "Eğitim Gurmesi Akademi",
  defaultSeoDescription: "Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları."
};

export function buildWhatsAppHref(
  message = DEFAULT_WHATSAPP_MESSAGE,
  number = CONTACT_WHATSAPP_NUMBER
) {
  const normalizedNumber = number.replace(/\D/g, "");
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

export function normalizePublicSiteSettings(input: Partial<PublicSiteSettings> | null | undefined) {
  const whatsappNumber = input?.supportWhatsappNumber?.replace(/\D/g, "") || CONTACT_WHATSAPP_NUMBER;
  const whatsappMessage = input?.whatsappMessage || DEFAULT_WHATSAPP_MESSAGE;
  const canonicalPhone =
    input?.canonicalPhone && /^\+[1-9]\d{7,14}$/.test(input.canonicalPhone)
      ? input.canonicalPhone
      : CONTACT_CANONICAL_PHONE;

  return {
    ...fallbackSiteSettings,
    ...input,
    siteName: input?.siteName || fallbackSiteSettings.siteName,
    siteTitle: input?.siteTitle || fallbackSiteSettings.siteTitle,
    supportEmail: input?.supportEmail ?? fallbackSiteSettings.supportEmail,
    supportPhone: input?.supportPhone ?? fallbackSiteSettings.supportPhone,
    supportWhatsappNumber: whatsappNumber,
    displayPhone: input?.displayPhone || CONTACT_DISPLAY_PHONE,
    canonicalPhone,
    telHref: `tel:${canonicalPhone}`,
    whatsappMessage,
    whatsappHref: buildWhatsAppHref(whatsappMessage, whatsappNumber),
    logoPrimaryUrl: normalizePublicAssetUrl(input?.logoPrimaryUrl, fallbackSiteSettings.logoPrimaryUrl),
    logoCompactUrl: normalizePublicAssetUrl(input?.logoCompactUrl, fallbackSiteSettings.logoCompactUrl),
    logoMarkUrl: normalizePublicAssetUrl(input?.logoMarkUrl, fallbackSiteSettings.logoMarkUrl),
    logoFooterUrl: normalizePublicAssetUrl(input?.logoFooterUrl, fallbackSiteSettings.logoFooterUrl),
    logoDarkUrl: normalizePublicAssetUrl(input?.logoDarkUrl, fallbackSiteSettings.logoDarkUrl),
    logoLightUrl: normalizePublicAssetUrl(input?.logoLightUrl, fallbackSiteSettings.logoLightUrl),
    faviconUrl: normalizePublicAssetUrl(input?.faviconUrl, fallbackSiteSettings.faviconUrl),
    defaultSocialImageUrl: normalizePublicAssetUrl(
      input?.defaultSocialImageUrl,
      fallbackSiteSettings.defaultSocialImageUrl
    ),
    logoAltText: input?.logoAltText || fallbackSiteSettings.logoAltText,
    address: input?.address || CONTACT_ADDRESS,
    footerBrandDescription:
      input?.footerBrandDescription || fallbackSiteSettings.footerBrandDescription,
    footerQuickLinks: normalizeFooterQuickLinks(input?.footerQuickLinks),
    footerContactTitle: input?.footerContactTitle || fallbackSiteSettings.footerContactTitle,
    socialLinks: input?.socialLinks ?? fallbackSiteSettings.socialLinks,
    copyrightText: input?.copyrightText || fallbackSiteSettings.copyrightText,
    defaultSeoTitle: input?.defaultSeoTitle || fallbackSiteSettings.defaultSeoTitle,
    defaultSeoDescription: input?.defaultSeoDescription || fallbackSiteSettings.defaultSeoDescription
  };
}

export const CONTACT_WHATSAPP_HREF = buildWhatsAppHref();

function normalizeFooterQuickLinks(value: PublicSiteSettings["footerQuickLinks"] | undefined) {
  const links = new Map<string, { label: string; href: string }>();

  for (const link of value ?? fallbackSiteSettings.footerQuickLinks) {
    if (link.label?.trim() && link.href?.startsWith("/")) {
      links.set(link.href, { label: link.label.trim(), href: link.href });
    }
  }

  for (const link of REQUIRED_FOOTER_QUICK_LINKS) {
    if (!links.has(link.href)) {
      links.set(link.href, link);
    }
  }

  return [...links.values()];
}

export function normalizePublicAssetUrl(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();

  if (!trimmed || !isSafePublicAssetUrl(trimmed)) {
    return fallback;
  }

  return trimmed;
}

export function isSafePublicAssetUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !/[\u0000-\u001f]/.test(value);
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidPublicSiteSettingsSnapshot(value: unknown): value is PublicSiteSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings = value as Partial<Record<keyof PublicSiteSettings, unknown>>;
  const requiredStringFields: Array<keyof PublicSiteSettings> = [
    "siteName",
    "siteTitle",
    "supportWhatsappNumber",
    "logoPrimaryUrl",
    "logoCompactUrl",
    "logoMarkUrl",
    "logoFooterUrl",
    "logoDarkUrl",
    "logoLightUrl",
    "faviconUrl",
    "defaultSocialImageUrl",
    "logoAltText",
    "displayPhone",
    "canonicalPhone",
    "telHref",
    "whatsappMessage",
    "whatsappHref",
    "address",
    "footerBrandDescription",
    "footerContactTitle",
    "copyrightText"
  ];

  return requiredStringFields.every((field) => typeof settings[field] === "string");
}

export function isAuthoritativePublicSiteSettingsResponse(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings = value as Partial<Record<keyof PublicSiteSettings, unknown>>;
  const requiredStringFields: Array<keyof PublicSiteSettings> = [
    "siteName",
    "siteTitle",
    "supportWhatsappNumber",
    "logoAltText",
    "displayPhone",
    "canonicalPhone",
    "telHref",
    "whatsappMessage",
    "whatsappHref",
    "address",
    "footerBrandDescription",
    "footerContactTitle",
    "copyrightText"
  ];
  const assetFields: Array<keyof PublicSiteSettings> = [
    "logoPrimaryUrl",
    "logoCompactUrl",
    "logoMarkUrl",
    "logoFooterUrl",
    "logoDarkUrl",
    "logoLightUrl",
    "faviconUrl",
    "defaultSocialImageUrl"
  ];

  if (!requiredStringFields.every((field) => typeof settings[field] === "string" && settings[field].trim().length > 0)) {
    return false;
  }

  if (!assetFields.every((field) => typeof settings[field] === "string" && isSafePublicAssetUrl(settings[field]))) {
    return false;
  }

  return Array.isArray(settings.footerQuickLinks) && Array.isArray(settings.socialLinks);
}
