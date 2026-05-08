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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";
const ACCESS_TOKEN_KEY = "ega_staff_access_token";
const REFRESH_TOKEN_KEY = "ega_staff_refresh_token";

type ApiErrorPayload = {
  message?: string;
};

async function parseError(response: Response) {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  throw new Error(payload?.message || "İstek işlenemedi.");
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
    throw new Error("Yenileme belirteci bulunamadı.");
  }

  const response = await request<StaffAuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });

  saveStaffTokens(response);
  return response;
}

async function fetchWithStaffToken<T>(path: string) {
  const accessToken = getStaffAccessToken();

  if (!accessToken) {
    throw new Error("Personel oturumu bulunamadı.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 401) {
    const refreshed = await refreshStaffToken();

    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${refreshed.accessToken}`
      }
    });

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
  return fetchWithStaffToken<StaffOverviewResponse>("/staff/overview");
}

export function fetchCurrentStaffUser() {
  return fetchWithStaffToken<StaffMeResponse>("/auth/me");
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
