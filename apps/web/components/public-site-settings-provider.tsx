"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  fallbackSiteSettings,
  isValidPublicSiteSettingsSnapshot,
  normalizePublicSiteSettings,
  type PublicSiteSettings
} from "../lib/contact";
import { SITE_PRESENTATION_PROPERTIES, sitePresentationStyle } from "@ega/ui";
import { requestPublicSiteSettingsSnapshot } from "../lib/public-content-api";
import { resolveClientPreviewToken } from "../lib/preview-mode";

export const PUBLIC_SITE_SETTINGS_REFRESH_EVENT = "ega:public-site-settings-refresh";
const PUBLIC_SITE_SETTINGS_REFRESH_STALE_MS = 30_000;

const PublicSiteSettingsContext = createContext<PublicSiteSettings>(fallbackSiteSettings);

export function PublicSiteSettingsProvider({
  initialSettings,
  children
}: {
  initialSettings: Partial<PublicSiteSettings> | null;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<PublicSiteSettings>(() =>
    normalizePublicSiteSettings(initialSettings)
  );
  const settingsRef = useRef(settings);
  const refreshControllerRef = useRef<AbortController | null>(null);
  const refreshRequestIdRef = useRef(0);
  const lastRefreshAtRef = useRef(Date.now());

  useEffect(() => {
    const normalized = normalizePublicSiteSettings(initialSettings);

    if (!isValidPublicSiteSettingsSnapshot(normalized)) {
      return;
    }

    settingsRef.current = normalized;
    setSettings(normalized);
  }, [initialSettings]);

  const refreshSettings = useCallback(() => {
    refreshControllerRef.current?.abort();

    const requestId = refreshRequestIdRef.current + 1;
    const controller = new AbortController();
    refreshRequestIdRef.current = requestId;
    refreshControllerRef.current = controller;

    void requestPublicSiteSettingsSnapshot({
      signal: controller.signal,
      rejectMalformed: true,
      // In the admin's preview frame, show the unpublished draft settings.
      previewToken: resolveClientPreviewToken()
    })
      .then((nextSettings) => {
        if (requestId !== refreshRequestIdRef.current || !isValidPublicSiteSettingsSnapshot(nextSettings)) {
          return;
        }

        settingsRef.current = nextSettings;
        lastRefreshAtRef.current = Date.now();
        setSettings(nextSettings);
      })
      .catch((error) => {
        if (controller.signal.aborted || process.env.NODE_ENV === "production") {
          return;
        }

        console.warn("[public-site-settings] refresh failed; keeping last valid settings.", error);
      })
      .finally(() => {
        if (refreshControllerRef.current === controller) {
          refreshControllerRef.current = null;
        }
      });
  }, []);

  // The layout renders the published settings on the server, and preview
  // tokens only exist in the browser URL. Without this, draft logo size and
  // typography would never show in the admin's preview frame.
  useEffect(() => {
    if (resolveClientPreviewToken()) {
      refreshSettings();
    }
  }, [refreshSettings]);

  // Keep the root custom properties in step with the settings the page holds,
  // so a refresh (or a preview draft) restyles the page without a reload. The
  // server already rendered the same values on <html>, so this is a no-op on
  // first load.
  useEffect(() => {
    const root = document.documentElement;
    const style = sitePresentationStyle(settings);

    for (const property of SITE_PRESENTATION_PROPERTIES) {
      const value = style[property];

      if (value) {
        root.style.setProperty(property, value);
      } else {
        root.style.removeProperty(property);
      }
    }
  }, [settings]);

  useEffect(() => {
    const handleRefresh = () => refreshSettings();
    const refreshIfStale = () => {
      if (Date.now() - lastRefreshAtRef.current >= PUBLIC_SITE_SETTINGS_REFRESH_STALE_MS) {
        refreshSettings();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfStale();
      }
    };

    window.addEventListener(PUBLIC_SITE_SETTINGS_REFRESH_EVENT, handleRefresh);
    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      refreshControllerRef.current?.abort();
      window.removeEventListener(PUBLIC_SITE_SETTINGS_REFRESH_EVENT, handleRefresh);
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshSettings]);

  return (
    <PublicSiteSettingsContext.Provider value={settings}>
      {children}
    </PublicSiteSettingsContext.Provider>
  );
}

export function usePublicSiteSettings() {
  return useContext(PublicSiteSettingsContext);
}
