"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PublicFooter } from "./public-footer";
import { PublicNavbar } from "./public-navbar";
import { fallbackSiteSettings, normalizePublicSiteSettings, type PublicSiteSettings } from "../lib/contact";
import { getPublicSiteSettings } from "../lib/public-content-api";

type PublicPageLayoutProps = {
  children: ReactNode;
  contactHref?: string;
  settings?: Partial<PublicSiteSettings>;
};

export function PublicPageLayout({ children, contactHref, settings: initialSettings }: PublicPageLayoutProps) {
  const [settings, setSettings] = useState<PublicSiteSettings>(
    normalizePublicSiteSettings(initialSettings ?? fallbackSiteSettings)
  );

  useEffect(() => {
    let active = true;

    if (initialSettings) {
      setSettings(normalizePublicSiteSettings(initialSettings));
      return () => {
        active = false;
      };
    }

    void getPublicSiteSettings().then((nextSettings) => {
      if (active) {
        setSettings(nextSettings);
      }
    });

    return () => {
      active = false;
    };
  }, [initialSettings]);

  const resolvedContactHref = contactHref ?? settings.whatsappHref;

  return (
    <main className="ega-page">
      <PublicNavbar />
      {children}

      <PublicFooter settings={settings} contactHref={resolvedContactHref} />

      <a
        className="ega-contact-bookmark"
        href={resolvedContactHref}
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
