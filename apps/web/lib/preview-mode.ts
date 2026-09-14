/**
 * Draft preview on the public site.
 *
 * The admin builder mints a short-lived signed token and opens a public URL
 * carrying `?preview=<token>`. The API returns unpublished draft content for a
 * valid token and published content for anything else, so a stale link quietly
 * shows the real site instead of failing.
 *
 * The token is deliberately passed explicitly rather than hidden in a cookie:
 * server components read it from their own searchParams, client components
 * read it from the URL once and keep it for the tab. Nothing global, nothing
 * that can leak into an ordinary visitor's request.
 */
export const PREVIEW_QUERY_PARAM = "preview";
const PREVIEW_STORAGE_KEY = "ega_preview_token";

/** Appends the preview token to an API path, preserving any existing query. */
export function appendPreviewToken(path: string, token?: string | null) {
  if (!token) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${PREVIEW_QUERY_PARAM}=${encodeURIComponent(token)}`;
}

/** Reads the token from a query string such as `location.search`. */
export function readPreviewTokenFromSearch(search: string | null | undefined) {
  if (!search) {
    return null;
  }

  try {
    const value = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
      PREVIEW_QUERY_PARAM
    );

    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

/**
 * Normalizes the `searchParams` value a server component receives, which is
 * `string | string[] | undefined` depending on how often the key appears.
 */
export function readPreviewTokenFromParams(value: string | string[] | undefined | null) {
  if (Array.isArray(value)) {
    return value.find((entry) => entry && entry.trim()) ?? null;
  }

  return value && value.trim() ? value : null;
}

/**
 * Resolves the token for browser-side fetches: the URL wins, and the value is
 * remembered for the tab so navigating inside the preview keeps working.
 * Returns null during server rendering.
 */
export function resolveClientPreviewToken(): string | null {
  const token = readClientPreviewToken();

  if (token) {
    persistPreviewToken(token);
  }

  return token;
}

/**
 * Pure read, safe to use as a render-time snapshot: the URL wins, falling back
 * to what this tab remembered. Writing is a separate step so that reading can
 * never have a side effect.
 */
export function readClientPreviewToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return readPreviewTokenFromSearch(window.location.search) ?? readStoredPreviewToken();
}

export function readStoredPreviewToken(): string | null {
  try {
    return window.sessionStorage.getItem(PREVIEW_STORAGE_KEY);
  } catch {
    // Private browsing and blocked site data both throw here; preview simply
    // does not persist across navigations in that case.
    return null;
  }
}

export function persistPreviewToken(token: string) {
  try {
    window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, token);
  } catch {
    // Not fatal: the token still applies to this page load.
  }
}

export function clearStoredPreviewToken() {
  try {
    window.sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}
