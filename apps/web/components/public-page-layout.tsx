"use client";

import { type ReactNode } from "react";
import { PublicFooter } from "./public-footer";
import { PublicNavbar } from "./public-navbar";
import { normalizePublicSiteSettings, type PublicSiteSettings } from "../lib/contact";
import { usePublicSiteSettings } from "./public-site-settings-provider";

type PublicPageLayoutProps = {
  children: ReactNode;
  contactHref?: string;
  settings?: Partial<PublicSiteSettings>;
};

export function PublicPageLayout({ children, contactHref, settings: initialSettings }: PublicPageLayoutProps) {
  const contextSettings = usePublicSiteSettings();
  const settings = normalizePublicSiteSettings(initialSettings ?? contextSettings);

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
