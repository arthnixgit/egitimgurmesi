export type PublicAuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  actorType: "USER";
  user: {
    id: string;
    email: string;
    phone?: string | null;
    status: string;
    profile?: {
      firstName: string;
      lastName: string;
      city?: string | null;
      district?: string | null;
      parentName?: string | null;
      parentPhone?: string | null;
    } | null;
    studentProfile?: {
      gradeLevel?: string | null;
      studyTrack?: string | null;
      schoolName?: string | null;
      targetExamYear?: number | null;
    } | null;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";
const ACCESS_TOKEN_KEY = "ega_user_access_token";
const REFRESH_TOKEN_KEY = "ega_user_refresh_token";

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

export function saveUserTokens(payload: Pick<PublicAuthResponse, "accessToken" | "refreshToken">) {
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
}

export function clearUserTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getUserAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getUserRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function registerUser(payload: Record<string, unknown>) {
  return request<PublicAuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return request<PublicAuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function refreshUserToken() {
  const refreshToken = getUserRefreshToken();

  if (!refreshToken) {
    throw new Error("Yenileme belirteci bulunamadı.");
  }

  const response = await request<PublicAuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });

  saveUserTokens(response);
  return response;
}

export async function fetchCurrentUser() {
  const accessToken = getUserAccessToken();

  if (!accessToken) {
    throw new Error("Oturum bulunamadı.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 401) {
    const refreshed = await refreshUserToken();

    const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${refreshed.accessToken}`
      }
    });

    if (!retryResponse.ok) {
      await parseError(retryResponse);
    }

    return (await retryResponse.json()) as {
      actorType: "USER";
      user: PublicAuthResponse["user"];
    };
  }

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as {
    actorType: "USER";
    user: PublicAuthResponse["user"];
  };
}

export async function logoutUser() {
  const accessToken = getUserAccessToken();

  if (!accessToken) {
    clearUserTokens();
    return;
  }

  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  clearUserTokens();
}
