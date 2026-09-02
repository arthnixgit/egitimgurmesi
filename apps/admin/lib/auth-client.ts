function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const isLocalDev =
      window.location.protocol === "http:" &&
      (window.location.port === "3000" || window.location.port === "3001");

    if (isLocalDev) {
      return (configured || "http://localhost:4000/v1").replace(/\/+$/, "");
    }

    return `${window.location.origin}/v1`;
  }

  return "http://localhost:4000/v1";
}

export type StaffAuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  actorType: "STAFF";
  staffUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    roleKeys: string[];
    permissionKeys: string[];
  };
};

type BootstrapStatusResponse = {
  requiresBootstrap: boolean;
};

type StaffOverviewResponse = {
  actorType: "STAFF";
  actorId: string;
  roleKeys: string[];
  permissionKeys: string[];
};

type StaffMeResponse = {
  actorType: "STAFF";
  staffUser: StaffAuthResponse["staffUser"];
};

export type AdminNavigationItem = {
  id?: string;
  itemKey: string;
  label: string;
  href: string;
  description?: string | null;
  target?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  children: AdminNavigationItem[];
};

export type AdminNavigationMenu = {
  id: string;
  key: string;
  name: string;
  location: string;
  description?: string | null;
  isActive: boolean;
  version?: number;
  items: AdminNavigationItem[];
};

export type AdminMarketingPageSection = {
  id?: string;
  sectionKey: string;
  eyebrow?: string | null;
  title?: string | null;
  body?: string | null;
  variantKey?: string | null;
  payload?: Record<string, unknown> | null;
  sortOrder?: number;
  isActive?: boolean;
  publishStatus?: string;
};

export type AdminMarketingPage = {
  id: string;
  key: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  description?: string | null;
  pageType: string;
  publishStatus: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  heroImageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  version?: number;
  sections: AdminMarketingPageSection[];
};

export type AdminStaffProfile = {
  id?: string;
  slug: string;
  fullName: string;
  title: string;
  city?: string | null;
  biography?: string | null;
  photoUrl?: string | null;
  sortOrder?: number;
  publishStatus?: string;
};

export type AdminStaffProfileGroup = {
  id?: string;
  key: string;
  label: string;
  eyebrow?: string | null;
  description?: string | null;
  introVideoSourceType?: "DIRECT" | "EMBED" | null;
  introVideoUrl?: string | null;
  introVideoPosterUrl?: string | null;
  introVideoTitle?: string | null;
  sortOrder?: number;
  publishStatus?: string;
  profiles: AdminStaffProfile[];
};

export type AdminStaffProfilesDocument = {
  version?: number;
  groups: AdminStaffProfileGroup[];
};

export type AdminSuccessStory = {
  id?: string;
  slug: string;
  studentName: string;
  city?: string | null;
  examLabel?: string | null;
  resultTitle: string;
  highlight: string;
  story?: string | null;
  avatarUrl?: string | null;
  sortOrder?: number;
  isFeatured?: boolean;
  publishStatus?: string;
};

export type AdminSuccessStoriesDocument = {
  version?: number;
  stories: AdminSuccessStory[];
};

export type AdminFreeMaterialItem = {
  id?: string;
  slug?: string | null;
  title: string;
  itemType: string;
  badgeLabel?: string | null;
  summary?: string | null;
  href?: string | null;
  buttonLabel?: string | null;
  iconKey?: string | null;
  tone?: string | null;
  coverImageUrl?: string | null;
  downloadUrl?: string | null;
  mediaAssetId?: string | null;
  displayFilename?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  accessibilityLabel?: string | null;
  opensInNewTab?: boolean;
  sortOrder?: number;
  isFeatured?: boolean;
  publishStatus?: string;
  version?: number;
  countdownPageSlug?: string | null;
};

export type AdminFreeMaterialCategory = {
  id?: string;
  key: string;
  label: string;
  description?: string | null;
  sortOrder?: number;
  publishStatus?: string;
  items: AdminFreeMaterialItem[];
};

export type AdminCountdownTarget = {
  id?: string;
  label: string;
  targetAt?: string | null;
  dateLabel: string;
  note: string;
  sortOrder?: number;
};

export type AdminCountdownOfficialLink = {
  id?: string;
  title: string;
  linkType: string;
  summary: string;
  href: string;
  buttonLabel?: string | null;
  sortOrder?: number;
};

