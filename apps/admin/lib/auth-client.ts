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
  opensInNewTab?: boolean;
  sortOrder?: number;
  isFeatured?: boolean;
  publishStatus?: string;
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
  categories: AdminFreeMaterialCategory[];
  countdownPages: AdminCountdownPage[];
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

async function parseError(response: Response) {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  throw new Error(payload?.message || "Request could not be processed.");
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

export function fetchAdminNavigationMenu(key = "primary") {
  return requestWithStaffToken<AdminNavigationMenu>(
    `/admin-content/navigation/${encodeURIComponent(key)}`
  );
}

export function saveAdminNavigationMenu(
  key: string,
  payload: Omit<AdminNavigationMenu, "id" | "key">
) {
  return requestWithStaffToken<AdminNavigationMenu>(
    `/admin-content/navigation/${encodeURIComponent(key)}`,
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
  payload: Omit<AdminMarketingPage, "id" | "key">
) {
  return requestWithStaffToken<AdminMarketingPage>(
    `/admin-content/marketing-pages/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      body: payload
    }
  );
}

export function fetchAdminStaffProfilesDocument() {
  return requestWithStaffToken<AdminStaffProfilesDocument>("/admin-content/staff-profiles");
}

export function saveAdminStaffProfilesDocument(payload: AdminStaffProfilesDocument) {
  return requestWithStaffToken<AdminStaffProfilesDocument>("/admin-content/staff-profiles", {
    method: "PUT",
    body: payload
  });
}

export function fetchAdminSuccessStoriesDocument() {
  return requestWithStaffToken<AdminSuccessStoriesDocument>("/admin-content/success-stories");
}

export function saveAdminSuccessStoriesDocument(payload: AdminSuccessStoriesDocument) {
  return requestWithStaffToken<AdminSuccessStoriesDocument>("/admin-content/success-stories", {
    method: "PUT",
    body: payload
  });
}

export function fetchAdminFreeMaterialsDocument() {
  return requestWithStaffToken<AdminFreeMaterialsDocument>("/admin-content/free-materials");
}

export function saveAdminFreeMaterialsDocument(payload: AdminFreeMaterialsDocument) {
  return requestWithStaffToken<AdminFreeMaterialsDocument>("/admin-content/free-materials", {
    method: "PUT",
    body: payload
  });
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
