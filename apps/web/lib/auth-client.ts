import { resolveApiBaseUrl } from "./api-base-url";

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
    emailVerifiedAt?: string | null;
    profile?: {
      firstName: string;
      lastName: string;
      city?: string | null;
      district?: string | null;
      parentName?: string | null;
      parentPhone?: string | null;
      marketingConsent?: boolean | null;
    } | null;
    studentProfile?: {
      gradeLevel?: string | null;
      studyTrack?: string | null;
      schoolName?: string | null;
      targetExamYear?: number | null;
    } | null;
    externalAccounts: Array<{
      id: string;
      provider: string;
      externalEmail?: string | null;
      linkedAt: string;
    }>;
  };
};

export type AuthActionResponse = {
  success: true;
  message: string;
  email?: string;
  emailVerificationRequired?: boolean;
  previewUrl?: string;
};

const API_BASE_URL = resolveApiBaseUrl();
const ACCESS_TOKEN_KEY = "ega_user_access_token";
const REFRESH_TOKEN_KEY = "ega_user_refresh_token";

type ApiErrorPayload = {
  message?: string;
};

export class ApiRequestError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export function isAuthFailure(error: unknown) {
  return error instanceof ApiRequestError && error.status === 401;
}

export function isPermissionFailure(error: unknown) {
  return error instanceof ApiRequestError && error.status === 403;
}

export function isNotFoundFailure(error: unknown) {
  return error instanceof ApiRequestError && error.status === 404;
}

export function getUserFacingErrorMessage(
  error: unknown,
  fallback = "İşlem sırasında bir sorun oluştu. Lütfen tekrar deneyin."
) {
  if (isPermissionFailure(error)) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }

  if (error instanceof ApiRequestError && error.status && error.status >= 500) {
    return fallback;
  }

  if (error instanceof TypeError) {
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function parseError(response: Response) {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  const message =
    payload?.message ||
    (response.status === 403
      ? "Bu işlem için yetkiniz bulunmuyor."
      : response.status === 404
        ? "Kayıt bulunamadı."
        : response.status >= 500
          ? "İşlem sırasında bir sorun oluştu. Lütfen tekrar deneyin."
          : "İstek işlenemedi.");

  throw new ApiRequestError(message, response.status);
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
  return request<AuthActionResponse>("/auth/register", {
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

export function requestEmailVerification(payload: { email: string }) {
  return request<AuthActionResponse>("/auth/email-verification/request", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function confirmEmailVerification(token: string) {
  return request<AuthActionResponse>("/auth/email-verification/confirm", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export function requestPasswordReset(payload: { email: string }) {
  return request<AuthActionResponse>("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function confirmPasswordReset(payload: { token: string; password: string }) {
  return request<AuthActionResponse>("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function refreshUserToken() {
  const refreshToken = getUserRefreshToken();

  if (!refreshToken) {
    throw new ApiRequestError("Oturum bulunamadı.", 401);
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
    throw new ApiRequestError("Oturum bulunamadı.", 401);
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 401) {
    let refreshed: PublicAuthResponse;

    try {
      refreshed = await refreshUserToken();
    } catch (error) {
      if (isAuthFailure(error)) {
        clearUserTokens();
      }

      throw error;
    }

    const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${refreshed.accessToken}`
      }
    });

    if (retryResponse.status === 401) {
      clearUserTokens();
    }

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

export async function updateCurrentUserProfile(payload: Record<string, unknown>) {
  const accessToken = getUserAccessToken();

  if (!accessToken) {
    throw new ApiRequestError("Oturum bulunamadı.", 401);
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401) {
    let refreshed: PublicAuthResponse;

    try {
      refreshed = await refreshUserToken();
    } catch (error) {
      if (isAuthFailure(error)) {
        clearUserTokens();
      }

      throw error;
    }

    const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshed.accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (retryResponse.status === 401) {
      clearUserTokens();
    }

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
