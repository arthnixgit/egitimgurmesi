"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@ega/ui";
import { getNavigationItems } from "../lib/public-content-api";
import { publicNavigationItems, type PublicNavItem } from "../lib/navigation";

export function PublicNavbar() {
  const [navigationItems, setNavigationItems] = useState<readonly PublicNavItem[]>(publicNavigationItems);
  const [openMegaMenuId, setOpenMegaMenuId] = useState<string | null>(null);
  const [activeMegaColumnId, setActiveMegaColumnId] = useState<string | null>(null);
  const [isScrollSettling, setIsScrollSettling] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const scrollUnlockTimerRef = useRef<number | null>(null);

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

  useEffect(
    () => () => {
      clearCloseTimer();
      clearScrollUnlockTimer();
    },
    []
  );

  useEffect(() => {
    let isCancelled = false;

    void getNavigationItems().then((items) => {
      if (!isCancelled) {
        setNavigationItems(items);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const closeOnViewportChange = () => {
      closeMegaMenu();
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

  return (
    <header className="ega-header">
      <div className="ega-header__inner">
        <Link className="ega-brand" href="/" aria-label="Eğitim Gurmesi Akademi ana sayfa">
          <Image
            src="/branding/ega-mark-transparent.png"
            alt="Eğitim Gurmesi Akademi logosu"
            width={64}
            height={64}
            className="ega-brand__logo"
            priority
          />
          <div className="ega-brand__copy">
            <strong>Eğitim Gurmesi Akademi</strong>
          </div>
        </Link>

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
            const activeColumn = columns.find((column) => column.id === activeMegaColumnId) ?? null;

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
                <button
                  type="button"
                  className="ega-nav__trigger"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  data-open={isOpen}
                >
                  <span>{item.label}</span>
                  <span className="ega-nav__chevron" aria-hidden="true">
                    ▾
                  </span>
                </button>

                <div className="ega-nav__mega-panel" data-open={isOpen} onPointerEnter={clearCloseTimer}>
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

        <div className="ega-header__actions" onPointerEnter={closeMegaMenu} onFocusCapture={closeMegaMenu}>
          <ButtonLink href="/giris" label="Giriş Yap / Kayıt Ol" />
        </div>
      </div>
    </header>
  );
}
