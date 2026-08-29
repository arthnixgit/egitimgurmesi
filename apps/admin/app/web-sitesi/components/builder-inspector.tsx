"use client";

import type { Dispatch, SetStateAction } from "react";
import type {
  AdminMarketingPage,
  AdminMarketingPageSection,
  AdminNavigationItem,
  AdminNavigationMenu,
  AdminSiteSettings,
  AdminStaffProfilesDocument,
  AdminSuccessStoriesDocument
} from "../../../lib/auth-client";
import type {
  BuilderActions,
  BuilderStatus,
  InspectorTab,
  WebsiteBuilderData,
  WebsiteSelection
} from "../lib/builder-types";
import { getSectionDefinition, HOME_SLIDER_SECTION_KEY, readableSectionLabel } from "../lib/section-registry";
import { normalizeAnchorId } from "../lib/builder-validation";
import { MediaField } from "./media-field";
import { HomepageSliderEditor } from "./homepage-slider-editor";
import { FreeMaterialEditor } from "./free-material-editor";
import { RevisionPanel } from "./revision-panel";

export function BuilderInspector({
  data,
  selection,
  status,
  currentPage,
  currentSection,
  setStaffProfiles,
  setSuccessStories,
  actions
}: {
  data: WebsiteBuilderData;
  selection: WebsiteSelection;
  status: BuilderStatus;
  currentPage: AdminMarketingPage | null;
  currentSection: AdminMarketingPageSection | null;
  setStaffProfiles: Dispatch<SetStateAction<AdminStaffProfilesDocument>>;
  setSuccessStories: Dispatch<SetStateAction<AdminSuccessStoriesDocument>>;
  actions: BuilderActions;
}) {
  return (
    <aside className="admin-website-builder__right" aria-label="Seçili bölüm ayarları">
      <header className="admin-builder-inspector__header">
        <span>Ayarlar</span>
        <h2>{currentSection ? readableSectionLabel(currentSection) : "Seçim"}</h2>
      </header>

      <div className="admin-builder-panel-tabs" role="tablist" aria-label="Ayar sekmeleri">
        {(["icerik", "tasarim", "gelismis"] as InspectorTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selection.inspectorTab === tab}
            data-active={selection.inspectorTab === tab}
            onClick={() => actions.dispatchSelection({ type: "set-inspector-tab", tab })}
          >
            {tab === "icerik" ? "İçerik" : tab === "tasarim" ? "Tasarım" : "Gelişmiş"}
          </button>
        ))}
      </div>

      {selection.selectedArea === "genel" ? <GeneralSettingsPanel settings={data.settings} actions={actions} /> : null}
      {selection.selectedArea === "marka" ? <BrandSettingsPanel settings={data.settings} actions={actions} /> : null}
      {selection.selectedArea === "footer" ? <FooterSettingsPanel settings={data.settings} actions={actions} /> : null}
      {selection.selectedArea === "header" ? <NavigationPanel navigation={data.navigation} actions={actions} /> : null}
      {selection.selectedArea === "sayfalar" ? (
        <PageInspector
          page={currentPage}
          section={currentSection}
          tab={selection.inspectorTab}
          selectedSlideId={selection.selectedSlideId}
          actions={actions}
        />
      ) : null}
      {selection.selectedArea === "ucretsiz-materyaller" ? (
        <FreeMaterialEditor
          materials={data.materials}
          selectedCategory={
            data.materials.categories.find((category) => category.key === selection.selectedMaterialKey) ??
            data.materials.categories[0] ??
            null
          }
          selectedItem={
            data.materials.categories
              .find((category) => category.key === selection.selectedMaterialKey)
              ?.items.find((item) => item.slug === selection.selectedMaterialSlug) ??
            data.materials.categories.find((category) => category.key === selection.selectedMaterialKey)?.items[0] ??
            data.materials.categories[0]?.items[0] ??
            null
          }
          actions={actions}
        />
      ) : null}
      {selection.selectedArea === "akademik-kadro" ? (
        <StaffPanel document={data.staffProfiles} setDocument={setStaffProfiles} />
      ) : null}
      {selection.selectedArea === "basari-hikayeleri" ? (
        <SuccessStoriesPanel document={data.successStories} setDocument={setSuccessStories} />
      ) : null}
      {selection.selectedArea === "gecmis" ? (
        <RevisionPanel
          revisions={data.revisions}
          saving={status.saving}
          loadRevisions={actions.loadRevisions}
          restoreRevision={actions.restoreRevision}
        />
      ) : null}
    </aside>
  );
}

