"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  clearStaffTokens,
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
  restoreAdminWebsiteRevision,
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

type WebsiteArea =
  | "genel"
  | "marka"
  | "header"
  | "footer"
  | "sayfalar"
  | "ucretsiz-materyaller"
  | "akademik-kadro"
  | "basari-hikayeleri"
  | "medya"
  | "gecmis";

type ResponsiveMode = "desktop" | "tablet" | "mobile";
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

const pageInventory = [
  { label: "Home page", route: "/", kind: "Editable content section" },
  { label: "Paketlerimiz", route: "/paketlerimiz", kind: "Dynamic application module" },
  { label: "Package detail", route: "/paketlerimiz/[slug]", kind: "System-required locked section" },
  { label: "Checkout", route: "/checkout/[slug]", kind: "System-required locked section" },
  { label: "Hakkımızda", route: "/hakkimizda", kind: "Editable content section" },
  { label: "Ücretsiz Materyaller", route: "/ucretsiz-materyaller", kind: "Editable content section" },
  { label: "PDF dokümanlar", route: "/ucretsiz-materyaller/pdf-dokumanlar", kind: "Editable content section" },
  { label: "Sayaçlar", route: "/ucretsiz-materyaller/*-kac-gun-kaldi", kind: "Dynamic application module" },
  { label: "Puan hesapla", route: "/ucretsiz-materyaller/puan-hesapla", kind: "Dynamic application module" },
  { label: "YKS Atlas", route: "/ucretsiz-materyaller/yks-atlas", kind: "Dynamic application module" },
  { label: "Maarif Simülasyonları", route: "/ucretsiz-materyaller/maarif-simulasyonlari", kind: "Dynamic application module" },
  { label: "Akademik Kadro", route: "/akademik-kadro", kind: "Editable reusable/global section" },
  { label: "Başarı Hikayeleri", route: "/basarilarimiz", kind: "Editable reusable/global section" },
  { label: "Yüz Yüze Koçluk", route: "/yuz-yuze-kocluk", kind: "Editable content section" },
  { label: "Giriş ve öğrenci hesabı", route: "/giris", kind: "System-required locked section" }
];

