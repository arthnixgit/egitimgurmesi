"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  fallbackSiteSettings,
  isValidPublicSiteSettingsSnapshot,
  normalizePublicSiteSettings,
  type PublicSiteSettings
} from "../lib/contact";
import { requestPublicSiteSettingsSnapshot } from "../lib/public-content-api";

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

    void requestPublicSiteSettingsSnapshot({ signal: controller.signal, rejectMalformed: true })
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
