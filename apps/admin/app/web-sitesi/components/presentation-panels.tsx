"use client";

import {
  NAVBAR_LOGO_HEIGHT_DEFAULT,
  NAVBAR_LOGO_HEIGHT_MAX,
  NAVBAR_LOGO_HEIGHT_MIN,
  SITE_FONT_OPTIONS,
  TEXT_SCALE_DEFAULT,
  TEXT_SCALE_MAX,
  TEXT_SCALE_MIN,
  normalizeNavbarLogoHeight,
  normalizeSiteFontKey,
  normalizeTextScale,
  shouldShowNavbarWordmark
} from "@ega/ui";
import type { AdminSiteSettings } from "../../../lib/auth-client";
import type { BuilderActions } from "../lib/builder-types";
import { AssetImage } from "./asset-image";

type PanelProps = { settings: AdminSiteSettings; actions: BuilderActions };

/**
 * Navbar logo size and the site-name text beside it.
 *
 * The mock header previews the result immediately, before saving. The canvas
 * on the right shows the real site after "Taslak kaydet".
 */
export function NavbarBrandControls({ settings, actions }: PanelProps) {
  const height = normalizeNavbarLogoHeight(settings.navbarLogoHeight) ?? NAVBAR_LOGO_HEIGHT_DEFAULT;
  const showWordmark = shouldShowNavbarWordmark(settings);

  return (
    <section className="admin-brand-card" aria-labelledby="navbar-brand-heading">
      <div className="admin-brand-card__meta">
        <strong id="navbar-brand-heading">Üst menü (navbar) logosu</strong>
        <p>Logonun menüdeki yüksekliğini ayarlayın ve logo yanındaki site adı yazısını gösterin ya da gizleyin.</p>
      </div>

      <div className="admin-navbar-mock" aria-label="Navbar logo önizlemesi">
        <AssetImage
          src={settings.logoPrimaryUrl}
          fallbackSrc="/branding/ega-logo-official.png"
          alt={settings.logoAltText || settings.siteName}
          style={{ height: `${height}px` }}
        />
        {showWordmark ? <strong>{settings.siteName}</strong> : null}
        <span className="admin-navbar-mock__links" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>

      <label className="admin-builder-field">
        <span>
          Logo yüksekliği: <output>{height} px</output>
        </span>
        <input
          className="admin-range"
          type="range"
          min={NAVBAR_LOGO_HEIGHT_MIN}
          max={NAVBAR_LOGO_HEIGHT_MAX}
          step={1}
          value={height}
          onChange={(event) => actions.updateSetting("navbarLogoHeight", normalizeNavbarLogoHeight(event.target.value))}
        />
      </label>
      <small className="admin-brand-card__state">
        Varsayılan {NAVBAR_LOGO_HEIGHT_DEFAULT} px. Menü yüksekliği logoya göre büyür. Tablet ve telefonda logo,
        ekrana sığacak şekilde otomatik küçültülür.
      </small>
      {settings.navbarLogoHeight != null ? (
        <button
          type="button"
          className="admin-button--compact admin-button--ghost"
          onClick={() => actions.updateSetting("navbarLogoHeight", null)}
        >
          Varsayılan boyuta dön
        </button>
      ) : null}

      <label className="admin-checkbox-row">
        <input
          type="checkbox"
          checked={showWordmark}
          onChange={(event) => actions.updateSetting("showNavbarWordmark", event.target.checked)}
        />
        Logo yanında site adını göster (“{settings.siteName}”)
      </label>
      <small className="admin-brand-card__state">
        Yazının kendisi Genel Ayarlar → Site adı alanından gelir.
      </small>
    </section>
  );
}

/** Site-wide fonts and text sizes. */
export function TypographyPanel({ settings, actions }: PanelProps) {
  const headingScale = normalizeTextScale(settings.headingScale) ?? TEXT_SCALE_DEFAULT;
  const bodyScale = normalizeTextScale(settings.bodyScale) ?? TEXT_SCALE_DEFAULT;

  return (
    <div className="admin-website-builder__form">
      <div className="admin-alert" role="status">
        Buradaki ayarlar tüm sayfalara ve kartlara uygulanır. “Taslak kaydet” sonrası sağdaki önizleme güncellenir;
        ziyaretçiler değişikliği “Yayınla” ile görür.
      </div>

      <FontSelect
        label="Başlık yazı tipi"
        description="Sayfa ve kart başlıkları, menü başlıkları."
        value={settings.headingFontFamily}
        onChange={(value) => actions.updateSetting("headingFontFamily", value)}
      />
      <FontSelect
        label="Metin yazı tipi"
        description="Paragraflar, kart açıklamaları, butonlar ve menü."
        value={settings.fontFamily}
        onChange={(value) => actions.updateSetting("fontFamily", value)}
      />

      <ScaleField
        label="Başlık boyutu"
        value={headingScale}
        onChange={(value) => actions.updateSetting("headingScale", value)}
      />
      <ScaleField
        label="Metin boyutu"
        value={bodyScale}
        onChange={(value) => actions.updateSetting("bodyScale", value)}
      />

      <button
        type="button"
        className="admin-button--ghost"
        onClick={() => {
          actions.updateSetting("headingFontFamily", null);
          actions.updateSetting("fontFamily", null);
          actions.updateSetting("headingScale", null);
          actions.updateSetting("bodyScale", null);
        }}
      >
        Tipografiyi varsayılana döndür
      </button>
    </div>
  );
}

function FontSelect({
  label,
  description,
  value,
  onChange
}: {
  label: string;
  description: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}) {
  const selected = normalizeSiteFontKey(value) ?? "default";

  return (
    <label className="admin-builder-field">
      <span>{label}</span>
      <select value={selected} onChange={(event) => onChange(normalizeSiteFontKey(event.target.value))}>
        {SITE_FONT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label} — {option.hint}
          </option>
        ))}
      </select>
      <small className="admin-brand-card__state">{description}</small>
    </label>
  );
}

function ScaleField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="admin-builder-field">
      <span>
        {label}: <output>%{value}</output>
      </span>
      <input
        className="admin-range"
        type="range"
        min={TEXT_SCALE_MIN}
        max={TEXT_SCALE_MAX}
        step={5}
        value={value}
        onChange={(event) => {
          const next = normalizeTextScale(event.target.value);
          onChange(next === TEXT_SCALE_DEFAULT ? null : next);
        }}
      />
      <small className="admin-brand-card__state">
        %{TEXT_SCALE_MIN} – %{TEXT_SCALE_MAX} arası. %100 tasarımın özgün boyutudur.
      </small>
    </label>
  );
}