export type AdminCountdownArticleSection = {
  id?: string;
  title: string;
  body: string;
  sortOrder?: number;
};

export type AdminCountdownPage = {
  id?: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  updatedLabel?: string | null;
  videoTitle: string;
  videoNote: string;
  publishStatus?: string;
  targets: AdminCountdownTarget[];
  officialLinks: AdminCountdownOfficialLink[];
  articleSections: AdminCountdownArticleSection[];
};

export type AdminFreeMaterialsDocument = {
  version?: number;
  categories: AdminFreeMaterialCategory[];
  countdownPages: AdminCountdownPage[];
};

export type AdminSiteSettings = {
  id: string;
  key: string;
  siteName: string;
  siteTitle: string;
  tagline?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  supportWhatsappNumber: string;
  logoPrimaryUrl?: string | null;
  logoMarkUrl?: string | null;
  logoFooterUrl?: string | null;
  logoCompactUrl?: string | null;
  logoDarkUrl?: string | null;
  logoLightUrl?: string | null;
  faviconUrl?: string | null;
  defaultSocialImageUrl?: string | null;
  logoAltText?: string | null;
  displayPhone: string;
  canonicalPhone: string;
  telHref: string;
  whatsappMessage: string;
  whatsappHref: string;
  address: string;
  publicContactEmail?: string | null;
  footerBrandDescription: string;
  footerQuickLinks: Array<{ label: string; href: string }>;
  footerContactTitle: string;
  socialLinks: Array<{ label: string; href: string }>;
  copyrightText: string;
  footerNotice?: string | null;
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  version: number;
  publishedAt?: string | null;
  updatedAt?: string | null;
  draftStatus?: "DRAFT";
  revalidateRoutes?: string[];
  revalidateTags?: string[];
};

export type AdminWebsiteRevision = {
  id: string;
  scope: string;
  entityType: string;
  entityKey: string;
  version: number;
  action: string;
  summary?: string | null;
  beforeData?: unknown;
  afterData: unknown;
  createdByStaffUserId?: string | null;
  createdAt: string;
};

const API_BASE_URL = resolveApiBaseUrl();
const ACCESS_TOKEN_KEY = "ega_staff_access_token";
const REFRESH_TOKEN_KEY = "ega_staff_refresh_token";

type ApiErrorPayload = {
  message?: string;
};

type StaffRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export function isStaffSessionError(error: unknown) {
  return (
    (error instanceof AdminApiError && error.status === 401) ||
    (error instanceof Error &&
      (error.message === "Staff session is missing." || error.message === "Refresh token is missing."))
  );
}

export function getAdminRequestErrorMessage(
  error: unknown,
  messages: {
    forbidden?: string;
    notFound?: string;
    server?: string;
    network?: string;
    fallback?: string;
  } = {}
) {
  if (error instanceof AdminApiError) {
    if (error.status === 403) {
      return messages.forbidden ?? "Bu alan için yetkiniz bulunmuyor.";
    }

    if (error.status === 404) {
      return messages.notFound ?? "Kayıt bulunamadı.";
    }

    if (error.status >= 500) {
      return messages.server ?? "Servise ulaşılamadı. Lütfen tekrar deneyin.";
    }

    return error.message;
  }

  if (error instanceof TypeError) {
    return messages.network ?? "Servise ulaşılamadı. Bağlantınızı kontrol edin.";
  }

  return error instanceof Error ? error.message : messages.fallback ?? "İşlem tamamlanamadı.";
}

async function parseError(response: Response) {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  throw new AdminApiError(payload?.message || "Request could not be processed.", response.status);
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as T;
}

export function saveStaffTokens(payload: Pick<StaffAuthResponse, "accessToken" | "refreshToken">) {
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
}

export function clearStaffTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getStaffAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStaffRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function fetchBootstrapStatus() {
  return request<BootstrapStatusResponse>("/staff/bootstrap-status");
}

export function bootstrapStaff(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  bootstrapSecret: string;
}) {
  return request<StaffAuthResponse>("/staff/bootstrap", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginStaff(payload: { email: string; password: string }) {
  return request<StaffAuthResponse>("/auth/staff/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function refreshStaffToken() {
  const refreshToken = getStaffRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh token is missing.");
  }

  const response = await request<StaffAuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });

  saveStaffTokens(response);
  return response;
}