const widgetGroups = [
  "Section",
  "Container",
  "Heading",
  "Rich text",
  "Image",
  "Video",
  "Button",
  "Card grid",
  "Gallery",
  "Testimonial",
  "Team/staff grid",
  "FAQ",
  "Site logo",
  "Navigation menu",
  "Footer links",
  "Contact card",
  "WhatsApp button",
  "Package-directory section",
  "Free-material directory",
  "Download card",
  "Countdown card",
  "Calculator card"
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
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<AdminSiteSettings>(defaultSettings);
  const [navigation, setNavigation] = useState<AdminNavigationMenu>(emptyNavigation);
  const [pages, setPages] = useState<AdminMarketingPage[]>([]);
  const [materials, setMaterials] = useState<AdminFreeMaterialsDocument>(emptyMaterials);
  const [staffProfiles, setStaffProfiles] = useState<AdminStaffProfilesDocument>({ version: 1, groups: [] });
  const [successStories, setSuccessStories] = useState<AdminSuccessStoriesDocument>({ version: 1, stories: [] });
  const [revisions, setRevisions] = useState<AdminWebsiteRevision[]>([]);
  const [selectedPageKey, setSelectedPageKey] = useState("");
  const [selectedSectionKey, setSelectedSectionKey] = useState("");
  const [selectedMaterialKey, setSelectedMaterialKey] = useState("");
  const [selectedMaterialSlug, setSelectedMaterialSlug] = useState("");
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>("desktop");
  const [snapshot, setSnapshot] = useState("");
  const [previewTokenStatus, setPreviewTokenStatus] = useState("");

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
    currentMaterialCategory?.items.find((item) => item.slug === selectedMaterialSlug) ??
    currentMaterialCategory?.items[0] ??
    null;

  const draftSignature = useMemo(
    () =>
      JSON.stringify({
        selectedArea,
        settings,
        navigation,
        pages,
        materials,
        staffProfiles,
        successStories
      }),
    [selectedArea, settings, navigation, pages, materials, staffProfiles, successStories]
  );
  const isDirty = Boolean(snapshot && snapshot !== draftSignature);

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

        setError(
          getAdminRequestErrorMessage(requestError, {
            forbidden: "Web sitesi yönetimi için yetkiniz bulunmuyor.",
            fallback: "Web sitesi yönetimi yüklenemedi."
          })
        );
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
    if (!overview || !canReadWebsite) {
      return;
    }

    let active = true;

    async function loadArea() {
      setAreaLoading(true);
      setError("");
      setSuccess("");

      try {
        if (["genel", "marka", "footer"].includes(selectedArea)) {
          const response = await fetchAdminSiteSettings();
          if (!active) {
            return;
          }
          setSettings(response);
        } else if (selectedArea === "header") {
          const response = await fetchAdminNavigationMenu("primary");
          if (!active) {
            return;
          }
          setNavigation(response);
        } else if (selectedArea === "sayfalar") {
          const response = await fetchAdminMarketingPages();
          if (!active) {
            return;
          }
          setPages(response);
          setSelectedPageKey((current) => current || response[0]?.key || "");
          setSelectedSectionKey((current) => current || response[0]?.sections[0]?.sectionKey || "");
        } else if (selectedArea === "ucretsiz-materyaller") {
          const response = await fetchAdminFreeMaterialsDocument();
          if (!active) {
            return;
          }
          setMaterials(response);
          setSelectedMaterialKey((current) => current || response.categories[0]?.key || "");
          setSelectedMaterialSlug((current) => current || response.categories[0]?.items[0]?.slug || "");
        } else if (selectedArea === "akademik-kadro") {
          const response = await fetchAdminStaffProfilesDocument();
          if (!active) {
            return;
          }
          setStaffProfiles(response);
        } else if (selectedArea === "basari-hikayeleri") {
          const response = await fetchAdminSuccessStoriesDocument();
          if (!active) {
            return;
          }
          setSuccessStories(response);
        } else if (selectedArea === "gecmis") {
          const response = await fetchAdminWebsiteRevisions();
          if (!active) {
            return;
          }
          setRevisions(response);
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

        setError(
          getAdminRequestErrorMessage(requestError, {
            forbidden: "Web sitesi yönetimi için yetkiniz bulunmuyor.",
            server: "Web sitesi içerik servisine ulaşılamadı.",
            fallback: "Web sitesi içeriği yüklenemedi."
          })
        );
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
  }, [canReadWebsite, overview, router, selectedArea]);

  useEffect(() => {
    if (!areaLoading) {
      setSnapshot(draftSignature);
    }
  }, [areaLoading]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function changeArea(area: WebsiteArea) {
    if (area === "medya") {
      router.push("/medya");
      return;
    }

    if (isDirty && !window.confirm("Kaydedilmemiş değişiklikler var. Devam ederseniz bu ekrandaki taslak kaybolabilir.")) {
      return;
    }

    router.push(`/web-sitesi?alan=${area}`);
  }

  function updateSetting<K extends keyof AdminSiteSettings>(key: K, value: AdminSiteSettings[K]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
      telHref: key === "canonicalPhone" ? `tel:${String(value)}` : current.telHref,
      whatsappHref:
        key === "supportWhatsappNumber" || key === "whatsappMessage"
          ? `https://wa.me/${key === "supportWhatsappNumber" ? String(value) : current.supportWhatsappNumber}?text=${encodeURIComponent(
              key === "whatsappMessage" ? String(value) : current.whatsappMessage
            )}`
          : current.whatsappHref
    }));
  }

  function updateNavigationItem(index: number, patch: Partial<AdminNavigationItem>) {
    setNavigation((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    }));
  }

  function addNavigationItem() {
    setNavigation((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          itemKey: `menu-${current.items.length + 1}`,
          label: "Yeni Bağlantı",
          href: "/",
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

    setPages((current) =>
      current.map((page) => (page.key === currentPage.key ? { ...page, ...patch } : page))
    );
  }

  function updateSection(patch: Partial<AdminMarketingPageSection>) {
    if (!currentPage || !currentSection) {
      return;
    }

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

  function moveSection(direction: -1 | 1) {
    if (!currentPage || !currentSection) {
      return;
    }

    setPages((current) =>
      current.map((page) => {
        if (page.key !== currentPage.key) {
          return page;
        }

        const sections = [...page.sections];
        const index = sections.findIndex((section) => section.sectionKey === currentSection.sectionKey);
        const targetIndex = index + direction;

        if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) {
          return page;
        }

        const [section] = sections.splice(index, 1);
        sections.splice(targetIndex, 0, section);
        return {
          ...page,
          sections: sections.map((entry, entryIndex) => ({
            ...entry,
            sortOrder: (entryIndex + 1) * 10
          }))
        };
      })
    );
  }

  function duplicateSection() {
    if (!currentPage || !currentSection) {
      return;
    }

    const sectionKey = `${currentSection.sectionKey}-copy-${Date.now().toString(36)}`;
    setPages((current) =>
      current.map((page) =>
        page.key === currentPage.key
          ? {
              ...page,
              sections: [
                ...page.sections,
                {
                  ...currentSection,
                  id: undefined,
                  sectionKey,
                  title: `${currentSection.title ?? "Bölüm"} kopyası`,
                  sortOrder: (page.sections.length + 1) * 10
                }
              ]
            }
          : page
      )
    );
    setSelectedSectionKey(sectionKey);
  }

  function updateMaterialCategory(patch: Partial<AdminFreeMaterialCategory>) {
    if (!currentMaterialCategory) {
      return;
    }

    setMaterials((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.key === currentMaterialCategory.key ? { ...category, ...patch } : category
      )
    }));
  }

  function updateMaterialItem(patch: Partial<AdminFreeMaterialItem>) {
    if (!currentMaterialCategory || !currentMaterialItem) {
      return;
    }

    setMaterials((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.key === currentMaterialCategory.key
          ? {
              ...category,
              items: category.items.map((item) =>
                item.slug === currentMaterialItem.slug ? { ...item, ...patch } : item
              )
            }
          : category
      )
    }));
  }

  function addMaterialCategory() {
    const key = `kategori-${Date.now().toString(36)}`;
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
    setSelectedMaterialSlug("");
  }

  function addMaterialCard() {
    if (!currentMaterialCategory) {
      return;
    }

    const slug = `${currentMaterialCategory.key}-kart-${Date.now().toString(36)}`;
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
                  itemType: "INTERNAL_PAGE",
                  badgeLabel: "Ücretsiz",
                  summary: "",
                  href: "/ucretsiz-materyaller",
                  buttonLabel: "İçeriği Aç",
                  iconKey: "document",
                  tone: "blue",
                  opensInNewTab: false,
                  sortOrder: (category.items.length + 1) * 10,
                  isFeatured: false,
                  publishStatus: "DRAFT"
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

    const slug = `${currentMaterialItem.slug ?? "materyal"}-copy-${Date.now().toString(36)}`;
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

  async function saveCurrent(action: "draft" | "publish") {
    if (action === "publish" && !canPublishWebsite) {
      setError("Yayınlama yetkiniz bulunmuyor.");
      return;
    }

    if (!canManageWebsite) {
      setError("Web sitesi yönetimi için yetkiniz bulunmuyor.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let nextSettings = settings;
      let nextNavigation = navigation;
      let nextPages = pages;
      let nextMaterials = materials;
      let nextStaffProfiles = staffProfiles;
      let nextSuccessStories = successStories;

      if (["genel", "marka", "footer"].includes(selectedArea)) {
        const response =
          action === "publish" ? await publishAdminSiteSettings(settings) : await saveAdminSiteSettings(settings);
        setSettings(response);
        nextSettings = response;
      } else if (selectedArea === "header") {
        const response = await saveAdminNavigationMenu("primary", omitNavigationResponseFields(navigation), action);
        setNavigation(response);
        nextNavigation = response;
      } else if (selectedArea === "sayfalar" && currentPage) {
        const response = await saveAdminMarketingPage(currentPage.key, omitMarketingPageResponseFields(currentPage), action);
        nextPages = pages.map((page) => (page.key === response.key ? response : page));
        setPages(nextPages);
      } else if (selectedArea === "ucretsiz-materyaller") {
        const response = await saveAdminFreeMaterialsDocument(materials, action);
        setMaterials(response);
        nextMaterials = response;
      } else if (selectedArea === "akademik-kadro") {
        const response = await saveAdminStaffProfilesDocument(staffProfiles, action);
        setStaffProfiles(response);
        nextStaffProfiles = response;
      } else if (selectedArea === "basari-hikayeleri") {
        const response = await saveAdminSuccessStoriesDocument(successStories, action);
        setSuccessStories(response);
        nextSuccessStories = response;
      }

      setSuccess(action === "publish" ? "Yayınlandı. İlgili public rotalar yenilenecek." : "Taslak kaydedildi.");
      setSnapshot(
        JSON.stringify({
          selectedArea,
          settings: nextSettings,
          navigation: nextNavigation,
          pages: nextPages,
          materials: nextMaterials,
          staffProfiles: nextStaffProfiles,
          successStories: nextSuccessStories
        })
      );
    } catch (requestError) {
      if (isStaffSessionError(requestError)) {
        clearStaffTokens();
        router.replace("/giris");
        return;
      }

      setError(
        getAdminRequestErrorMessage(requestError, {
          forbidden: "Web sitesi yönetimi için yetkiniz bulunmuyor.",
          server: "İşlem tamamlanamadı.",
          fallback: "İşlem tamamlanamadı."
        })
      );
    } finally {
      setSaving(false);
    }
  }

  async function requestPreviewToken() {
    setPreviewTokenStatus("");
    try {
      const response = await fetchAdminPreviewToken();
      setPreviewTokenStatus(`Önizleme oturumu hazır. Geçerlilik: ${new Date(response.expiresAt * 1000).toLocaleTimeString("tr-TR")}`);
    } catch (requestError) {
      setPreviewTokenStatus(
        getAdminRequestErrorMessage(requestError, {
          forbidden: "Önizleme için yetkiniz bulunmuyor.",
          fallback: "Önizleme oturumu oluşturulamadı."
        })
      );
    }
  }

  async function loadRevisions() {
    setAreaLoading(true);
    try {
      setRevisions(await fetchAdminWebsiteRevisions());
      setSuccess("Revizyon geçmişi yüklendi.");
    } catch (requestError) {
      setError(getAdminRequestErrorMessage(requestError));
    } finally {
      setAreaLoading(false);
    }
  }

  async function restoreRevision(revisionId: string) {
    if (!window.confirm("Bu revizyonu yayınlanan içerik olarak geri yüklemek istiyor musunuz?")) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await restoreAdminWebsiteRevision(revisionId);
      setSuccess("Revizyon geri yüklendi.");
      await loadRevisions();
    } catch (requestError) {
      setError(getAdminRequestErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

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
    <main className="admin-page-shell admin-website-builder">
      <section className="admin-page-hero admin-website-builder__hero">
        <div>
          <span className="admin-page-eyebrow">Web Sitesi</span>
          <h1>Web Sitesi Yönetimi</h1>
          <p>
            Global ayarlar, sayfalar, footer, ücretsiz materyaller ve revizyon akışı tek ekranda yönetilir.
          </p>
          {isBranchAdmin ? (
            <p className="admin-website-builder__global-warning" role="status">
              Bu alanda yapılan değişiklikler tüm genel web sitesini etkiler.
            </p>
          ) : null}
        </div>
        <div className="admin-website-builder__toolbar" role="toolbar" aria-label="Web sitesi işlem çubuğu">
          <select
            value={selectedArea}
            onChange={(event) => changeArea(event.target.value as WebsiteArea)}
            aria-label="Yönetim alanı"
          >
            {areas.map((area) => (
              <option key={area.key} value={area.key}>
                {area.label}
              </option>
            ))}
          </select>
          <button className="admin-button--ghost" type="button" disabled={saving || !canManageWebsite} onClick={() => void saveCurrent("draft")}>
            {saving ? "Kaydediliyor..." : "Taslağı Kaydet"}
          </button>
          <button className="admin-button" type="button" disabled={saving || !canPublishWebsite} onClick={() => void saveCurrent("publish")}>
            Yayınla
          </button>
          <button className="admin-button--ghost" type="button" onClick={() => void requestPreviewToken()}>
            Önizle
          </button>
          <button className="admin-button--ghost" type="button" disabled>
            Geri Al
          </button>
          <button className="admin-button--ghost" type="button" disabled>
            İleri Al
          </button>
          <button className="admin-button--ghost" type="button" onClick={() => changeArea("gecmis")}>
            Geçmiş
          </button>
          <Link className="admin-button--ghost" href="/" target="_blank">
            Canlı Sayfa
          </Link>
        </div>
      </section>

      {error ? <div className="admin-alert admin-alert--danger" role="alert">{error}</div> : null}
      {success ? <div className="admin-alert admin-alert--success" role="status">{success}</div> : null}
      {previewTokenStatus ? <div className="admin-alert" role="status">{previewTokenStatus}</div> : null}

      <section className="admin-website-builder__layout" data-mode={responsiveMode}>
        <aside className="admin-website-builder__left" aria-label="Sayfa ve widget gezgini">
          <h2>Sayfa Ağacı</h2>
          <div className="admin-website-builder__area-list" role="tablist" aria-label="Web sitesi yönetim alanları">
            {areas.map((area) => (
              <button
                key={area.key}
                type="button"
                role="tab"
                aria-selected={selectedArea === area.key}
                className="admin-website-builder__area"
                data-active={selectedArea === area.key}
                onClick={() => changeArea(area.key)}
              >
                <strong>{area.label}</strong>
                <span>{area.description}</span>
              </button>
            ))}
          </div>
          <h2>Widget Kütüphanesi</h2>
          <div className="admin-website-builder__widgets">
            {widgetGroups.map((widget) => (
              <span key={widget}>{widget}</span>
            ))}
          </div>
        </aside>

        <section className="admin-website-builder__canvas" aria-label="Canlı önizleme alanı">
          <div className="admin-website-builder__canvas-toolbar">
            <strong>{areas.find((area) => area.key === selectedArea)?.label}</strong>
            <div className="admin-website-builder__segments" role="tablist" aria-label="Önizleme genişliği">
              {(["desktop", "tablet", "mobile"] as ResponsiveMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-selected={responsiveMode === mode}
                  data-active={responsiveMode === mode}
                  onClick={() => setResponsiveMode(mode)}
                >
                  {mode === "desktop" ? "Desktop" : mode === "tablet" ? "Tablet" : "Mobil"}
                </button>
              ))}
            </div>
          </div>

          {areaLoading ? <div className="admin-empty-state">Alan yükleniyor...</div> : null}
          {!areaLoading ? (
            <div className="admin-website-builder__preview-frame" data-mode={responsiveMode}>
              {renderPreview(selectedArea, {
                settings,
                navigation,
                currentPage,
                currentSection,
                materials,
                currentMaterialCategory,
                currentMaterialItem,
                staffProfiles,
                successStories
              })}
            </div>
          ) : null}
        </section>

        <aside className="admin-website-builder__right" aria-label="Seçili bölüm ayarları">
          <h2>Ayarlar</h2>
          {selectedArea === "genel" ? (
            <GeneralSettingsPanel settings={settings} updateSetting={updateSetting} />
          ) : null}
          {selectedArea === "marka" ? (
            <BrandSettingsPanel settings={settings} updateSetting={updateSetting} />
          ) : null}
          {selectedArea === "footer" ? (
            <FooterSettingsPanel settings={settings} setSettings={setSettings} updateSetting={updateSetting} />
          ) : null}
          {selectedArea === "header" ? (
            <NavigationPanel navigation={navigation} updateItem={updateNavigationItem} addItem={addNavigationItem} />
          ) : null}
          {selectedArea === "sayfalar" ? (
            <PagesPanel
              pages={pages}
              selectedPageKey={selectedPageKey}
              selectedSectionKey={selectedSectionKey}
              setSelectedPageKey={setSelectedPageKey}
              setSelectedSectionKey={setSelectedSectionKey}
              currentPage={currentPage}
              currentSection={currentSection}
              updatePage={updatePage}
              updateSection={updateSection}
              moveSection={moveSection}
              duplicateSection={duplicateSection}
            />
          ) : null}
          {selectedArea === "ucretsiz-materyaller" ? (
            <FreeMaterialsPanel
              materials={materials}
              selectedCategory={currentMaterialCategory}
              selectedItem={currentMaterialItem}
              setSelectedMaterialKey={setSelectedMaterialKey}
              setSelectedMaterialSlug={setSelectedMaterialSlug}
              updateCategory={updateMaterialCategory}
              updateItem={updateMaterialItem}
              addCategory={addMaterialCategory}
              addCard={addMaterialCard}
              duplicateCard={duplicateMaterialCard}
            />
          ) : null}
          {selectedArea === "akademik-kadro" ? (
            <StaffPanel document={staffProfiles} setDocument={setStaffProfiles} />
          ) : null}
          {selectedArea === "basari-hikayeleri" ? (
            <SuccessStoriesPanel document={successStories} setDocument={setSuccessStories} />
          ) : null}
          {selectedArea === "gecmis" ? (
            <RevisionsPanel revisions={revisions} loadRevisions={loadRevisions} restoreRevision={restoreRevision} saving={saving} />
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function GeneralSettingsPanel({
  settings,
  updateSetting
}: {
  settings: AdminSiteSettings;
  updateSetting: <K extends keyof AdminSiteSettings>(key: K, value: AdminSiteSettings[K]) => void;
}) {
  return (
    <div className="admin-website-builder__form">
      <label>
        Site adı
        <input value={settings.siteName} onChange={(event) => updateSetting("siteName", event.target.value)} />
      </label>
      <label>
        Varsayılan başlık
        <input value={settings.siteTitle} onChange={(event) => updateSetting("siteTitle", event.target.value)} />
      </label>
      <label>
        Kısa açıklama
        <textarea value={settings.tagline ?? ""} onChange={(event) => updateSetting("tagline", event.target.value)} />
      </label>
      <details open>
        <summary>SEO</summary>
        <label>
          SEO başlığı
          <input value={settings.defaultSeoTitle ?? ""} onChange={(event) => updateSetting("defaultSeoTitle", event.target.value)} />
        </label>
        <label>
          SEO açıklaması
          <textarea value={settings.defaultSeoDescription ?? ""} onChange={(event) => updateSetting("defaultSeoDescription", event.target.value)} />
        </label>
      </details>
    </div>
  );
}

function BrandSettingsPanel({
  settings,
  updateSetting
}: {
  settings: AdminSiteSettings;
  updateSetting: <K extends keyof AdminSiteSettings>(key: K, value: AdminSiteSettings[K]) => void;
}) {
  return (
    <div className="admin-website-builder__form">
      {[
        ["logoPrimaryUrl", "Header ana logo"],
        ["logoFooterUrl", "Footer logo"],
        ["logoCompactUrl", "Kompakt/mobil logo"],
        ["logoDarkUrl", "Koyu zemin logo"],
        ["logoLightUrl", "Açık zemin logo"],
        ["faviconUrl", "Favicon"],
        ["defaultSocialImageUrl", "Sosyal paylaşım görseli"]
      ].map(([key, label]) => (
        <label key={key}>
          {label}
          <input value={String(settings[key as keyof AdminSiteSettings] ?? "")} onChange={(event) => updateSetting(key as keyof AdminSiteSettings, event.target.value as never)} />
        </label>
      ))}
      <label>
        Logo alt metni
        <input value={settings.logoAltText ?? ""} onChange={(event) => updateSetting("logoAltText", event.target.value)} />
      </label>
      <p className="admin-website-builder__hint">Medya Kütüphanesi URL veya güvenli site içi dosya yolu kullanılabilir.</p>
    </div>
  );
}

function FooterSettingsPanel({
  settings,
  setSettings,
  updateSetting
}: {
  settings: AdminSiteSettings;
  setSettings: Dispatch<SetStateAction<AdminSiteSettings>>;
  updateSetting: <K extends keyof AdminSiteSettings>(key: K, value: AdminSiteSettings[K]) => void;
}) {
  return (
    <div className="admin-website-builder__form">
      <label>
        Görünen telefon
        <input value={settings.displayPhone} onChange={(event) => updateSetting("displayPhone", event.target.value)} />
      </label>
      <label>
        E.164 telefon
        <input value={settings.canonicalPhone} onChange={(event) => updateSetting("canonicalPhone", event.target.value)} />
      </label>
      <label>
        WhatsApp numarası
        <input value={settings.supportWhatsappNumber} onChange={(event) => updateSetting("supportWhatsappNumber", event.target.value)} />
      </label>
      <label>
        WhatsApp mesajı
        <textarea value={settings.whatsappMessage} onChange={(event) => updateSetting("whatsappMessage", event.target.value)} />
      </label>
      <div className="admin-website-builder__preview-links">
        <a href={settings.telHref}>Telefon bağlantısı: {settings.telHref}</a>
        <a href={settings.whatsappHref} target="_blank" rel="noreferrer">WhatsApp testini aç</a>
      </div>
      <label>
        Adres
        <textarea value={settings.address} onChange={(event) => updateSetting("address", event.target.value)} />
      </label>
      <label>
        E-posta
        <input value={settings.publicContactEmail ?? ""} onChange={(event) => updateSetting("publicContactEmail", event.target.value)} />
      </label>
      <label>
        Footer marka açıklaması
        <textarea value={settings.footerBrandDescription} onChange={(event) => updateSetting("footerBrandDescription", event.target.value)} />
      </label>
      <h3>Hızlı Erişim</h3>
      {settings.footerQuickLinks.map((link, index) => (
        <div className="admin-website-builder__row" key={`${link.href}-${index}`}>
          <input
            aria-label="Bağlantı etiketi"
            value={link.label}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                footerQuickLinks: current.footerQuickLinks.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, label: event.target.value } : entry
                )
              }))
            }
          />
          <input
            aria-label="Bağlantı rotası"
            value={link.href}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                footerQuickLinks: current.footerQuickLinks.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, href: event.target.value } : entry
                )
              }))
            }
          />
        </div>
      ))}
    </div>
  );
}