function GeneralSettingsPanel({ settings, actions }: { settings: AdminSiteSettings; actions: BuilderActions }) {
  return (
    <div className="admin-website-builder__form">
      <label className="admin-builder-field">
        <span>Site adı</span>
        <input value={settings.siteName} onChange={(event) => actions.updateSetting("siteName", event.target.value)} />
      </label>
      <label className="admin-builder-field">
        <span>Varsayılan başlık</span>
        <input value={settings.siteTitle} onChange={(event) => actions.updateSetting("siteTitle", event.target.value)} />
      </label>
      <label className="admin-builder-field">
        <span>Kısa açıklama</span>
        <textarea value={settings.tagline ?? ""} onChange={(event) => actions.updateSetting("tagline", event.target.value)} />
      </label>
      <details open className="admin-builder-advanced">
        <summary>SEO</summary>
        <label className="admin-builder-field">
          <span>SEO başlığı</span>
          <input value={settings.defaultSeoTitle ?? ""} onChange={(event) => actions.updateSetting("defaultSeoTitle", event.target.value)} />
        </label>
        <label className="admin-builder-field">
          <span>SEO açıklaması</span>
          <textarea value={settings.defaultSeoDescription ?? ""} onChange={(event) => actions.updateSetting("defaultSeoDescription", event.target.value)} />
        </label>
      </details>
    </div>
  );
}

function BrandSettingsPanel({ settings, actions }: { settings: AdminSiteSettings; actions: BuilderActions }) {
  const fields = [
    ["logoPrimaryUrl", "Header ana logo", "Üst menüde kullanılan ana logo.", "229x121 px", "/branding/ega-logo-official.png"],
    ["logoFooterUrl", "Footer logo", "Footer marka kolonunda kullanılan logo.", "229x121 px", "/branding/ega-logo-official.png"],
    ["logoCompactUrl", "Kompakt/mobil logo", "Dar alanlarda kullanılan marka işareti.", "160x160 px", "/branding/ega-mark-transparent.png"],
    ["logoDarkUrl", "Koyu zemin logo", "Koyu arka planlarda kullanılacak logo.", "229x121 px", "/branding/ega-logo-official.png"],
    ["logoLightUrl", "Açık zemin logo", "Açık arka planlarda kullanılacak logo.", "229x121 px", "/branding/ega-logo-official.png"],
    ["logoMarkUrl", "Logo mark", "Simgesel marka işareti.", "160x160 px", "/branding/ega-mark-transparent.png"],
    ["faviconUrl", "Favicon", "Tarayıcı sekmesi ve kısa yol simgesi.", "32x32 px", "/icon.png"],
    ["defaultSocialImageUrl", "Sosyal paylaşım görseli", "Paylaşımlarda kullanılan varsayılan görsel.", "1200x630 px", "/branding/ega-logo-official.png"]
  ] as const;

  return (
    <div className="admin-brand-grid">
      {fields.map(([key, label, description, dimensions, fallbackUrl]) => (
        <MediaField
          key={key}
          intent={{
            kind: "BRANDING",
            label,
            description,
            recommendedDimensions: dimensions,
            fallbackUrl,
            allowExternalUrl: true
          }}
          value={String(settings[key as keyof AdminSiteSettings] ?? "")}
          altText={settings.logoAltText ?? settings.siteName}
          onChange={(value) => actions.updateSetting(key as keyof AdminSiteSettings, value as never)}
          onAltTextChange={(value) => actions.updateSetting("logoAltText", value)}
        />
      ))}
    </div>
  );
}

