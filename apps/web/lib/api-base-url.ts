function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function ensureV1Suffix(value: string) {
  const trimmed = trimTrailingSlash(value);
  return /\/v1$/i.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

export function resolveApiBaseUrl() {
  const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (typeof window !== "undefined") {
    if (publicBaseUrl && /^https?:\/\//i.test(publicBaseUrl)) {
      return trimTrailingSlash(publicBaseUrl);
    }

    return `${window.location.origin}/v1`;
  }

  const internalBaseUrl = process.env.INTERNAL_API_BASE_URL?.trim() || process.env.API_APP_URL?.trim();

  if (internalBaseUrl) {
    return ensureV1Suffix(internalBaseUrl);
  }

  if (publicBaseUrl && /^https?:\/\//i.test(publicBaseUrl)) {
    return trimTrailingSlash(publicBaseUrl);
  }

  return "http://localhost:4000/v1";
}