function NavigationPanel({
  navigation,
  updateItem,
  addItem
}: {
  navigation: AdminNavigationMenu;
  updateItem: (index: number, patch: Partial<AdminNavigationItem>) => void;
  addItem: () => void;
}) {
  return (
    <div className="admin-website-builder__form">
      <button className="admin-button--ghost" type="button" onClick={addItem}>Yeni Menü Öğesi</button>
      {navigation.items.map((item, index) => (
        <fieldset key={`${item.itemKey}-${index}`}>
          <legend>{item.label || "Menü öğesi"}</legend>
          <label>
            Etiket
            <input value={item.label} onChange={(event) => updateItem(index, { label: event.target.value })} />
          </label>
          <label>
            Hedef
            <input value={item.href} onChange={(event) => updateItem(index, { href: event.target.value })} />
          </label>
          <label>
            Sıra
            <input type="number" value={item.sortOrder ?? 0} onChange={(event) => updateItem(index, { sortOrder: Number(event.target.value) })} />
          </label>
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={item.isActive ?? true} onChange={(event) => updateItem(index, { isActive: event.target.checked })} />
            Aktif
          </label>
        </fieldset>
      ))}
    </div>
  );
}

function PagesPanel({
  pages,
  selectedPageKey,
  selectedSectionKey,
  setSelectedPageKey,
  setSelectedSectionKey,
  currentPage,
  currentSection,
  updatePage,
  updateSection,
  moveSection,
  duplicateSection
}: {
  pages: AdminMarketingPage[];
  selectedPageKey: string;
  selectedSectionKey: string;
  setSelectedPageKey: (key: string) => void;
  setSelectedSectionKey: (key: string) => void;
  currentPage: AdminMarketingPage | null;
  currentSection: AdminMarketingPageSection | null;
  updatePage: (patch: Partial<AdminMarketingPage>) => void;
  updateSection: (patch: Partial<AdminMarketingPageSection>) => void;
  moveSection: (direction: -1 | 1) => void;
  duplicateSection: () => void;
}) {
  return (
    <div className="admin-website-builder__form">
      <label>
        Sayfa
        <select value={selectedPageKey} onChange={(event) => setSelectedPageKey(event.target.value)}>
          {pages.map((page) => (
            <option key={page.key} value={page.key}>{page.title}</option>
          ))}
        </select>
      </label>
      {currentPage ? (
        <>
          <label>
            Sayfa başlığı
            <input value={currentPage.title} onChange={(event) => updatePage({ title: event.target.value })} />
          </label>
          <label>
            Slug
            <input value={currentPage.slug} onChange={(event) => updatePage({ slug: event.target.value })} />
          </label>
          <label>
            Özet
            <textarea value={currentPage.description ?? ""} onChange={(event) => updatePage({ description: event.target.value })} />
          </label>
          <label>
            Bölüm
            <select value={selectedSectionKey} onChange={(event) => setSelectedSectionKey(event.target.value)}>
              {currentPage.sections.map((section) => (
                <option key={section.sectionKey} value={section.sectionKey}>{section.title || section.sectionKey}</option>
              ))}
            </select>
          </label>
        </>
      ) : null}
      {currentSection ? (
        <fieldset>
          <legend>Seçili Bölüm</legend>
          <div className="admin-website-builder__row">
            <button className="admin-button--compact" type="button" onClick={() => moveSection(-1)}>Yukarı</button>
            <button className="admin-button--compact" type="button" onClick={() => moveSection(1)}>Aşağı</button>
            <button className="admin-button--compact" type="button" onClick={duplicateSection}>Çoğalt</button>
          </div>
          <label>
            Kaş
            <input value={currentSection.eyebrow ?? ""} onChange={(event) => updateSection({ eyebrow: event.target.value })} />
          </label>
          <label>
            Başlık
            <input value={currentSection.title ?? ""} onChange={(event) => updateSection({ title: event.target.value })} />
          </label>
          <label>
            Metin
            <textarea value={currentSection.body ?? ""} onChange={(event) => updateSection({ body: event.target.value })} />
          </label>
          <label>
            Widget tipi
            <input value={currentSection.variantKey ?? ""} onChange={(event) => updateSection({ variantKey: event.target.value })} />
          </label>
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={currentSection.isActive ?? true} onChange={(event) => updateSection({ isActive: event.target.checked })} />
            Aktif
          </label>
        </fieldset>
      ) : null}
    </div>
  );
}

