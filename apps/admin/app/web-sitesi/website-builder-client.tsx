"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  clearStaffTokens,
  archiveAdminMaterialCard,
  archiveAdminMaterialCategory,
  deleteAdminMaterialCard,
  deleteAdminMaterialCategory,
  fetchAdminFreeMaterialsDocument,
  fetchAdminMarketingPages,
  fetchAdminNavigationMenu,
  fetchAdminPreviewToken,
  fetchAdminSiteSettings,
  fetchAdminStaffProfilesDocument,
  fetchAdminSuccessStoriesDocument,
  fetchAdminWebsiteRevisions,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  getAdminRequestErrorMessage,
  isStaffSessionError,
  publishAdminSiteSettings,
  restoreAdminMaterialCard,
  restoreAdminMaterialCategory,
  restoreAdminWebsiteRevision,
  moveAdminMaterialCard,
  saveAdminFreeMaterialsDocument,
  saveAdminMarketingPage,
  saveAdminNavigationMenu,
  saveAdminSiteSettings,
  saveAdminStaffProfilesDocument,
  saveAdminSuccessStoriesDocument,
  type AdminFreeMaterialCategory,
  type AdminFreeMaterialItem,
  type AdminFreeMaterialsDocument,
  type AdminMarketingPage,
  type AdminMarketingPageSection,
  type AdminNavigationItem,
  type AdminNavigationMenu,
  type AdminSiteSettings,
  type AdminStaffProfilesDocument,
  type AdminSuccessStoriesDocument,
  type AdminWebsiteRevision
} from "../../lib/auth-client";
import { WebsiteBuilderShell } from "./components/website-builder-shell";
import { cloneSnapshot, emptyHistory, pushHistory, redoHistory, undoHistory } from "./lib/builder-history";
import type {
  BuilderActions,
  BuilderCommand,
  BuilderHistory,
  BuilderSnapshot,
  InspectorTab,
  LeftPanelMode,
  ResponsiveMode,
  SectionMutation,
  WebsiteArea,
  WebsiteSelection
} from "./lib/builder-types";
import { duplicatePageSection, getSectionDefinition, resequenceSections } from "./lib/section-registry";
import { createSectionFromWidget } from "./lib/widget-registry";

type StaffOverview = Awaited<ReturnType<typeof fetchStaffOverview>>;
type StaffMe = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;

const areas: Array<{ key: WebsiteArea; label: string; description: string }> = [
  { key: "genel", label: "Genel Ayarlar", description: "Site adı, SEO ve yayın bilgileri" },
  { key: "marka", label: "Logo ve Marka", description: "Logo, favicon ve paylaşım görseli" },
  { key: "header", label: "Header ve Menü", description: "Ana menü ve mobil navigasyon" },
  { key: "footer", label: "Footer ve İletişim", description: "Telefon, WhatsApp, adres ve hızlı erişim" },
  { key: "sayfalar", label: "Sayfalar", description: "Sayfa ağacı, bölümler ve widget ayarları" },
  { key: "ucretsiz-materyaller", label: "Ücretsiz Materyaller", description: "Kategori ve indirme kartları" },
  { key: "akademik-kadro", label: "Akademik Kadro", description: "Kadro grupları ve profiller" },
  { key: "basari-hikayeleri", label: "Başarı Hikayeleri", description: "Öğrenci hikayeleri ve öne çıkanlar" },
  { key: "medya", label: "Medya Kütüphanesi", description: "Görsel ve doküman seçimi" },
  { key: "gecmis", label: "Taslaklar ve Geçmiş", description: "Revizyonlar ve geri yükleme" }
];

