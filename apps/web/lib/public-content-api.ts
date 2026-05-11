import type { AcademicStaffGroup } from "./academic-staff";
import { academicStaffGroups } from "./academic-staff";
import type { ExamCountdownPage, ExamCountdownTarget, ResourceLink } from "./free-materials";
import {
  examCountdownPages,
  freeTools as fallbackFreeTools,
  guidanceContent as fallbackGuidanceContent,
  pdfDocuments as fallbackPdfDocuments,
  speedReading as fallbackSpeedReading,
  usefulLinks as fallbackUsefulLinks
} from "./free-materials";
import type { PublicNavItem, PublicMegaMenuColumn, PublicNavLeaf } from "./navigation";
import { publicNavigationItems } from "./navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

const fallbackHomePage = {
  key: "home",
  slug: "home",
  title: "Ana Sayfa",
  excerpt: "Kayıt, paket seçimi, ücretsiz materyaller ve koçluk vitrini.",
  description: "Eğitim Gurmesi Akademi ana sayfa içerikleri.",
  seoTitle: "Eğitim Gurmesi Akademi",
  seoDescription: "Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları.",
  sections: [
    {
      sectionKey: "showcase-hero",
      eyebrow: "Eğitim Gurmesi Akademi",
      title: "Öğrencinin kayıt, paket ve çalışma düzenini tek akışta toplayan açılış alanı",
      body: "Bu bölüm, markanın satış vitrini ile öğrenci deneyimini aynı sahnede birleştirir.",
      variantKey: "showcase-hero",
      sortOrder: 10,
      payload: {
        ctaPrimary: { label: "Paketleri İncele", href: "/paketlerimiz" },
        ctaSecondary: { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" }
      }
    },
    {
      sectionKey: "logo-rail",
      eyebrow: "Canlı akış",
      title: "Hareketli logo ve alan ritmi",
      body: "Kurumsal vitrin, kamp ve içerik akışının arasında nefes alan alan.",
      variantKey: "logo-rail",
      sortOrder: 20,
      payload: {
        items: ["Fen Sprinti", "Koçluk Takibi", "Deneme Analizi", "Tekrar Serisi", "Temel Hazırlık"]
      }
    },
    {
      sectionKey: "package-surface",
      eyebrow: "Paket yapısı",
      title: "Koçluk ve video ürünlerini ayrıştıran katalog alanı",
      body: "Kategori bazlı yönlendirme, öğrenciyi doğru ürün akışına alır.",
      variantKey: "packages-surface",
      sortOrder: 30,
      payload: {
        featuredCategories: ["online-coaching", "in-person-coaching", "exam-camp"]
      }
    }
  ]
} as const;

const fallbackAboutPage = {
  key: "about",
  slug: "hakkimizda",
  title: "Hakkımızda",
  excerpt: "Marka yaklaşımı, ekip ve sistem vizyonu.",
  description: "Eğitim Gurmesi Akademi marka ve yaklaşım sayfası.",
  seoTitle: "Hakkımızda",
  seoDescription: "Eğitim Gurmesi Akademi hakkında daha fazla bilgi alın.",
  sections: [
    {
      sectionKey: "about-intro",
      eyebrow: "Yaklaşımımız",
      title: "Koçluk, içerik ve öğrenci düzenini aynı sistemde topluyoruz",
      body: "Marka yaklaşımı; düzen, görünür takip ve kontrollü öğrenci akışı üzerine kurulur.",
      variantKey: "about-intro",
      sortOrder: 10,
      payload: {}
    }
  ]
} as const;

const fallbackSuccessStories = [
  {
    id: "fallback-success-1",
    slug: "ayse-yks-disiplin-artisi",
    studentName: "Ayşe D.",
    city: "Ankara",
    examLabel: "2025 YKS",
    resultTitle: "Düzenli net artışı ve kontrollü süreç",
    highlight: "Haftalık takip, deneme analizi ve koçluk akışıyla istikrarlı yükseliş.",
    story:
      "Öğrenci önce çalışma düzensizliği sorunu yaşarken, planlı haftalık akış ve görünür takip sistemi ile süreci stabilize etti.",
    avatarUrl: null,
    isFeatured: true
  },
  {
    id: "fallback-success-2",
    slug: "mert-lgs-ritim-kurulumu",
    studentName: "Mert K.",
    city: "Ankara",
    examLabel: "2025 LGS",
    resultTitle: "Ders ritmi ve sınav sabahı kontrolü",
    highlight: "Aile görünürlüğü ve rutin takibi ile daha net bir sınav hazırlığı.",
    story:
      "Velinin de dahil olduğu görünür takip yapısı ile ders düzeni oturtuldu ve deneme performansı toparlandı.",
    avatarUrl: null,
    isFeatured: true
  },
  {
    id: "fallback-success-3",
    slug: "zeynep-ayt-kapanis-plani",
    studentName: "Zeynep A.",
    city: "Ankara",
    examLabel: "2025 AYT",
    resultTitle: "Son viraj tekrar kapanışı",
    highlight: "Tekrar kampı ve analiz bloklarıyla kapanış temposu kuruldu.",
    story:
      "Öğrenci son dönemde tekrar listesini netleştirerek kamp akışıyla eksiklerini görünür biçimde kapattı.",
    avatarUrl: null,
    isFeatured: false
  }
] as const;

type NavigationNodeResponse = {
  id: string;
  itemKey: string;
  label: string;
  href: string;
  description: string | null;
  target: string | null;
  children: NavigationNodeResponse[];
};

type NavigationMenuResponse = {
  id: string;
  key: string;
  name: string;
  location: string;
  items: NavigationNodeResponse[];
};

type StaffProfileResponse = {
  id: string;
  fullName: string;
  title: string;
  city: string | null;
  photoUrl: string | null;
};

type StaffProfileGroupResponse = {
  id: string;
  key: string;
  label: string;
  eyebrow: string;
  description: string;
  profiles: StaffProfileResponse[];
};

type FreeMaterialItemResponse = {
  id: string;
  title: string;
  badgeLabel: string | null;
  summary: string;
  href: string;
  buttonLabel: string | null;
  opensInNewTab: boolean;
  countdownPage: {
    slug: string;
    title: string;
    updatedLabel: string;
  } | null;
};

type FreeMaterialCategoryResponse = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  items: FreeMaterialItemResponse[];
};