export async function requestWithStaffToken<T>(path: string, init?: StaffRequestInit) {
  const accessToken = getStaffAccessToken();

  if (!accessToken) {
    throw new Error("Staff session is missing.");
  }

  const headers = {
    ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers ?? {})
  };

  const performFetch = (token: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      headers: {
        Authorization: `Bearer ${token}`,
        ...headers
      }
    });

  const response = await performFetch(accessToken);

  if (response.status === 401) {
    const refreshed = await refreshStaffToken();
    const retryResponse = await performFetch(refreshed.accessToken);

    if (!retryResponse.ok) {
      await parseError(retryResponse);
    }

    return (await retryResponse.json()) as T;
  }

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as T;
}

export async function requestFormWithStaffToken<T>(path: string, formData: FormData) {
  const accessToken = getStaffAccessToken();

  if (!accessToken) {
    throw new Error("Staff session is missing.");
  }

  const performFetch = (token: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  const response = await performFetch(accessToken);

  if (response.status === 401) {
    const refreshed = await refreshStaffToken();
    const retryResponse = await performFetch(refreshed.accessToken);

    if (!retryResponse.ok) {
      await parseError(retryResponse);
    }

    return (await retryResponse.json()) as T;
  }

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as T;
}

export function fetchStaffOverview() {
  return requestWithStaffToken<StaffOverviewResponse>("/staff/overview");
}

export function fetchCurrentStaffUser() {
  return requestWithStaffToken<StaffMeResponse>("/auth/me");
}

export function fetchAdminSiteSettings() {
  return requestWithStaffToken<AdminSiteSettings>("/admin-content/site-settings");
}

export function saveAdminSiteSettings(payload: AdminSiteSettings) {
  return requestWithStaffToken<AdminSiteSettings>("/admin-content/site-settings", {
    method: "PUT",
    body: serializeSiteSettingsPayload(payload)
  });
}

export function publishAdminSiteSettings(payload: AdminSiteSettings) {
  return requestWithStaffToken<AdminSiteSettings>("/admin-content/site-settings/publish", {
    method: "POST",
    body: serializeSiteSettingsPayload(payload)
  });
}

export function fetchAdminWebsiteRevisions(filters: { entityType?: string; entityKey?: string } = {}) {
  const params = new URLSearchParams();

  if (filters.entityType) {
    params.set("entityType", filters.entityType);
  }

  if (filters.entityKey) {
    params.set("entityKey", filters.entityKey);
  }

  const query = params.toString();
  return requestWithStaffToken<AdminWebsiteRevision[]>(
    `/admin-content/revisions${query ? `?${query}` : ""}`
  );
}

export function restoreAdminWebsiteRevision(revisionId: string) {
  return requestWithStaffToken<unknown>(
    `/admin-content/revisions/${encodeURIComponent(revisionId)}/restore`,
    {
      method: "POST"
    }
  );
}

export function fetchAdminPreviewToken() {
  return requestWithStaffToken<{ token: string; expiresAt: number }>("/admin-content/preview-token", {
    method: "POST"
  });
}

export function fetchAdminNavigationMenu(key = "primary") {
  return requestWithStaffToken<AdminNavigationMenu>(
    `/admin-content/navigation/${encodeURIComponent(key)}`
  );
}

export function saveAdminNavigationMenu(
  key: string,
  payload: Omit<AdminNavigationMenu, "id" | "key">,
  action: "draft" | "publish" = "draft"
) {
  return requestWithStaffToken<AdminNavigationMenu>(
    `/admin-content/navigation/${encodeURIComponent(key)}?action=${action}`,
    {
      method: "PUT",
      body: payload
    }
  );
}

export function fetchAdminMarketingPages() {
  return requestWithStaffToken<AdminMarketingPage[]>("/admin-content/marketing-pages");
}

export function saveAdminMarketingPage(
  key: string,
  payload: Omit<AdminMarketingPage, "id" | "key">,
  action: "draft" | "publish" = "draft"
) {
  return requestWithStaffToken<AdminMarketingPage>(
    `/admin-content/marketing-pages/${encodeURIComponent(key)}?action=${action}`,
    {
      method: "PUT",
      body: payload
    }
  );
}

export function fetchAdminStaffProfilesDocument() {
  return requestWithStaffToken<AdminStaffProfilesDocument>("/admin-content/staff-profiles");
}

export function saveAdminStaffProfilesDocument(
  payload: AdminStaffProfilesDocument,
  action: "draft" | "publish" = "draft"
) {
  return requestWithStaffToken<AdminStaffProfilesDocument>(`/admin-content/staff-profiles?action=${action}`, {
    method: "PUT",
    body: serializeStaffProfilesPayload(payload)
  });
}

export function fetchAdminSuccessStoriesDocument() {
  return requestWithStaffToken<AdminSuccessStoriesDocument>("/admin-content/success-stories");
}

export function saveAdminSuccessStoriesDocument(
  payload: AdminSuccessStoriesDocument,
  action: "draft" | "publish" = "draft"
) {
  return requestWithStaffToken<AdminSuccessStoriesDocument>(`/admin-content/success-stories?action=${action}`, {
    method: "PUT",
    body: serializeSuccessStoriesPayload(payload)
  });
}

export function fetchAdminFreeMaterialsDocument() {
  return requestWithStaffToken<AdminFreeMaterialsDocument>("/admin-content/free-materials");
}

export function saveAdminFreeMaterialsDocument(
  payload: AdminFreeMaterialsDocument,
  action: "draft" | "publish" = "draft"
) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>(`/admin-content/free-materials?action=${action}`, {
    method: "PUT",
    body: serializeFreeMaterialsPayload(payload)
  });
}

