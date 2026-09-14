"use client";

import { resolveAssetUrlFrom, resolveSiteUrl } from "../../../lib/site-url";
import { useClientValue } from "../../../lib/use-client-value";

type AssetImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
  /** Used when `src` is empty, so callers keep their existing fallback art. */
  fallbackSrc?: string;
};

/**
 * An <img> that understands where the public website lives.
 *
 * Every image the builder shows comes from one of two places: media uploaded
 * through the API (already an absolute URL) or content authored against the
 * public site's static assets (a site-relative path like
 * "/homepage/showcase-plan.png"). The second kind only resolves correctly
 * against the public origin, which is not the origin the admin panel is served
 * from. Rendering a raw <img src> works in local development, where both apps
 * answer on localhost, and breaks in production, where the admin sits on its
 * own subdomain — which is exactly how it reached the customer.
 *
 * The origin is read through useClientValue so the server and client render the
 * same markup and hydration stays quiet.
 */
export function AssetImage({ src, fallbackSrc, ...rest }: AssetImageProps) {
  const siteUrl = useClientValue(resolveSiteUrl, null);
  const resolved = resolveAssetUrlFrom(siteUrl, src) || resolveAssetUrlFrom(siteUrl, fallbackSrc);

  if (!resolved) {
    return null;
  }

  return <img {...rest} src={resolved} />;
}
