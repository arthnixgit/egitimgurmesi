"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  clearStoredPreviewToken,
  persistPreviewToken,
  readClientPreviewToken
} from "../lib/preview-mode";

/** The token is fixed for a page load, so the store never notifies. */
const subscribeNever = () => () => {};

/**
 * Marks a page that is rendering unpublished draft content.
 *
 * Without this, a preview URL is indistinguishable from the live site, which
 * is how someone ends up reporting a "bug" about content no visitor can see —
 * or worse, assumes an unpublished change is already live.
 */
export function PreviewBanner() {
  // Read as a client-only value rather than assigning state from an effect:
  // the server has no token, the client resolves one on hydration, and there
  // is no second render pass.
  const token = useSyncExternalStore(
    subscribeNever,
    readClientPreviewToken,
    () => null as string | null
  );

  useEffect(() => {
    if (token) {
      // Remember it for this tab so navigating within the preview keeps
      // showing drafts once the token drops out of the URL.
      persistPreviewToken(token);
    }
  }, [token]);

  if (!token) {
    return null;
  }

  return (
    <div className="ega-preview-banner" role="status" aria-live="polite">
      <span className="ega-preview-banner__dot" aria-hidden="true" />
      <span className="ega-preview-banner__text">
        <strong>Önizleme modu.</strong> Bu sayfa yayınlanmamış taslağı gösteriyor; ziyaretçiler bu
        içeriği görmüyor.
      </span>
      <button
        type="button"
        className="ega-preview-banner__exit"
        onClick={() => {
          clearStoredPreviewToken();
          // Drop the token from the URL as well, otherwise a reload would
          // simply re-enter preview from the query string.
          window.location.href = window.location.pathname;
        }}
      >
        Yayındaki sayfayı aç
      </button>
    </div>
  );
}