type CountdownTargetResponse = {
  id: string;
  label: string;
  targetAt: string | null;
  dateLabel: string;
  note: string;
};

type CountdownOfficialLinkResponse = {
  id: string;
  title: string;
  linkType: string;
  summary: string;
  href: string;
  buttonLabel: string | null;
};

type CountdownArticleSectionResponse = {
  id: string;
  title: string;
  body: string;
};

type CountdownPageResponse = {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  updatedLabel: string;
  videoTitle: string;
  videoNote: string;
  targets: CountdownTargetResponse[];
  officialLinks: CountdownOfficialLinkResponse[];
  articleSections: CountdownArticleSectionResponse[];
};

type MarketingPageSectionResponse = {
  id: string;
  sectionKey: string;
  eyebrow: string | null;
  title: string;
  body: string | null;
  variantKey: string | null;
  payload: Record<string, unknown> | null;
  sortOrder: number;
};

type MarketingPageResponse = {
  id: string;
  key: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sections: MarketingPageSectionResponse[];
};

type SuccessStoryResponse = {
  id: string;
  slug: string;
  studentName: string;
  city: string | null;
  examLabel: string;
  resultTitle: string;
  highlight: string;
  story: string;
  avatarUrl: string | null;
  isFeatured: boolean;
};

type CollectionPayload<T> = T[] | { value: T[] };

export type FreeMaterialsContent = {
  freeTools: readonly ResourceLink[];
  usefulLinks: readonly ResourceLink[];
  pdfDocuments: readonly ResourceLink[];
  guidanceContent: readonly ResourceLink[];
  speedReading: ResourceLink;
  countdownPages: readonly ExamCountdownPage[];
};

export type MarketingPageSection = {
  id: string;
  sectionKey: string;
  eyebrow?: string;
  title: string;
  body?: string;
  variantKey?: string;
  payload: Record<string, unknown>;
  sortOrder: number;
};

export type MarketingPageContent = {
  id: string;
  key: string;
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  sections: readonly MarketingPageSection[];
};

export type SuccessStoryContent = {
  id: string;
  slug: string;
  studentName: string;
  city?: string;
  examLabel: string;
  resultTitle: string;
  highlight: string;
  story: string;
  avatarUrl?: string;
  isFeatured: boolean;
};