export function archiveAdminMaterialCategory(categoryKey: string) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>(
    `/admin-content/free-materials/categories/${encodeURIComponent(categoryKey)}/archive`,
    { method: "POST" }
  );
}

export function restoreAdminMaterialCategory(categoryKey: string) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>(
    `/admin-content/free-materials/categories/${encodeURIComponent(categoryKey)}/restore`,
    { method: "POST" }
  );
}

export function deleteAdminMaterialCategory(categoryKey: string) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>(
    `/admin-content/free-materials/categories/${encodeURIComponent(categoryKey)}`,
    { method: "DELETE" }
  );
}

export function archiveAdminMaterialCard(itemIdOrSlug: string) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>(
    `/admin-content/free-materials/items/${encodeURIComponent(itemIdOrSlug)}/archive`,
    { method: "POST" }
  );
}

export function restoreAdminMaterialCard(itemIdOrSlug: string) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>(
    `/admin-content/free-materials/items/${encodeURIComponent(itemIdOrSlug)}/restore`,
    { method: "POST" }
  );
}

export function deleteAdminMaterialCard(itemIdOrSlug: string) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>(
    `/admin-content/free-materials/items/${encodeURIComponent(itemIdOrSlug)}`,
    { method: "DELETE" }
  );
}

export function moveAdminMaterialCard(itemIdOrSlug: string, direction: -1 | 1) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>(
    `/admin-content/free-materials/items/${encodeURIComponent(itemIdOrSlug)}/move`,
    {
      method: "PATCH",
      body: { direction }
    }
  );
}

export function serializeSiteSettingsPayload(settings: AdminSiteSettings) {
  return {
    version: settings.version,
    siteName: settings.siteName,
    siteTitle: settings.siteTitle,
    tagline: settings.tagline ?? null,
    supportEmail: settings.supportEmail ?? null,
    supportPhone: settings.displayPhone,
    supportWhatsappNumber: settings.supportWhatsappNumber,
    logoPrimaryUrl: settings.logoPrimaryUrl ?? null,
    logoMarkUrl: settings.logoMarkUrl ?? null,
    logoFooterUrl: settings.logoFooterUrl ?? null,
    logoCompactUrl: settings.logoCompactUrl ?? null,
    logoDarkUrl: settings.logoDarkUrl ?? null,
    logoLightUrl: settings.logoLightUrl ?? null,
    faviconUrl: settings.faviconUrl ?? null,
    defaultSocialImageUrl: settings.defaultSocialImageUrl ?? null,
    logoAltText: settings.logoAltText ?? null,
    displayPhone: settings.displayPhone,
    canonicalPhone: settings.canonicalPhone,
    whatsappMessage: settings.whatsappMessage,
    address: settings.address,
    publicContactEmail: settings.publicContactEmail ?? null,
    footerBrandDescription: settings.footerBrandDescription,
    footerQuickLinks: settings.footerQuickLinks.map((link) => ({
      label: link.label,
      href: link.href
    })),
    footerContactTitle: settings.footerContactTitle,
    socialLinks: settings.socialLinks.map((link) => ({
      label: link.label,
      href: link.href
    })),
    copyrightText: settings.copyrightText,
    footerNotice: settings.footerNotice ?? null,
    defaultSeoTitle: settings.defaultSeoTitle ?? null,
    defaultSeoDescription: settings.defaultSeoDescription ?? null
  };
}

