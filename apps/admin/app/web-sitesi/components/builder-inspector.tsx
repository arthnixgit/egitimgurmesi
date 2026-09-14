"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type {
  AdminMarketingPage,
  AdminMarketingPageSection,
  AdminNavigationItem,
  AdminNavigationMenu,
  AdminSiteSettings,
  AdminStaffProfilesDocument,
  AdminSuccessStory,
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
import { AssetImage } from "./asset-image";
import { MediaField } from "./media-field";
import { SectionListEditor } from "./section-list-editor";
import { getSectionListSpec } from "../lib/section-content-schema";
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
      {selection.selectedArea === "sayfalar" || selection.selectedArea === "ana-sayfa-slideri" ? (
        <PageInspector
          page={currentPage}
          section={currentSection}
          tab={selection.inspectorTab}
          selectedSlideId={selection.selectedSlideId}
          sliderMode={selection.selectedArea === "ana-sayfa-slideri"}
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
              ?.items.find((item) => (item.id || item.slug || "") === selection.selectedMaterialSlug) ??
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
        <SuccessStoriesPanel document={data.successStories} setDocument={setSuccessStories} actions={actions} />
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
    {
      key: "logoPrimaryUrl",
      label: "Header ana logo",
      description: "Web sitesinin masaüstü üst menüsünde kullanılır.",
      usage: "Masaüstü header ve açık header bağlamları",
      dimensions: "229x121 px",
      fallbackUrl: "/branding/ega-logo-official.png",
      canApplyToAll: true
    },
    {
      key: "logoCompactUrl",
      label: "Kompakt/mobil logo",
      description: "Mobil menü ve dar başlık alanlarında kullanılır.",
      usage: "Mobil header ve kompakt başlık alanları",
      dimensions: "160x160 px",
      fallbackUrl: "/branding/ega-mark-transparent.png",
      canApplyToAll: true
    },
    {
      key: "logoFooterUrl",
      label: "Footer logo",
      description: "Web sitesinin alt bilgi alanında kullanılır.",
      usage: "Footer marka kolonu",
      dimensions: "229x121 px",
      fallbackUrl: "/branding/ega-logo-official.png",
      canApplyToAll: true
    },
    {
      key: "logoMarkUrl",
      label: "Logo mark",
      description: "Sadece marka işareti beklenen yüzeylerde kullanılır.",
      usage: "Başarı vitrini avatar yedeği ve dekoratif marka izi",
      dimensions: "160x160 px",
      fallbackUrl: "/branding/ega-mark-transparent.png",
      canApplyToAll: true
    },
    {
      key: "logoDarkUrl",
      label: "Açık zemin logo",
      description: "Açık arka planlarda okunabilir koyu/renkli logo olarak kullanılır.",
      usage: "Açık zemin marka önizlemeleri",
      dimensions: "229x121 px",
      fallbackUrl: "/branding/ega-logo-official.png",
      canApplyToAll: true
    },
    {
      key: "logoLightUrl",
      label: "Koyu zemin logo",
      description: "Koyu veya degrade arka planlarda okunabilir açık logo olarak kullanılır.",
      usage: "Koyu zemin marka önizlemeleri",
      dimensions: "229x121 px",
      fallbackUrl: "/branding/ega-logo-official.png",
      canApplyToAll: true
    },
    {
      key: "faviconUrl",
      label: "Favicon",
      description: "Tarayıcı sekmesinde kullanılır; tarayıcı önbelleği nedeniyle değişiklik gecikmeli görünebilir.",
      usage: "Browser favicon ve uygulama ikon metadata alanları",
      dimensions: "32x32 px",
      fallbackUrl: "/icon.png",
      canApplyToAll: false
    },
    {
      key: "defaultSocialImageUrl",
      label: "Sosyal paylaşım görseli",
      description: "Bağlantı sosyal platformlarda paylaşıldığında varsayılan önizleme görselidir.",
      usage: "Open Graph ve Twitter varsayılan görseli",
      dimensions: "1200x630 px",
      fallbackUrl: "/branding/ega-logo-official.png",
      canApplyToAll: false
    }
  ] as const;

  return (
    <div className="admin-brand-grid">
      {fields.map((field) => (
        <section key={field.key} className="admin-brand-card">
          <div className="admin-brand-card__meta">
            <span className="admin-builder-badge" data-tone="teal">
              {settings.publishedAt ? "Yayında" : "Taslak"}
            </span>
            <p>Bu logo şu alanlarda kullanılıyor: {field.usage}.</p>
          </div>
          <div className="admin-brand-card__previews" aria-label={`${field.label} kullanım önizlemesi`}>
            <span data-tone="light">
              <AssetImage
                src={String(settings[field.key as keyof AdminSiteSettings] || "")}
                fallbackSrc={field.fallbackUrl}
                alt=""
              />
            </span>
            <span data-tone="dark">
              <AssetImage
                src={String(settings[field.key as keyof AdminSiteSettings] || "")}
                fallbackSrc={field.fallbackUrl}
                alt=""
              />
            </span>
          </div>
          <MediaField
            intent={{
              kind: "BRANDING",
              label: field.label,
              description: field.description,
              recommendedDimensions: field.dimensions,
              fallbackUrl: field.fallbackUrl,
              allowExternalUrl: true
            }}
            value={String(settings[field.key as keyof AdminSiteSettings] ?? "")}
            altText={settings.logoAltText ?? settings.siteName}
            onChange={(value) => actions.updateSetting(field.key as keyof AdminSiteSettings, value as never)}
            onAltTextChange={(value) => actions.updateSetting("logoAltText", value)}
          />
          {field.canApplyToAll ? (
            <button
              type="button"
              className="admin-button--compact admin-button--ghost"
              onClick={() => actions.applyLogoToAllFields(field.key as keyof AdminSiteSettings)}
            >
              Bu görseli tüm logo alanlarında kullan
            </button>
          ) : null}
          <small className="admin-brand-card__state">
            Yayınlanan görsel public sitede Publish sonrası kullanılır; yükleme veya medya seçimi tek başına canlı siteyi değiştirmez.
          </small>
        </section>
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
      <div className="admin-alert" role="status">
        Paketlerimiz alt başlıkları katalogdan gelir; kategori adı, sırası, görünürlüğü ve hedefi
        Super Admin tarafından <a href="/ticaret">/ticaret</a> alanından yönetilir.
      </div>
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
  sliderMode = false,
  actions
}: {
  page: AdminMarketingPage | null;
  section: AdminMarketingPageSection | null;
  tab: InspectorTab;
  selectedSlideId: string | null;
  sliderMode?: boolean;
  actions: BuilderActions;
}) {
  if (!page) {
    if (sliderMode) {
      return <HomeSliderRepairState reason="Ana sayfa kaydı bulunamadı." actions={actions} />;
    }

    return <div className="admin-empty-state">Sayfa seçin.</div>;
  }

  if (!section) {
    if (sliderMode) {
      return <HomeSliderRepairState reason="Ana sayfa slider bölümü bulunamadı." actions={actions} />;
    }

    return <PageSettings page={page} actions={actions} />;
  }

  if (section.sectionKey === HOME_SLIDER_SECTION_KEY || section.variantKey === HOME_SLIDER_SECTION_KEY) {
    return <HomepageSliderEditor section={section} selectedSlideId={selectedSlideId} actions={actions} />;
  }

  const definition = getSectionDefinition(section);
  const listSpec = getSectionListSpec(section);

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
      {listSpec ? <SectionListEditor section={section} spec={listSpec} actions={actions} /> : null}
      <SectionMediaControl section={section} actions={actions} />
      {definition.behavior === "dynamic" ? (
        <div className="admin-alert" role="status">
          Bu bölüm dinamik veriyi mevcut uygulama modülünden alır. Yalnızca çevre başlıkları ve görünürlük ayarları düzenlenir.
        </div>
      ) : null}
    </div>
  );
}

function HomeSliderRepairState({ reason, actions }: { reason: string; actions: BuilderActions }) {
  return (
    <div className="admin-empty-state admin-empty-state--action">
      <strong>Ana Sayfa Sliderı hazırlanmalı</strong>
      <span>{reason}</span>
      <button type="button" className="admin-button" onClick={actions.repairHomeSliderDraft}>
        Ana Sayfa Sliderını Oluştur
      </button>
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
  setDocument,
  actions
}: {
  document: AdminSuccessStoriesDocument;
  setDocument: Dispatch<SetStateAction<AdminSuccessStoriesDocument>>;
  actions: BuilderActions;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED" | "FEATURED">("ALL");
  const [selectedSlug, setSelectedSlug] = useState(document.stories[0]?.slug ?? "");
  const counts = useMemo(
    () => ({
      all: document.stories.length,
      published: document.stories.filter((story) => story.publishStatus === "PUBLISHED").length,
      draft: document.stories.filter((story) => story.publishStatus !== "PUBLISHED" && story.publishStatus !== "ARCHIVED").length,
      archived: document.stories.filter((story) => story.publishStatus === "ARCHIVED").length,
      featured: document.stories.filter((story) => story.isFeatured).length
    }),
    [document.stories]
  );
  const selectedStory =
    document.stories.find((story) => story.slug === selectedSlug) ?? document.stories[0] ?? null;
  const visibleStories = document.stories.filter((story) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "FEATURED" ? story.isFeatured : (story.publishStatus ?? "DRAFT") === filter);
    const text = `${story.studentName} ${story.slug} ${story.city ?? ""} ${story.examLabel ?? ""} ${story.resultTitle} ${story.highlight}`;

    return matchesFilter && text.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
  });

  function commitStory(slug: string, patch: Partial<AdminSuccessStory>) {
    setDocument((current) => ({
      ...current,
      stories: current.stories.map((story) => (story.slug === slug ? { ...story, ...patch } : story))
    }));
    if (patch.slug) {
      setSelectedSlug(patch.slug);
    }
  }

  function createStory() {
    const slug = `basari-hikayesi-${Date.now().toString(36)}`;
    const story: AdminSuccessStory = {
      slug,
      studentName: "",
      city: "",
      examLabel: "",
      resultTitle: "",
      highlight: "",
      story: "",
      avatarUrl: "",
      sortOrder: (document.stories.length + 1) * 10,
      isFeatured: false,
      publishStatus: "DRAFT"
    };

    setDocument((current) => ({
      ...current,
      stories: [...current.stories, story]
    }));
    setSelectedSlug(slug);
  }

  function duplicateStory() {
    if (!selectedStory) {
      return;
    }

    const slug = `${selectedStory.slug || "basari-hikayesi"}-kopya-${Date.now().toString(36)}`;
    setDocument((current) => ({
      ...current,
      stories: resequenceStories([
        ...current.stories,
        {
          ...selectedStory,
          id: undefined,
          slug,
          studentName: `${selectedStory.studentName} kopyası`.trim(),
          publishStatus: "DRAFT"
        }
      ])
    }));
    setSelectedSlug(slug);
  }

  function moveStory(direction: -1 | 1) {
    if (!selectedStory) {
      return;
    }

    const sorted = [...document.stories].sort(compareStories);
    const index = sorted.findIndex((story) => story.slug === selectedStory.slug);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
      return;
    }

    const [story] = sorted.splice(index, 1);
    sorted.splice(targetIndex, 0, story);
    setDocument((current) => ({
      ...current,
      stories: resequenceStories(sorted)
    }));
  }

  function deleteStory() {
    if (!selectedStory) {
      return;
    }

    const typed = window.prompt(`"${selectedStory.studentName || selectedStory.slug}" silinecek. Devam etmek için SİL yazın.`);
    if (typed !== "SİL") {
      return;
    }

    const nextStories = document.stories.filter((story) => story.slug !== selectedStory.slug);
    setDocument((current) => ({
      ...current,
      stories: resequenceStories(current.stories.filter((story) => story.slug !== selectedStory.slug))
    }));
    setSelectedSlug(nextStories[0]?.slug ?? "");
  }

  return (
    <div className="admin-success-workspace">
      <aside className="admin-success-workspace__list" aria-label="Başarı hikayeleri listesi">
        <div className="admin-toolbar admin-toolbar--split">
          <div>
            <strong>Başarı Hikayeleri</strong>
            <p>Yayında {counts.published} · Taslak {counts.draft} · Arşiv {counts.archived}</p>
          </div>
          <button className="admin-button--compact" type="button" onClick={createStory}>
            Yeni Başarı Hikayesi
          </button>
        </div>

        <label className="admin-builder-field">
          <span>Arama</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Öğrenci, şehir, sınav" />
        </label>

        <div className="admin-builder-check-grid" role="group" aria-label="Başarı hikayesi filtreleri">
          {[
            ["ALL", `Tümü (${counts.all})`],
            ["PUBLISHED", `Yayında (${counts.published})`],
            ["DRAFT", `Taslak (${counts.draft})`],
            ["ARCHIVED", `Arşivlenmiş (${counts.archived})`],
            ["FEATURED", `Öne Çıkanlar (${counts.featured})`]
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="admin-button--compact admin-button--ghost"
              data-active={filter === key}
              onClick={() => setFilter(key as typeof filter)}
            >
              {label}
            </button>
          ))}
        </div>

        {document.stories.length === 0 ? (
          <div className="admin-empty-state admin-empty-state--action">
            <strong>Henüz başarı hikayesi eklenmedi.</strong>
            <button className="admin-button" type="button" onClick={createStory}>
              İlk Başarı Hikayesini Ekle
            </button>
          </div>
        ) : (
          <div className="admin-success-list">
            {visibleStories.map((story) => (
              <button
                key={story.slug}
                type="button"
                className="admin-success-list__item"
                data-active={story.slug === selectedStory?.slug}
                onClick={() => setSelectedSlug(story.slug)}
              >
                <strong>{story.studentName || "İsimsiz hikaye"}</strong>
                <span>{story.resultTitle || story.slug}</span>
                <small>{story.publishStatus ?? "DRAFT"} · {story.isFeatured ? "Öne çıkan" : "Standart"}</small>
              </button>
            ))}
          </div>
        )}
      </aside>

      {selectedStory ? (
        <section className="admin-success-workspace__editor" aria-label="Başarı hikayesi editörü">
          <div className="admin-toolbar admin-toolbar--split admin-sticky-actions">
            <div className="admin-editor-meta">
              <span className="admin-badge">{selectedStory.publishStatus ?? "DRAFT"}</span>
              <span className="admin-editor-meta__text">{selectedStory.slug}</span>
            </div>
            <div className="admin-actions">
              <button className="admin-button--compact admin-button--ghost" type="button" onClick={duplicateStory}>Kopyala</button>
              <button className="admin-button--compact admin-button--ghost" type="button" onClick={() => moveStory(-1)}>Yukarı Taşı</button>
              <button className="admin-button--compact admin-button--ghost" type="button" onClick={() => moveStory(1)}>Aşağı Taşı</button>
              <button className="admin-button--compact admin-button--ghost" type="button" onClick={() => actions.saveCurrent("draft")}>Kaydet</button>
              <button className="admin-button--compact" type="button" onClick={() => {
                commitStory(selectedStory.slug, { publishStatus: "PUBLISHED" });
                window.setTimeout(() => void actions.saveCurrent("publish"), 0);
              }}>Yayınla</button>
            </div>
          </div>

          <div className="admin-success-preview">
            {selectedStory.avatarUrl ? (
              <AssetImage src={selectedStory.avatarUrl} alt={`${selectedStory.studentName} görseli`} />
            ) : null}
            <div>
              <strong>{selectedStory.studentName || "Öğrenci adı"}</strong>
              <span>{selectedStory.examLabel || "Sınav / Yıl"}</span>
              <p>{selectedStory.highlight || selectedStory.resultTitle || "Kısa vurgu"}</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="admin-builder-field">
              <span>Öğrenci Adı</span>
              <input value={selectedStory.studentName} onChange={(event) => commitStory(selectedStory.slug, { studentName: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>Slug</span>
              <input value={selectedStory.slug} onChange={(event) => commitStory(selectedStory.slug, { slug: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>Şehir</span>
              <input value={selectedStory.city ?? ""} onChange={(event) => commitStory(selectedStory.slug, { city: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>Sınav / Yıl</span>
              <input value={selectedStory.examLabel ?? ""} onChange={(event) => commitStory(selectedStory.slug, { examLabel: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>Sonuç Başlığı</span>
              <input value={selectedStory.resultTitle} onChange={(event) => commitStory(selectedStory.slug, { resultTitle: event.target.value })} />
            </label>
            <label className="admin-builder-field">
              <span>Sıra</span>
              <input type="number" value={selectedStory.sortOrder ?? 0} onChange={(event) => commitStory(selectedStory.slug, { sortOrder: Number(event.target.value) })} />
            </label>
          </div>

          <label className="admin-builder-field">
            <span>Kısa Vurgu</span>
            <textarea value={selectedStory.highlight} onChange={(event) => commitStory(selectedStory.slug, { highlight: event.target.value })} />
          </label>
          <label className="admin-builder-field">
            <span>Başarı Hikayesi</span>
            <textarea value={selectedStory.story ?? ""} onChange={(event) => commitStory(selectedStory.slug, { story: event.target.value })} />
          </label>

          <MediaField
            intent={{
              kind: "IMAGE",
              label: "Öğrenci Görseli",
              description: "Dosya yükleyin veya Medya Kütüphanesinden seçin.",
              recommendedDimensions: "640x640 px",
              recommendedAspectRatio: "1:1",
              allowExternalUrl: true
            }}
            value={selectedStory.avatarUrl ?? ""}
            altText={selectedStory.studentName ? `${selectedStory.studentName} başarı hikayesi` : "Başarı hikayesi görseli"}
            onChange={(avatarUrl) => commitStory(selectedStory.slug, { avatarUrl })}
          />

          <div className="admin-inline-checks">
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={selectedStory.isFeatured ?? false}
                onChange={(event) => commitStory(selectedStory.slug, { isFeatured: event.target.checked })}
              />
              Öne Çıkar
            </label>
            <label className="admin-builder-field">
              <span>Yayın Durumu</span>
              <select
                value={selectedStory.publishStatus ?? "DRAFT"}
                onChange={(event) => commitStory(selectedStory.slug, { publishStatus: event.target.value })}
              >
                <option value="DRAFT">Taslak</option>
                <option value="PUBLISHED">Yayında</option>
                <option value="ARCHIVED">Arşivlenmiş</option>
              </select>
            </label>
          </div>

          <div className="admin-actions">
            <button className="admin-button--ghost" type="button" onClick={() => actions.requestPreviewToken()}>Önizle</button>
            <button className="admin-button--ghost" type="button" onClick={() => {
              commitStory(selectedStory.slug, { publishStatus: "DRAFT" });
              window.setTimeout(() => void actions.saveCurrent("publish"), 0);
            }}>Yayından Kaldır</button>
            <button className="admin-button--ghost" type="button" onClick={() => {
              commitStory(selectedStory.slug, { publishStatus: "ARCHIVED" });
              window.setTimeout(() => void actions.saveCurrent("publish"), 0);
            }}>Arşivle</button>
            <button className="admin-button--ghost" type="button" onClick={() => {
              commitStory(selectedStory.slug, { publishStatus: "DRAFT" });
              window.setTimeout(() => void actions.saveCurrent("draft"), 0);
            }}>Arşivden Çıkar</button>
            <button className="admin-button--ghost" type="button" onClick={() => actions.dispatchSelection({ type: "select-area", area: "gecmis" })}>Revizyonu Gör</button>
            <button className="admin-button--ghost" type="button" onClick={deleteStory}>Sil</button>
          </div>
        </section>
      ) : (
        <div className="admin-empty-state admin-empty-state--action">
          <strong>Henüz başarı hikayesi eklenmedi.</strong>
          <button className="admin-button" type="button" onClick={createStory}>
            İlk Başarı Hikayesini Ekle
          </button>
        </div>
      )}
    </div>
  );
}

function compareStories(left: AdminSuccessStory, right: AdminSuccessStory) {
  return (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.studentName.localeCompare(right.studentName, "tr");
}

function resequenceStories(stories: AdminSuccessStory[]) {
  return stories.map((story, index) => ({
    ...story,
    sortOrder: (index + 1) * 10
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
