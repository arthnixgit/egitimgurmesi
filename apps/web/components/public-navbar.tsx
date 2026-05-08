"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@ega/ui";
import { publicNavigationItems } from "../lib/navigation";

export function PublicNavbar() {
  const [openMegaMenuId, setOpenMegaMenuId] = useState<string | null>(null);
  const [activeMegaColumnId, setActiveMegaColumnId] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
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
    },
    []
  );

  useEffect(() => {
    const closeOnViewportChange = () => {
      closeMegaMenu();
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
        <a className="ega-brand" href="#anasayfa" aria-label="Eğitim Gurmesi Akademi ana sayfa">
          <Image
            src="/branding/ega-mark-transparent.png"
            alt="Eğitim Gurmesi Akademi logosu"
            width={84}
            height={45}
            className="ega-brand__logo"
            priority
          />
          <div className="ega-brand__copy">
            <strong>Eğitim Gurmesi Akademi</strong>
            <span>Video paketleri, koçluk akışı ve öğrenci paneli</span>
          </div>
        </a>

        <nav className="ega-nav" aria-label="Ana gezinme" onPointerLeave={scheduleMegaMenuClose}>
          {publicNavigationItems.map((item) => {
            if (!item.megaMenuColumns) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="ega-nav__link"
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
                onPointerEnter={() => openMegaMenu(item.id)}
                onFocusCapture={() => openMegaMenu(item.id)}
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
                          <a href={column.href} className="ega-nav__mega-tab" data-active={isActive}>
                            {column.label}
                          </a>

                          <div className="ega-nav__mega-submenu" data-open={isActive}>
                            <div className="ega-nav__mega-submenu-head">
                              <span>{item.label}</span>
                              <strong>{column.label}</strong>
                            </div>

                            <div className="ega-nav__mega-submenu-links">
                              {column.items?.map((subItem) => (
                                <a key={subItem.id} href={subItem.href} className="ega-nav__mega-submenu-link">
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
          <ButtonLink href="/giris" label="Giriş Yap" variant="ghost" />
          <ButtonLink href="/kayit" label="Kayıt Ol" />
        </div>
      </div>
    </header>
  );
}
