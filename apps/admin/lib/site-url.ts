/**
 * Resolving the public website's URL from the admin panel.
 *
 * The builder's "Canlı Sayfa" button used to link to "/", which is the admin
 * panel's own root — so the one control that promised to show the live site
 * reopened the editor instead. The logic that gets this right lived in
 * admin-frame.tsx and was never shared. It is here now, as pure functions, so
 * every caller resolves the same way and it can be tested.
 */
export type SiteLocation = {
  protocol: string;
  hostname: string;
};

export const PREVIEW_QUERY_PARAM = "preview";

/**
 * Pure resolution so it can be exercised for every deployment shape:
 * configured origin, admin subdomain, local development, and server rendering.
 */
export function resolveSiteUrlFrom(
  configured: string | null | undefined,
  location: SiteLocation | null
): string | null {
  const trimmed = configured?.trim();

  if (trimmed && /^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  if (!location) {
    // Server render: there is no honest answer yet, and guessing would produce
    // a link to the wrong host.
    return null;
  }

  const { protocol, hostname } = location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }

  if (hostname.startsWith("admin.")) {
    return `${protocol}//${hostname.replace(/^admin\./, "")}`;
  }

  return `${protocol}//${hostname}`;
}

export function resolveSiteUrl(): string | null {
  return resolveSiteUrlFrom(
    process.env.NEXT_PUBLIC_SITE_URL,
    typeof window === "undefined"
      ? null
      : { protocol: window.location.protocol, hostname: window.location.hostname }
  );
}

/** The public path a marketing page is served from. */
export function pagePathForSlug(slug: string | null | undefined) {
  const trimmed = (slug ?? "").trim().replace(/^\/+|\/+$/g, "");

  if (!trimmed || trimmed === "home") {
    return "/";
  }

  return `/${trimmed}`;
}

/**
 * Builds the URL the preview iframe and the "Önizle" button open.
 *
 * `cacheBuster` changes after each save so the iframe reloads instead of
 * showing the draft as it was when the frame first mounted.
 */
export function buildPreviewUrl(
  siteUrl: string | null,
  path: string,
  token: string | null,
  cacheBuster?: number | string | null
) {
  if (!siteUrl) {
    return null;
  }

  const params = new URLSearchParams();

  if (token) {
    params.set(PREVIEW_QUERY_PARAM, token);
  }

  if (cacheBuster !== undefined && cacheBuster !== null && cacheBuster !== "") {
    params.set("v", String(cacheBuster));
  }

  const query = params.toString();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${siteUrl}${normalizedPath}${query ? `?${query}` : ""}`;
}
