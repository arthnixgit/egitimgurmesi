import type { Metadata } from "next";
import "./globals.css";
import { FloatingInstagramLink } from "../components/floating-instagram-link";
import { FloatingWhatsAppLink } from "../components/floating-whatsapp-link";
import { PublicNavigationProvider } from "../components/public-navigation-provider";
import { PublicSiteSettingsProvider } from "../components/public-site-settings-provider";
import { StudentSessionManager } from "../components/student-session-manager";
import { getNavigationSnapshot, getPublicSiteSettings } from "../lib/public-content-api";

const fallbackMetadataDescription =
  "Lise ve sınav hazırlık öğrencileri için kayıtlı video paketleri ve koçluk programları.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const metadataBase = new URL(resolvePublicSiteOrigin());
  const title = settings.defaultSeoTitle || settings.siteTitle || settings.siteName;
  const description = settings.defaultSeoDescription || fallbackMetadataDescription || settings.siteTitle;
  const socialImageUrl = toAbsoluteMetadataUrl(settings.defaultSocialImageUrl, metadataBase);

  return {
    metadataBase,
    title: {
      default: title,
      template: `%s | ${settings.siteName}`
    },
    description,
    applicationName: settings.siteName,
    icons: {
      icon: [
        { url: settings.faviconUrl, sizes: "32x32", type: "image/png" },
        { url: settings.faviconUrl, sizes: "192x192", type: "image/png" }
      ],
      apple: [{ url: settings.faviconUrl, sizes: "180x180", type: "image/png" }]
    },
    openGraph: {
      title,
      description,
      siteName: settings.siteName,
      images: [{ url: socialImageUrl }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImageUrl]
    }
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [navigationSnapshot, siteSettings] = await Promise.all([
    getNavigationSnapshot(),
    getPublicSiteSettings()
  ]);

  return (
    <html lang="tr">
      <body>
        <PublicNavigationProvider initialSnapshot={navigationSnapshot}>
          <PublicSiteSettingsProvider initialSettings={siteSettings}>
            {children}
            <StudentSessionManager />
            <FloatingInstagramLink />
            <FloatingWhatsAppLink />
          </PublicSiteSettingsProvider>
        </PublicNavigationProvider>
      </body>
    </html>
  );
}

function resolvePublicSiteOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.PUBLIC_APP_URL?.trim();

  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }

  return process.env.NODE_ENV === "production"
    ? "https://egitimgurmesi.com"
    : "http://localhost:3000";
}

function toAbsoluteMetadataUrl(value: string, metadataBase: URL) {
  try {
    return new URL(value, metadataBase).toString();
  } catch {
    return new URL("/branding/ega-logo-official.png", metadataBase).toString();
  }
}