function FooterSettingsPanel({ settings, actions }: { settings: AdminSiteSettings; actions: BuilderActions }) {
  return (
    <div className="admin-website-builder__form">
      <label className="admin-builder-field">
        <span>Görünen telefon</span>
        <input value={settings.displayPhone} onChange={(event) => actions.updateSetting("displayPhone", event.target.value)} />
      </label>
      <label className="admin-builder-field">
        <span>E.164 telefon</span>
        <input value={settings.canonicalPhone} onChange={(event) => actions.updateSetting("canonicalPhone", event.target.value)} />
      </label>
      <label className="admin-builder-field">
        <span>WhatsApp numarası</span>
        <input value={settings.supportWhatsappNumber} onChange={(event) => actions.updateSetting("supportWhatsappNumber", event.target.value)} />
      </label>
      <label className="admin-builder-field">
        <span>WhatsApp mesajı</span>
        <textarea value={settings.whatsappMessage} onChange={(event) => actions.updateSetting("whatsappMessage", event.target.value)} />
      </label>
      <div className="admin-website-builder__preview-links">
        <a href={settings.telHref}>Telefon bağlantısını test et</a>
        <a href={settings.whatsappHref} target="_blank" rel="noreferrer">WhatsApp önizlemesini aç</a>
      </div>
      <label className="admin-builder-field">
        <span>Footer marka açıklaması</span>
        <textarea value={settings.footerBrandDescription} onChange={(event) => actions.updateSetting("footerBrandDescription", event.target.value)} />
      </label>
      <label className="admin-builder-field">
        <span>İletişim başlığı</span>
        <input value={settings.footerContactTitle} onChange={(event) => actions.updateSetting("footerContactTitle", event.target.value)} />
      </label>
      <label className="admin-builder-field">
        <span>Adres</span>
        <textarea value={settings.address} onChange={(event) => actions.updateSetting("address", event.target.value)} />
      </label>
      <fieldset>
        <legend>Hızlı erişim bağlantıları</legend>
        {settings.footerQuickLinks.map((link, index) => (
          <div key={`${link.href}-${index}`} className="admin-builder-inline-grid">
            <input
              aria-label={`${index + 1}. hızlı erişim etiketi`}
              value={link.label}
              onChange={(event) =>
                actions.updateSetting("footerQuickLinks", settings.footerQuickLinks.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, label: event.target.value } : entry
                ))
              }
            />
            <input
              aria-label={`${index + 1}. hızlı erişim bağlantısı`}
              value={link.href}
              onChange={(event) =>
                actions.updateSetting("footerQuickLinks", settings.footerQuickLinks.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, href: event.target.value } : entry
                ))
              }
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}

