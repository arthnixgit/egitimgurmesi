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

    window.addEventListener(PUBLIC_SITE_SETTINGS_REFRESH_EVENT, handleRefresh);
    return () => {
      refreshControllerRef.current?.abort();
      window.removeEventListener(PUBLIC_SITE_SETTINGS_REFRESH_EVENT, handleRefresh);
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
