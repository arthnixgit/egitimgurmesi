"use client";

import { HomeShowcaseHero } from "@ega/ui";
import type {
  AdminFreeMaterialCategory,
  AdminFreeMaterialItem,
  AdminMarketingPage,
  AdminMarketingPageSection,
  AdminNavigationMenu,
  AdminSiteSettings,
  AdminStaffProfilesDocument,
  AdminSuccessStoriesDocument
} from "../../../lib/auth-client";
import type { BuilderActions, ResponsiveMode, SectionField, WebsiteArea, WebsiteSelection } from "../lib/builder-types";
import { HOME_SLIDER_SECTION_KEY, normalizeHomeSliderPayload, pageLabel, readableSectionLabel } from "../lib/section-registry";
import { EditableSectionFrame, InlineTextControl } from "./editable-section-frame";

export function BuilderCanvas({
  selectedArea,
  selection,
  settings,
  navigation,
  currentPage,
  currentSection,
  materials,
  currentMaterialCategory,
  currentMaterialItem,
  staffProfiles,
  successStories,
  areaLoading,
  actions
}: {
  selectedArea: WebsiteArea;
  selection: WebsiteSelection;
  settings: AdminSiteSettings;
  navigation: AdminNavigationMenu;
  currentPage: AdminMarketingPage | null;
  currentSection: AdminMarketingPageSection | null;
  materials: { categories: AdminFreeMaterialCategory[] };
  currentMaterialCategory: AdminFreeMaterialCategory | null;
  currentMaterialItem: AdminFreeMaterialItem | null;
  staffProfiles: AdminStaffProfilesDocument;
  successStories: AdminSuccessStoriesDocument;
  areaLoading: boolean;
  actions: BuilderActions;
}) {
  return (
    <section className="admin-website-builder__canvas" aria-label="Canlı düzenleme canvas alanı">
      {areaLoading ? <div className="admin-empty-state">Alan yükleniyor...</div> : null}
      {!areaLoading ? (
        <div
          className="admin-website-builder__preview-frame"
          data-mode={selection.responsiveMode}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const widgetKey = event.dataTransfer.getData("application/x-ega-widget");
            if (widgetKey) {
              actions.insertWidget(widgetKey, selection.selectedSectionKey);
            }
          }}
        >
          {renderCanvasContent({
            selectedArea,
            selection,
            settings,
            navigation,
            currentPage,
            currentSection,
            materials,
            currentMaterialCategory,
            currentMaterialItem,
            staffProfiles,
            successStories,
            actions
          })}
        </div>
      ) : null}
    </section>
  );
}