function NavigationPanel({ navigation, actions }: { navigation: AdminNavigationMenu; actions: BuilderActions }) {
  return (
    <div className="admin-website-builder__form">
      <button className="admin-button--ghost" type="button" onClick={actions.addNavigationItem}>Yeni Menü Öğesi</button>
      {navigation.items.map((item, index) => (
        <fieldset key={`${item.itemKey}-${index}`}>
          <legend>{item.label || "Menü öğesi"}</legend>
          <label className="admin-builder-field">
            <span>Etiket</span>
            <input value={item.label} onChange={(event) => actions.updateNavigationItem(index, { label: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Hedef</span>
            <input value={item.href} onChange={(event) => actions.updateNavigationItem(index, { href: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Sıra</span>
            <input type="number" value={item.sortOrder ?? 0} onChange={(event) => actions.updateNavigationItem(index, { sortOrder: Number(event.target.value) })} />
          </label>
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={item.isActive ?? true} onChange={(event) => actions.updateNavigationItem(index, { isActive: event.target.checked })} />
            Aktif
          </label>
        </fieldset>
      ))}
    </div>
  );
}

function PageInspector({
  page,
  section,
  tab,
  selectedSlideId,
  actions
}: {
  page: AdminMarketingPage | null;
  section: AdminMarketingPageSection | null;
  tab: InspectorTab;
  selectedSlideId: string | null;
  actions: BuilderActions;
}) {
  if (!page) {
    return <div className="admin-empty-state">Sayfa seçin.</div>;
  }

  if (!section) {
    return <PageSettings page={page} actions={actions} />;
  }

  if (section.sectionKey === HOME_SLIDER_SECTION_KEY || section.variantKey === HOME_SLIDER_SECTION_KEY) {
    return <HomepageSliderEditor section={section} selectedSlideId={selectedSlideId} actions={actions} />;
  }

  const definition = getSectionDefinition(section);

  if (tab === "tasarim") {
    const payload = isRecord(section.payload) ? section.payload : {};
    const style = isRecord(payload.style) ? payload.style : {};
    return (
      <div className="admin-website-builder__form">
        <label className="admin-builder-field">
          <span>Renk tonu</span>
          <select
            value={String(style.tone ?? "teal")}
            onChange={(event) => actions.updateSection({ payload: { ...payload, style: { ...style, tone: event.target.value } } })}
          >
            <option value="teal">Teal</option>
            <option value="blue">Mavi</option>
            <option value="amber">Amber</option>
          </select>
        </label>
        <label className="admin-builder-field">
          <span>Hizalama</span>
          <select
            value={String(style.align ?? "left")}
            onChange={(event) => actions.updateSection({ payload: { ...payload, style: { ...style, align: event.target.value } } })}
          >
            <option value="left">Sol</option>
            <option value="center">Orta</option>
            <option value="right">Sağ</option>
          </select>
        </label>
        <label className="admin-builder-field">
          <span>Boşluk</span>
          <select
            value={String(style.spacing ?? "normal")}
            onChange={(event) => actions.updateSection({ payload: { ...payload, style: { ...style, spacing: event.target.value } } })}
          >
            <option value="tight">Sıkı</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Geniş</option>
          </select>
        </label>
      </div>
    );
  }

  if (tab === "gelismis") {
    const payload = isRecord(section.payload) ? section.payload : {};
    return (
      <div className="admin-website-builder__form">
        <label className="admin-builder-field">
          <span>Anchor ID</span>
          <input
            value={String(payload.anchorId ?? "")}
            onChange={(event) =>
              actions.updateSection({ payload: { ...payload, anchorId: normalizeAnchorId(event.target.value) } })
            }
          />
        </label>
        <label className="admin-checkbox-row">
          <input type="checkbox" checked={section.isActive ?? true} onChange={(event) => actions.updateSection({ isActive: event.target.checked })} />
          Bölüm aktif
        </label>
        <details className="admin-builder-advanced">
          <summary>Teknik payload önizlemesi</summary>
          <pre>{JSON.stringify(section.payload ?? {}, null, 2)}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="admin-website-builder__form">
      <div className="admin-builder-inspector-note">
        <strong>{definition.label}</strong>
        <span>{definition.description}</span>
      </div>
      <label className="admin-builder-field">
        <span>Üst etiket</span>
        <input value={section.eyebrow ?? ""} onChange={(event) => actions.updateSection({ eyebrow: event.target.value })} />
      </label>
      <label className="admin-builder-field">
        <span>Başlık</span>
        <input value={section.title ?? ""} onChange={(event) => actions.updateSection({ title: event.target.value })} />
      </label>
      <label className="admin-builder-field">
        <span>Açıklama</span>
        <textarea value={section.body ?? ""} onChange={(event) => actions.updateSection({ body: event.target.value })} />
      </label>
      <SectionMediaControl section={section} actions={actions} />
      {definition.behavior === "dynamic" ? (
        <div className="admin-alert" role="status">
          Bu bölüm dinamik veriyi mevcut uygulama modülünden alır. Yalnızca çevre başlıkları ve görünürlük ayarları düzenlenir.
        </div>
      ) : null}
    </div>
  );
}

function PageSettings({ page, actions }: { page: AdminMarketingPage; actions: BuilderActions }) {
  return (
    <div className="admin-website-builder__form">
      <label className="admin-builder-field">
        <span>Sayfa başlığı</span>
        <input value={page.title} onChange={(event) => actions.updatePage({ title: event.target.value })} />
      </label>
      <label className="admin-builder-field">
        <span>Sayfa açıklaması</span>
        <textarea value={page.description ?? ""} onChange={(event) => actions.updatePage({ description: event.target.value })} />
      </label>
      <details className="admin-builder-advanced">
        <summary>SEO ve teknik ayarlar</summary>
        <label className="admin-builder-field">
          <span>Slug</span>
          <input value={page.slug} onChange={(event) => actions.updatePage({ slug: event.target.value })} />
        </label>
        <label className="admin-builder-field">
          <span>SEO başlığı</span>
          <input value={page.seoTitle ?? ""} onChange={(event) => actions.updatePage({ seoTitle: event.target.value })} />
        </label>
      </details>
    </div>
  );
}

function SectionMediaControl({ section, actions }: { section: AdminMarketingPageSection; actions: BuilderActions }) {
  const payload = isRecord(section.payload) ? section.payload : {};

  return (
    <MediaField
      intent={{
        kind: "IMAGE",
        label: "Bölüm görseli",
        description: "Bölüm görselini yükleyin veya medya kütüphanesinden seçin.",
        recommendedDimensions: "1200x800 px",
        allowExternalUrl: true
      }}
      value={typeof payload.mediaUrl === "string" ? payload.mediaUrl : ""}
      altText={typeof payload.mediaAlt === "string" ? payload.mediaAlt : ""}
      onChange={(mediaUrl) => actions.updateSection({ payload: { ...payload, mediaUrl } })}
      onAltTextChange={(mediaAlt) => actions.updateSection({ payload: { ...payload, mediaAlt } })}
    />
  );
}

function StaffPanel({
  document,
  setDocument
}: {
  document: AdminStaffProfilesDocument;
  setDocument: Dispatch<SetStateAction<AdminStaffProfilesDocument>>;
}) {
  const firstGroup = document.groups[0];
  return (
    <div className="admin-website-builder__form">
      <p className="admin-website-builder__hint">Kadro grupları yapılandırılmış alanlarla yönetilir; özel kod kabul edilmez.</p>
      {firstGroup ? (
        <label className="admin-builder-field">
          <span>İlk grup başlığı</span>
          <input
            value={firstGroup.label}
            onChange={(event) =>
              setDocument((current) => ({
                ...current,
                groups: current.groups.map((group, index) =>
                  index === 0 ? { ...group, label: event.target.value } : group
                )
              }))
            }
          />
        </label>
      ) : (
        <p className="admin-empty-state">Kadro grubu bulunmuyor.</p>
      )}
    </div>
  );
}

function SuccessStoriesPanel({
  document,
  setDocument
}: {
  document: AdminSuccessStoriesDocument;
  setDocument: Dispatch<SetStateAction<AdminSuccessStoriesDocument>>;
}) {
  const firstStory = document.stories[0];
  return (
    <div className="admin-website-builder__form">
      <p className="admin-website-builder__hint">Başarı hikayeleri öne çıkan sıralama ve yayın durumu ile saklanır.</p>
      {firstStory ? (
        <label className="admin-builder-field">
          <span>İlk hikaye başlığı</span>
          <input
            value={firstStory.resultTitle}
            onChange={(event) =>
              setDocument((current) => ({
                ...current,
                stories: current.stories.map((story, index) =>
                  index === 0 ? { ...story, resultTitle: event.target.value } : story
                )
              }))
            }
          />
        </label>
      ) : (
        <p className="admin-empty-state">Başarı hikayesi bulunmuyor.</p>
      )}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