export function serializeStaffProfilesPayload(document: AdminStaffProfilesDocument) {
  return {
    version: document.version,
    groups: document.groups.map((group) => ({
      key: group.key,
      label: group.label,
      eyebrow: group.eyebrow ?? null,
      description: group.description ?? null,
      introVideoSourceType: group.introVideoSourceType ?? null,
      introVideoUrl: group.introVideoUrl ?? null,
      introVideoPosterUrl: group.introVideoPosterUrl ?? null,
      introVideoTitle: group.introVideoTitle ?? null,
      sortOrder: group.sortOrder,
      publishStatus: group.publishStatus,
      profiles: group.profiles.map((profile) => ({
        slug: profile.slug,
        fullName: profile.fullName,
        title: profile.title,
        city: profile.city ?? null,
        biography: profile.biography ?? null,
        photoUrl: profile.photoUrl ?? null,
        sortOrder: profile.sortOrder,
        publishStatus: profile.publishStatus
      }))
    }))
  };
}

export function serializeSuccessStoriesPayload(document: AdminSuccessStoriesDocument) {
  return {
    version: document.version,
    stories: document.stories.map((story) => ({
      slug: story.slug,
      studentName: story.studentName,
      city: story.city ?? null,
      examLabel: story.examLabel ?? null,
      resultTitle: story.resultTitle,
      highlight: story.highlight,
      story: story.story ?? null,
      avatarUrl: story.avatarUrl ?? null,
      isFeatured: story.isFeatured,
      sortOrder: story.sortOrder,
      publishStatus: story.publishStatus
    }))
  };
}

export function serializeFreeMaterialsPayload(document: AdminFreeMaterialsDocument) {
  return {
    version: document.version,
    completeDocument: true,
    categories: document.categories.map((category) => ({
      id: category.id,
      key: category.key,
      label: category.label,
      description: category.description ?? null,
      sortOrder: category.sortOrder,
      publishStatus: category.publishStatus,
      items: category.items.map((item) => ({
        id: item.id,
        slug: item.slug ?? undefined,
        title: item.title,
        itemType: item.itemType,
        badgeLabel: item.badgeLabel ?? null,
        summary: item.summary ?? null,
        href: item.href ?? null,
        buttonLabel: item.buttonLabel ?? null,
        iconKey: item.iconKey ?? null,
        tone: item.tone ?? null,
        coverImageUrl: item.coverImageUrl ?? null,
        downloadUrl: item.downloadUrl ?? null,
        mediaAssetId: item.mediaAssetId ?? null,
        displayFilename: item.displayFilename ?? null,
        mimeType: item.mimeType ?? null,
        fileSizeBytes: item.fileSizeBytes ?? null,
        accessibilityLabel: item.accessibilityLabel ?? null,
        opensInNewTab: item.opensInNewTab,
        sortOrder: item.sortOrder,
        isFeatured: item.isFeatured,
        publishStatus: item.publishStatus,
        countdownPageSlug: item.countdownPageSlug ?? null
      }))
    })),
    countdownPages: document.countdownPages.map((page) => ({
      id: page.id,
      slug: page.slug,
      eyebrow: page.eyebrow,
      title: page.title,
      description: page.description,
      updatedLabel: page.updatedLabel ?? null,
      videoTitle: page.videoTitle,
      videoNote: page.videoNote,
      publishStatus: page.publishStatus,
      targets: page.targets.map((target) => ({
        label: target.label,
        targetAt: target.targetAt ?? null,
        dateLabel: target.dateLabel,
        note: target.note,
        sortOrder: target.sortOrder
      })),
      officialLinks: page.officialLinks.map((link) => ({
        title: link.title,
        linkType: link.linkType,
        summary: link.summary,
        href: link.href,
        buttonLabel: link.buttonLabel ?? null,
        sortOrder: link.sortOrder
      })),
      articleSections: page.articleSections.map((section) => ({
        title: section.title,
        body: section.body,
        sortOrder: section.sortOrder
      }))
    }))
  };
}

export async function logoutStaff() {
  const accessToken = getStaffAccessToken();

  if (!accessToken) {
    clearStaffTokens();
    return;
  }

  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  clearStaffTokens();
}