async function requestJson<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Public content request failed for "${path}" with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function unwrapCollection<T>(payload: CollectionPayload<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray(payload.value)) {
    return payload.value;
  }

  return [];
}

function normalizeNavLeaf(node: NavigationNodeResponse): PublicNavLeaf {
  return {
    id: node.itemKey,
    label: node.label,
    href: node.href,
    target: node.target ?? undefined
  };
}

function normalizeMegaColumn(node: NavigationNodeResponse): PublicMegaMenuColumn {
  return {
    id: node.itemKey,
    label: node.label,
    href: node.href,
    description: node.description ?? undefined,
    target: node.target ?? undefined,
    items: node.children.map(normalizeNavLeaf)
  };
}

function normalizeNavigationNode(node: NavigationNodeResponse): PublicNavItem {
  return {
    id: node.itemKey,
    label: node.label,
    href: node.href,
    target: node.target ?? undefined,
    megaMenuColumns: node.children.length > 0 ? node.children.map(normalizeMegaColumn) : undefined
  };
}

function normalizeStaffGroup(group: StaffProfileGroupResponse): AcademicStaffGroup {
  return {
    id: group.key,
    label: group.label,
    eyebrow: group.eyebrow,
    description: group.description,
    members: group.profiles.map((profile) => ({
      id: profile.id,
      name: profile.fullName,
      title: profile.title,
      city: profile.city ?? undefined,
      photoSrc: profile.photoUrl ?? undefined
    }))
  };
}

function normalizeResourceLink(item: FreeMaterialItemResponse): ResourceLink {
  return {
    title: item.title,
    type: item.badgeLabel ?? "İçerik",
    summary: item.summary,
    href: item.href,
    buttonLabel: item.buttonLabel ?? undefined,
    countdownSlug: item.countdownPage?.slug,
    opensInNewTab: item.opensInNewTab
  };
}

function normalizeCountdownTarget(target: CountdownTargetResponse): ExamCountdownTarget {
  return {
    label: target.label,
    targetIso: target.targetAt ?? undefined,
    dateLabel: target.dateLabel,
    note: target.note
  };
}

function normalizeCountdownPage(page: CountdownPageResponse): ExamCountdownPage {
  return {
    slug: page.slug,
    eyebrow: page.eyebrow,
    title: page.title,
    description: page.description,
    updatedLabel: page.updatedLabel,
    countdowns: page.targets.map(normalizeCountdownTarget),
    videoTitle: page.videoTitle,
    videoNote: page.videoNote,
    officialLinks: page.officialLinks.map((item) => ({
      title: item.title,
      type: item.linkType,
      summary: item.summary,
      href: item.href,
      buttonLabel: item.buttonLabel ?? undefined,
      opensInNewTab: true
    })),
    articleSections: page.articleSections.map((section) => ({
      title: section.title,
      body: section.body
    }))
  };
}

function normalizeMarketingPage(page: MarketingPageResponse): MarketingPageContent {
  return {
    id: page.id,
    key: page.key,
    slug: page.slug,
    title: page.title,
    excerpt: page.excerpt ?? undefined,
    description: page.description ?? undefined,
    seoTitle: page.seoTitle ?? undefined,
    seoDescription: page.seoDescription ?? undefined,
    sections: [...page.sections]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((section) => ({
        id: section.id,
        sectionKey: section.sectionKey,
        eyebrow: section.eyebrow ?? undefined,
        title: section.title,
        body: section.body ?? undefined,
        variantKey: section.variantKey ?? undefined,
        payload: section.payload ?? {},
        sortOrder: section.sortOrder
      }))
  };
}

function normalizeSuccessStory(story: SuccessStoryResponse): SuccessStoryContent {
  return {
    id: story.id,
    slug: story.slug,
    studentName: story.studentName,
    city: story.city ?? undefined,
    examLabel: story.examLabel,
    resultTitle: story.resultTitle,
    highlight: story.highlight,
    story: story.story,
    avatarUrl: story.avatarUrl ?? undefined,
    isFeatured: story.isFeatured
  };
}

function getFallbackMarketingPage(slug: string) {
  if (slug === "home") {
    return fallbackHomePage;
  }

  if (slug === "hakkimizda" || slug === "about") {
    return fallbackAboutPage;
  }

  return null;
}