function FreeMaterialsPanel({
  materials,
  selectedCategory,
  selectedItem,
  setSelectedMaterialKey,
  setSelectedMaterialSlug,
  updateCategory,
  updateItem,
  addCategory,
  addCard,
  duplicateCard
}: {
  materials: AdminFreeMaterialsDocument;
  selectedCategory: AdminFreeMaterialCategory | null;
  selectedItem: AdminFreeMaterialItem | null;
  setSelectedMaterialKey: (key: string) => void;
  setSelectedMaterialSlug: (slug: string) => void;
  updateCategory: (patch: Partial<AdminFreeMaterialCategory>) => void;
  updateItem: (patch: Partial<AdminFreeMaterialItem>) => void;
  addCategory: () => void;
  addCard: () => void;
  duplicateCard: () => void;
}) {
  return (
    <div className="admin-website-builder__form">
      <div className="admin-website-builder__row">
        <button className="admin-button--compact" type="button" onClick={addCategory}>Yeni Kategori</button>
        <button className="admin-button--compact" type="button" onClick={addCard} disabled={!selectedCategory}>Yeni Kart</button>
        <button className="admin-button--compact" type="button" onClick={duplicateCard} disabled={!selectedItem}>Çoğalt</button>
      </div>
      <label>
        Kategori
        <select value={selectedCategory?.key ?? ""} onChange={(event) => setSelectedMaterialKey(event.target.value)}>
          {materials.categories.map((category) => (
            <option key={category.key} value={category.key}>{category.label}</option>
          ))}
        </select>
      </label>
      {selectedCategory ? (
        <>
          <label>
            Kategori adı
            <input value={selectedCategory.label} onChange={(event) => updateCategory({ label: event.target.value })} />
          </label>
          <label>
            Kategori açıklaması
            <textarea value={selectedCategory.description ?? ""} onChange={(event) => updateCategory({ description: event.target.value })} />
          </label>
          <label>
            Kart
            <select value={selectedItem?.slug ?? ""} onChange={(event) => setSelectedMaterialSlug(event.target.value)}>
              {selectedCategory.items.map((item) => (
                <option key={item.slug ?? item.title} value={item.slug ?? ""}>{item.title}</option>
              ))}
            </select>
          </label>
        </>
      ) : null}
      {selectedItem ? (
        <fieldset>
          <legend>Materyal Kartı</legend>
          <label>
            Başlık
            <input value={selectedItem.title} onChange={(event) => updateItem({ title: event.target.value })} />
          </label>
          <label>
            Özet
            <textarea value={selectedItem.summary ?? ""} onChange={(event) => updateItem({ summary: event.target.value })} />
          </label>
          <label>
            Tür
            <select value={selectedItem.itemType} onChange={(event) => updateItem({ itemType: event.target.value })}>
              {["DOWNLOAD", "INTERNAL_PAGE", "EXTERNAL_LINK", "COUNTDOWN", "CALCULATOR", "BLOG", "SIMULATION", "SYSTEM_TOOL", "PDF", "LINK", "TOOL"].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Site içi/harici hedef
            <input value={selectedItem.href ?? ""} onChange={(event) => updateItem({ href: event.target.value })} />
          </label>
          <label>
            İndirme URL
            <input value={selectedItem.downloadUrl ?? ""} onChange={(event) => updateItem({ downloadUrl: event.target.value })} />
          </label>
          <label>
            Medya Asset ID
            <input value={selectedItem.mediaAssetId ?? ""} onChange={(event) => updateItem({ mediaAssetId: event.target.value })} />
          </label>
          <label>
            Dosya adı
            <input value={selectedItem.displayFilename ?? ""} onChange={(event) => updateItem({ displayFilename: event.target.value })} />
          </label>
          <label>
            MIME tipi
            <input value={selectedItem.mimeType ?? ""} onChange={(event) => updateItem({ mimeType: event.target.value })} />
          </label>
          <label>
            Buton etiketi
            <input value={selectedItem.buttonLabel ?? ""} onChange={(event) => updateItem({ buttonLabel: event.target.value })} />
          </label>
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={selectedItem.publishStatus === "PUBLISHED"} onChange={(event) => updateItem({ publishStatus: event.target.checked ? "PUBLISHED" : "DRAFT" })} />
            Yayında
          </label>
        </fieldset>
      ) : null}
    </div>
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
        <label>
          İlk grup başlığı
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
        <label>
          İlk hikaye başlığı
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

function RevisionsPanel({
  revisions,
  loadRevisions,
  restoreRevision,
  saving
}: {
  revisions: AdminWebsiteRevision[];
  loadRevisions: () => Promise<void>;
  restoreRevision: (revisionId: string) => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="admin-website-builder__form">
      <button className="admin-button--ghost" type="button" onClick={() => void loadRevisions()}>Revizyonları Yenile</button>
      <div className="admin-website-builder__revision-list">
        {revisions.map((revision) => (
          <article key={revision.id}>
            <strong>{revision.entityType}</strong>
            <span>{revision.action}</span>
            <small>{new Date(revision.createdAt).toLocaleString("tr-TR")}</small>
            <p>{revision.summary}</p>
            <button className="admin-button--compact" type="button" disabled={saving} onClick={() => void restoreRevision(revision.id)}>
              Geri Yükle
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function renderPreview(
  area: WebsiteArea,
  data: {
    settings: AdminSiteSettings;
    navigation: AdminNavigationMenu;
    currentPage: AdminMarketingPage | null;
    currentSection: AdminMarketingPageSection | null;
    materials: AdminFreeMaterialsDocument;
    currentMaterialCategory: AdminFreeMaterialCategory | null;
    currentMaterialItem: AdminFreeMaterialItem | null;
    staffProfiles: AdminStaffProfilesDocument;
    successStories: AdminSuccessStoriesDocument;
  }
) {
  if (["genel", "marka", "footer"].includes(area)) {
    return <FooterPreview settings={data.settings} />;
  }

  if (area === "header") {
    return (
      <div className="admin-website-builder__site-preview">
        <div className="admin-website-builder__preview-nav">
          <Image src="/branding/ega-logo-official.png" alt="Eğitim Gurmesi Akademi" width={96} height={51} />
          <nav aria-label="Önizleme menüsü">
            {data.navigation.items.map((item) => (
              <a key={item.itemKey} href={item.href}>{item.label}</a>
            ))}
          </nav>
        </div>
      </div>
    );
  }

  if (area === "sayfalar" && data.currentPage) {
    return (
      <div className="admin-website-builder__site-preview">
        <h2>{data.currentPage.title}</h2>
        <p>{data.currentPage.description}</p>
        <div className="admin-website-builder__section-stack">
          {data.currentPage.sections.map((section) => (
            <article key={section.sectionKey} data-active={section.sectionKey === data.currentSection?.sectionKey}>
              <span>{section.variantKey || "Section"}</span>
              <h3>{section.title || section.sectionKey}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (area === "ucretsiz-materyaller") {
    return (
      <div className="admin-website-builder__site-preview">
        <h2>Ücretsiz Materyaller</h2>
        <div className="admin-website-builder__material-grid">
          {(data.currentMaterialCategory?.items ?? []).map((item) => (
            <MaterialPreviewCard key={item.slug ?? item.title} item={item} active={item.slug === data.currentMaterialItem?.slug} />
          ))}
        </div>
      </div>
    );
  }

  if (area === "akademik-kadro") {
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

  if (area === "basari-hikayeleri") {
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

  if (area === "gecmis") {
    return (
      <div className="admin-website-builder__site-preview">
        <h2>Taslaklar ve Geçmiş</h2>
        <p>Revizyonlar sağ panelden yüklenir ve yetkili kullanıcı tarafından geri alınabilir.</p>
      </div>
    );
  }

  return (
    <div className="admin-website-builder__site-preview">
      <h2>Sayfa ve Widget Envanteri</h2>
      <div className="admin-website-builder__inventory">
        {pageInventory.map((item) => (
          <article key={item.route}>
            <strong>{item.label}</strong>
            <span>{item.route}</span>
            <small>{item.kind}</small>
          </article>
        ))}
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
