"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@ega/ui";
import {
  fetchCurrentUser,
  hasUserTokens,
  isAuthFailure,
  USER_AUTH_CHANGED_EVENT
} from "../lib/auth-client";
import { requestNavigationSnapshot } from "../lib/public-content-api";
import {
  isValidNavigationSnapshot,
  navigationSnapshotFingerprint,
  type PublicNavigationSnapshot
} from "../lib/navigation";
import { usePublicNavigationSnapshot } from "./public-navigation-provider";

type NavbarAuthState =
  | { status: "checking" }
  | { status: "anonymous" }
  | { status: "authenticated"; label: string };

const NAVIGATION_STALE_MS = 60_000;
export const PUBLIC_NAVIGATION_REFRESH_EVENT = "ega:public-navigation-refresh";

export function PublicNavbar({
  initialSnapshot
}: {
  initialSnapshot?: PublicNavigationSnapshot;
} = {}) {
  const contextSnapshot = usePublicNavigationSnapshot();
  const authoritativeSnapshot = initialSnapshot ?? contextSnapshot;
  const pathname = usePathname();
  const [navigationSnapshot, setNavigationSnapshot] =
    useState<PublicNavigationSnapshot>(authoritativeSnapshot);
  const [openMegaMenuId, setOpenMegaMenuId] = useState<string | null>(null);
  const [activeMegaColumnId, setActiveMegaColumnId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileGroupId, setOpenMobileGroupId] = useState<string | null>(null);
  const [isScrollSettling, setIsScrollSettling] = useState(false);
  const [authState, setAuthState] = useState<NavbarAuthState>({ status: "checking" });
  const closeTimerRef = useRef<number | null>(null);
  const scrollUnlockTimerRef = useRef<number | null>(null);
  const navigationFingerprintRef = useRef(navigationSnapshotFingerprint(authoritativeSnapshot));
  const refreshControllerRef = useRef<AbortController | null>(null);
  const refreshRequestIdRef = useRef(0);
  const lastRefreshAtRef = useRef(Date.now());
  const lastPathnameRef = useRef(pathname);

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const clearScrollUnlockTimer = () => {
    if (scrollUnlockTimerRef.current !== null) {
      window.clearTimeout(scrollUnlockTimerRef.current);
      scrollUnlockTimerRef.current = null;
    }
  };

  const closeMegaMenu = () => {
    clearCloseTimer();
    setOpenMegaMenuId(null);
    setActiveMegaColumnId(null);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setOpenMobileGroupId(null);
  };

  const scheduleMegaMenuClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      closeMegaMenu();
    }, 180);
  };

  const openMegaMenu = (itemId: string) => {
    clearCloseTimer();
    setOpenMegaMenuId(itemId);
    setActiveMegaColumnId(null);
  };

  const applyNavigationSnapshot = useCallback((nextSnapshot: PublicNavigationSnapshot, reason: string) => {
    if (!isValidNavigationSnapshot(nextSnapshot)) {
      logNavigationDiagnostic("rejected invalid snapshot", reason);
      return false;
    }

    const nextFingerprint = navigationSnapshotFingerprint(nextSnapshot);
    if (nextFingerprint === navigationFingerprintRef.current) {
      return false;
    }

    navigationFingerprintRef.current = nextFingerprint;
    setNavigationSnapshot(nextSnapshot);
    return true;
  }, []);

  const refreshNavigationSnapshot = useCallback(
    (reason: string, options: { replaceInFlight?: boolean } = {}) => {
      if (refreshControllerRef.current) {
        if (!options.replaceInFlight) {
          logNavigationDiagnostic("deduplicated refresh request", reason);
          return;
        }

        refreshControllerRef.current.abort();
      }

      const requestId = refreshRequestIdRef.current + 1;
      const controller = new AbortController();
      refreshRequestIdRef.current = requestId;
      refreshControllerRef.current = controller;
      lastRefreshAtRef.current = Date.now();

      void requestNavigationSnapshot({ signal: controller.signal })
        .then((nextSnapshot) => {
          if (requestId !== refreshRequestIdRef.current) {
            logNavigationDiagnostic("stale request ignored", reason);
            return;
          }

          applyNavigationSnapshot(nextSnapshot, reason);
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }

          logNavigationDiagnostic("navigation request failure", reason, error);
        })
        .finally(() => {
          if (refreshControllerRef.current === controller) {
            refreshControllerRef.current = null;
          }
        });
    },
    [applyNavigationSnapshot]
  );

  useEffect(
    () => {
      document.documentElement.dataset.publicNavigationReady = "true";

      return () => {
        clearCloseTimer();
        clearScrollUnlockTimer();
        refreshControllerRef.current?.abort();
        delete document.documentElement.dataset.publicNavigationReady;
        document.body.style.overflow = "";
      };
    },
    []
  );

  useEffect(() => {
    applyNavigationSnapshot(authoritativeSnapshot, "server-snapshot");
  }, [applyNavigationSnapshot, authoritativeSnapshot]);

  useEffect(() => {
    if (pathname === lastPathnameRef.current) {
      return;
    }

    lastPathnameRef.current = pathname;
    if (Date.now() - lastRefreshAtRef.current >= NAVIGATION_STALE_MS) {
      refreshNavigationSnapshot("route-transition");
    }
  }, [pathname, refreshNavigationSnapshot]);

  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastRefreshAtRef.current >= NAVIGATION_STALE_MS) {
        refreshNavigationSnapshot("window-focus");
      }
    };
    const handleNavigationRefresh = () => {
      refreshNavigationSnapshot("application-event", { replaceInFlight: true });
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(PUBLIC_NAVIGATION_REFRESH_EVENT, handleNavigationRefresh);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(PUBLIC_NAVIGATION_REFRESH_EVENT, handleNavigationRefresh);
    };
  }, [refreshNavigationSnapshot]);

  useEffect(() => {
    const closeOnViewportChange = () => {
      closeMegaMenu();
      closeMobileMenu();
      setIsScrollSettling(true);
      clearScrollUnlockTimer();
      scrollUnlockTimerRef.current = window.setTimeout(() => {
        setIsScrollSettling(false);
      }, 180);
    };

    window.addEventListener("scroll", closeOnViewportChange, { passive: true });
    window.addEventListener("resize", closeOnViewportChange);

    return () => {
      window.removeEventListener("scroll", closeOnViewportChange);
      window.removeEventListener("resize", closeOnViewportChange);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
  }, [mobileMenuOpen]);

  useEffect(() => {
    let active = true;

    async function loadAuthState() {
      if (!hasUserTokens()) {
        if (active) {
          setAuthState({ status: "anonymous" });
        }

        return;
      }

      try {
        const response = await fetchCurrentUser();

        if (!active) {
          return;
        }

        const firstName = response.user.profile?.firstName?.trim();
        setAuthState({
          status: "authenticated",
          label: firstName ? `${firstName} Paneli` : "Öğrenci Paneli"
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setAuthState({ status: isAuthFailure(error) ? "anonymous" : "anonymous" });
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "ega_user_access_token" ||
        event.key === "ega_user_refresh_token" ||
        event.key === null
      ) {
        void loadAuthState();
      }
    };

    void loadAuthState();
    window.addEventListener(USER_AUTH_CHANGED_EVENT, loadAuthState);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      active = false;
      window.removeEventListener(USER_AUTH_CHANGED_EVENT, loadAuthState);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const accountActionHref = authState.status === "authenticated" ? "/hesabim" : "/giris";
  const accountActionLabel =
    authState.status === "authenticated" ? authState.label : "Giriş Yap / Kayıt Ol";
  const navigationItems = navigationSnapshot.enabled ? navigationSnapshot.items : [];

  return (
    <header className="ega-header">
      <div className="ega-header__inner">
        <Link className="ega-brand" href="/" aria-label="Eğitim Gurmesi Akademi ana sayfa">
          <Image
            src="/branding/ega-logo-official.png"
            alt="Eğitim Gurmesi Akademi"
            width={152}
            height={80}
            className="ega-brand__logo"
            priority
          />
          <div className="ega-brand__copy">
            <strong>Eğitim Gurmesi Akademi</strong>
          </div>
        </Link>

        <button
          type="button"
          className="ega-mobile-nav-toggle"
          aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={mobileMenuOpen}
          onClick={() => {
            closeMegaMenu();
            setMobileMenuOpen((current) => !current);
          }}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className="ega-nav"
          aria-label="Ana gezinme"
          data-scroll-settling={isScrollSettling}
          onPointerLeave={scheduleMegaMenuClose}
        >
          {navigationItems.map((item) => {
            if (!item.megaMenuColumns) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="ega-nav__link"
                  target={item.target}
                  rel={item.target === "_blank" ? "noreferrer" : undefined}
                  onPointerEnter={closeMegaMenu}
                  onFocus={closeMegaMenu}
                >
                  {item.label}
                </a>
              );
            }

            const columns = item.megaMenuColumns;
            const isOpen = openMegaMenuId === item.id;
            const activeColumn =
              columns.find((column) => column.id === activeMegaColumnId) ?? null;

            return (
              <div
                key={item.id}
                className="ega-nav__item ega-nav__item--mega"
                onPointerEnter={() => {
                  if (!isScrollSettling) {
                    openMegaMenu(item.id);
                  }
                }}
                onFocusCapture={() => {
                  if (!isScrollSettling) {
                    openMegaMenu(item.id);
                  }
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    scheduleMegaMenuClose();
                  }
                }}
              >
                <Link
                  href={item.href}
                  className="ega-nav__trigger"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  data-open={isOpen}
                >
                  <span>{item.label}</span>
                  <span className="ega-nav__chevron" aria-hidden="true">
                    ▾
                  </span>
                </Link>

                <div
                  className="ega-nav__mega-panel"
                  data-open={isOpen}
                  onPointerEnter={clearCloseTimer}
                >
                  <div className="ega-nav__mega-strip">
                    {columns.map((column) => {
                      const isActive = activeColumn?.id === column.id;

                      return (
                        <div
                          key={column.id}
                          className="ega-nav__mega-group"
                          data-active={isActive}
                          onPointerEnter={() => setActiveMegaColumnId(column.id)}
                          onFocusCapture={() => setActiveMegaColumnId(column.id)}
                        >
                          <a
                            href={column.href}
                            className="ega-nav__mega-tab"
                            data-active={isActive}
                            target={column.target}
                            rel={column.target === "_blank" ? "noreferrer" : undefined}
                          >
                            {column.label}
                          </a>

                          <div className="ega-nav__mega-submenu" data-open={isActive}>
                            <div className="ega-nav__mega-submenu-head">
                              <span>{item.label}</span>
                              <strong>{column.label}</strong>
                            </div>

                            <div className="ega-nav__mega-submenu-links">
                              {column.items?.map((subItem) => (
                                <a
                                  key={subItem.id}
                                  href={subItem.href}
                                  className="ega-nav__mega-submenu-link"
                                  target={subItem.target}
                                  rel={subItem.target === "_blank" ? "noreferrer" : undefined}
                                >
                                  {subItem.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div
          className="ega-header__actions"
          onPointerEnter={closeMegaMenu}
          onFocusCapture={closeMegaMenu}
        >
          <ButtonLink href={accountActionHref} label={accountActionLabel} />
        </div>
      </div>

      <div className="ega-mobile-nav" data-open={mobileMenuOpen} aria-hidden={!mobileMenuOpen}>
        <div className="ega-mobile-nav__backdrop" onClick={closeMobileMenu} />
        <div className="ega-mobile-nav__panel">
          <div className="ega-mobile-nav__head">
            <strong>Menü</strong>
            <button
              type="button"
              className="ega-mobile-nav__close"
              aria-label="Menüyü kapat"
              onClick={closeMobileMenu}
            >
              ×
            </button>
          </div>

          <div className="ega-mobile-nav__body">
            {navigationItems.map((item) => {
              if (!item.megaMenuColumns) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className="ega-mobile-nav__link"
                    target={item.target}
                    rel={item.target === "_blank" ? "noreferrer" : undefined}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </a>
                );
              }

              const isGroupOpen = openMobileGroupId === item.id;

              return (
                <div key={item.id} className="ega-mobile-nav__group" data-open={isGroupOpen}>
                  <div className="ega-mobile-nav__group-head">
                    <a href={item.href} className="ega-mobile-nav__link" onClick={closeMobileMenu}>
                      {item.label}
                    </a>
                    <button
                      type="button"
                      className="ega-mobile-nav__group-toggle"
                      aria-expanded={isGroupOpen}
                      onClick={() =>
                        setOpenMobileGroupId((current) => (current === item.id ? null : item.id))
                      }
                    >
                      <span>{isGroupOpen ? "−" : "+"}</span>
                    </button>
                  </div>

                  <div className="ega-mobile-nav__submenu">
                    {item.megaMenuColumns.map((column) => (
                      <div key={column.id} className="ega-mobile-nav__submenu-block">
                        <a
                          href={column.href}
                          className="ega-mobile-nav__submenu-title"
                          target={column.target}
                          rel={column.target === "_blank" ? "noreferrer" : undefined}
                          onClick={closeMobileMenu}
                        >
                          {column.label}
                        </a>

                        {column.items?.length ? (
                          <div className="ega-mobile-nav__submenu-links">
                            {column.items.map((subItem) => (
                              <a
                                key={subItem.id}
                                href={subItem.href}
                                className="ega-mobile-nav__submenu-link"
                                target={subItem.target}
                                rel={subItem.target === "_blank" ? "noreferrer" : undefined}
                                onClick={closeMobileMenu}
                              >
                                {subItem.label}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ega-mobile-nav__footer">
            <ButtonLink href={accountActionHref} label={accountActionLabel} />
          </div>
        </div>
      </div>
    </header>
  );
}

function logNavigationDiagnostic(message: string, reason: string, error?: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn(`[public-navigation] ${message}: ${reason}`, error ?? "");
}
