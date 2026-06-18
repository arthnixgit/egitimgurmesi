"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearStaffTokens,
  fetchAdminFreeMaterialsDocument,
  fetchAdminMarketingPages,
  fetchAdminNavigationMenu,
  fetchAdminStaffProfilesDocument,
  fetchAdminSuccessStoriesDocument,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  getAdminRequestErrorMessage,
  isStaffSessionError,
  logoutStaff,
  saveAdminFreeMaterialsDocument,
  saveAdminMarketingPage,
  saveAdminNavigationMenu,
  saveAdminStaffProfilesDocument,
  saveAdminSuccessStoriesDocument,
  type AdminFreeMaterialsDocument,
  type AdminFreeMaterialCategory,
  type AdminFreeMaterialItem,
  type AdminCountdownPage,
  type AdminMarketingPage,
  type AdminMarketingPageSection,
  type AdminNavigationItem,
  type AdminNavigationMenu,
  type AdminStaffProfile,
  type AdminStaffProfileGroup,
  type AdminStaffProfilesDocument,
  type AdminSuccessStory,
  type AdminSuccessStoriesDocument
} from "../../lib/auth-client";
import {
  fetchAdminMedia,
  uploadAdminMedia,
  type AdminMediaAsset,
  type AdminMediaKind
} from "../../lib/media-client";

type AdminTabKey =
  | "navigation"
  | "marketing-pages"
  | "academic-staff"
  | "success-stories"
  | "free-materials";

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;

const tabMeta: Record<
  AdminTabKey,
  {
    label: string;
    description: string;
    guide: string;
  }
> = {
  navigation: {
    label: "Navigasyon",
    description: "Üst menü ve açılır menüler",
    guide: "Üst menü ve yönlendirmeleri düzenleyin."
  },
  "marketing-pages": {
    label: "Sayfa Bölümleri",
    description: "Ana sayfa, paketler, hakkımızda ve banner alanları",
    guide: "Sayfa bölümlerini ve yayın metinlerini düzenleyin."
  },
  "academic-staff": {
    label: "Akademik Kadro",
    description: "Koç ve öğretmen grupları",
    guide: "Profil, fotoğraf ve tanıtım videolarını yönetin."
  },
  "success-stories": {
    label: "Başarı Hikayeleri",
    description: "Öğrenci başarı kayıtları",
    guide: "Başarı hikayelerini vitrine hazırlayın."
  },
  "free-materials": {
    label: "Ücretsiz Materyaller",
    description: "Araçlar, linkler, PDF ve geri sayım sayfaları",
    guide: "Materyalleri, bağlantıları ve sayaçları düzenleyin."
  }
};

type ShowcaseTone = "amber" | "teal" | "blue";
type ShowcaseMediaType = "IMAGE" | "VIDEO";

type ShowcaseEditorSlide = {
  id: string;
  label: string;
  title: string;
  description: string;
  tone: ShowcaseTone;
  mediaType: ShowcaseMediaType;
  mediaUrl: string;
  mediaPosterUrl: string;
  mediaAlt: string;
};

type PackagesRibbonEditorState = {
  isActive: boolean;
  title: string;
};

type MediaPickerRequest = {
  title: string;
  description?: string;
  kinds: AdminMediaKind[];
  onSelect: (asset: AdminMediaAsset) => void;
};

type SavedContentSnapshots = {
  navigation: string;
  marketingPages: Record<string, string>;
  staff: string;
  success: string;
  freeMaterials: string;
};

const MENU_SETTINGS_KEY = "__menu-settings";
const PAGE_OVERVIEW_KEY = "__page-overview";
const FREE_MATERIAL_CATEGORIES_KEY = "categories";
const FREE_MATERIAL_COUNTDOWNS_KEY = "countdowns";

const defaultShowcaseSlides: ShowcaseEditorSlide[] = [
  {
    id: "showcase-plan",
    label: "Kayıttan Sonraki Akış",
    title: "Kayıttan sonra düzenli çalışma ritmi başlar",
    description: "Ders planı, haftalık görevler ve ilerleme takibi tek panelde birleşir.",
    tone: "amber",
    mediaType: "IMAGE",
    mediaUrl: "",
    mediaPosterUrl: "",
    mediaAlt: "Planlı çalışma yapan öğrenciler"
  },
  {
    id: "showcase-coach",
    label: "Koçluk Tanıtımı",
    title: "Koçluk süreci sade ve güven veren bir akışla ilerler",
    description: "Öğrenci, paketi ve görüşme sürecini net biçimde görerek başvuru yapar.",
    tone: "teal",
    mediaType: "IMAGE",
    mediaUrl: "",
    mediaPosterUrl: "",
    mediaAlt: "Koçluk görüşmesi yapan eğitmen ve öğrenci"
  },
  {
    id: "showcase-library",
    label: "Video Kütüphanesi",
    title: "Video dersler öğrencinin panelinde düzenli şekilde açılır",
    description: "Öğrenci modüllere, tekrar listelerine ve ders videolarına tek panelden ulaşır.",
    tone: "blue",
    mediaType: "IMAGE",
    mediaUrl: "",
    mediaPosterUrl: "",
    mediaAlt: "Video derslerini dijital panelde inceleyen öğrenci"
  }
];