function fallbackCountdownPage(slug: string) {
  return examCountdownPages.find((page) => page.slug === slug) ?? null;
}

export async function getNavigationItems() {
  try {
    const menu = await requestJson<NavigationMenuResponse>("/public/navigation?key=primary");
    return menu.items.map(normalizeNavigationNode);
  } catch {
    return publicNavigationItems;
  }
}

export async function getAcademicStaffGroups() {
  try {
    const groups = await requestJson<CollectionPayload<StaffProfileGroupResponse>>("/public/academic-staff");
    return unwrapCollection(groups).map(normalizeStaffGroup);
  } catch {
    return academicStaffGroups;
  }
}

export async function getMarketingPageContent(slug: string) {
  try {
    const page = await requestJson<MarketingPageResponse>(`/public/pages/${encodeURIComponent(slug)}`);
    return normalizeMarketingPage(page);
  } catch {
    const fallback = getFallbackMarketingPage(slug);
    return fallback ? normalizeMarketingPage(fallback as unknown as MarketingPageResponse) : null;
  }
}

export async function getSuccessStories() {
  try {
    const stories = await requestJson<CollectionPayload<SuccessStoryResponse>>("/public/success-stories");
    const normalized = unwrapCollection(stories).map(normalizeSuccessStory);
    return normalized.length > 0 ? normalized : fallbackSuccessStories.map(normalizeSuccessStory);
  } catch {
    return fallbackSuccessStories.map(normalizeSuccessStory);
  }
}

export async function getCountdownPageBySlug(slug: string) {
  try {
    const page = await requestJson<CountdownPageResponse>(`/public/countdown-pages/${encodeURIComponent(slug)}`);
    return normalizeCountdownPage(page);
  } catch {
    return fallbackCountdownPage(slug);
  }
}

export async function getFreeMaterialsContent(): Promise<FreeMaterialsContent> {
  try {
    const categoriesPayload = await requestJson<CollectionPayload<FreeMaterialCategoryResponse>>("/public/free-materials");
    const categories = unwrapCollection(categoriesPayload);
    const categoryMap = new Map(categories.map((category) => [category.key, category]));

    const freeToolItems = categoryMap.get("free-tools")?.items ?? [];
    const countdownSlugs = Array.from(
      new Set(
        freeToolItems
          .map((item) => item.countdownPage?.slug)
          .filter((slug): slug is string => Boolean(slug))
      )
    );

    const countdownPages = (
      await Promise.all(countdownSlugs.map((slug) => getCountdownPageBySlug(slug)))
    ).filter((page): page is ExamCountdownPage => Boolean(page));

    return {
      freeTools: freeToolItems.length > 0 ? freeToolItems.map(normalizeResourceLink) : fallbackFreeTools,
      usefulLinks:
        (categoryMap.get("useful-links")?.items ?? []).length > 0
          ? (categoryMap.get("useful-links")?.items ?? []).map(normalizeResourceLink)
          : fallbackUsefulLinks,
      pdfDocuments:
        (categoryMap.get("pdf-documents")?.items ?? []).length > 0
          ? (categoryMap.get("pdf-documents")?.items ?? []).map(normalizeResourceLink)
          : fallbackPdfDocuments,
      guidanceContent:
        (categoryMap.get("guidance-content")?.items ?? []).length > 0
          ? (categoryMap.get("guidance-content")?.items ?? []).map(normalizeResourceLink)
          : fallbackGuidanceContent,
      speedReading: normalizeResourceLink(categoryMap.get("speed-reading")?.items[0] ?? {
        id: "fallback-speed-reading",
        title: fallbackSpeedReading.title,
        badgeLabel: fallbackSpeedReading.type,
        summary: fallbackSpeedReading.summary,
        href: fallbackSpeedReading.href,
        buttonLabel: fallbackSpeedReading.buttonLabel ?? null,
        opensInNewTab: true,
        countdownPage: null
      }),
      countdownPages: countdownPages.length > 0 ? countdownPages : examCountdownPages
    };
  } catch {
    return {
      freeTools: fallbackFreeTools,
      usefulLinks: fallbackUsefulLinks,
      pdfDocuments: fallbackPdfDocuments,
      guidanceContent: fallbackGuidanceContent,
      speedReading: fallbackSpeedReading,
      countdownPages: examCountdownPages
    };
  }
}