function renderCanvasContent(data: {
  selectedArea: WebsiteArea;
  selection: WebsiteSelection;
  settings: AdminSiteSettings;
  navigation: AdminNavigationMenu;
  currentPage: AdminMarketingPage | null;
  currentSection: AdminMarketingPageSection | null;
  materials: { categories: AdminFreeMaterialCategory[] };
  currentMaterialCategory: AdminFreeMaterialCategory | null;
  currentMaterialItem: AdminFreeMaterialItem | null;
  staffProfiles: AdminStaffProfilesDocument;
  successStories: AdminSuccessStoriesDocument;
  actions: BuilderActions;
}) {
  if (["genel", "marka", "footer"].includes(data.selectedArea)) {
    return <FooterPreview settings={data.settings} />;
  }

  if (data.selectedArea === "header") {
    return <NavigationPreview navigation={data.navigation} settings={data.settings} />;
  }

  if (data.selectedArea === "sayfalar") {
    return <PageCanvas {...data} currentPage={data.currentPage} />;
  }

  if (data.selectedArea === "ucretsiz-materyaller") {
    return (
      <div className="admin-website-builder__site-preview">
        <h2>Ücretsiz Materyaller</h2>
        <p>{data.currentMaterialCategory?.description}</p>
        <div className="admin-website-builder__material-grid">
          {(data.currentMaterialCategory?.items ?? []).map((item) => (
            <MaterialPreviewCard
              key={item.id ?? item.slug ?? item.title}
              item={item}
              active={(item.id || item.slug || "") === (data.currentMaterialItem?.id || data.currentMaterialItem?.slug || "")}
            />
          ))}
        </div>
      </div>
    );
  }

  if (data.selectedArea === "akademik-kadro") {
    return (
      <div className="admin-website-builder__site-preview">
        <h2>Akademik Kadro</h2>
        <div className="admin-website-builder__material-grid">
          {data.staffProfiles.groups.flatMap((group) => group.profiles).map((profile) => (
            <article key={profile.slug} className="admin-website-builder__mini-card">
              <strong>{profile.fullName}</strong>
              <span>{profile.title}</span>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (data.selectedArea === "basari-hikayeleri") {
    return (
      <div className="admin-website-builder__site-preview">
        <h2>Başarı Hikayeleri</h2>
        <div className="admin-website-builder__material-grid">
          {data.successStories.stories.map((story) => (
            <article key={story.slug} className="admin-website-builder__mini-card">
              <strong>{story.studentName}</strong>
              <span>{story.resultTitle}</span>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (data.selectedArea === "gecmis") {
    return (
      <div className="admin-website-builder__site-preview">
        <h2>Taslaklar ve Geçmiş</h2>
        <p>Revizyonlar sağ panelden yüklenir ve yetkili kullanıcı tarafından geri alınabilir.</p>
      </div>
    );
  }

  return <div className="admin-empty-state">Bu alan için önizleme hazırlanıyor.</div>;
}

function PageCanvas({
  currentPage,
  selection,
  actions
}: {
  currentPage: AdminMarketingPage | null;
  selection: WebsiteSelection;
  actions: BuilderActions;
}) {
  if (!currentPage) {
    return <div className="admin-empty-state">Düzenlenecek sayfa bulunamadı.</div>;
  }

  return (
    <div className="admin-page-canvas" data-page={currentPage.key}>
      <header className="admin-page-canvas__header">
        <span>Sayfa</span>
        <h2>{pageLabel(currentPage)}</h2>
        <p>{currentPage.description}</p>
      </header>

      <div className="admin-page-canvas__sections">
        <DropZone label="İlk sıraya bileşen ekle" afterSectionKey="" actions={actions} />
        {currentPage.sections.map((section) => (
          <div key={section.sectionKey}>
            <EditableSectionFrame
              section={section}
              selected={selection.selectedSectionKey === section.sectionKey}
              actions={actions}
              onInlineField={(field) => actions.dispatchSelection({ type: "set-inline-field", field })}
            >
              <SectionPreview
                section={section}
                active={selection.selectedSectionKey === section.sectionKey}
                inlineField={selection.inlineField}
                selectedSlideId={selection.selectedSlideId}
                responsiveMode={selection.responsiveMode}
                actions={actions}
              />
            </EditableSectionFrame>
            <DropZone label="Buraya bileşen ekle" afterSectionKey={section.sectionKey} actions={actions} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionPreview({
  section,
  active,
  inlineField,
  selectedSlideId,
  actions
}: {
  section: AdminMarketingPageSection;
  active: boolean;
  inlineField: SectionField | null;
  selectedSlideId: string | null;
  responsiveMode: ResponsiveMode;
  actions: BuilderActions;
}) {
  if (section.sectionKey === HOME_SLIDER_SECTION_KEY || section.variantKey === HOME_SLIDER_SECTION_KEY) {
    const slider = normalizeHomeSliderPayload(section);
    const selectedIndex = slider.slides.findIndex((slide) => slide.id === selectedSlideId);
    const initialIndex = slider.slides.findIndex((slide) => slide.id === slider.settings.initialSlideId);
    const activeIndex = Math.max(0, selectedIndex >= 0 ? selectedIndex : initialIndex);
    return (
      <HomeShowcaseHero
        slides={slider.slides}
        activeIndex={activeIndex}
        onSelectSlide={(_index, slide) => {
          actions.dispatchSelection({ type: "set-slide", slideId: slide.id });
        }}
        disableActions
        includeInactiveSlides
      />
    );
  }

  return (
    <section className="admin-generic-section-preview" data-variant={section.variantKey ?? "section"}>
      <span>{section.eyebrow || section.variantKey || "Bölüm"}</span>
      <h3>
        <InlineTextControl
          label="Bölüm başlığı"
          value={section.title ?? ""}
          editing={active && inlineField === "title"}
          onStart={() => actions.dispatchSelection({ type: "set-inline-field", field: "title" })}
          onCancel={() => actions.dispatchSelection({ type: "set-inline-field", field: null })}
          onChange={(title) => actions.updateSection({ title })}
        />
      </h3>
      <p>
        <InlineTextControl
          label="Bölüm metni"
          value={section.body ?? ""}
          multiline
          editing={active && inlineField === "body"}
          onStart={() => actions.dispatchSelection({ type: "set-inline-field", field: "body" })}
          onCancel={() => actions.dispatchSelection({ type: "set-inline-field", field: null })}
          onChange={(body) => actions.updateSection({ body })}
        />
      </p>
    </section>
  );
}

function DropZone({
  label,
  afterSectionKey,
  actions
}: {
  label: string;
  afterSectionKey: string;
  actions: BuilderActions;
}) {
  return (
    <button
      type="button"
      className="admin-builder-dropzone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const widgetKey = event.dataTransfer.getData("application/x-ega-widget");
        if (widgetKey) {
          actions.insertWidget(widgetKey, afterSectionKey);
        }
      }}
      onClick={() => {
        actions.dispatchSelection({ type: "set-left-panel-mode", mode: "bilesenler" });
      }}
    >
      {label}
    </button>
  );
}

function NavigationPreview({ navigation, settings }: { navigation: AdminNavigationMenu; settings: AdminSiteSettings }) {
  return (
    <div className="admin-website-builder__site-preview">
      <div className="admin-website-builder__preview-nav">
        <img src={settings.logoPrimaryUrl || "/branding/ega-logo-official.png"} alt={settings.logoAltText || settings.siteName} />
        <nav aria-label="Önizleme menüsü">
          {navigation.items.map((item) => (
            <a key={item.itemKey} href={item.href}>{item.label}</a>
          ))}
        </nav>
      </div>
    </div>
  );
}

function FooterPreview({ settings }: { settings: AdminSiteSettings }) {
  return (
    <footer className="admin-website-builder__footer-preview">
      <div>
        <img src={settings.logoFooterUrl || "/branding/ega-logo-official.png"} alt={settings.logoAltText || settings.siteName} />
        <p>{settings.footerBrandDescription}</p>
      </div>
      <nav aria-label="Hızlı erişim önizlemesi">
        <h3>Hızlı Erişim</h3>
        {settings.footerQuickLinks.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>
      <address>
        <h3>{settings.footerContactTitle}</h3>
        <a href={settings.telHref}>{settings.displayPhone}</a>
        <a href={settings.whatsappHref}>WhatsApp ile Yazın</a>
        <span>{settings.address}</span>
        {settings.publicContactEmail ? <a href={`mailto:${settings.publicContactEmail}`}>{settings.publicContactEmail}</a> : null}
      </address>
    </footer>
  );
}

function MaterialPreviewCard({ item, active }: { item: AdminFreeMaterialItem; active: boolean }) {
  const isDownload = ["PDF", "DOWNLOAD"].includes(item.itemType);
  return (
    <article className="admin-website-builder__download-card" data-active={active}>
      <span className="admin-website-builder__icon-well" aria-hidden="true">{iconLabel(item.iconKey, isDownload)}</span>
      <span>{item.badgeLabel || item.itemType}</span>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      {item.displayFilename ? <small>{item.displayFilename}</small> : null}
      <button type="button" className="admin-button--compact">
        {item.accessibilityLabel || item.buttonLabel || (isDownload ? `${item.title} dosyasını indir` : "İçeriği Aç")}
      </button>
    </article>
  );
}

function iconLabel(iconKey: string | null | undefined, isDownload: boolean) {
  if (iconKey === "calculator") {
    return "CAL";
  }
  if (iconKey === "countdown") {
    return "DAY";
  }
  if (iconKey === "blog") {
    return "TXT";
  }
  if (iconKey === "simulation") {
    return "SIM";
  }
  return isDownload ? "PDF" : "LNK";
}