export default function AdminContentStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTabKey>("navigation");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mediaAssets, setMediaAssets] = useState<AdminMediaAsset[]>([]);
  const [mediaPickerRequest, setMediaPickerRequest] = useState<MediaPickerRequest | null>(null);
  const [mediaPickerLoading, setMediaPickerLoading] = useState(false);
  const [mediaPickerError, setMediaPickerError] = useState("");
  const [validationTouched, setValidationTouched] = useState(false);
  const [savedSnapshots, setSavedSnapshots] = useState<SavedContentSnapshots>({
    navigation: "",
    marketingPages: {},
    staff: "",
    success: "",
    freeMaterials: ""
  });

  const [navigationMenu, setNavigationMenu] = useState<AdminNavigationMenu | null>(null);
  const [selectedNavigationItemKey, setSelectedNavigationItemKey] = useState(MENU_SETTINGS_KEY);

  const [marketingPages, setMarketingPages] = useState<AdminMarketingPage[]>([]);
  const [selectedMarketingKey, setSelectedMarketingKey] = useState("");
  const [selectedMarketingSectionKey, setSelectedMarketingSectionKey] = useState(PAGE_OVERVIEW_KEY);

  const [staffDocument, setStaffDocument] = useState<AdminStaffProfilesDocument | null>(null);
  const [selectedStaffGroupKey, setSelectedStaffGroupKey] = useState("");
  const [selectedStaffProfileKey, setSelectedStaffProfileKey] = useState("");

  const [successDocument, setSuccessDocument] = useState<AdminSuccessStoriesDocument | null>(null);
  const [selectedSuccessStoryKey, setSelectedSuccessStoryKey] = useState("");

  const [freeMaterialsDocument, setFreeMaterialsDocument] = useState<AdminFreeMaterialsDocument | null>(null);
  const [selectedFreeMaterialMode, setSelectedFreeMaterialMode] = useState<
    typeof FREE_MATERIAL_CATEGORIES_KEY | typeof FREE_MATERIAL_COUNTDOWNS_KEY
  >(FREE_MATERIAL_CATEGORIES_KEY);
  const [selectedFreeMaterialCategoryKey, setSelectedFreeMaterialCategoryKey] = useState("");
  const [selectedFreeMaterialItemKey, setSelectedFreeMaterialItemKey] = useState("");
  const [selectedCountdownPageSlug, setSelectedCountdownPageSlug] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setSuccess("");

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

        const [menuResult, pagesResult, staffDocResult, successDocResult, freeDocResult] = await Promise.allSettled([
          fetchAdminNavigationMenu("primary"),
          fetchAdminMarketingPages(),
          fetchAdminStaffProfilesDocument(),
          fetchAdminSuccessStoriesDocument(),
          fetchAdminFreeMaterialsDocument()
        ]);

        if (!active) {
          return;
        }

        const contentFailures = [menuResult, pagesResult, staffDocResult, successDocResult, freeDocResult].filter(
          (result): result is PromiseRejectedResult => result.status === "rejected"
        );
        const sessionFailure = contentFailures.find((result) => isStaffSessionError(result.reason));

        if (sessionFailure) {
          throw sessionFailure.reason;
        }

        const menu = menuResult.status === "fulfilled" ? menuResult.value : null;
        const pages = pagesResult.status === "fulfilled" ? pagesResult.value : [];
        const staffDoc = staffDocResult.status === "fulfilled" ? staffDocResult.value : null;
        const successDoc = successDocResult.status === "fulfilled" ? successDocResult.value : null;
        const freeDoc = freeDocResult.status === "fulfilled" ? freeDocResult.value : null;

        setNavigationMenu(menu);
        setSelectedNavigationItemKey(MENU_SETTINGS_KEY);

        setMarketingPages(pages);
        const initialMarketingPage = pages[0] ?? null;
        setSelectedMarketingKey(initialMarketingPage?.key ?? "");
        setSelectedMarketingSectionKey(PAGE_OVERVIEW_KEY);

        setStaffDocument(staffDoc);
        setSelectedStaffGroupKey(staffDoc?.groups[0]?.key ?? "");
        setSelectedStaffProfileKey(staffDoc?.groups[0]?.profiles[0] ? getStaffProfileKey(staffDoc.groups[0].profiles[0], 0) : "");

        setSuccessDocument(successDoc);
        setSelectedSuccessStoryKey(successDoc?.stories[0] ? getSuccessStoryKey(successDoc.stories[0], 0) : "");

        setFreeMaterialsDocument(freeDoc);
        setSelectedFreeMaterialCategoryKey(freeDoc?.categories[0]?.key ?? "");
        setSelectedFreeMaterialItemKey(freeDoc?.categories[0]?.items[0] ? getFreeMaterialItemKey(freeDoc.categories[0].items[0], 0) : "");
        setSelectedCountdownPageSlug(freeDoc?.countdownPages[0]?.slug ?? "");
        setSavedSnapshots({
          navigation: serializeContentSnapshot(menu),
          marketingPages: createMarketingPageSnapshots(pages),
          staff: serializeContentSnapshot(staffDoc),
          success: serializeContentSnapshot(successDoc),
          freeMaterials: serializeContentSnapshot(freeDoc)
        });

        if (contentFailures.length > 0) {
          setError("Bazı içerik kayıtları alınamadı. Açılan bölümleri düzenlemeye devam edebilirsiniz.");
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
            forbidden: "Bu alan için yetkiniz bulunmuyor.",
            notFound: "İçerik kaydı bulunamadı.",
            server: "İçerik servisine ulaşılamadı.",
            fallback: "İçerik stüdyosu verileri yüklenemedi."
          })
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const selectedMarketingPage = useMemo(
    () => marketingPages.find((page) => page.key === selectedMarketingKey) ?? null,
    [marketingPages, selectedMarketingKey]
  );

  const selectedMarketingShowcaseSlides = useMemo(
    () => getMarketingPageShowcaseSlides(selectedMarketingPage),
    [selectedMarketingPage]
  );
  const selectedPackagesRibbon = useMemo(
    () => getPackagesRibbonState(selectedMarketingPage),
    [selectedMarketingPage]
  );

  const selectedFreeMaterialItem = useMemo(
    () =>
      getSelectedFreeMaterialItem(
        freeMaterialsDocument,
        selectedFreeMaterialCategoryKey,
        selectedFreeMaterialItemKey
      ),
    [freeMaterialsDocument, selectedFreeMaterialCategoryKey, selectedFreeMaterialItemKey]
  );

  const activeValidationErrors = useMemo(
    () =>
      validateActiveContent({
        activeTab,
        navigationMenu,
        selectedMarketingPage,
        staffDocument,
        successDocument,
        freeMaterialsDocument
      }),
    [activeTab, freeMaterialsDocument, navigationMenu, selectedMarketingPage, staffDocument, successDocument]
  );

  const hasUnsavedChanges = useMemo(
    () =>
      getHasUnsavedChanges({
        activeTab,
        navigationMenu,
        selectedMarketingPage,
        staffDocument,
        successDocument,
        freeMaterialsDocument,
        savedSnapshots
      }),
    [
      activeTab,
      freeMaterialsDocument,
      navigationMenu,
      savedSnapshots,
      selectedMarketingPage,
      staffDocument,
      successDocument
    ]
  );

  const previewHref = useMemo(
    () =>
      getContentPreviewHref({
        activeTab,
        selectedMarketingPage,
        selectedFreeMaterialMode,
        selectedCountdownPageSlug,
        selectedFreeMaterialItem
      }),
    [
      activeTab,
      selectedCountdownPageSlug,
      selectedFreeMaterialItem,
      selectedFreeMaterialMode,
      selectedMarketingPage
    ]
  );

  const visibleValidationErrors = validationTouched ? activeValidationErrors : [];

  useEffect(() => {
    setValidationTouched(false);
  }, [
    activeTab,
    selectedMarketingKey,
    selectedMarketingSectionKey,
    selectedNavigationItemKey,
    selectedStaffGroupKey,
    selectedStaffProfileKey,
    selectedSuccessStoryKey,
    selectedFreeMaterialMode,
    selectedFreeMaterialCategoryKey,
    selectedFreeMaterialItemKey,
    selectedCountdownPageSlug
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!selectedMarketingPage) {
      return;
    }

    const hasSelectedSection =
      selectedMarketingSectionKey === PAGE_OVERVIEW_KEY ||
      selectedMarketingPage.sections.some((section) => section.sectionKey === selectedMarketingSectionKey);

    if (!hasSelectedSection) {
      setSelectedMarketingSectionKey(PAGE_OVERVIEW_KEY);
    }
  }, [selectedMarketingPage, selectedMarketingSectionKey]);

  useEffect(() => {
    if (!staffDocument?.groups.length) {
      return;
    }

    const selectedGroup =
      staffDocument.groups.find((group) => group.key === selectedStaffGroupKey) ?? staffDocument.groups[0];

    if (selectedGroup.key !== selectedStaffGroupKey) {
      setSelectedStaffGroupKey(selectedGroup.key);
      return;
    }

    const hasSelectedProfile = selectedGroup.profiles.some(
      (profile, index) => getStaffProfileKey(profile, index) === selectedStaffProfileKey
    );

    if (!hasSelectedProfile) {
      setSelectedStaffProfileKey(
        selectedGroup.profiles[0] ? getStaffProfileKey(selectedGroup.profiles[0], 0) : ""
      );
    }
  }, [staffDocument, selectedStaffGroupKey, selectedStaffProfileKey]);

  useEffect(() => {
    if (!successDocument?.stories.length) {
      return;
    }

    const hasSelectedStory = successDocument.stories.some(
      (story, index) => getSuccessStoryKey(story, index) === selectedSuccessStoryKey
    );

    if (!hasSelectedStory) {
      setSelectedSuccessStoryKey(getSuccessStoryKey(successDocument.stories[0], 0));
    }
  }, [successDocument, selectedSuccessStoryKey]);

  useEffect(() => {
    if (!freeMaterialsDocument) {
      return;
    }

    const selectedCategory =
      freeMaterialsDocument.categories.find((category) => category.key === selectedFreeMaterialCategoryKey) ??
      freeMaterialsDocument.categories[0];

    if (selectedCategory && selectedCategory.key !== selectedFreeMaterialCategoryKey) {
      setSelectedFreeMaterialCategoryKey(selectedCategory.key);
      return;
    }

    if (selectedCategory) {
      const hasSelectedItem = selectedCategory.items.some(
        (item, index) => getFreeMaterialItemKey(item, index) === selectedFreeMaterialItemKey
      );

      if (!hasSelectedItem) {
        setSelectedFreeMaterialItemKey(
          selectedCategory.items[0] ? getFreeMaterialItemKey(selectedCategory.items[0], 0) : ""
        );
      }
    }

    if (
      freeMaterialsDocument.countdownPages.length > 0 &&
      !freeMaterialsDocument.countdownPages.some((page) => page.slug === selectedCountdownPageSlug)
    ) {
      setSelectedCountdownPageSlug(freeMaterialsDocument.countdownPages[0].slug);
    }
  }, [
    freeMaterialsDocument,
    selectedCountdownPageSlug,
    selectedFreeMaterialCategoryKey,
    selectedFreeMaterialItemKey
  ]);

  const contentStats = useMemo(
    () => ({
      navigationItems: countNavigationItems(navigationMenu?.items ?? []),
      marketingPages: marketingPages.length,
      staffProfiles: staffDocument?.groups.reduce((total, group) => total + group.profiles.length, 0) ?? 0,
      successStories: successDocument?.stories.length ?? 0,
      freeMaterialItems:
        freeMaterialsDocument?.categories.reduce((total, category) => total + category.items.length, 0) ?? 0
    }),
    [freeMaterialsDocument, marketingPages.length, navigationMenu?.items, staffDocument, successDocument]
  );

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  async function loadMediaAssets() {
    setMediaPickerLoading(true);
    setMediaPickerError("");

    try {
      setMediaAssets(await fetchAdminMedia());
    } catch (requestError) {
      setMediaPickerError(
        requestError instanceof Error ? requestError.message : "Medya kütüphanesi yüklenemedi."
      );
    } finally {
      setMediaPickerLoading(false);
    }
  }

  function openMediaPicker(request: MediaPickerRequest) {
    setMediaPickerRequest(request);
    setMediaPickerError("");

    if (!mediaAssets.length && !mediaPickerLoading) {
      void loadMediaAssets();
    }
  }

  function selectMediaAsset(asset: AdminMediaAsset) {
    mediaPickerRequest?.onSelect(asset);
    setMediaPickerRequest(null);
  }

  function replaceSelectedMarketingPage(nextPage: AdminMarketingPage) {
    const nextPages = marketingPages.map((page) => (page.key === nextPage.key ? nextPage : page));
    setMarketingPages(nextPages);
  }

  function updateSelectedMarketingPage(
    updater: (currentPage: AdminMarketingPage) => AdminMarketingPage
  ) {
    if (!selectedMarketingPage) {
      return;
    }

    replaceSelectedMarketingPage(updater(selectedMarketingPage));
  }

  function updateHomepageShowcaseSlide(
    slideIndex: number,
    field: keyof ShowcaseEditorSlide,
    value: string
  ) {
    updateSelectedMarketingPage((page) =>
      withUpdatedShowcaseSlides(page, (slides) =>
        slides.map((slide, index) =>
          index === slideIndex ? { ...slide, [field]: value } : slide
        )
      )
    );
  }

  async function handleHomepageShowcaseUpload(
    slideIndex: number,
    field: "mediaUrl" | "mediaPosterUrl",
    file: File | null
  ) {
    if (!file) {
      return;
    }

    const slide = selectedMarketingShowcaseSlides[slideIndex];
    const mediaKind = field === "mediaPosterUrl" || slide?.mediaType !== "VIDEO" ? "IMAGE" : "VIDEO";
    const asset = await uploadAdminMedia({
      file,
      kind: mediaKind,
      title: `${slide?.label ?? "Vitrin"} ${field === "mediaPosterUrl" ? "poster" : "medya"}`,
      altText: slide?.mediaAlt
    });
    const assetUrl = asset.url ?? asset.publicUrl ?? "";

    if (!assetUrl) {
      setError("Medya yüklendi ancak kullanılabilir URL üretilemedi.");
      return;
    }

    updateHomepageShowcaseSlide(slideIndex, field, assetUrl);
    setSuccess("Medya kütüphanesine yüklendi ve slayta bağlandı.");
  }

  function updatePackagesRibbon(field: keyof PackagesRibbonEditorState, value: string | boolean) {
    updateSelectedMarketingPage((page) => withUpdatedPackagesRibbon(page, field, value));
  }

  function updateNavigationMenu(updater: (currentMenu: AdminNavigationMenu) => AdminNavigationMenu) {
    if (!navigationMenu) {
      return;
    }

    const nextMenu = updater(navigationMenu);
    setNavigationMenu(nextMenu);
  }

  function updateStaffDocument(updater: (currentDocument: AdminStaffProfilesDocument) => AdminStaffProfilesDocument) {
    if (!staffDocument) {
      return;
    }

    const nextDocument = updater(staffDocument);
    setStaffDocument(nextDocument);
  }

  function updateSuccessDocument(updater: (currentDocument: AdminSuccessStoriesDocument) => AdminSuccessStoriesDocument) {
    if (!successDocument) {
      return;
    }

    const nextDocument = updater(successDocument);
    setSuccessDocument(nextDocument);
  }

  function updateFreeMaterialsDocument(updater: (currentDocument: AdminFreeMaterialsDocument) => AdminFreeMaterialsDocument) {
    if (!freeMaterialsDocument) {
      return;
    }

    const nextDocument = updater(freeMaterialsDocument);
    setFreeMaterialsDocument(nextDocument);
  }

  async function handleReload() {
    router.refresh();
    window.location.reload();
  }

  function handleValidateCurrent() {
    setValidationTouched(true);
    setSuccess("");

    if (activeValidationErrors.length > 0) {
      setError("Eksik veya hatalı alanlar var. Kaydetmeden önce listedeki alanları düzeltin.");
      return;
    }

    setError("");
    setSuccess("Ön kontrol temiz. Bu içerik kaydedilmeye hazır.");
  }

  async function handleSaveCurrent() {
    setError("");
    setSuccess("");
    setValidationTouched(true);

    if (activeValidationErrors.length > 0) {
      setError("Eksik veya hatalı alanlar var. Kaydetmeden önce listedeki alanları düzeltin.");
      return;
    }

    setSaving(true);

    try {
      if (activeTab === "navigation") {
        if (!navigationMenu) {
          throw new Error("Navigasyon kaydı yüklenmedi.");
        }

        const saved = await saveAdminNavigationMenu(navigationMenu.key, {
          name: navigationMenu.name,
          location: navigationMenu.location,
          description: navigationMenu.description ?? undefined,
          isActive: navigationMenu.isActive,
          items: navigationMenu.items
        });

        setNavigationMenu(saved);
        setSavedSnapshots((current) => ({
          ...current,
          navigation: serializeContentSnapshot(saved)
        }));
        setValidationTouched(false);
        setSuccess("Navigasyon kaydedildi.");
        return;
      }

      if (activeTab === "marketing-pages") {
        if (!selectedMarketingPage) {
          throw new Error("Kaydedilecek sayfa seçilmedi.");
        }

        const saved = await saveAdminMarketingPage(selectedMarketingPage.key, {
          slug: selectedMarketingPage.slug,
          title: selectedMarketingPage.title,
          excerpt: selectedMarketingPage.excerpt ?? undefined,
          description: selectedMarketingPage.description ?? undefined,
          pageType: selectedMarketingPage.pageType,
          publishStatus: selectedMarketingPage.publishStatus,
          seoTitle: selectedMarketingPage.seoTitle ?? undefined,
          seoDescription: selectedMarketingPage.seoDescription ?? undefined,
          heroImageUrl: selectedMarketingPage.heroImageUrl ?? undefined,
          metadata: selectedMarketingPage.metadata ?? undefined,
          sections: selectedMarketingPage.sections
        });

        const nextPages = marketingPages.map((page) => (page.key === saved.key ? saved : page));
        setMarketingPages(nextPages);
        setSavedSnapshots((current) => ({
          ...current,
          marketingPages: {
            ...current.marketingPages,
            [saved.key]: serializeContentSnapshot(saved)
          }
        }));
        setValidationTouched(false);
        setSuccess(`${saved.title} sayfası kaydedildi.`);
        return;
      }

      if (activeTab === "academic-staff") {
        if (!staffDocument) {
          throw new Error("Akademik kadro belgesi yüklenmedi.");
        }

        const saved = await saveAdminStaffProfilesDocument(staffDocument);
        setStaffDocument(saved);
        setSavedSnapshots((current) => ({
          ...current,
          staff: serializeContentSnapshot(saved)
        }));
        setValidationTouched(false);
        setSuccess("Akademik kadro içeriği kaydedildi.");
        return;
      }

      if (activeTab === "success-stories") {
        if (!successDocument) {
          throw new Error("Başarı hikayeleri belgesi yüklenmedi.");
        }

        const saved = await saveAdminSuccessStoriesDocument(successDocument);
        setSuccessDocument(saved);
        setSavedSnapshots((current) => ({
          ...current,
          success: serializeContentSnapshot(saved)
        }));
        setValidationTouched(false);
        setSuccess("Başarı hikayeleri kaydedildi.");
        return;
      }

      if (!freeMaterialsDocument) {
        throw new Error("Ücretsiz materyaller belgesi yüklenmedi.");
      }

      const saved = await saveAdminFreeMaterialsDocument(freeMaterialsDocument);
      setFreeMaterialsDocument(saved);
      setSavedSnapshots((current) => ({
        ...current,
        freeMaterials: serializeContentSnapshot(saved)
      }));
      setValidationTouched(false);
      setSuccess("Ücretsiz materyaller ve countdown sayfaları kaydedildi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kaydetme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-card">
          <span className="admin-badge">Yükleniyor</span>
          <h1>İçerik yönetimi açılıyor</h1>
          <div className="admin-message admin-message--success">
            İçerik kayıtları ve yetkiler yükleniyor.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">CMS</div>
          <div>
            <strong style={{ display: "block" }}>İçerik Stüdyosu</strong>
            <span style={{ color: "var(--admin-muted)" }}>
              Website içeriklerini ve yayın akışını yönetin.
            </span>
          </div>
        </div>

        <div className="admin-actions">
          <Link className="admin-button--ghost" href="/">
            Kontrol Merkezi
          </Link>
          <Link className="admin-button--ghost" href="/medya">
            Medya Kütüphanesi
          </Link>
          <button className="admin-button--ghost" type="button" onClick={handleReload}>
            Yeniden Yükle
          </button>
          <button className="admin-button" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="admin-panel-grid">
        <aside className="admin-card admin-sidebar">
          <span className="admin-badge">İçerik</span>
          <h2 style={{ marginTop: 18 }}>İçerik Yönetimi</h2>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            Sayfa bölümleri, vitrin alanları ve materyalleri tek merkezden düzenleyin.
          </p>

          <div className="admin-summary">
            <div className="admin-list__item">
              <strong>
                {staff?.staffUser.firstName} {staff?.staffUser.lastName}
              </strong>
              <div>{staff?.staffUser.email}</div>
            </div>
            <div className="admin-list__item">
              <strong>Rol</strong>
              <div>{staff?.staffUser.roleKeys.join(", ") || "Tanımsız"}</div>
            </div>
            <div className="admin-list__item">
              <strong>Yetkiler</strong>
              <div>{overview?.permissionKeys.length ?? 0} adet</div>
            </div>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi">
              <strong>{contentStats.navigationItems}</strong>
              <span>Menü öğesi</span>
            </div>
            <div className="admin-kpi">
              <strong>{contentStats.marketingPages}</strong>
              <span>Sayfa kaydı</span>
            </div>
            <div className="admin-kpi">
              <strong>{contentStats.staffProfiles}</strong>
              <span>Kadro profili</span>
            </div>
            <div className="admin-kpi">
              <strong>{contentStats.successStories}</strong>
              <span>Başarı kaydı</span>
            </div>
            <div className="admin-kpi">
              <strong>{contentStats.freeMaterialItems}</strong>
              <span>Ücretsiz içerik</span>
            </div>
          </div>

          <div className="admin-tab-list">
            {(Object.keys(tabMeta) as AdminTabKey[]).map((tabKey) => (
              <button
                key={tabKey}
                className={`admin-tab ${activeTab === tabKey ? "admin-tab--active" : ""}`}
                type="button"
                onClick={() => {
                  setActiveTab(tabKey);
                  setError("");
                  setSuccess("");
                }}
              >
                <strong>{tabMeta[tabKey].label}</strong>
                <span>{tabMeta[tabKey].description}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-card admin-editor-panel">
          <div className="admin-editor-header">
            <div>
              <span className="admin-badge">{tabMeta[activeTab].label}</span>
              <h1>{tabMeta[activeTab].description}</h1>
              <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
                {tabMeta[activeTab].guide}
              </p>
            </div>

            {activeTab === "marketing-pages" ? (
              <label className="admin-field admin-field--compact">
                <span>Önce düzenlenecek sayfayı seç</span>
                <select
                  className="admin-input admin-select"
                  value={selectedMarketingKey}
                  onChange={(event) => {
                    setSelectedMarketingKey(event.target.value);
                    setSelectedMarketingSectionKey(PAGE_OVERVIEW_KEY);
                  }}
                >
                  {marketingPages.map((page) => (
                    <option key={page.key} value={page.key}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="admin-workflow-strip">
            <div>
              <strong>1. Bölüm seçildi</strong>
              <span>{tabMeta[activeTab].label}</span>
            </div>
            <div>
              <strong>2. Sayfa / kayıt seç</strong>
              <span>{getActiveRecordLabel(activeTab, selectedMarketingPage, staffDocument, successDocument, freeMaterialsDocument)}</span>
            </div>
            <div>
              <strong>3. Alanı düzenle ve yayınla</strong>
              <span>Sol listeden bölüm seç, sağdaki formu düzenle, sonra Kaydet.</span>
            </div>
          </div>

          {error ? <div className="admin-message admin-message--error">{error}</div> : null}
          {success ? <div className="admin-message admin-message--success">{success}</div> : null}
          {visibleValidationErrors.length > 0 ? (
            <div className="admin-message admin-message--error">
              <strong>Kaydetmeden önce düzeltilecek alanlar</strong>
              <ul className="admin-validation-list">
                {visibleValidationErrors.map((validationError) => (
                  <li key={validationError}>{validationError}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="admin-toolbar admin-toolbar--split">
            <div className="admin-editor-meta">
              <span className="admin-badge">Form düzenleyici</span>
              <span className={`admin-save-state ${hasUnsavedChanges ? "admin-save-state--dirty" : "admin-save-state--clean"}`}>
                {hasUnsavedChanges ? "Kaydedilmemiş değişiklik var" : "Kaydedildi"}
              </span>
              <span className="admin-editor-meta__text">
                {activeValidationErrors.length > 0
                  ? `${activeValidationErrors.length} kontrol uyarısı var.`
                  : "Ön kontrol temiz."}
              </span>
            </div>
            <div className="admin-actions admin-toolbar-actions">
              <a className="admin-button--ghost" href={previewHref} target="_blank" rel="noreferrer">
                Önizle
              </a>
              <button className="admin-button--ghost" type="button" onClick={handleValidateCurrent}>
                Kontrol Et
              </button>
              <button className="admin-button" type="button" disabled={saving} onClick={handleSaveCurrent}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>

          {activeTab === "navigation" ? (
            <NavigationMenuForm
              menu={navigationMenu}
              selectedItemKey={selectedNavigationItemKey}
              onSelectedItemKeyChange={setSelectedNavigationItemKey}
              onChange={updateNavigationMenu}
            />
          ) : null}

          {activeTab === "marketing-pages" ? (
            <MarketingPageForm
              page={selectedMarketingPage}
              selectedSectionKey={selectedMarketingSectionKey}
              showcaseSlides={selectedMarketingShowcaseSlides}
              packagesRibbon={selectedPackagesRibbon}
              onSelectedSectionKeyChange={setSelectedMarketingSectionKey}
              onChange={replaceSelectedMarketingPage}
              onShowcaseFieldChange={updateHomepageShowcaseSlide}
              onShowcaseUpload={handleHomepageShowcaseUpload}
              onPackagesRibbonChange={updatePackagesRibbon}
              onOpenMediaPicker={openMediaPicker}
            />
          ) : null}

          {activeTab === "academic-staff" ? (
            <StaffProfilesForm
              document={staffDocument}
              selectedGroupKey={selectedStaffGroupKey}
              selectedProfileKey={selectedStaffProfileKey}
              onSelectedGroupKeyChange={(key) => {
                setSelectedStaffGroupKey(key);
                setSelectedStaffProfileKey("");
              }}
              onSelectedProfileKeyChange={setSelectedStaffProfileKey}
              onChange={updateStaffDocument}
              onOpenMediaPicker={openMediaPicker}
            />
          ) : null}

          {activeTab === "success-stories" ? (
            <SuccessStoriesForm
              document={successDocument}
              selectedStoryKey={selectedSuccessStoryKey}
              onSelectedStoryKeyChange={setSelectedSuccessStoryKey}
              onChange={updateSuccessDocument}
              onOpenMediaPicker={openMediaPicker}
            />
          ) : null}

          {activeTab === "free-materials" ? (
            <FreeMaterialsForm
              document={freeMaterialsDocument}
              selectedMode={selectedFreeMaterialMode}
              selectedCategoryKey={selectedFreeMaterialCategoryKey}
              selectedItemKey={selectedFreeMaterialItemKey}
              selectedCountdownSlug={selectedCountdownPageSlug}
              onSelectedModeChange={setSelectedFreeMaterialMode}
              onSelectedCategoryKeyChange={(key) => {
                setSelectedFreeMaterialCategoryKey(key);
                setSelectedFreeMaterialItemKey("");
              }}
              onSelectedItemKeyChange={setSelectedFreeMaterialItemKey}
              onSelectedCountdownSlugChange={setSelectedCountdownPageSlug}
              onChange={updateFreeMaterialsDocument}
            />
          ) : null}
        </section>
      </div>

      {mediaPickerRequest ? (
        <MediaPickerModal
          request={mediaPickerRequest}
          assets={mediaAssets}
          loading={mediaPickerLoading}
          error={mediaPickerError}
          onClose={() => setMediaPickerRequest(null)}
          onReload={() => void loadMediaAssets()}
          onSelect={selectMediaAsset}
        />
      ) : null}
    </main>
  );
}

function NavigationMenuForm({
  menu,
  selectedItemKey,
  onSelectedItemKeyChange,
  onChange
}: {
  menu: AdminNavigationMenu | null;
  selectedItemKey: string;
  onSelectedItemKeyChange: (key: string) => void;
  onChange: (updater: (currentMenu: AdminNavigationMenu) => AdminNavigationMenu) => void;
}) {
  if (!menu) {
    return <div className="admin-list__item">Navigasyon kaydı bulunamadı.</div>;
  }

  const selectedItemIndex = menu.items.findIndex(
    (item, index) => getNavigationItemKey(item, index) === selectedItemKey
  );
  const selectedItem = selectedItemIndex >= 0 ? menu.items[selectedItemIndex] : null;

  function updateTopLevelItem(updater: (item: AdminNavigationItem) => AdminNavigationItem) {
    if (selectedItemIndex < 0) {
      return;
    }

    onChange((current) => ({
      ...current,
      items: current.items.map((item, index) => (index === selectedItemIndex ? updater(item) : item))
    }));
  }

  return (
    <section className="admin-customer-editor">
      <div className="admin-customer-editor__head">
        <div>
          <span className="admin-badge">Navbar</span>
          <h2>Menü ağacı</h2>
          <p>Sol listeden menü ayarlarını veya üst seviye menü başlığını seçerek düzenle.</p>
        </div>
      </div>

      <div className="admin-record-grid">
        <div className="admin-record-list">
          <div className="admin-record-list__items">
            <button
              className={`admin-record-item ${selectedItemKey === MENU_SETTINGS_KEY ? "admin-record-item--active" : ""}`}
              type="button"
              onClick={() => onSelectedItemKeyChange(MENU_SETTINGS_KEY)}
            >
              <div className="admin-record-item__top">
                <strong>Navbar ayarları</strong>
                <span>{menu.isActive ? "Yayında" : "Kapalı"}</span>
              </div>
              <div className="admin-record-item__meta">
                <span>{menu.items.length} üst menü</span>
                <span>{menu.location}</span>
              </div>
            </button>

            {menu.items.map((item, index) => {
              const itemKey = getNavigationItemKey(item, index);

              return (
                <button
                  key={itemKey}
                  className={`admin-record-item ${selectedItemKey === itemKey ? "admin-record-item--active" : ""}`}
                  type="button"
                  onClick={() => onSelectedItemKeyChange(itemKey)}
                >
                  <div className="admin-record-item__top">
                    <strong>{item.label || "Menü öğesi"}</strong>
                    <span>{item.isActive === false ? "Kapalı" : "Yayında"}</span>
                  </div>
                  <div className="admin-record-item__meta">
                    <span>{item.href}</span>
                    <span>{item.children?.length ?? 0} alt menü</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-record-editor">
          {selectedItemKey === MENU_SETTINGS_KEY ? (
            <article className="admin-customer-card">
              <div className="admin-customer-card__title">
                <strong>Navbar genel ayarları</strong>
                <span>{menu.key}</span>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Menü adı</span>
                  <input
                    className="admin-input"
                    value={menu.name}
                    onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="admin-field">
                  <span>Konum</span>
                  <input
                    className="admin-input"
                    value={menu.location}
                    onChange={(event) => onChange((current) => ({ ...current, location: event.target.value }))}
                  />
                </label>
              </div>

              <label className="admin-field">
                <span>Açıklama</span>
                <input
                  className="admin-input"
                  value={menu.description ?? ""}
                  onChange={(event) =>
                    onChange((current) => ({ ...current, description: event.target.value || null }))
                  }
                />
              </label>

              <label className="admin-check admin-check--inline">
                <input
                  type="checkbox"
                  checked={menu.isActive}
                  onChange={(event) => onChange((current) => ({ ...current, isActive: event.target.checked }))}
                />
                <span>Navbar yayında</span>
              </label>
            </article>
          ) : selectedItem ? (
            <NavigationItemEditor item={selectedItem} onChange={updateTopLevelItem} />
          ) : (
            <div className="admin-list__item">Düzenlenecek menü başlığı seçin.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function NavigationItemEditor({
  item,
  onChange
}: {
  item: AdminNavigationItem;
  onChange: (updater: (item: AdminNavigationItem) => AdminNavigationItem) => void;
}) {
  return (
    <article className="admin-customer-card">
      <div className="admin-customer-card__title">
        <strong>{item.label || "Menü öğesi"}</strong>
        <span>{item.itemKey}</span>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Başlık</span>
          <input
            className="admin-input"
            value={item.label}
            onChange={(event) => onChange((current) => ({ ...current, label: event.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>Link</span>
          <input
            className="admin-input"
            value={item.href}
            onChange={(event) => onChange((current) => ({ ...current, href: event.target.value }))}
          />
        </label>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Açıklama</span>
          <input
            className="admin-input"
            value={item.description ?? ""}
            onChange={(event) =>
              onChange((current) => ({ ...current, description: event.target.value || null }))
            }
          />
        </label>
        <label className="admin-field">
          <span>Sıra</span>
          <input
            className="admin-input"
            type="number"
            value={item.sortOrder ?? 0}
            onChange={(event) =>
              onChange((current) => ({ ...current, sortOrder: Number(event.target.value) }))
            }
          />
        </label>
      </div>

      <label className="admin-check admin-check--inline">
        <input
          type="checkbox"
          checked={item.isActive ?? true}
          onChange={(event) => onChange((current) => ({ ...current, isActive: event.target.checked }))}
        />
        <span>Menüde göster</span>
      </label>

      {item.children?.length ? (
        <div className="admin-subpanel">
          <div className="admin-customer-card__title">
            <strong>Alt menüler</strong>
            <span>{item.children.length} kayıt</span>
          </div>
          <NavigationItemsForm
            depth={1}
            items={item.children}
            onChange={(children) => onChange((current) => ({ ...current, children }))}
          />
        </div>
      ) : null}
    </article>
  );
}

function NavigationItemsForm({
  items,
  onChange,
  depth = 0
}: {
  items: AdminNavigationItem[];
  onChange: (items: AdminNavigationItem[]) => void;
  depth?: number;
}) {
  function updateItem(index: number, updater: (item: AdminNavigationItem) => AdminNavigationItem) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)));
  }

  return (
    <div className="admin-customer-editor__list" data-depth={depth}>
      {items.map((item, index) => (
        <article key={item.id ?? `${item.itemKey}-${index}`} className="admin-customer-card">
          <div className="admin-customer-card__title">
            <strong>{item.label || "Menü öğesi"}</strong>
            <span>{item.href}</span>
          </div>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Başlık</span>
              <input
                className="admin-input"
                value={item.label}
                onChange={(event) => updateItem(index, (current) => ({ ...current, label: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>Link</span>
              <input
                className="admin-input"
                value={item.href}
                onChange={(event) => updateItem(index, (current) => ({ ...current, href: event.target.value }))}
              />
            </label>
          </div>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Açıklama</span>
              <input
                className="admin-input"
                value={item.description ?? ""}
                onChange={(event) =>
                  updateItem(index, (current) => ({ ...current, description: event.target.value || null }))
                }
              />
            </label>
            <label className="admin-field">
              <span>Sıra</span>
              <input
                className="admin-input"
                type="number"
                value={item.sortOrder ?? 0}
                onChange={(event) =>
                  updateItem(index, (current) => ({ ...current, sortOrder: Number(event.target.value) }))
                }
              />
            </label>
          </div>

          <label className="admin-check admin-check--inline">
            <input
              type="checkbox"
              checked={item.isActive ?? true}
              onChange={(event) =>
                updateItem(index, (current) => ({ ...current, isActive: event.target.checked }))
              }
            />
            <span>Menüde göster</span>
          </label>

          {item.children?.length ? (
            <NavigationItemsForm
              depth={depth + 1}
              items={item.children}
              onChange={(children) => updateItem(index, (current) => ({ ...current, children }))}
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}

function MarketingPageForm({
  page,
  selectedSectionKey,
  showcaseSlides,
  packagesRibbon,
  onSelectedSectionKeyChange,
  onChange,
  onShowcaseFieldChange,
  onShowcaseUpload,
  onPackagesRibbonChange,
  onOpenMediaPicker
}: {
  page: AdminMarketingPage | null;
  selectedSectionKey: string;
  showcaseSlides: ShowcaseEditorSlide[];
  packagesRibbon: PackagesRibbonEditorState;
  onSelectedSectionKeyChange: (key: string) => void;
  onChange: (page: AdminMarketingPage) => void;
  onShowcaseFieldChange: (slideIndex: number, field: keyof ShowcaseEditorSlide, value: string) => void;
  onShowcaseUpload: (slideIndex: number, field: "mediaUrl" | "mediaPosterUrl", file: File | null) => Promise<void>;
  onPackagesRibbonChange: (field: keyof PackagesRibbonEditorState, value: string | boolean) => void;
  onOpenMediaPicker: (request: MediaPickerRequest) => void;
}) {
  if (!page) {
    return <div className="admin-list__item">Önce düzenlenecek sayfayı seçin.</div>;
  }

  const currentPage = page;
  const selectedSectionIndex = currentPage.sections.findIndex(
    (section) => section.sectionKey === selectedSectionKey
  );
  const selectedSection = selectedSectionIndex >= 0 ? currentPage.sections[selectedSectionIndex] : null;

  function updatePage(field: keyof AdminMarketingPage, value: string) {
    onChange({ ...currentPage, [field]: value });
  }

  function updateSection(index: number, updater: (section: AdminMarketingPageSection) => AdminMarketingPageSection) {
    onChange({
      ...currentPage,
      sections: currentPage.sections.map((section, sectionIndex) =>
        sectionIndex === index ? updater(section) : section
      )
    });
  }

  return (
    <section className="admin-customer-editor">
      <div className="admin-customer-editor__head">
        <div>
          <span className="admin-badge">Sayfa</span>
          <h2>{currentPage.title}</h2>
          <p>Önce sayfa genel ayarlarını veya tek bir bölümü seç; sağdaki form sadece o alanı değiştirir.</p>
        </div>
      </div>

      <div className="admin-record-grid">
        <div className="admin-record-list">
          <div className="admin-record-list__items">
            <button
              className={`admin-record-item ${selectedSectionKey === PAGE_OVERVIEW_KEY ? "admin-record-item--active" : ""}`}
              type="button"
              onClick={() => onSelectedSectionKeyChange(PAGE_OVERVIEW_KEY)}
            >
              <div className="admin-record-item__top">
                <strong>Sayfa genel ayarları</strong>
                <span>{currentPage.publishStatus}</span>
              </div>
              <div className="admin-record-item__meta">
                <span>SEO, slug, hero görseli</span>
                <span>{currentPage.slug}</span>
              </div>
            </button>

            {currentPage.sections.map((section) => (
              <button
                key={section.id ?? section.sectionKey}
                className={`admin-record-item ${selectedSectionKey === section.sectionKey ? "admin-record-item--active" : ""}`}
                type="button"
                onClick={() => onSelectedSectionKeyChange(section.sectionKey)}
              >
                <div className="admin-record-item__top">
                  <strong>{section.title || section.sectionKey}</strong>
                  <span>{section.isActive === false ? "Kapalı" : "Yayında"}</span>
                </div>
                <div className="admin-record-item__meta">
                  <span>{section.sectionKey}</span>
                  <span>{section.variantKey ?? "standart"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-record-editor">
          {selectedSectionKey === PAGE_OVERVIEW_KEY ? (
            <article className="admin-customer-card">
              <div className="admin-customer-card__title">
                <strong>Sayfa genel ayarları</strong>
                <span>{currentPage.key}</span>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Sayfa başlığı</span>
                  <input
                    className="admin-input"
                    value={currentPage.title}
                    onChange={(event) => updatePage("title", event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>Slug</span>
                  <input
                    className="admin-input"
                    value={currentPage.slug}
                    onChange={(event) => updatePage("slug", event.target.value)}
                  />
                </label>
              </div>

              <label className="admin-field">
                <span>Kısa açıklama</span>
                <textarea
                  className="admin-input admin-textarea"
                  value={currentPage.description ?? ""}
                  onChange={(event) => updatePage("description", event.target.value)}
                />
              </label>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>SEO başlık</span>
                  <input
                    className="admin-input"
                    value={currentPage.seoTitle ?? ""}
                    onChange={(event) => updatePage("seoTitle", event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>SEO açıklama</span>
                  <input
                    className="admin-input"
                    value={currentPage.seoDescription ?? ""}
                    onChange={(event) => updatePage("seoDescription", event.target.value)}
                  />
                </label>
              </div>

              <div className="admin-form-grid">
                <MediaUrlField
                  label="Hero görsel URL"
                  value={currentPage.heroImageUrl ?? ""}
                  kinds={["IMAGE", "BRANDING"]}
                  pickerTitle={`${currentPage.title} hero görseli seç`}
                  onChange={(value) => updatePage("heroImageUrl", value)}
                  onOpenMediaPicker={onOpenMediaPicker}
                />
                <label className="admin-field">
                  <span>Yayın durumu</span>
                  <select
                    className="admin-input admin-select"
                    value={currentPage.publishStatus}
                    onChange={(event) => updatePage("publishStatus", event.target.value)}
                  >
                    <option value="PUBLISHED">Yayında</option>
                    <option value="DRAFT">Taslak</option>
                    <option value="ARCHIVED">Arşiv</option>
                  </select>
                </label>
              </div>

              {currentPage.key === "packages" ? (
                <PackagesRibbonEditor state={packagesRibbon} onChange={onPackagesRibbonChange} />
              ) : null}
            </article>
          ) : selectedSection ? (
            <article className="admin-customer-card">
              <div className="admin-customer-card__title">
                <strong>{selectedSection.title || selectedSection.sectionKey}</strong>
                <span>{selectedSection.sectionKey}</span>
              </div>

              {currentPage.key === "home" && selectedSection.sectionKey === "showcase-hero" ? (
                <HomepageShowcaseEditor
                  slides={showcaseSlides}
                  onFieldChange={onShowcaseFieldChange}
                  onUpload={onShowcaseUpload}
                  onOpenMediaPicker={onOpenMediaPicker}
                />
              ) : null}

              <MarketingSectionFields
                section={selectedSection}
                onChange={(updater) => updateSection(selectedSectionIndex, updater)}
              />
            </article>
          ) : (
            <div className="admin-list__item">Düzenlenecek bölüm seçin.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function MarketingSectionFields({
  section,
  onChange
}: {
  section: AdminMarketingPageSection;
  onChange: (updater: (section: AdminMarketingPageSection) => AdminMarketingPageSection) => void;
}) {
  return (
    <div className="admin-form-stack">
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Etiket</span>
          <input
            className="admin-input"
            value={section.eyebrow ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, eyebrow: event.target.value || null }))}
          />
        </label>
        <label className="admin-field">
          <span>Bölüm başlığı</span>
          <input
            className="admin-input"
            value={section.title ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value || null }))}
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Bölüm metni</span>
        <textarea
          className="admin-input admin-textarea"
          value={section.body ?? ""}
          onChange={(event) => onChange((current) => ({ ...current, body: event.target.value || null }))}
        />
      </label>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Varyant anahtarı</span>
          <input
            className="admin-input"
            value={section.variantKey ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, variantKey: event.target.value || null }))}
          />
        </label>
        <label className="admin-field">
          <span>Sıra</span>
          <input
            className="admin-input"
            type="number"
            value={section.sortOrder ?? 0}
            onChange={(event) => onChange((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
          />
        </label>
      </div>

      <label className="admin-check admin-check--inline">
        <input
          type="checkbox"
          checked={section.isActive ?? true}
          onChange={(event) => onChange((current) => ({ ...current, isActive: event.target.checked }))}
        />
        <span>Bölümü yayınla</span>
      </label>
    </div>
  );
}

function StaffProfilesForm({
  document,
  selectedGroupKey,
  selectedProfileKey,
  onSelectedGroupKeyChange,
  onSelectedProfileKeyChange,
  onChange,
  onOpenMediaPicker
}: {
  document: AdminStaffProfilesDocument | null;
  selectedGroupKey: string;
  selectedProfileKey: string;
  onSelectedGroupKeyChange: (key: string) => void;
  onSelectedProfileKeyChange: (key: string) => void;
  onChange: (updater: (currentDocument: AdminStaffProfilesDocument) => AdminStaffProfilesDocument) => void;
  onOpenMediaPicker: (request: MediaPickerRequest) => void;
}) {
  if (!document) {
    return <div className="admin-list__item">Akademik kadro kaydı bulunamadı.</div>;
  }

  const selectedGroupIndex = document.groups.findIndex((group) => group.key === selectedGroupKey);
  const selectedGroup = selectedGroupIndex >= 0 ? document.groups[selectedGroupIndex] : document.groups[0] ?? null;
  const selectedProfileIndex =
    selectedGroup?.profiles.findIndex(
      (profile, index) => getStaffProfileKey(profile, index) === selectedProfileKey
    )  -1;
  const selectedProfile =
    selectedGroup && selectedProfileIndex >= 0 ? selectedGroup.profiles[selectedProfileIndex] : null;

  function updateGroup(groupIndex: number, updater: (group: AdminStaffProfileGroup) => AdminStaffProfileGroup) {
    onChange((current) => ({
      ...current,
      groups: current.groups.map((group, index) => (index === groupIndex ? updater(group) : group))
    }));
  }

  function updateSelectedGroup(updater: (group: AdminStaffProfileGroup) => AdminStaffProfileGroup) {
    if (selectedGroupIndex < 0) {
      return;
    }

    updateGroup(selectedGroupIndex, updater);
  }

  function updateSelectedProfile(updater: (profile: AdminStaffProfile) => AdminStaffProfile) {
    if (selectedProfileIndex < 0) {
      return;
    }

    updateSelectedGroup((group) => ({
      ...group,
      profiles: group.profiles.map((profile, index) =>
        index === selectedProfileIndex ? updater(profile) : profile
      )
    }));
  }

  return (
    <section className="admin-customer-editor">
      <div className="admin-customer-editor__head">
        <div>
          <span className="admin-badge">Akademik Kadro</span>
          <h2>Koç ve öğretmen grupları</h2>
          <p>Önce grup seç, sonra o gruptaki koç veya öğretmen profilini düzenle.</p>
        </div>
      </div>

      <div className="admin-record-grid">
        <div className="admin-record-list">
          <div className="admin-record-list__items">
            {document.groups.map((group) => (
              <button
                key={group.key}
                className={`admin-record-item ${selectedGroup?.key === group.key ? "admin-record-item--active" : ""}`}
                type="button"
                onClick={() => onSelectedGroupKeyChange(group.key)}
              >
                <div className="admin-record-item__top">
                  <strong>{group.label}</strong>
                  <span>{group.publishStatus ?? "PUBLISHED"}</span>
                </div>
                <div className="admin-record-item__meta">
                  <span>{group.profiles.length} profil</span>
                  <span>{group.introVideoUrl ? "Video var" : "Video yok"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-record-editor">
          {selectedGroup ? (
            <article className="admin-customer-card">
              <div className="admin-customer-card__title">
                <strong>{selectedGroup.label}</strong>
                <span>{selectedGroup.key}</span>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Grup adı</span>
                  <input
                    className="admin-input"
                    value={selectedGroup.label}
                    onChange={(event) => updateSelectedGroup((current) => ({ ...current, label: event.target.value }))}
                  />
                </label>
                <label className="admin-field">
                  <span>Durum</span>
                  <select
                    className="admin-input admin-select"
                    value={selectedGroup.publishStatus ?? "PUBLISHED"}
                    onChange={(event) =>
                      updateSelectedGroup((current) => ({ ...current, publishStatus: event.target.value }))
                    }
                  >
                    <option value="PUBLISHED">Yayında</option>
                    <option value="DRAFT">Taslak</option>
                    <option value="ARCHIVED">Arşiv</option>
                  </select>
                </label>
              </div>

              <label className="admin-field">
                <span>Grup açıklaması</span>
                <textarea
                  className="admin-input admin-textarea"
                  value={selectedGroup.description ?? ""}
                  onChange={(event) =>
                    updateSelectedGroup((current) => ({ ...current, description: event.target.value || null }))
                  }
                />
              </label>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Tanıtım video tipi</span>
                  <select
                    className="admin-input admin-select"
                    value={selectedGroup.introVideoSourceType ?? "EMBED"}
                    onChange={(event) =>
                      updateSelectedGroup((current) => ({ ...current, introVideoSourceType: event.target.value as "DIRECT" | "EMBED" }))
                    }
                  >
                    <option value="EMBED">Embed / Cloud URL</option>
                    <option value="DIRECT">Doğrudan video</option>
                  </select>
                </label>
                <MediaUrlField
                  label="Tanıtım video URL"
                  value={selectedGroup.introVideoUrl ?? ""}
                  kinds={["VIDEO"]}
                  pickerTitle={`${selectedGroup.label} tanıtım videosu seç`}
                  onChange={(value) =>
                    updateSelectedGroup((current) => ({ ...current, introVideoUrl: value || null }))
                  }
                  onSelectAsset={(asset) =>
                    updateSelectedGroup((current) => ({
                      ...current,
                      introVideoUrl: getMediaAssetUsableUrl(asset) || null,
                      introVideoSourceType: asset.playbackSourceType ?? current.introVideoSourceType ?? "EMBED"
                    }))
                  }
                  onOpenMediaPicker={onOpenMediaPicker}
                />
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Video başlığı</span>
                  <input
                    className="admin-input"
                    value={selectedGroup.introVideoTitle ?? ""}
                    onChange={(event) =>
                      updateSelectedGroup((current) => ({ ...current, introVideoTitle: event.target.value || null }))
                    }
                  />
                </label>
                <MediaUrlField
                  label="Poster görsel URL"
                  value={selectedGroup.introVideoPosterUrl ?? ""}
                  kinds={["IMAGE", "BRANDING"]}
                  pickerTitle={`${selectedGroup.label} video posteri seç`}
                  onChange={(value) =>
                    updateSelectedGroup((current) => ({ ...current, introVideoPosterUrl: value || null }))
                  }
                  onOpenMediaPicker={onOpenMediaPicker}
                />
              </div>

              <div className="admin-subpanel">
                <div className="admin-customer-card__title">
                  <strong>Profil seç</strong>
                  <span>{selectedGroup.profiles.length} kayıt</span>
                </div>
                <div className="admin-record-list__items admin-record-list__items--compact">
                  {selectedGroup.profiles.map((profile, index) => {
                    const profileKey = getStaffProfileKey(profile, index);

                    return (
                      <button
                        key={profileKey}
                        className={`admin-record-item ${selectedProfileKey === profileKey ? "admin-record-item--active" : ""}`}
                        type="button"
                        onClick={() => onSelectedProfileKeyChange(profileKey)}
                      >
                        <div className="admin-record-item__top">
                          <strong>{profile.fullName}</strong>
                          <span>{profile.publishStatus ?? "PUBLISHED"}</span>
                        </div>
                        <div className="admin-record-item__meta">
                          <span>{profile.title}</span>
                          <span>{profile.city ?? "Şehir yok"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedProfile ? (
                <StaffProfileFields
                  profile={selectedProfile}
                  onChange={updateSelectedProfile}
                  onOpenMediaPicker={onOpenMediaPicker}
                />
              ) : (
                <div className="admin-list__item">Düzenlenecek profil seçin.</div>
              )}
            </article>
          ) : (
            <div className="admin-list__item">Düzenlenecek kadro grubu seçin.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function StaffProfileFields({
  profile,
  onChange,
  onOpenMediaPicker
}: {
  profile: AdminStaffProfile;
  onChange: (updater: (profile: AdminStaffProfile) => AdminStaffProfile) => void;
  onOpenMediaPicker: (request: MediaPickerRequest) => void;
}) {
  return (
    <article className="admin-nested-card">
      <div className="admin-customer-card__title">
        <strong>{profile.fullName}</strong>
        <span>{profile.slug}</span>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Ad Soyad</span>
          <input
            className="admin-input"
            value={profile.fullName}
            onChange={(event) => onChange((current) => ({ ...current, fullName: event.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>Unvan</span>
          <input
            className="admin-input"
            value={profile.title}
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Şehir</span>
          <input
            className="admin-input"
            value={profile.city ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, city: event.target.value || null }))}
          />
        </label>
        <MediaUrlField
          label="Fotoğraf URL"
          value={profile.photoUrl ?? ""}
          kinds={["IMAGE", "BRANDING"]}
          pickerTitle={`${profile.fullName} profil fotoğrafı seç`}
          onChange={(value) => onChange((current) => ({ ...current, photoUrl: value || null }))}
          onOpenMediaPicker={onOpenMediaPicker}
        />
      </div>

      <label className="admin-field">
        <span>Biyografi</span>
        <textarea
          className="admin-input admin-textarea"
          value={profile.biography ?? ""}
          onChange={(event) => onChange((current) => ({ ...current, biography: event.target.value || null }))}
        />
      </label>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Sıra</span>
          <input
            className="admin-input"
            type="number"
            value={profile.sortOrder ?? 0}
            onChange={(event) => onChange((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
          />
        </label>
        <label className="admin-field">
          <span>Durum</span>
          <select
            className="admin-input admin-select"
            value={profile.publishStatus ?? "PUBLISHED"}
            onChange={(event) => onChange((current) => ({ ...current, publishStatus: event.target.value }))}
          >
            <option value="PUBLISHED">Yayında</option>
            <option value="DRAFT">Taslak</option>
            <option value="ARCHIVED">Arşiv</option>
          </select>
        </label>
      </div>
    </article>
  );
}

function SuccessStoriesForm({
  document,
  selectedStoryKey,
  onSelectedStoryKeyChange,
  onChange,
  onOpenMediaPicker
}: {
  document: AdminSuccessStoriesDocument | null;
  selectedStoryKey: string;
  onSelectedStoryKeyChange: (key: string) => void;
  onChange: (updater: (currentDocument: AdminSuccessStoriesDocument) => AdminSuccessStoriesDocument) => void;
  onOpenMediaPicker: (request: MediaPickerRequest) => void;
}) {
  if (!document) {
    return <div className="admin-list__item">Başarı hikayesi kaydı bulunamadı.</div>;
  }

  const selectedStoryIndex = document.stories.findIndex(
    (story, index) => getSuccessStoryKey(story, index) === selectedStoryKey
  );
  const selectedStory = selectedStoryIndex >= 0 ? document.stories[selectedStoryIndex] : null;

  function updateSelectedStory(updater: (story: AdminSuccessStory) => AdminSuccessStory) {
    if (selectedStoryIndex < 0) {
      return;
    }

    onChange((current) => ({
      ...current,
      stories: current.stories.map((story, index) =>
        index === selectedStoryIndex ? updater(story) : story
      )
    }));
  }

  return (
    <section className="admin-customer-editor">
      <div className="admin-customer-editor__head">
        <div>
          <span className="admin-badge">Başarılar</span>
          <h2>Öğrenci başarı hikayeleri</h2>
          <p>Sol listeden tek bir başarı hikayesi seç ve sadece o kartı düzenle.</p>
        </div>
      </div>

      <div className="admin-record-grid">
        <div className="admin-record-list">
          <div className="admin-record-list__items">
            {document.stories.map((story, index) => {
              const storyKey = getSuccessStoryKey(story, index);

              return (
                <button
                  key={storyKey}
                  className={`admin-record-item ${selectedStoryKey === storyKey ? "admin-record-item--active" : ""}`}
                  type="button"
                  onClick={() => onSelectedStoryKeyChange(storyKey)}
                >
                  <div className="admin-record-item__top">
                    <strong>{story.studentName}</strong>
                    <span>{story.publishStatus ?? "PUBLISHED"}</span>
                  </div>
                  <div className="admin-record-item__meta">
                    <span>{story.resultTitle}</span>
                    <span>{story.examLabel ?? "Sınav yok"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-record-editor">
          {selectedStory ? (
            <article className="admin-customer-card">
              <div className="admin-customer-card__title">
                <strong>{selectedStory.studentName}</strong>
                <span>{selectedStory.slug}</span>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Öğrenci adı</span>
                  <input
                    className="admin-input"
                    value={selectedStory.studentName}
                    onChange={(event) =>
                      updateSelectedStory((current) => ({ ...current, studentName: event.target.value }))
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>Sonuç başlığı</span>
                  <input
                    className="admin-input"
                    value={selectedStory.resultTitle}
                    onChange={(event) =>
                      updateSelectedStory((current) => ({ ...current, resultTitle: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Şehir</span>
                  <input
                    className="admin-input"
                    value={selectedStory.city ?? ""}
                    onChange={(event) =>
                      updateSelectedStory((current) => ({ ...current, city: event.target.value || null }))
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>Sınav etiketi</span>
                  <input
                    className="admin-input"
                    value={selectedStory.examLabel ?? ""}
                    onChange={(event) =>
                      updateSelectedStory((current) => ({ ...current, examLabel: event.target.value || null }))
                    }
                  />
                </label>
              </div>

              <label className="admin-field">
                <span>Öne çıkan cümle</span>
                <textarea
                  className="admin-input admin-textarea"
                  value={selectedStory.highlight}
                  onChange={(event) =>
                    updateSelectedStory((current) => ({ ...current, highlight: event.target.value }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Hikaye metni</span>
                <textarea
                  className="admin-input admin-textarea"
                  value={selectedStory.story ?? ""}
                  onChange={(event) =>
                    updateSelectedStory((current) => ({ ...current, story: event.target.value || null }))
                  }
                />
              </label>

              <div className="admin-form-grid">
                <MediaUrlField
                  label="Avatar URL"
                  value={selectedStory.avatarUrl ?? ""}
                  kinds={["IMAGE", "BRANDING"]}
                  pickerTitle={`${selectedStory.studentName} başarı görseli seç`}
                  onChange={(value) =>
                    updateSelectedStory((current) => ({ ...current, avatarUrl: value || null }))
                  }
                  onOpenMediaPicker={onOpenMediaPicker}
                />
                <label className="admin-field">
                  <span>Durum</span>
                  <select
                    className="admin-input admin-select"
                    value={selectedStory.publishStatus ?? "PUBLISHED"}
                    onChange={(event) =>
                      updateSelectedStory((current) => ({ ...current, publishStatus: event.target.value }))
                    }
                  >
                    <option value="PUBLISHED">Yayında</option>
                    <option value="DRAFT">Taslak</option>
                    <option value="ARCHIVED">Arşiv</option>
                  </select>
                </label>
              </div>
            </article>
          ) : (
            <div className="admin-list__item">Düzenlenecek başarı hikayesi seçin.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function FreeMaterialsForm({
  document,
  selectedMode,
  selectedCategoryKey,
  selectedItemKey,
  selectedCountdownSlug,
  onSelectedModeChange,
  onSelectedCategoryKeyChange,
  onSelectedItemKeyChange,
  onSelectedCountdownSlugChange,
  onChange
}: {
  document: AdminFreeMaterialsDocument | null;
  selectedMode: typeof FREE_MATERIAL_CATEGORIES_KEY | typeof FREE_MATERIAL_COUNTDOWNS_KEY;
  selectedCategoryKey: string;
  selectedItemKey: string;
  selectedCountdownSlug: string;
  onSelectedModeChange: (mode: typeof FREE_MATERIAL_CATEGORIES_KEY | typeof FREE_MATERIAL_COUNTDOWNS_KEY) => void;
  onSelectedCategoryKeyChange: (key: string) => void;
  onSelectedItemKeyChange: (key: string) => void;
  onSelectedCountdownSlugChange: (slug: string) => void;
  onChange: (updater: (currentDocument: AdminFreeMaterialsDocument) => AdminFreeMaterialsDocument) => void;
}) {
  if (!document) {
    return <div className="admin-list__item">Ücretsiz materyal kaydı bulunamadı.</div>;
  }

  const selectedCategoryIndex = document.categories.findIndex((category) => category.key === selectedCategoryKey);
  const selectedCategory =
    selectedCategoryIndex >= 0 ? document.categories[selectedCategoryIndex] : document.categories[0] ?? null;
  const selectedItemIndex =
    selectedCategory?.items.findIndex((item, index) => getFreeMaterialItemKey(item, index) === selectedItemKey)  -1;
  const selectedItem = selectedCategory && selectedItemIndex >= 0 ? selectedCategory.items[selectedItemIndex] : null;
  const selectedCountdownIndex = document.countdownPages.findIndex((page) => page.slug === selectedCountdownSlug);
  const selectedCountdown =
    selectedCountdownIndex >= 0 ? document.countdownPages[selectedCountdownIndex] : document.countdownPages[0] ?? null;

  function updateCategory(updater: (category: AdminFreeMaterialCategory) => AdminFreeMaterialCategory) {
    if (selectedCategoryIndex < 0) {
      return;
    }

    onChange((current) => ({
      ...current,
      categories: current.categories.map((category, index) =>
        index === selectedCategoryIndex ? updater(category) : category
      )
    }));
  }

  function updateItem(updater: (item: AdminFreeMaterialItem) => AdminFreeMaterialItem) {
    if (selectedItemIndex < 0) {
      return;
    }

    updateCategory((category) => ({
      ...category,
      items: category.items.map((item, index) => (index === selectedItemIndex ? updater(item) : item))
    }));
  }

  function updateCountdown(updater: (page: AdminCountdownPage) => AdminCountdownPage) {
    if (selectedCountdownIndex < 0) {
      return;
    }

    onChange((current) => ({
      ...current,
      countdownPages: current.countdownPages.map((page, index) =>
        index === selectedCountdownIndex ? updater(page) : page
      )
    }));
  }

  return (
    <section className="admin-customer-editor">
      <div className="admin-customer-editor__head">
        <div>
          <span className="admin-badge">Ücretsiz Materyaller</span>
          <h2>Kategori kartları ve sayaç sayfaları</h2>
          <p>Kart kategorilerini ve geri sayım sayfalarını ayrı ayrı seçerek düzenle.</p>
        </div>
      </div>

      <div className="admin-record-grid">
        <div className="admin-record-list">
          <div className="admin-inline-checks">
            <button
              className={`admin-record-item ${selectedMode === FREE_MATERIAL_CATEGORIES_KEY ? "admin-record-item--active" : ""}`}
              type="button"
              onClick={() => onSelectedModeChange(FREE_MATERIAL_CATEGORIES_KEY)}
            >
              Kategori kartları
            </button>
            <button
              className={`admin-record-item ${selectedMode === FREE_MATERIAL_COUNTDOWNS_KEY ? "admin-record-item--active" : ""}`}
              type="button"
              onClick={() => onSelectedModeChange(FREE_MATERIAL_COUNTDOWNS_KEY)}
            >
              Sayaç sayfaları
            </button>
          </div>

          <div className="admin-record-list__items">
            {selectedMode === FREE_MATERIAL_CATEGORIES_KEY
              ? document.categories.map((category) => (
                  <button
                    key={category.key}
                    className={`admin-record-item ${selectedCategory?.key === category.key ? "admin-record-item--active" : ""}`}
                    type="button"
                    onClick={() => onSelectedCategoryKeyChange(category.key)}
                  >
                    <div className="admin-record-item__top">
                      <strong>{category.label}</strong>
                      <span>{category.publishStatus ?? "PUBLISHED"}</span>
                    </div>
                    <div className="admin-record-item__meta">
                      <span>{category.items.length} içerik</span>
                      <span>{category.key}</span>
                    </div>
                  </button>
                ))
              : document.countdownPages.map((page) => (
                  <button
                    key={page.slug}
                    className={`admin-record-item ${selectedCountdown?.slug === page.slug ? "admin-record-item--active" : ""}`}
                    type="button"
                    onClick={() => onSelectedCountdownSlugChange(page.slug)}
                  >
                    <div className="admin-record-item__top">
                      <strong>{page.title}</strong>
                      <span>{page.publishStatus ?? "PUBLISHED"}</span>
                    </div>
                    <div className="admin-record-item__meta">
                      <span>{page.targets.length} sayaç</span>
                      <span>{page.slug}</span>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        <div className="admin-record-editor">
          {selectedMode === FREE_MATERIAL_CATEGORIES_KEY && selectedCategory ? (
            <article className="admin-customer-card">
              <div className="admin-customer-card__title">
                <strong>{selectedCategory.label}</strong>
                <span>{selectedCategory.key}</span>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Kategori adı</span>
                  <input
                    className="admin-input"
                    value={selectedCategory.label}
                    onChange={(event) => updateCategory((current) => ({ ...current, label: event.target.value }))}
                  />
                </label>
                <label className="admin-field">
                  <span>Durum</span>
                  <select
                    className="admin-input admin-select"
                    value={selectedCategory.publishStatus ?? "PUBLISHED"}
                    onChange={(event) => updateCategory((current) => ({ ...current, publishStatus: event.target.value }))}
                  >
                    <option value="PUBLISHED">Yayında</option>
                    <option value="DRAFT">Taslak</option>
                    <option value="ARCHIVED">Arşiv</option>
                  </select>
                </label>
              </div>

              <label className="admin-field">
                <span>Açıklama</span>
                <textarea
                  className="admin-input admin-textarea"
                  value={selectedCategory.description ?? ""}
                  onChange={(event) => updateCategory((current) => ({ ...current, description: event.target.value || null }))}
                />
              </label>

              <div className="admin-subpanel">
                <div className="admin-customer-card__title">
                  <strong>İçerik seç</strong>
                  <span>{selectedCategory.items.length} kayıt</span>
                </div>
                <div className="admin-record-list__items admin-record-list__items--compact">
                  {selectedCategory.items.map((item, index) => {
                    const itemKey = getFreeMaterialItemKey(item, index);

                    return (
                      <button
                        key={itemKey}
                        className={`admin-record-item ${selectedItemKey === itemKey ? "admin-record-item--active" : ""}`}
                        type="button"
                        onClick={() => onSelectedItemKeyChange(itemKey)}
                      >
                        <div className="admin-record-item__top">
                          <strong>{item.title}</strong>
                          <span>{item.publishStatus ?? "PUBLISHED"}</span>
                        </div>
                        <div className="admin-record-item__meta">
                          <span>{item.itemType}</span>
                          <span>{item.href ?? item.countdownPageSlug ?? "Link yok"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedItem ? (
                <FreeMaterialItemFields item={selectedItem} onChange={updateItem} />
              ) : (
                <div className="admin-list__item">Düzenlenecek içerik kartını seçin.</div>
              )}
            </article>
          ) : null}

          {selectedMode === FREE_MATERIAL_COUNTDOWNS_KEY && selectedCountdown ? (
            <CountdownPageFields page={selectedCountdown} onChange={updateCountdown} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FreeMaterialItemFields({
  item,
  onChange
}: {
  item: AdminFreeMaterialItem;
  onChange: (updater: (item: AdminFreeMaterialItem) => AdminFreeMaterialItem) => void;
}) {
  return (
    <article className="admin-nested-card">
      <div className="admin-customer-card__title">
        <strong>{item.title}</strong>
        <span>{item.slug ?? item.itemType}</span>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>İçerik başlığı</span>
          <input
            className="admin-input"
            value={item.title}
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>Rozet</span>
          <input
            className="admin-input"
            value={item.badgeLabel ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, badgeLabel: event.target.value || null }))}
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Kısa açıklama</span>
        <textarea
          className="admin-input admin-textarea"
          value={item.summary ?? ""}
          onChange={(event) => onChange((current) => ({ ...current, summary: event.target.value || null }))}
        />
      </label>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Link</span>
          <input
            className="admin-input"
            value={item.href ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, href: event.target.value || null }))}
          />
        </label>
        <label className="admin-field">
          <span>Buton metni</span>
          <input
            className="admin-input"
            value={item.buttonLabel ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, buttonLabel: event.target.value || null }))}
          />
        </label>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Sayaç sayfası slug</span>
          <input
            className="admin-input"
            value={item.countdownPageSlug ?? ""}
            onChange={(event) =>
              onChange((current) => ({ ...current, countdownPageSlug: event.target.value || null }))
            }
          />
        </label>
        <label className="admin-field">
          <span>Durum</span>
          <select
            className="admin-input admin-select"
            value={item.publishStatus ?? "PUBLISHED"}
            onChange={(event) => onChange((current) => ({ ...current, publishStatus: event.target.value }))}
          >
            <option value="PUBLISHED">Yayında</option>
            <option value="DRAFT">Taslak</option>
            <option value="ARCHIVED">Arşiv</option>
          </select>
        </label>
      </div>

      <label className="admin-check admin-check--inline">
        <input
          type="checkbox"
          checked={item.opensInNewTab ?? false}
          onChange={(event) => onChange((current) => ({ ...current, opensInNewTab: event.target.checked }))}
        />
        <span>Yeni sekmede aç</span>
      </label>
    </article>
  );
}

function CountdownPageFields({
  page,
  onChange
}: {
  page: AdminCountdownPage;
  onChange: (updater: (page: AdminCountdownPage) => AdminCountdownPage) => void;
}) {
  return (
    <article className="admin-customer-card">
      <div className="admin-customer-card__title">
        <strong>{page.title}</strong>
        <span>{page.slug}</span>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Sayfa başlığı</span>
          <input
            className="admin-input"
            value={page.title}
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>Slug</span>
          <input
            className="admin-input"
            value={page.slug}
            onChange={(event) => onChange((current) => ({ ...current, slug: event.target.value }))}
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Açıklama</span>
        <textarea
          className="admin-input admin-textarea"
          value={page.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
        />
      </label>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Motivasyon video başlığı</span>
          <input
            className="admin-input"
            value={page.videoTitle}
            onChange={(event) => onChange((current) => ({ ...current, videoTitle: event.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>Güncelleme etiketi</span>
          <input
            className="admin-input"
            value={page.updatedLabel ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, updatedLabel: event.target.value || null }))}
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Video notu</span>
        <textarea
          className="admin-input admin-textarea"
          value={page.videoNote}
          onChange={(event) => onChange((current) => ({ ...current, videoNote: event.target.value }))}
        />
      </label>

      <div className="admin-subpanel">
        <div className="admin-customer-card__title">
          <strong>Sayaç hedefleri</strong>
          <span>{page.targets.length} hedef</span>
        </div>
        {page.targets.map((target, index) => (
          <article key={target.id ?? `${target.label}-${index}`} className="admin-nested-card">
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Etiket</span>
                <input
                  className="admin-input"
                  value={target.label}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      targets: current.targets.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, label: event.target.value } : entry
                      )
                    }))
                  }
                />
              </label>
              <label className="admin-field">
                <span>Hedef tarih / saat</span>
                <input
                  className="admin-input"
                  value={target.targetAt ?? ""}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      targets: current.targets.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, targetAt: event.target.value || null } : entry
                      )
                    }))
                  }
                />
              </label>
            </div>
            <label className="admin-field">
              <span>Not</span>
              <input
                className="admin-input"
                value={target.note}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    targets: current.targets.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, note: event.target.value } : entry
                    )
                  }))
                }
              />
            </label>
          </article>
        ))}
      </div>

      <div className="admin-subpanel">
        <div className="admin-customer-card__title">
          <strong>Resmi linkler</strong>
          <span>{page.officialLinks.length} link</span>
        </div>
        {page.officialLinks.map((link, index) => (
          <article key={link.id ?? `${link.title}-${index}`} className="admin-nested-card">
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Başlık</span>
                <input
                  className="admin-input"
                  value={link.title}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      officialLinks: current.officialLinks.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, title: event.target.value } : entry
                      )
                    }))
                  }
                />
              </label>
              <label className="admin-field">
                <span>URL</span>
                <input
                  className="admin-input"
                  value={link.href}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      officialLinks: current.officialLinks.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, href: event.target.value } : entry
                      )
                    }))
                  }
                />
              </label>
            </div>
            <label className="admin-field">
              <span>Özet</span>
              <input
                className="admin-input"
                value={link.summary}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    officialLinks: current.officialLinks.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, summary: event.target.value } : entry
                    )
                  }))
                }
              />
            </label>
          </article>
        ))}
      </div>
    </article>
  );
}

function HomepageShowcaseEditor({
  slides,
  onFieldChange,
  onUpload,
  onOpenMediaPicker
}: {
  slides: ShowcaseEditorSlide[];
  onFieldChange: (slideIndex: number, field: keyof ShowcaseEditorSlide, value: string) => void;
  onUpload: (slideIndex: number, field: "mediaUrl" | "mediaPosterUrl", file: File | null) => Promise<void>;
  onOpenMediaPicker: (request: MediaPickerRequest) => void;
}) {
  return (
    <section className="admin-showcase-editor">
      <div className="admin-showcase-editor__head">
        <div>
          <span className="admin-badge">Ana Sayfa Banner</span>
          <div className="admin-showcase-dimension-note">
            <strong>Önerilen banner ölçüsü</strong>
            <span>Görsel: 1920 × 760 px JPG/PNG/WebP. Video: 16:9 MP4/WebM, en az 1920 × 1080. Video posteri: 1920 × 760 px.</span>
          </div>
          <h2>Ana sayfa slaytlarını düzenle</h2>
          <p>Başlık, metin ve medya alanlarını yayın görünümüne uygun hazırlayın.</p>
        </div>
      </div>

      <div className="admin-showcase-editor__grid">
        {slides.map((slide, index) => (
          <article key={slide.id} className="admin-showcase-card">
            <div className="admin-showcase-card__head">
              <strong>Slayt {index + 1}</strong>
              <span>{slide.id}</span>
            </div>

            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Etiket</span>
                <input
                  className="admin-input"
                  type="text"
                  value={slide.label}
                  onChange={(event) => onFieldChange(index, "label", event.target.value)}
                />
              </label>

              <label className="admin-field">
                <span>Renk tonu</span>
                <select
                  className="admin-input admin-select"
                  value={slide.tone}
                  onChange={(event) => onFieldChange(index, "tone", event.target.value)}
                >
                  <option value="amber">Amber</option>
                  <option value="teal">Teal</option>
                  <option value="blue">Blue</option>
                </select>
              </label>
            </div>

            <label className="admin-field">
              <span>Başlık</span>
              <textarea
                className="admin-input admin-textarea admin-textarea--compact"
                value={slide.title}
                onChange={(event) => onFieldChange(index, "title", event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Açıklama</span>
              <textarea
                className="admin-input admin-textarea"
                value={slide.description}
                onChange={(event) => onFieldChange(index, "description", event.target.value)}
              />
            </label>

            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Medya tipi</span>
                <select
                  className="admin-input admin-select"
                  value={slide.mediaType}
                  onChange={(event) => onFieldChange(index, "mediaType", event.target.value)}
                >
                  <option value="IMAGE">Görsel</option>
                  <option value="VIDEO">Video</option>
                </select>
              </label>

              <label className="admin-field">
                <span>Alternatif metin</span>
                <input
                  className="admin-input"
                  type="text"
                  value={slide.mediaAlt}
                  onChange={(event) => onFieldChange(index, "mediaAlt", event.target.value)}
                />
              </label>
            </div>

            <MediaUrlField
              label={slide.mediaType === "VIDEO" ? "Video URL" : "Görsel URL"}
              value={slide.mediaUrl}
              kinds={slide.mediaType === "VIDEO" ? ["VIDEO"] : ["IMAGE", "BRANDING"]}
              pickerTitle={`Slayt ${index + 1} ${slide.mediaType === "VIDEO" ? "videosu" : "görseli"} seç`}
              onChange={(value) => onFieldChange(index, "mediaUrl", value)}
              onSelectAsset={(asset) => {
                onFieldChange(index, "mediaUrl", getMediaAssetUsableUrl(asset));
                onFieldChange(index, "mediaType", asset.kind === "VIDEO" ? "VIDEO" : "IMAGE");
              }}
              onOpenMediaPicker={onOpenMediaPicker}
            />

            <div className="admin-form-grid admin-showcase-upload-grid">
              <LocalUploadField
                label={slide.mediaType === "VIDEO" ? "Video / görsel yükle" : "Görsel yükle"}
                actionLabel="Bilgisayardan dosya seç"
                helper="Yerel bilgisayardan banner görseli veya kısa tanıtım videosu seç."
                accept="image/*,video/*"
                onFileSelect={(file) => void onUpload(index, "mediaUrl", file)}
              />
              <label className="admin-field">
                <span>Görsel yükle</span>
                <input
                  className="admin-input admin-file-input"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(event) => void onUpload(index, "mediaUrl", event.target.files?.[0] ?? null)}
                />
              </label>

              <MediaUrlField
                label="Poster URL"
                value={slide.mediaPosterUrl}
                kinds={["IMAGE", "BRANDING"]}
                pickerTitle={`Slayt ${index + 1} poster görseli seç`}
                onChange={(value) => onFieldChange(index, "mediaPosterUrl", value)}
                onOpenMediaPicker={onOpenMediaPicker}
              />
            </div>

            <label className="admin-field">
              <span>Poster yükle</span>
              <input
                className="admin-input admin-file-input"
                type="file"
                accept="image/*"
                onChange={(event) => void onUpload(index, "mediaPosterUrl", event.target.files?.[0] ?? null)}
              />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}

function LocalUploadField({
  label,
  actionLabel,
  helper,
  accept,
  onFileSelect
}: {
  label: string;
  actionLabel: string;
  helper: string;
  accept: string;
  onFileSelect: (file: File | null) => void;
}) {
  return (
    <label className="admin-local-upload-field">
      <span className="admin-local-upload-field__label">{label}</span>
      <input
        className="admin-local-upload-field__input"
        type="file"
        accept={accept}
        onChange={(event) => {
          onFileSelect(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />
      <span className="admin-local-upload-field__button">{actionLabel}</span>
      <small>{helper}</small>
    </label>
  );
}

function MediaUrlField({
  label,
  value,
  kinds,
  pickerTitle,
  placeholder,
  onChange,
  onSelectAsset,
  onOpenMediaPicker
}: {
  label: string;
  value: string;
  kinds: AdminMediaKind[];
  pickerTitle: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSelectAsset?: (asset: AdminMediaAsset) => void;
  onOpenMediaPicker: (request: MediaPickerRequest) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <div className="admin-media-url-field">
        <input
          className="admin-input"
          type="text"
          value={value}
          placeholder={placeholder ?? "Medya URL'si"}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          className="admin-button--ghost admin-button--compact"
          type="button"
          onClick={() =>
            onOpenMediaPicker({
              title: pickerTitle,
              description: `${kinds.join(", ")} türündeki medya kayıtları listelenir.`,
              kinds,
              onSelect: (asset) => {
                if (onSelectAsset) {
                  onSelectAsset(asset);
                  return;
                }

                onChange(getMediaAssetUsableUrl(asset));
              }
            })
          }
        >
          Medyadan Seç
        </button>
      </div>
    </label>
  );
}

function MediaPickerModal({
  request,
  assets,
  loading,
  error,
  onClose,
  onReload,
  onSelect
}: {
  request: MediaPickerRequest;
  assets: AdminMediaAsset[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onReload: () => void;
  onSelect: (asset: AdminMediaAsset) => void;
}) {
  const filteredAssets = assets.filter((asset) => request.kinds.includes(asset.kind));

  return (
    <div className="admin-media-picker" role="dialog" aria-modal="true" aria-label={request.title}>
      <button className="admin-media-picker__backdrop" type="button" aria-label="Kapat" onClick={onClose} />

      <section className="admin-media-picker__panel">
        <div className="admin-media-picker__head">
          <div>
            <span className="admin-badge">Medya Kütüphanesi</span>
            <h2>{request.title}</h2>
            <p>{request.description ?? "Uygun medya kaydını seçin."}</p>
          </div>

          <div className="admin-actions">
            <button className="admin-button--ghost" type="button" onClick={onReload} disabled={loading}>
              {loading ? "Yükleniyor..." : "Yenile"}
            </button>
            <Link className="admin-button--ghost" href="/medya" target="_blank">
              Medya Ekle
            </Link>
            <button className="admin-button" type="button" onClick={onClose}>
              Kapat
            </button>
          </div>
        </div>

        {error ? <div className="admin-message admin-message--error">{error}</div> : null}
        {loading ? <div className="admin-message admin-message--success">Medya kayıtları yükleniyor.</div> : null}

        {!loading && filteredAssets.length === 0 ? (
          <div className="admin-empty-state">
            Uygun medya bulunamadı. Medya Kütüphanesi’nden yeni kayıt ekleyin.
          </div>
        ) : null}

        <div className="admin-media-picker__grid">
          {filteredAssets.map((asset) => (
            <article key={asset.id} className="admin-media-picker-card">
              <div className="admin-media-picker-card__preview">
                {asset.kind === "IMAGE" || asset.kind === "BRANDING" ? (
                  getMediaAssetUsableUrl(asset) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getMediaAssetUsableUrl(asset)} alt={asset.altText ?? asset.title} />
                  ) : (
                    <span>{asset.kind}</span>
                  )
                ) : asset.kind === "VIDEO" && asset.embedUrl ? (
                  <iframe src={asset.embedUrl} title={asset.title} loading="lazy" allowFullScreen />
                ) : asset.kind === "VIDEO" && asset.publicUrl ? (
                  <video src={asset.publicUrl} poster={asset.thumbnailUrl ?? undefined} preload="metadata" controls />
                ) : (
                  <span>{asset.kind}</span>
                )}
              </div>

              <div className="admin-media-picker-card__body">
                <strong>{asset.title}</strong>
                <span>
                  {asset.kind} · {asset.sourceType}
                </span>
                <code>{getMediaAssetUsableUrl(asset) || "URL yok"}</code>
              </div>

              <button
                className="admin-button"
                type="button"
                disabled={!getMediaAssetUsableUrl(asset)}
                onClick={() => onSelect(asset)}
              >
                Bu Medyayı Kullan
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PackagesRibbonEditor({
  state,
  onChange
}: {
  state: PackagesRibbonEditorState;
  onChange: (field: keyof PackagesRibbonEditorState, value: string | boolean) => void;
}) {
  return (
    <section className="admin-showcase-editor">
      <div className="admin-showcase-editor__head">
        <div>
          <span className="admin-badge">Paketlerimiz Ribbon</span>
          <h2>Güvence şeridi</h2>
          <p>Paketler sayfasındaki güven mesajını düzenleyin.</p>
        </div>
      </div>

      <article className="admin-showcase-card">
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Görünür</span>
            <select
              className="admin-input admin-select"
              value={state.isActive ? "on" : "off"}
              onChange={(event) => onChange("isActive", event.target.value === "on")}
            >
              <option value="on">Açık</option>
              <option value="off">Kapalı</option>
            </select>
          </label>
        </div>

        <label className="admin-field">
          <span>Ribbon metni</span>
          <input
            className="admin-input"
            type="text"
            value={state.title}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </label>
      </article>
    </section>
  );
}

function getActiveRecordLabel(
  activeTab: AdminTabKey,
  selectedMarketingPage: AdminMarketingPage | null,
  staffDocument: AdminStaffProfilesDocument | null,
  successDocument: AdminSuccessStoriesDocument | null,
  freeMaterialsDocument: AdminFreeMaterialsDocument | null
) {
  if (activeTab === "marketing-pages") {
    return selectedMarketingPage?.title ?? "Sayfa seçimi bekleniyor";
  }

  if (activeTab === "academic-staff") {
    return `${staffDocument?.groups.length ?? 0} kadro grubu`;
  }

  if (activeTab === "success-stories") {
    return `${successDocument?.stories.length ?? 0} başarı hikayesi`;
  }

  if (activeTab === "free-materials") {
    return `${freeMaterialsDocument?.categories.length ?? 0} kategori, ${freeMaterialsDocument?.countdownPages.length ?? 0} sayaç sayfası`;
  }

  return "Primary navigation";
}

function serializeContentSnapshot(value: unknown) {
  return JSON.stringify(value ?? null);
}

function createMarketingPageSnapshots(pages: AdminMarketingPage[]) {
  return pages.reduce<Record<string, string>>((snapshots, page) => {
    snapshots[page.key] = serializeContentSnapshot(page);
    return snapshots;
  }, {});
}

function getSelectedFreeMaterialItem(
  document: AdminFreeMaterialsDocument | null,
  selectedCategoryKey: string,
  selectedItemKey: string
) {
  const category = document?.categories.find((entry) => entry.key === selectedCategoryKey);

  return (
    category?.items.find((item, index) => getFreeMaterialItemKey(item, index) === selectedItemKey) ??
    null
  );
}

function getHasUnsavedChanges({
  activeTab,
  navigationMenu,
  selectedMarketingPage,
  staffDocument,
  successDocument,
  freeMaterialsDocument,
  savedSnapshots
}: {
  activeTab: AdminTabKey;
  navigationMenu: AdminNavigationMenu | null;
  selectedMarketingPage: AdminMarketingPage | null;
  staffDocument: AdminStaffProfilesDocument | null;
  successDocument: AdminSuccessStoriesDocument | null;
  freeMaterialsDocument: AdminFreeMaterialsDocument | null;
  savedSnapshots: SavedContentSnapshots;
}) {
  if (activeTab === "navigation") {
    return serializeContentSnapshot(navigationMenu) !== savedSnapshots.navigation;
  }

  if (activeTab === "marketing-pages") {
    if (!selectedMarketingPage) {
      return false;
    }

    return (
      serializeContentSnapshot(selectedMarketingPage) !==
      (savedSnapshots.marketingPages[selectedMarketingPage.key] ?? "")
    );
  }

  if (activeTab === "academic-staff") {
    return serializeContentSnapshot(staffDocument) !== savedSnapshots.staff;
  }

  if (activeTab === "success-stories") {
    return serializeContentSnapshot(successDocument) !== savedSnapshots.success;
  }

  return serializeContentSnapshot(freeMaterialsDocument) !== savedSnapshots.freeMaterials;
}

function getContentPreviewHref({
  activeTab,
  selectedMarketingPage,
  selectedFreeMaterialMode,
  selectedCountdownPageSlug,
  selectedFreeMaterialItem
}: {
  activeTab: AdminTabKey;
  selectedMarketingPage: AdminMarketingPage | null;
  selectedFreeMaterialMode: typeof FREE_MATERIAL_CATEGORIES_KEY | typeof FREE_MATERIAL_COUNTDOWNS_KEY;
  selectedCountdownPageSlug: string;
  selectedFreeMaterialItem: AdminFreeMaterialItem | null;
}) {
  const baseUrl = getPublicWebBaseUrl();

  if (activeTab === "marketing-pages") {
    return toPreviewUrl(baseUrl, getMarketingPagePreviewPath(selectedMarketingPage));
  }

  if (activeTab === "academic-staff") {
    return toPreviewUrl(baseUrl, "/akademik-kadro");
  }

  if (activeTab === "success-stories") {
    return toPreviewUrl(baseUrl, "/basarilarimiz");
  }

  if (activeTab === "free-materials") {
    if (selectedFreeMaterialMode === FREE_MATERIAL_COUNTDOWNS_KEY && selectedCountdownPageSlug) {
      return toPreviewUrl(baseUrl, `/ucretsiz-materyaller/${selectedCountdownPageSlug}`);
    }

    if (selectedFreeMaterialItem?.countdownPageSlug) {
      return toPreviewUrl(baseUrl, `/ucretsiz-materyaller/${selectedFreeMaterialItem.countdownPageSlug}`);
    }

    if (selectedFreeMaterialItem?.href) {
      return toPreviewUrl(baseUrl, selectedFreeMaterialItem.href);
    }

    return toPreviewUrl(baseUrl, "/ucretsiz-materyaller");
  }

  return toPreviewUrl(baseUrl, "/");
}

function getPublicWebBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_WEB_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }

    return window.location.origin.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

function getMarketingPagePreviewPath(page: AdminMarketingPage | null) {
  if (!page) {
    return "/";
  }

  const slug = page.slug.trim().replace(/^\/+|\/+$/g, "");

  if (!slug || page.key === "home" || slug === "home") {
    return "/";
  }

  return `/${slug}`;
}

function toPreviewUrl(baseUrl: string, href: string) {
  const trimmedHref = href.trim();

  if (/^https?:\/\//i.test(trimmedHref)) {
    return trimmedHref;
  }

  if (!trimmedHref || trimmedHref === "/") {
    return `${baseUrl}/`;
  }

  return `${baseUrl}/${trimmedHref.replace(/^\/+/, "")}`;
}

function validateActiveContent({
  activeTab,
  navigationMenu,
  selectedMarketingPage,
  staffDocument,
  successDocument,
  freeMaterialsDocument
}: {
  activeTab: AdminTabKey;
  navigationMenu: AdminNavigationMenu | null;
  selectedMarketingPage: AdminMarketingPage | null;
  staffDocument: AdminStaffProfilesDocument | null;
  successDocument: AdminSuccessStoriesDocument | null;
  freeMaterialsDocument: AdminFreeMaterialsDocument | null;
}) {
  if (activeTab === "navigation") {
    return validateNavigationMenu(navigationMenu);
  }

  if (activeTab === "marketing-pages") {
    return validateMarketingPage(selectedMarketingPage);
  }

  if (activeTab === "academic-staff") {
    return validateStaffDocument(staffDocument);
  }

  if (activeTab === "success-stories") {
    return validateSuccessStories(successDocument);
  }

  return validateFreeMaterialsDocument(freeMaterialsDocument);
}

function validateNavigationMenu(menu: AdminNavigationMenu | null) {
  const errors: string[] = [];

  if (!menu) {
    return ["Navigasyon kaydı yüklenmedi."];
  }

  if (isBlank(menu.name)) {
    errors.push("Navigasyon adı boş bırakılamaz.");
  }

  if (isBlank(menu.location)) {
    errors.push("Navigasyon konumu boş bırakılamaz.");
  }

  if (menu.items.length === 0) {
    errors.push("Navigasyon içinde en az bir menü öğesi olmalı.");
  }

  validateNavigationItems(menu.items, errors);

  return errors;
}

function validateNavigationItems(items: AdminNavigationItem[], errors: string[], prefix = "Menü") {
  items.forEach((item, index) => {
    const itemLabel = item.label?.trim() || `${prefix} ${index + 1}`;
    const childItems = Array.isArray(item.children) ? item.children : [];

    if (isBlank(item.itemKey)) {
      errors.push(`${itemLabel}: sistem anahtarı boş bırakılamaz.`);
    }

    if (isBlank(item.label)) {
      errors.push(`${prefix} ${index + 1}: görünen başlık boş bırakılamaz.`);
    }

    if (!isValidInternalOrExternalHref(item.href)) {
      errors.push(`${itemLabel}: geçerli bir link yazın. Örnek: /paketlerimiz veya https://...`);
    }

    if (childItems.length > 0) {
      validateNavigationItems(childItems, errors, itemLabel);
    }
  });
}

function validateMarketingPage(page: AdminMarketingPage | null) {
  const errors: string[] = [];

  if (!page) {
    return ["Düzenlenecek sayfa seçilmedi."];
  }

  if (isBlank(page.title)) {
    errors.push("Sayfa başlığı boş bırakılamaz.");
  }

  if (isBlank(page.slug)) {
    errors.push("Sayfa slug alanı boş bırakılamaz.");
  }

  if (isBlank(page.publishStatus)) {
    errors.push("Sayfa yayın durumu seçilmeli.");
  }

  page.sections.forEach((section, index) => {
    const sectionLabel = section.title?.trim() || section.sectionKey || `Bölüm ${index + 1}`;

    if (isBlank(section.sectionKey)) {
      errors.push(`${sectionLabel}: bölüm anahtarı boş bırakılamaz.`);
    }

    if (section.isActive !== false && !hasMeaningfulSectionContent(section)) {
      errors.push(`${sectionLabel}: aktif bölümde başlık, metin veya içerik verisi olmalı.`);
    }
  });

  if (page.key === "home") {
    getMarketingPageShowcaseSlides(page).forEach((slide, index) => {
      const slideLabel = slide.label || `Slayt ${index + 1}`;

      if (isBlank(slide.title)) {
        errors.push(`${slideLabel}: slayt başlığı boş bırakılamaz.`);
      }

      if (isBlank(slide.description)) {
        errors.push(`${slideLabel}: slayt açıklaması boş bırakılamaz.`);
      }
    });
  }

  if (page.slug.trim().replace(/^\/+|\/+$/g, "") === "paketlerimiz") {
    const ribbon = getPackagesRibbonState(page);

    if (ribbon.isActive && isBlank(ribbon.title)) {
      errors.push("Paketlerimiz güvence şeridi açıkken metin boş bırakılamaz.");
    }
  }

  return errors;
}

function validateStaffDocument(document: AdminStaffProfilesDocument | null) {
  const errors: string[] = [];

  if (!document) {
    return ["Akademik kadro belgesi yüklenmedi."];
  }

  if (document.groups.length === 0) {
    errors.push("Akademik kadro içinde en az bir grup olmalı.");
  }

  document.groups.forEach((group, groupIndex) => {
    const groupLabel = group.label?.trim() || `Grup ${groupIndex + 1}`;

    if (isBlank(group.key)) {
      errors.push(`${groupLabel}: grup anahtarı boş bırakılamaz.`);
    }

    if (isBlank(group.label)) {
      errors.push(`Grup ${groupIndex + 1}: grup adı boş bırakılamaz.`);
    }

    if (group.introVideoUrl && !isValidAssetHref(group.introVideoUrl)) {
      errors.push(`${groupLabel}: tanıtım video linki geçerli değil.`);
    }

    group.profiles.forEach((profile, profileIndex) => {
      const profileLabel = profile.fullName?.trim() || `${groupLabel} profil ${profileIndex + 1}`;

      if (isBlank(profile.fullName)) {
        errors.push(`${groupLabel}: profil adı boş bırakılamaz.`);
      }

      if (isBlank(profile.slug)) {
        errors.push(`${profileLabel}: profil slug alanı boş bırakılamaz.`);
      }

      if (isBlank(profile.title)) {
        errors.push(`${profileLabel}: görev/unvan alanı boş bırakılamaz.`);
      }

      if (profile.photoUrl && !isValidAssetHref(profile.photoUrl)) {
        errors.push(`${profileLabel}: profil fotoğraf linki geçerli değil.`);
      }
    });
  });

  return errors;
}

function validateSuccessStories(document: AdminSuccessStoriesDocument | null) {
  const errors: string[] = [];

  if (!document) {
    return ["Başarı hikayeleri belgesi yüklenmedi."];
  }

  document.stories.forEach((story, index) => {
    const storyLabel = story.studentName?.trim() || `Başarı kaydı ${index + 1}`;

    if (isBlank(story.studentName)) {
      errors.push(`Başarı kaydı ${index + 1}: öğrenci adı boş bırakılamaz.`);
    }

    if (isBlank(story.slug)) {
      errors.push(`${storyLabel}: slug alanı boş bırakılamaz.`);
    }

    if (isBlank(story.resultTitle)) {
      errors.push(`${storyLabel}: sonuç başlığı boş bırakılamaz.`);
    }

    if (isBlank(story.highlight)) {
      errors.push(`${storyLabel}: öne çıkan başarı metni boş bırakılamaz.`);
    }

    if (story.avatarUrl && !isValidAssetHref(story.avatarUrl)) {
      errors.push(`${storyLabel}: görsel linki geçerli değil.`);
    }
  });

  return errors;
}

function validateFreeMaterialsDocument(document: AdminFreeMaterialsDocument | null) {
  const errors: string[] = [];

  if (!document) {
    return ["Ücretsiz materyaller belgesi yüklenmedi."];
  }

  if (document.categories.length === 0) {
    errors.push("Ücretsiz materyaller içinde en az bir kategori olmalı.");
  }

  document.categories.forEach((category, categoryIndex) => {
    const categoryLabel = category.label?.trim() || `Kategori ${categoryIndex + 1}`;

    if (isBlank(category.key)) {
      errors.push(`${categoryLabel}: kategori anahtarı boş bırakılamaz.`);
    }

    if (isBlank(category.label)) {
      errors.push(`Kategori ${categoryIndex + 1}: kategori adı boş bırakılamaz.`);
    }

    category.items.forEach((item, itemIndex) => {
      const itemLabel = item.title?.trim() || `${categoryLabel} içerik ${itemIndex + 1}`;

      if (isBlank(item.title)) {
        errors.push(`${categoryLabel}: içerik başlığı boş bırakılamaz.`);
      }

      if (isBlank(item.itemType)) {
        errors.push(`${itemLabel}: içerik tipi boş bırakılamaz.`);
      }

      if (!item.href && !item.countdownPageSlug) {
        errors.push(`${itemLabel}: bir hedef link veya sayaç sayfası slug değeri olmalı.`);
      }

      if (item.href && !isValidInternalOrExternalHref(item.href)) {
        errors.push(`${itemLabel}: hedef link geçerli değil.`);
      }
    });
  });

  document.countdownPages.forEach((page, pageIndex) => {
    const pageLabel = page.title?.trim() || `Sayaç sayfası ${pageIndex + 1}`;

    if (isBlank(page.slug)) {
      errors.push(`${pageLabel}: slug alanı boş bırakılamaz.`);
    }

    if (isBlank(page.title)) {
      errors.push(`Sayaç sayfası ${pageIndex + 1}: başlık boş bırakılamaz.`);
    }

    if (isBlank(page.description)) {
      errors.push(`${pageLabel}: açıklama boş bırakılamaz.`);
    }

    page.targets.forEach((target, targetIndex) => {
      const targetLabel = target.label?.trim() || `${pageLabel} hedef ${targetIndex + 1}`;

      if (isBlank(target.label)) {
        errors.push(`${pageLabel}: sayaç hedef adı boş bırakılamaz.`);
      }

      if (isBlank(target.targetAt) || Number.isNaN(Date.parse(target.targetAt ?? ""))) {
        errors.push(`${targetLabel}: geçerli bir tarih/saat girilmeli.`);
      }

      if (isBlank(target.dateLabel)) {
        errors.push(`${targetLabel}: görünen sınav tarihi boş bırakılamaz.`);
      }
    });

    page.officialLinks.forEach((link, linkIndex) => {
      const linkLabel = link.title?.trim() || `${pageLabel} resmi link ${linkIndex + 1}`;

      if (isBlank(link.title)) {
        errors.push(`${pageLabel}: resmi link başlığı boş bırakılamaz.`);
      }

      if (!isValidInternalOrExternalHref(link.href)) {
        errors.push(`${linkLabel}: geçerli bir resmi link yazın.`);
      }
    });

    page.articleSections.forEach((section, sectionIndex) => {
      const sectionLabel = section.title?.trim() || `${pageLabel} yazı bölümü ${sectionIndex + 1}`;

      if (isBlank(section.title)) {
        errors.push(`${pageLabel}: yazı bölüm başlığı boş bırakılamaz.`);
      }

      if (isBlank(section.body)) {
        errors.push(`${sectionLabel}: yazı metni boş bırakılamaz.`);
      }
    });
  });

  return errors;
}

function hasMeaningfulSectionContent(section: AdminMarketingPageSection) {
  if (!isBlank(section.title) || !isBlank(section.body) || !isBlank(section.eyebrow)) {
    return true;
  }

  if (!section.payload) {
    return false;
  }

  return Object.keys(section.payload).length > 0;
}

function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

function isValidInternalOrExternalHref(value: string | null | undefined) {
  const href = value?.trim() ?? "";

  if (!href) {
    return false;
  }

  return (
    href.startsWith("/") ||
    href.startsWith("#") ||
    /^(https?:\/\/|mailto:|tel:)/i.test(href)
  );
}

function isValidAssetHref(value: string) {
  return isValidInternalOrExternalHref(value) || value.startsWith("data:");
}

function getMediaAssetUsableUrl(asset: AdminMediaAsset) {
  return asset.url ?? asset.embedUrl ?? asset.publicUrl ?? asset.externalUrl ?? asset.thumbnailUrl ?? "";
}

function getNavigationItemKey(item: AdminNavigationItem, index: number) {
  return item.itemKey || item.id || `navigation-${index}`;
}

function getStaffProfileKey(profile: AdminStaffProfile, index: number) {
  return profile.slug || profile.id || `${profile.fullName}-${index}`;
}

function getSuccessStoryKey(story: AdminSuccessStory, index: number) {
  return story.slug || story.id || `${story.studentName}-${index}`;
}

function getFreeMaterialItemKey(item: AdminFreeMaterialItem, index: number) {
  return item.slug || item.id || `${item.title}-${index}`;
}

function isShowcaseTone(value: unknown): value is ShowcaseTone {
  return value === "amber" || value === "teal" || value === "blue";
}

function isShowcaseMediaType(value: unknown): value is ShowcaseMediaType {
  return value === "IMAGE" || value === "VIDEO";
}

function getMarketingPageShowcaseSlides(page: AdminMarketingPage | null) {
  const showcaseSection = page?.sections.find((section) => section.sectionKey === "showcase-hero");
  const payloadSlides = Array.isArray(showcaseSection?.payload?.slides) ? showcaseSection.payload.slides : [];

  if (payloadSlides.length === 0) {
    return defaultShowcaseSlides;
  }

  return payloadSlides
    .map((rawSlide, index) => {
      if (!rawSlide || typeof rawSlide !== "object") {
        return null;
      }

      const source = rawSlide as Record<string, unknown>;
      const fallback = defaultShowcaseSlides[index] ?? defaultShowcaseSlides[0];

      return {
        id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : fallback.id,
        label:
          typeof source.label === "string" && source.label.trim().length > 0
            ? source.label
            : fallback.label,
        title:
          typeof source.title === "string" && source.title.trim().length > 0
            ? source.title
            : fallback.title,
        description:
          typeof source.description === "string" && source.description.trim().length > 0
            ? source.description
            : fallback.description,
        tone: isShowcaseTone(source.tone) ? source.tone : fallback.tone,
        mediaType: isShowcaseMediaType(source.mediaType) ? source.mediaType : fallback.mediaType,
        mediaUrl:
          typeof source.mediaUrl === "string" && source.mediaUrl.trim().length > 0
            ? source.mediaUrl.trim()
            : fallback.mediaUrl,
        mediaPosterUrl:
          typeof source.mediaPosterUrl === "string" && source.mediaPosterUrl.trim().length > 0
            ? source.mediaPosterUrl.trim()
            : fallback.mediaPosterUrl,
        mediaAlt:
          typeof source.mediaAlt === "string" && source.mediaAlt.trim().length > 0
            ? source.mediaAlt
            : fallback.mediaAlt
      } satisfies ShowcaseEditorSlide;
    })
    .filter((slide): slide is ShowcaseEditorSlide => slide !== null);
}

function getPackagesRibbonState(page: AdminMarketingPage | null): PackagesRibbonEditorState {
  const ribbonSection = page?.sections.find((section) => section.sectionKey === "packages-guarantee-ribbon");

  return {
    isActive: ribbonSection?.isActive ?? true,
    title:
      ribbonSection?.title?.trim() ||
      "Memnun Kalmazsan %100 İade Garantisi Sağlıyoruz!"
  };
}

function withUpdatedShowcaseSlides(
  page: AdminMarketingPage,
  updater: (slides: ShowcaseEditorSlide[]) => ShowcaseEditorSlide[]
) {
  const nextSlides = updater(getMarketingPageShowcaseSlides(page)).map((slide) => ({
    ...slide,
    mediaPosterUrl: slide.mediaPosterUrl || undefined
  }));

  const sections =
    page.sections.length > 0
      ? page.sections.map((section) =>
          section.sectionKey === "showcase-hero"
            ? {
                ...section,
                payload: {
                  ...(section.payload ?? {}),
                  slides: nextSlides
                }
              }
            : section
        )
      : [
          {
            sectionKey: "showcase-hero",
            eyebrow: "Eğitim Gurmesi Akademi",
            title: page.title,
            body: page.description ?? "",
            variantKey: "showcase-hero",
            sortOrder: 10,
            payload: { slides: nextSlides },
            isActive: true,
            publishStatus: "PUBLISHED"
          }
        ];

  return {
    ...page,
    sections
  };
}

function withUpdatedPackagesRibbon(
  page: AdminMarketingPage,
  field: keyof PackagesRibbonEditorState,
  value: string | boolean
) {
  const current = getPackagesRibbonState(page);
  const next = {
    ...current,
    [field]: value
  };

  const hasSection = page.sections.some((section) => section.sectionKey === "packages-guarantee-ribbon");
  const sections = hasSection
    ? page.sections.map((section) =>
        section.sectionKey === "packages-guarantee-ribbon"
          ? {
              ...section,
              title: next.title,
              isActive: next.isActive,
              variantKey: section.variantKey ?? "guarantee-ribbon",
              sortOrder: section.sortOrder ?? 20,
              publishStatus: section.publishStatus ?? "PUBLISHED"
            }
          : section
      )
    : [
        ...page.sections,
        {
          sectionKey: "packages-guarantee-ribbon",
          eyebrow: "Güvence",
          title: next.title,
          body: "",
          variantKey: "guarantee-ribbon",
          sortOrder: 20,
          payload: {},
          isActive: next.isActive,
          publishStatus: "PUBLISHED"
        }
      ];

  return {
    ...page,
    sections
  };
}


function countNavigationItems(items: readonly { children?: readonly unknown[] }[]): number {
  return items.reduce((total, item) => {
    const childCount: number = Array.isArray(item.children)
      ? countNavigationItems(item.children)
      : 0;
    return total + 1 + childCount;
  }, 0);
}
