"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearUserTokens,
  hasUserTokens,
  logoutUser,
  USER_AUTH_CHANGED_EVENT
} from "../lib/auth-client";

const STUDENT_TIMEOUT_MS = 60 * 60 * 1000;
const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 15 * 1000;
const CHANNEL_NAME = "ega-student-session";
const STORAGE_EVENT_KEY = "ega_student_session_event";

type SessionEvent =
  | {
      type: "activity";
      at: number;
    }
  | {
      type: "logout";
      at: number;
      reason: "timeout" | "manual";
    };

export function StudentSessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastActivityRef = useRef(Date.now());
  const lastActivityBroadcastRef = useRef(0);
  const logoutHandledRef = useRef(false);
  const suspendForPayment = Boolean(pathname?.startsWith("/odeme/paytr"));
  const enabled = authenticated && !suspendForPayment;

  useEffect(() => {
    function syncAuthState() {
      setAuthenticated(hasUserTokens());
    }

    syncAuthState();
    window.addEventListener(USER_AUTH_CHANGED_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(USER_AUTH_CHANGED_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const broadcast = useCallback((event: SessionEvent) => {
    channelRef.current?.postMessage(event);

    try {
      window.localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(event));
    } catch {
      // Storage sync is a fallback for browsers without BroadcastChannel.
    }
  }, []);

  const redirectToLogin = useCallback(
    (reason: "timeout" | "manual") => {
      clearUserTokens();
      setAuthenticated(false);
      router.replace(`/giris?reason=${reason}`);
    },
    [router]
  );

  const finishSession = useCallback(
    async (reason: "timeout" | "manual") => {
      if (logoutHandledRef.current) {
        return;
      }

      logoutHandledRef.current = true;
      broadcast({ type: "logout", at: Date.now(), reason });

      try {
        await logoutUser();
      } catch {
        clearUserTokens();
      }

      setAuthenticated(false);
      router.replace(`/giris?reason=${reason}`);
    },
    [broadcast, router]
  );

  const markActivity = useCallback(
    (forceBroadcast = false) => {
      if (!enabled || logoutHandledRef.current) {
        return;
      }

      const now = Date.now();
      lastActivityRef.current = now;
      setWarningOpen(false);

      if (forceBroadcast || now - lastActivityBroadcastRef.current > ACTIVITY_THROTTLE_MS) {
        lastActivityBroadcastRef.current = now;
        broadcast({ type: "activity", at: now });
      }
    },
    [broadcast, enabled]
  );

  useEffect(() => {
    if (!enabled) {
      setWarningOpen(false);
      return;
    }

    logoutHandledRef.current = false;
    lastActivityRef.current = Date.now();
    setWarningOpen(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    markActivity(true);
  }, [enabled, markActivity, pathname]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
    channelRef.current = channel;

    function handleEvent(event: SessionEvent) {
      if (event.type === "activity") {
        lastActivityRef.current = Math.max(lastActivityRef.current, event.at);
        setWarningOpen(false);
        return;
      }

      logoutHandledRef.current = true;
      redirectToLogin(event.reason);
    }

    function handleChannelMessage(message: MessageEvent<SessionEvent>) {
      handleEvent(message.data);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_EVENT_KEY || !event.newValue) {
        return;
      }

      try {
        handleEvent(JSON.parse(event.newValue) as SessionEvent);
      } catch {
        // Ignore malformed cross-tab payloads.
      }
    }

    channel?.addEventListener("message", handleChannelMessage);
    window.addEventListener("storage", handleStorage);

    return () => {
      channel?.removeEventListener("message", handleChannelMessage);
      channel?.close();
      channelRef.current = null;
      window.removeEventListener("storage", handleStorage);
    };
  }, [enabled, redirectToLogin]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const pointerActivity = () => markActivity(false);
    const directActivity = () => markActivity(true);
    const events: Array<[keyof WindowEventMap, EventListenerOrEventListenerObject, AddEventListenerOptions?]> = [
      ["pointermove", pointerActivity, { passive: true }],
      ["click", directActivity, { passive: true }],
      ["keydown", directActivity],
      ["scroll", directActivity, { passive: true }]
    ];

    events.forEach(([eventName, listener, options]) => window.addEventListener(eventName, listener, options));

    const timer = window.setInterval(() => {
      const inactiveFor = Date.now() - lastActivityRef.current;

      if (inactiveFor >= STUDENT_TIMEOUT_MS) {
        void finishSession("timeout");
        return;
      }

      setWarningOpen(inactiveFor >= STUDENT_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS);
    }, 1000);

    return () => {
      window.clearInterval(timer);
      events.forEach(([eventName, listener, options]) => window.removeEventListener(eventName, listener, options));
    };
  }, [enabled, finishSession, markActivity]);

  if (!enabled || !warningOpen) {
    return null;
  }

  return (
    <div className="ega-session-modal" role="alertdialog" aria-modal="true" aria-labelledby="ega-session-title">
      <div className="ega-session-modal__card">
        <span className="ega-session-modal__badge">Oturum Güvenliği</span>
        <h2 id="ega-session-title">Oturumunuz kısa süre içinde kapanacak.</h2>
        <p>
          Hesabınızı korumak için uzun süre işlem yapılmayan oturumlar otomatik kapatılır. Devam
          etmek istiyorsanız oturumu sürdürün.
        </p>
        <div className="ega-session-modal__actions">
          <button className="ega-button" type="button" onClick={() => markActivity(true)}>
            Oturumu Sürdür
          </button>
          <button className="ega-button ega-button--ghost" type="button" onClick={() => void finishSession("manual")}>
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