const defaultSettings: AdminSiteSettings = {
  id: "",
  key: "default",
  siteName: "Eğitim Gurmesi Akademi",
  siteTitle: "EĞİTİM GURMESİ AKADEMİ",
  tagline: "Video paketleri, koçluk akışı ve öğrenci paneli",
  supportEmail: "bilgi@egitimgurmesi.com",
  supportPhone: "+90 531 855 38 27",
  supportWhatsappNumber: "905318553827",
  logoPrimaryUrl: "/branding/ega-logo-official.png",
  logoMarkUrl: "/branding/ega-mark-transparent.png",
  logoFooterUrl: "/branding/ega-logo-official.png",
  logoCompactUrl: "/branding/ega-mark-transparent.png",
  logoDarkUrl: "/branding/ega-logo-official.png",
  logoLightUrl: "/branding/ega-logo-official.png",
  faviconUrl: "/icon.png",
  defaultSocialImageUrl: "/branding/ega-logo-official.png",
  logoAltText: "Eğitim Gurmesi Akademi",
  displayPhone: "+90 531 855 38 27",
  canonicalPhone: "+905318553827",
  telHref: "tel:+905318553827",
  whatsappMessage: "Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.",
  whatsappHref:
    "https://wa.me/905318553827?text=Merhaba%2C%20E%C4%9Fitim%20Gurmesi%20Akademi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.",
  address: "Alacaatlı Mah. 4834. Sok. No: 10/8-59 Çankaya/Ankara",
  publicContactEmail: "bilgi@egitimgurmesi.com",
  footerBrandDescription:
    "Eğitim Gurmesi Akademi; kayıtlı video paketlerini, koçluk yönlendirme mantığını ve öğrenci hesap disiplinini tek çatı altında birleştiren yeni nesil bir eğitim satış platformu olarak kurgulanıyor.",
  footerQuickLinks: [
    { label: "Paketlerimiz", href: "/paketlerimiz" },
    { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" },
    { label: "Hakkımızda", href: "/hakkimizda" },
    { label: "Öğrenci Girişi", href: "/giris" }
  ],
  footerContactTitle: "İletişim",
  socialLinks: [],
  copyrightText: "© Eğitim Gurmesi Akademi. Tüm hakları saklıdır.",
  footerNotice: "Eğitim Gurmesi Akademi iletişim ve marka bilgileri.",
  defaultSeoTitle: "Eğitim Gurmesi Akademi",
  defaultSeoDescription: "Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları.",
  version: 1
};

const emptyNavigation: AdminNavigationMenu = {
  id: "",
  key: "primary",
  name: "Ana Menü",
  location: "PRIMARY",
  isActive: true,
  version: 1,
  items: []
};

const emptyMaterials: AdminFreeMaterialsDocument = {
  version: 1,
  categories: [],
  countdownPages: []
};
const EMPTY_ACTIVE_NAVIGATION_MESSAGE = "Ana menüde en az bir aktif öğe bulunmalıdır.";

export function WebsiteBuilderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedArea = (searchParams.get("alan") || "genel") as WebsiteArea;
  const selectedArea = areas.some((area) => area.key === requestedArea) ? requestedArea : "genel";

  const [staff, setStaff] = useState<StaffMe | null>(null);
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [loadingShell, setLoadingShell] = useState(true);
  const [areaLoading, setAreaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewTokenStatus, setPreviewTokenStatus] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dirtyVersion, setDirtyVersion] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);
  const [history, setHistory] = useState<BuilderHistory>(emptyHistory);

  const [settings, setSettings] = useState<AdminSiteSettings>(defaultSettings);
  const [navigation, setNavigation] = useState<AdminNavigationMenu>(emptyNavigation);
  const [navigationLoaded, setNavigationLoaded] = useState(false);
  const [pages, setPages] = useState<AdminMarketingPage[]>([]);
  const [materials, setMaterials] = useState<AdminFreeMaterialsDocument>(emptyMaterials);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);
  const [staffProfiles, setStaffProfiles] = useState<AdminStaffProfilesDocument>({ version: 1, groups: [] });
  const [successStories, setSuccessStories] = useState<AdminSuccessStoriesDocument>({ version: 1, stories: [] });
  const [revisions, setRevisions] = useState<AdminWebsiteRevision[]>([]);

  const [selectedPageKey, setSelectedPageKey] = useState("");
  const [selectedSectionKey, setSelectedSectionKey] = useState("");
  const [selectedMaterialKey, setSelectedMaterialKey] = useState("");
  const [selectedMaterialSlug, setSelectedMaterialSlug] = useState("");
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>("desktop");
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("sayfalar");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("icerik");
  const [inlineField, setInlineField] = useState<WebsiteSelection["inlineField"]>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  const isSuperAdmin = Boolean(overview?.roleKeys.includes("super-admin"));
  const canReadWebsite = Boolean(isSuperAdmin || overview?.permissionKeys.includes("website.read"));
  const canManageWebsite = Boolean(isSuperAdmin || overview?.permissionKeys.includes("website.manage"));
  const canPublishWebsite = Boolean(isSuperAdmin || overview?.permissionKeys.includes("website.publish"));
  const isBranchAdmin = Boolean(overview?.roleKeys.includes("branch-admin") && !isSuperAdmin);

  const currentPage = pages.find((page) => page.key === selectedPageKey) ?? pages[0] ?? null;
  const currentSection =
    currentPage?.sections.find((section) => section.sectionKey === selectedSectionKey) ??
    currentPage?.sections[0] ??
    null;
  const currentMaterialCategory =
    materials.categories.find((category) => category.key === selectedMaterialKey) ??
    materials.categories[0] ??
    null;
  const currentMaterialItem =
    currentMaterialCategory?.items.find((item) => getMaterialIdentity(item) === selectedMaterialSlug) ??
    currentMaterialCategory?.items[0] ??
    null;

  const selection: WebsiteSelection = {
    selectedArea,
    selectedPageKey: currentPage?.key ?? selectedPageKey,
    selectedSectionKey: currentSection?.sectionKey ?? selectedSectionKey,
    selectedMaterialKey: currentMaterialCategory?.key ?? selectedMaterialKey,
    selectedMaterialSlug: getMaterialIdentity(currentMaterialItem) || selectedMaterialSlug,
    responsiveMode,
    leftPanelMode,
    inspectorTab,
    inlineField,
    selectedSlideId
  };

  const captureSnapshot = useCallback(
    (): BuilderSnapshot => ({
      settings: cloneSnapshot(settings),
      navigation: cloneSnapshot(navigation),
      pages: cloneSnapshot(pages),
      materials: cloneSnapshot(materials),
      staffProfiles: cloneSnapshot(staffProfiles),
      successStories: cloneSnapshot(successStories),
      selectedArea,
      selectedPageKey,
      selectedSectionKey,
      selectedMaterialKey,
      selectedMaterialSlug
    }),
    [
      materials,
      navigation,
      pages,
      selectedArea,
      selectedMaterialKey,
      selectedMaterialSlug,
      selectedPageKey,
      selectedSectionKey,
      settings,
      staffProfiles,
      successStories
    ]
  );

  const rememberMutation = useCallback(() => {
    setHistory((current) => pushHistory(current, captureSnapshot()));
    setDirtyVersion((current) => current + 1);
    setMessage("");
    setError("");
  }, [captureSnapshot]);

  const restoreSnapshot = useCallback((snapshot: BuilderSnapshot) => {
    setSettings(snapshot.settings);
    setNavigation(snapshot.navigation);
    setNavigationLoaded(true);
    setPages(snapshot.pages);
    setMaterials(snapshot.materials);
    setStaffProfiles(snapshot.staffProfiles);
    setSuccessStories(snapshot.successStories);
    setSelectedPageKey(snapshot.selectedPageKey);
    setSelectedSectionKey(snapshot.selectedSectionKey);
    setSelectedMaterialKey(snapshot.selectedMaterialKey);
    setSelectedMaterialSlug(snapshot.selectedMaterialSlug);
    setInlineField(null);
    router.replace(`/web-sitesi?alan=${snapshot.selectedArea}`);
    setDirtyVersion((current) => current + 1);
  }, [router]);

  useEffect(() => {
    let active = true;

    async function loadShell() {
      setLoadingShell(true);
      setError("");
      try {
        const bootstrap = await fetchBootstrapStatus();
        if (!active) {
          return;
        }

        if (bootstrap.requiresBootstrap) {
          router.replace("/kurulum");
          return;
        }

        const [staffResponse, overviewResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview()
        ]);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (isStaffSessionError(requestError)) {
          clearStaffTokens();
          router.replace("/giris");
          return;
        }

        setError(getAdminRequestErrorMessage(requestError, {
          fallback: "Web sitesi yönetimi yüklenemedi."
        }));
      } finally {
        if (active) {
          setLoadingShell(false);
        }
      }
    }

    void loadShell();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (loadingShell || !canReadWebsite) {
      return;
    }

    let active = true;

    async function loadArea() {
      setAreaLoading(true);
      setError("");
      try {
        if (["genel", "marka", "footer"].includes(selectedArea)) {
          setSettings(await fetchAdminSiteSettings());
        } else if (selectedArea === "header") {
          setNavigationLoaded(false);
          const response = await fetchAdminNavigationMenu("primary");
          if (!active) {
            return;
          }
          setNavigation(response);
          setNavigationLoaded(true);
        } else if (selectedArea === "sayfalar") {
          const response = await fetchAdminMarketingPages();
          if (!active) {
            return;
          }
          setPages(response);
          setSelectedPageKey((current) => current || response[0]?.key || "");
          setSelectedSectionKey((current) => current || response[0]?.sections[0]?.sectionKey || "");
        } else if (selectedArea === "ucretsiz-materyaller") {
          setMaterialsLoaded(false);
          const response = await fetchAdminFreeMaterialsDocument();
          if (!active) {
            return;
          }
          setMaterials(response);
          const nextCategory =
            response.categories.find((category) => category.key === selectedMaterialKey) ??
            response.categories[0] ??
            null;
          const nextItem =
            nextCategory?.items.find((item) => getMaterialIdentity(item) === selectedMaterialSlug) ??
            nextCategory?.items[0] ??
            null;
          setSelectedMaterialKey(nextCategory?.key ?? "");
          setSelectedMaterialSlug(getMaterialIdentity(nextItem));
          setMaterialsLoaded(true);
        } else if (selectedArea === "akademik-kadro") {
          setStaffProfiles(await fetchAdminStaffProfilesDocument());
        } else if (selectedArea === "basari-hikayeleri") {
          setSuccessStories(await fetchAdminSuccessStoriesDocument());
        } else if (selectedArea === "gecmis") {
          setRevisions(await fetchAdminWebsiteRevisions());
        }

        if (active) {
          setSavedVersion(dirtyVersion);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (isStaffSessionError(requestError)) {
          clearStaffTokens();
          router.replace("/giris");
          return;
        }

        setError(getAdminRequestErrorMessage(requestError, {
          fallback: "Seçili web sitesi alanı yüklenemedi."
        }));
      } finally {
        if (active) {
          setAreaLoading(false);
        }
      }
    }

    void loadArea();
    return () => {
      active = false;
    };
  }, [canReadWebsite, loadingShell, router, selectedArea]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (dirtyVersion === savedVersion) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirtyVersion, savedVersion]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveCurrent("draft");
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key === "Escape") {
        setInlineField(null);
      }

      if (!isTyping && (event.key === "Delete" || event.key === "Backspace") && currentSection) {
        event.preventDefault();
        deleteSection(currentSection.sectionKey);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function dispatchSelection(command: BuilderCommand) {
    if (command.type === "select-area") {
      router.replace(`/web-sitesi?alan=${command.area}`);
      setInlineField(null);
      return;
    }

    if (command.type === "select-page") {
      setSelectedPageKey(command.pageKey);
      const page = pages.find((entry) => entry.key === command.pageKey);
      setSelectedSectionKey(page?.sections[0]?.sectionKey ?? "");
      setSelectedSlideId(null);
      return;
    }

    if (command.type === "select-section") {
      setSelectedSectionKey(command.sectionKey);
      setInlineField(null);
      return;
    }

    if (command.type === "select-material-category") {
      setSelectedMaterialKey(command.categoryKey);
      const category = materials.categories.find((entry) => entry.key === command.categoryKey);
      setSelectedMaterialSlug(getMaterialIdentity(category?.items[0]));
      return;
    }

    if (command.type === "select-material-item") {
      setSelectedMaterialSlug(command.slug);
      return;
    }

    if (command.type === "set-responsive-mode") {
      setResponsiveMode(command.mode);
      return;
    }

    if (command.type === "set-left-panel-mode") {
      setLeftPanelMode(command.mode);
      return;
    }

    if (command.type === "set-inspector-tab") {
      setInspectorTab(command.tab);
      return;
    }

    if (command.type === "set-inline-field") {
      setInlineField(command.field);
      return;
    }

    if (command.type === "set-slide") {
      setSelectedSlideId(command.slideId);
    }
  }

  function updateSetting<K extends keyof AdminSiteSettings>(key: K, value: AdminSiteSettings[K]) {
    rememberMutation();
    setSettings((current) => {
      const next = { ...current, [key]: value };
      if (key === "canonicalPhone") {
        next.telHref = `tel:${String(value)}`;
      }
      if (key === "supportWhatsappNumber" || key === "whatsappMessage") {
        next.whatsappHref = `https://wa.me/${String(
          key === "supportWhatsappNumber" ? value : next.supportWhatsappNumber
        )}?text=${encodeURIComponent(String(key === "whatsappMessage" ? value : next.whatsappMessage))}`;
      }
      return next;
    });
  }

  function applyLogoToAllFields(sourceKey: keyof AdminSiteSettings) {
    const sourceValue = settings[sourceKey];

    if (typeof sourceValue !== "string" || !sourceValue.trim()) {
      setError("Tüm logo alanlarına uygulanacak geçerli bir görsel seçin.");
      return;
    }

    rememberMutation();
    setSettings((current) => ({
      ...current,
      logoPrimaryUrl: sourceValue,
      logoFooterUrl: sourceValue,
      logoCompactUrl: sourceValue,
      logoMarkUrl: sourceValue,
      logoDarkUrl: sourceValue,
      logoLightUrl: sourceValue
    }));
    setMessage("Seçili görsel uyumlu logo alanlarına kopyalandı. Yayına almak için önce taslak kaydedin, sonra yayınlayın.");
  }

  function updateNavigationItem(index: number, patch: Partial<AdminNavigationItem>) {
    rememberMutation();
    setNavigation((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
  }

  function addNavigationItem() {
    rememberMutation();
    setNavigation((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          itemKey: `menu-${Date.now().toString(36)}`,
          label: "Yeni Menü Öğesi",
          href: "/",
          description: null,
          target: null,
          sortOrder: (current.items.length + 1) * 10,
          isActive: true,
          children: []
        }
      ]
    }));
  }

  function updatePage(patch: Partial<AdminMarketingPage>) {
    if (!currentPage) {
      return;
    }
    rememberMutation();
    setPages((current) =>
      current.map((page) => (page.key === currentPage.key ? { ...page, ...patch } : page))
    );
  }

  function updateSection(patch: Partial<AdminMarketingPageSection>) {
    if (!currentPage || !currentSection) {
      return;
    }
    rememberMutation();
    setPages((current) =>
      current.map((page) =>
        page.key === currentPage.key
          ? {
              ...page,
              sections: page.sections.map((section) =>
                section.sectionKey === currentSection.sectionKey ? { ...section, ...patch } : section
              )
            }
          : page
      )
    );
  }

  function updateSections(mutation: SectionMutation, selectedKey?: string) {
    if (!currentPage) {
      return;
    }
    rememberMutation();
    setPages((current) =>
      current.map((page) =>
        page.key === currentPage.key ? { ...page, sections: resequenceSections(mutation(page.sections)) } : page
      )
    );
    if (selectedKey !== undefined) {
      setSelectedSectionKey(selectedKey);
    }
  }

  function insertWidget(widgetKey: string, afterSectionKey?: string) {
    if (!currentPage) {
      return;
    }

    const newSection = createSectionFromWidget(widgetKey, (currentPage.sections.length + 1) * 10);
    if (!newSection) {
      setError("Bu bileşen seçili alana eklenemez.");
      return;
    }

    updateSections((sections) => {
      const index = afterSectionKey ? sections.findIndex((section) => section.sectionKey === afterSectionKey) : -1;
      const next = [...sections];
      next.splice(index >= 0 ? index + 1 : sections.length, 0, newSection);
      return next;
    }, newSection.sectionKey);
    setInspectorTab("icerik");
  }

  function moveSection(direction: -1 | 1) {
    if (currentSection) {
      moveSectionTo(currentSection.sectionKey, direction);
    }
  }

  function moveSectionTo(sectionKey: string, direction: -1 | 1) {
    updateSections((sections) => {
      const index = sections.findIndex((section) => section.sectionKey === sectionKey);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) {
        return sections;
      }
      const next = [...sections];
      const [section] = next.splice(index, 1);
      next.splice(targetIndex, 0, section);
      return next;
    }, sectionKey);
  }

  function duplicateSection() {
    if (!currentPage || !currentSection) {
      return;
    }

    const definition = getSectionDefinition(currentSection);
    if (!definition.duplicable) {
      setError("Bu sistem bölümü çoğaltılamaz.");
      return;
    }

    const duplicate = duplicatePageSection(currentSection, (currentPage.sections.length + 1) * 10);
    updateSections((sections) => [...sections, duplicate], duplicate.sectionKey);
  }

  function deleteSection(sectionKey: string) {
    const section = currentPage?.sections.find((entry) => entry.sectionKey === sectionKey);
    if (!section) {
      return;
    }

    const definition = getSectionDefinition(section);
    if (!definition.removable) {
      setError("Bu sistem bölümü silinemez; yalnızca görünürlük ve metin ayarları düzenlenebilir.");
      return;
    }

    if (!window.confirm("Bu bölüm taslaktan kaldırılacak. Kaydetmeden önce geri alabilirsiniz. Devam edilsin mi?")) {
      return;
    }

    updateSections((sections) => sections.filter((entry) => entry.sectionKey !== sectionKey), "");
  }

  function toggleSection(sectionKey: string) {
    updateSections((sections) =>
      sections.map((section) =>
        section.sectionKey === sectionKey
          ? { ...section, isActive: !(section.isActive ?? true), publishStatus: section.isActive === false ? "DRAFT" : section.publishStatus }
          : section
      )
    );
  }

  function updateMaterialCategory(patch: Partial<AdminFreeMaterialCategory>) {
    if (!currentMaterialCategory) {
      return;
    }
    const categoryIdentity = currentMaterialCategory.id ?? currentMaterialCategory.key;
    rememberMutation();
    setMaterials((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        (category.id ?? category.key) === categoryIdentity ? { ...category, ...patch } : category
      )
    }));
    if (patch.key) {
      setSelectedMaterialKey(patch.key);
    }
  }

  function updateMaterialItem(patch: Partial<AdminFreeMaterialItem>) {
    if (!currentMaterialCategory || !currentMaterialItem) {
      return;
    }
    const itemIdentity = getMaterialIdentity(currentMaterialItem);
    rememberMutation();
    setMaterials((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.key === currentMaterialCategory.key
          ? {
              ...category,
              items: category.items.map((item) =>
                getMaterialIdentity(item) === itemIdentity ? { ...item, ...patch } : item
              )
            }
          : category
      )
    }));
    if (!currentMaterialItem.id && patch.slug) {
      setSelectedMaterialSlug(patch.slug);
    }
  }

  async function saveMaterialCategoryStatus(publishStatus: "DRAFT" | "PUBLISHED", action: "draft" | "publish") {
    if (!currentMaterialCategory) {
      return;
    }

    if (action === "publish" && !canPublishWebsite) {
      setError("Web sitesini yayınlama yetkiniz bulunmuyor.");
      return;
    }

    const categoryIdentity = currentMaterialCategory.id ?? currentMaterialCategory.key;
    const nextMaterials = {
      ...materials,
      categories: materials.categories.map((category) =>
        (category.id ?? category.key) === categoryIdentity ? { ...category, publishStatus } : category
      )
    };

    await runMaterialMutation(
      () => saveAdminFreeMaterialsDocument(nextMaterials, action),
      action === "publish" ? "Kategori durumu yayınlandı." : "Kategori taslak olarak kaydedildi.",
      currentMaterialCategory.key,
      selectedMaterialSlug
    );
  }

  async function saveMaterialCardStatus(publishStatus: "DRAFT" | "PUBLISHED", action: "draft" | "publish") {
    if (!currentMaterialCategory || !currentMaterialItem) {
      return;
    }

    if (action === "publish" && !canPublishWebsite) {
      setError("Web sitesini yayınlama yetkiniz bulunmuyor.");
      return;
    }

    const itemIdentity = getMaterialIdentity(currentMaterialItem);
    const nextMaterials = {
      ...materials,
      categories: materials.categories.map((category) =>
        category.key === currentMaterialCategory.key
          ? {
              ...category,
              items: category.items.map((item) =>
                getMaterialIdentity(item) === itemIdentity ? { ...item, publishStatus } : item
              )
            }
          : category
      )
    };

    await runMaterialMutation(
      () => saveAdminFreeMaterialsDocument(nextMaterials, action),
      action === "publish" ? "Materyal kartı durumu yayınlandı." : "Materyal kartı taslak olarak kaydedildi.",
      currentMaterialCategory.key,
      itemIdentity
    );
  }

  function addMaterialCategory() {
    const key = `kategori-${Date.now().toString(36)}`;
    rememberMutation();
    setMaterials((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          key,
          label: "Yeni Kategori",
          description: "",
          sortOrder: (current.categories.length + 1) * 10,
          publishStatus: "DRAFT",
          items: []
        }
      ]
    }));
    setSelectedMaterialKey(key);
  }

  function addMaterialCard() {
    if (!currentMaterialCategory) {
      return;
    }
    const slug = `materyal-${Date.now().toString(36)}`;
    rememberMutation();
    setMaterials((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.key === currentMaterialCategory.key
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  slug,
                  title: "Yeni Materyal",
                  itemType: "DOWNLOAD",
                  badgeLabel: "PDF",
                  summary: "",
                  href: null,
                  buttonLabel: "Dosyayı İndir",
                  iconKey: "pdf",
                  tone: "blue",
                  coverImageUrl: null,
                  downloadUrl: null,
                  mediaAssetId: null,
                  displayFilename: null,
                  mimeType: null,
                  fileSizeBytes: null,
                  accessibilityLabel: null,
                  opensInNewTab: false,
                  sortOrder: (category.items.length + 1) * 10,
                  isFeatured: false,
                  publishStatus: "DRAFT",
                  countdownPageSlug: null
                }
              ]
            }
          : category
      )
    }));
    setSelectedMaterialSlug(slug);
  }

  function duplicateMaterialCard() {
    if (!currentMaterialCategory || !currentMaterialItem) {
      return;
    }
    const slug = `${currentMaterialItem.slug || "materyal"}-copy-${Date.now().toString(36)}`;
    rememberMutation();
    setMaterials((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.key === currentMaterialCategory.key
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  ...currentMaterialItem,
                  id: undefined,
                  slug,
                  title: `${currentMaterialItem.title} kopyası`,
                  publishStatus: "DRAFT",
                  sortOrder: (category.items.length + 1) * 10
                }
              ]
            }
          : category
      )
    }));
    setSelectedMaterialSlug(slug);
  }

  function applyMaterialDocument(
    document: AdminFreeMaterialsDocument,
    preferredCategoryKey = selectedMaterialKey,
    preferredItemIdentity = selectedMaterialSlug
  ) {
    const nextCategory =
      document.categories.find((category) => category.key === preferredCategoryKey) ??
      document.categories[0] ??
      null;
    const nextItem =
      nextCategory?.items.find((item) => getMaterialIdentity(item) === preferredItemIdentity) ??
      nextCategory?.items[0] ??
      null;

    setMaterials(document);
    setMaterialsLoaded(true);
    setSelectedMaterialKey(nextCategory?.key ?? "");
    setSelectedMaterialSlug(getMaterialIdentity(nextItem));
  }

  async function runMaterialMutation(
    mutation: () => Promise<AdminFreeMaterialsDocument>,
    successMessage: string,
    preferredCategoryKey = selectedMaterialKey,
    preferredItemIdentity = selectedMaterialSlug
  ) {
    if (!materialsLoaded || areaLoading) {
      setError("Ücretsiz materyaller tamamen yüklenmeden işlem yapılamaz.");
      return;
    }

    if (!canManageWebsite) {
      setError("Ücretsiz materyal yönetimi için yetkiniz bulunmuyor.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await mutation();
      applyMaterialDocument(response, preferredCategoryKey, preferredItemIdentity);
      setSavedVersion(dirtyVersion);
      setLastSavedAt(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
      setMessage(successMessage);
    } catch (requestError) {
      if (isStaffSessionError(requestError)) {
        clearStaffTokens();
        router.replace("/giris");
        return;
      }
      setError(getAdminRequestErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function archiveMaterialCategory() {
    if (!currentMaterialCategory) {
      return;
    }

    await runMaterialMutation(
      () => archiveAdminMaterialCategory(currentMaterialCategory.key),
      "Kategori arşivlendi.",
      currentMaterialCategory.key,
      selectedMaterialSlug
    );
  }

  async function restoreMaterialCategory() {
    if (!currentMaterialCategory) {
      return;
    }

    await runMaterialMutation(
      () => restoreAdminMaterialCategory(currentMaterialCategory.key),
      "Kategori arşivden çıkarıldı.",
      currentMaterialCategory.key,
      selectedMaterialSlug
    );
  }

  async function deleteMaterialCategory() {
    if (!currentMaterialCategory) {
      return;
    }

    const typed = window.prompt(
      `"${currentMaterialCategory.label}" kategorisi kalıcı olarak silinecek. Devam etmek için SİL yazın.`
    );
    if (typed !== "SİL") {
      return;
    }

    await runMaterialMutation(
      () => deleteAdminMaterialCategory(currentMaterialCategory.key),
      "Kategori kalıcı olarak silindi.",
      currentMaterialCategory.key,
      selectedMaterialSlug
    );
  }

  async function archiveMaterialCard() {
    if (!currentMaterialCategory || !currentMaterialItem) {
      return;
    }

    const identity = getMaterialIdentity(currentMaterialItem);
    if (!identity) {
      return;
    }

    await runMaterialMutation(
      () => archiveAdminMaterialCard(identity),
      "Materyal kartı arşivlendi.",
      currentMaterialCategory.key,
      identity
    );
  }

  async function restoreMaterialCard() {
    if (!currentMaterialCategory || !currentMaterialItem) {
      return;
    }

    const identity = getMaterialIdentity(currentMaterialItem);
    if (!identity) {
      return;
    }

    await runMaterialMutation(
      () => restoreAdminMaterialCard(identity),
      "Materyal kartı arşivden çıkarıldı.",
      currentMaterialCategory.key,
      identity
    );
  }

  async function deleteMaterialCard() {
    if (!currentMaterialCategory || !currentMaterialItem) {
      return;
    }

    const identity = getMaterialIdentity(currentMaterialItem);
    if (!identity) {
      return;
    }

    const typed = window.prompt(
      `"${currentMaterialItem.title}" kartı kalıcı olarak silinecek. Devam etmek için SİL yazın.`
    );
    if (typed !== "SİL") {
      return;
    }

    await runMaterialMutation(
      () => deleteAdminMaterialCard(identity),
      "Materyal kartı kalıcı olarak silindi.",
      currentMaterialCategory.key,
      identity
    );
  }

  async function moveMaterialCard(direction: -1 | 1) {
    if (!currentMaterialCategory || !currentMaterialItem) {
      return;
    }

    const identity = getMaterialIdentity(currentMaterialItem);
    if (!identity) {
      return;
    }

    if (!currentMaterialItem.id) {
      const index = currentMaterialCategory.items.findIndex((item) => getMaterialIdentity(item) === identity);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= currentMaterialCategory.items.length) {
        return;
      }

      rememberMutation();
      setMaterials((current) => ({
        ...current,
        categories: current.categories.map((category) => {
          if (category.key !== currentMaterialCategory.key) {
            return category;
          }

          const items = [...category.items];
          const [item] = items.splice(index, 1);
          items.splice(targetIndex, 0, item);
          return {
            ...category,
            items: items.map((entry, entryIndex) => ({ ...entry, sortOrder: (entryIndex + 1) * 10 }))
          };
        })
      }));
      setSelectedMaterialSlug(identity);
      return;
    }

    await runMaterialMutation(
      () => moveAdminMaterialCard(identity, direction),
      "Materyal kartı sıralaması güncellendi.",
      currentMaterialCategory.key,
      identity
    );
  }

  async function saveCurrent(action: "draft" | "publish") {
    if (action === "publish" && !canPublishWebsite) {
      setError("Web sitesini yayınlama yetkiniz bulunmuyor.");
      return;
    }

    if (action === "draft" && !canManageWebsite) {
      setError("Web sitesi taslağını kaydetme yetkiniz bulunmuyor.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (["genel", "marka", "footer"].includes(selectedArea)) {
        const response = action === "publish" ? await publishAdminSiteSettings(settings) : await saveAdminSiteSettings(settings);
        setSettings(response);
      } else if (selectedArea === "header") {
        if (!navigationLoaded || areaLoading) {
          setError("Ana menü yüklenmeden kaydedilemez.");
          return;
        }

        if (!hasActiveNavigationItem(navigation)) {
          setError(EMPTY_ACTIVE_NAVIGATION_MESSAGE);
          return;
        }

        setNavigation(await saveAdminNavigationMenu("primary", omitNavigationResponseFields(navigation), action));
      } else if (selectedArea === "sayfalar" && currentPage) {
        const response = await saveAdminMarketingPage(currentPage.key, omitMarketingPageResponseFields(currentPage), action);
        setPages((current) => current.map((page) => (page.key === response.key ? response : page)));
      } else if (selectedArea === "ucretsiz-materyaller") {
        if (!materialsLoaded || areaLoading) {
          setError("Ücretsiz materyaller tamamen yüklenmeden kaydedilemez.");
          return;
        }

        const response = await saveAdminFreeMaterialsDocument(materials, action);
        applyMaterialDocument(response);
      } else if (selectedArea === "akademik-kadro") {
        setStaffProfiles(await saveAdminStaffProfilesDocument(staffProfiles, action));
      } else if (selectedArea === "basari-hikayeleri") {
        setSuccessStories(await saveAdminSuccessStoriesDocument(successStories, action));
      }

      const nextVersion = dirtyVersion;
      setSavedVersion(nextVersion);
      setLastSavedAt(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
      setMessage(action === "publish" ? "Yayınlandı. İlgili public rotalar yenilenecek." : "Taslak kaydedildi.");
    } catch (requestError) {
      if (isStaffSessionError(requestError)) {
        clearStaffTokens();
        router.replace("/giris");
        return;
      }
      setError(getAdminRequestErrorMessage(requestError, {
        fallback:
          "Bu içerik başka bir kullanıcı tarafından güncellendi. Son sürümü yenileyerek değişikliklerinizi karşılaştırın."
      }));
    } finally {
      setSaving(false);
    }
  }

  async function requestPreviewToken() {
    try {
      const response = await fetchAdminPreviewToken();
      setPreviewTokenStatus(`Önizleme oturumu hazır. Süre sonu: ${new Date(response.expiresAt * 1000).toLocaleTimeString("tr-TR")}`);
    } catch (requestError) {
      setError(getAdminRequestErrorMessage(requestError));
    }
  }

  async function loadRevisions() {
    try {
      setRevisions(await fetchAdminWebsiteRevisions());
    } catch (requestError) {
      setError(getAdminRequestErrorMessage(requestError));
    }
  }

  async function restoreRevision(revisionId: string) {
    setSaving(true);
    try {
      await restoreAdminWebsiteRevision(revisionId);
      setMessage("Revizyon geri yüklendi.");
      await loadRevisions();
    } catch (requestError) {
      setError(getAdminRequestErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function undo() {
    const result = undoHistory(history, captureSnapshot());
    if (!result) {
      return;
    }
    setHistory(result.history);
    restoreSnapshot(result.snapshot);
  }

  function redo() {
    const result = redoHistory(history, captureSnapshot());
    if (!result) {
      return;
    }
    setHistory(result.history);
    restoreSnapshot(result.snapshot);
  }

  const setStaffProfilesWithHistory: Dispatch<SetStateAction<AdminStaffProfilesDocument>> = (value) => {
    rememberMutation();
    setStaffProfiles((current) => (typeof value === "function" ? value(current) : value));
  };

  const setSuccessStoriesWithHistory: Dispatch<SetStateAction<AdminSuccessStoriesDocument>> = (value) => {
    rememberMutation();
    setSuccessStories((current) => (typeof value === "function" ? value(current) : value));
  };

  const actions = useMemo<BuilderActions>(
    () => ({
      dispatchSelection,
      updateSetting,
      applyLogoToAllFields,
      updateNavigationItem,
      addNavigationItem,
      updatePage,
      updateSection,
      updateSections,
      insertWidget,
      moveSection,
      moveSectionTo,
      duplicateSection,
      deleteSection,
      toggleSection,
      updateMaterialCategory,
      updateMaterialItem,
      saveMaterialCategoryStatus,
      saveMaterialCardStatus,
      addMaterialCategory,
      addMaterialCard,
      duplicateMaterialCard,
      archiveMaterialCategory,
      restoreMaterialCategory,
      deleteMaterialCategory,
      archiveMaterialCard,
      restoreMaterialCard,
      deleteMaterialCard,
      moveMaterialCard,
      saveCurrent,
      requestPreviewToken,
      loadRevisions,
      restoreRevision,
      undo,
      redo
    }),
    [
      currentMaterialCategory,
      currentMaterialItem,
      currentPage,
      currentSection,
      dirtyVersion,
      history,
      materials,
      materialsLoaded,
      navigation,
      pages,
      selectedArea,
      settings,
      staffProfiles,
      successStories
    ]
  );

  if (loadingShell) {
    return <div className="admin-empty-state">Web sitesi yönetimi yükleniyor...</div>;
  }

  if (!canReadWebsite) {
    return (
      <main className="admin-page-shell">
        <section className="admin-empty-state">
          <h1>Web sitesi yönetimi</h1>
          <p>Bu alan için yetkiniz bulunmuyor.</p>
        </section>
      </main>
    );
  }

  return (
    <WebsiteBuilderShell
      areas={areas}
      data={{ settings, navigation, pages, materials, staffProfiles, successStories, revisions }}
      selection={selection}
      status={{
        isDirty: dirtyVersion !== savedVersion,
        saving,
        areaLoading,
        materialsLoaded,
        lastSavedAt,
        message,
        error,
        previewTokenStatus
      }}
      canManage={canManageWebsite}
      canPublish={canPublishWebsite}
      canUndo={history.past.length > 0}
      canRedo={history.future.length > 0}
      isBranchAdmin={isBranchAdmin}
      currentPage={currentPage}
      currentSection={currentSection}
      currentMaterialCategory={currentMaterialCategory}
      currentMaterialItem={currentMaterialItem}
      setStaffProfiles={setStaffProfilesWithHistory}
      setSuccessStories={setSuccessStoriesWithHistory}
      actions={actions}
    />
  );
}

function getMaterialIdentity(item?: AdminFreeMaterialItem | null) {
  return item?.id || item?.slug || "";
}

function omitNavigationResponseFields(menu: AdminNavigationMenu): Omit<AdminNavigationMenu, "id" | "key"> {
  return {
    name: menu.name,
    location: menu.location,
    description: menu.description ?? null,
    isActive: menu.isActive,
    version: menu.version,
    items: menu.items.map(omitNavigationItemResponseFields)
  };
}

function hasActiveNavigationItem(menu: AdminNavigationMenu) {
  if (menu.isActive === false) {
    return true;
  }

  return menu.items.some((item) =>
    item.isActive !== false &&
    Boolean(item.itemKey.trim() && item.label.trim() && item.href.trim())
  );
}

function omitNavigationItemResponseFields(item: AdminNavigationItem): AdminNavigationItem {
  return {
    itemKey: item.itemKey,
    label: item.label,
    href: item.href,
    description: item.description ?? null,
    target: item.target ?? null,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    children: item.children.map(omitNavigationItemResponseFields)
  };
}

function omitMarketingPageResponseFields(page: AdminMarketingPage): Omit<AdminMarketingPage, "id" | "key"> {
  return {
    slug: page.slug,
    title: page.title,
    excerpt: page.excerpt ?? null,
    description: page.description ?? null,
    pageType: page.pageType,
    publishStatus: page.publishStatus,
    seoTitle: page.seoTitle ?? null,
    seoDescription: page.seoDescription ?? null,
    heroImageUrl: page.heroImageUrl ?? null,
    metadata: page.metadata ?? null,
    version: page.version,
    sections: page.sections.map((section) => ({
      sectionKey: section.sectionKey,
      eyebrow: section.eyebrow ?? null,
      title: section.title ?? null,
      body: section.body ?? null,
      variantKey: section.variantKey ?? null,
      payload: section.payload ?? null,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
      publishStatus: section.publishStatus
    }))
  };
}
