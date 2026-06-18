"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearStaffTokens, logoutStaff } from "../lib/auth-client";

const ADMIN_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 15 * 1000;
const CHANNEL_NAME = "ega-admin-session";
const STORAGE_EVENT_KEY = "ega_admin_session_event";

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

type AdminSessionManagerProps = {
  roleKeys?: string[] | null;
};

export function AdminSessionManager({ roleKeys }: AdminSessionManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSuperAdmin = Boolean(roleKeys?.includes("super-admin"));
  const enabled = Boolean(roleKeys?.length) && !isSuperAdmin;
  const [warningOpen, setWarningOpen] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastActivityRef = useRef(Date.now());
  const lastActivityBroadcastRef = useRef(0);
  const logoutHandledRef = useRef(false);

  const broadcast = useCallback((event: SessionEvent) => {
    channelRef.current?.postMessage(event);

    try {
      window.localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(event));
    } catch {
      // Storage sync is a fallback; BroadcastChannel remains the primary path.
    }
  }, []);

  const redirectToLogin = useCallback(
    (reason: "timeout" | "manual") => {
      clearStaffTokens();
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
        await logoutStaff();
      } catch {
        clearStaffTokens();
      }

      redirectToLogin(reason);
    },
    [broadcast, redirectToLogin]
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

      if (inactiveFor >= ADMIN_TIMEOUT_MS) {
        void finishSession("timeout");
        return;
      }

      setWarningOpen(inactiveFor >= ADMIN_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS);
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
    <div className="admin-session-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-session-title">
      <div className="admin-session-modal__card">
        <span className="admin-session-modal__badge">Oturum Güvenliği</span>
        <h2 id="admin-session-title">Oturumunuz kısa süre içinde kapanacak.</h2>
        <p>
          Güvenliğiniz için hareketsiz kalan personel oturumları otomatik kapatılır. Devam etmek
          istiyorsanız oturumu sürdürün.
        </p>
        <div className="admin-session-modal__actions">
          <button className="admin-button" type="button" onClick={() => markActivity(true)}>
            Oturumu Sürdür
          </button>
          <button className="admin-button--ghost" type="button" onClick={() => void finishSession("manual")}>
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
