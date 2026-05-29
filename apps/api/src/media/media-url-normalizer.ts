import { MediaAssetKind, ProductVideoSourceType } from "@ega/db";

export type NormalizedExternalMedia = {
  provider: string;
  externalUrl: string;
  embedUrl: string | null;
  publicUrl: string | null;
  playbackSourceType: ProductVideoSourceType | null;
  metadata: Record<string, unknown>;
};

const DIRECT_VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?|#|$)/i;
const DIRECT_IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i;
const DIRECT_DOCUMENT_EXTENSIONS = /\.(pdf|docx?|pptx?|xlsx?)(\?|#|$)/i;

export function normalizeExternalMediaUrl(
  rawUrl: string,
  kind: MediaAssetKind
): NormalizedExternalMedia {
  const externalUrl = rawUrl.trim();

  if (!externalUrl) {
    throw new Error("Media URL is required.");
  }

  let parsed: URL;

  try {
    parsed = new URL(externalUrl);
  } catch {
    throw new Error("Media URL must be a valid absolute URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const provider = inferProvider(hostname);

  if (provider === "google-drive") {
    const fileId = extractGoogleDriveFileId(parsed);
    const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : externalUrl;

    return {
      provider,
      externalUrl,
      embedUrl: kind === MediaAssetKind.VIDEO || kind === MediaAssetKind.DOCUMENT ? embedUrl : null,
      publicUrl: kind === MediaAssetKind.IMAGE ? externalUrl : null,
      playbackSourceType: kind === MediaAssetKind.VIDEO ? ProductVideoSourceType.EMBED : null,
      metadata: {
        fileId,
        normalizedBy: "google-drive-preview"
      }
    };
  }

  if (provider === "youtube") {
    const videoId = extractYouTubeVideoId(parsed);
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : externalUrl;

    return {
      provider,
      externalUrl,
      embedUrl,
      publicUrl: null,
      playbackSourceType: kind === MediaAssetKind.VIDEO ? ProductVideoSourceType.EMBED : null,
      metadata: {
        videoId,
        normalizedBy: "youtube-embed"
      }
    };
  }

  if (provider === "vimeo") {
    const videoId = extractVimeoVideoId(parsed);
    const embedUrl = videoId ? `https://player.vimeo.com/video/${videoId}` : externalUrl;

    return {
      provider,
      externalUrl,
      embedUrl,
      publicUrl: null,
      playbackSourceType: kind === MediaAssetKind.VIDEO ? ProductVideoSourceType.EMBED : null,
      metadata: {
        videoId,
        normalizedBy: "vimeo-player"
      }
    };
  }

  if (kind === MediaAssetKind.VIDEO && DIRECT_VIDEO_EXTENSIONS.test(parsed.pathname)) {
    return {
      provider,
      externalUrl,
      embedUrl: null,
      publicUrl: externalUrl,
      playbackSourceType: ProductVideoSourceType.DIRECT,
      metadata: {
        normalizedBy: "direct-video"
      }
    };
  }

  if (kind === MediaAssetKind.IMAGE && DIRECT_IMAGE_EXTENSIONS.test(parsed.pathname)) {
    return {
      provider,
      externalUrl,
      embedUrl: null,
      publicUrl: externalUrl,
      playbackSourceType: null,
      metadata: {
        normalizedBy: "direct-image"
      }
    };
  }

  if (kind === MediaAssetKind.DOCUMENT && DIRECT_DOCUMENT_EXTENSIONS.test(parsed.pathname)) {
    return {
      provider,
      externalUrl,
      embedUrl: null,
      publicUrl: externalUrl,
      playbackSourceType: null,
      metadata: {
        normalizedBy: "direct-document"
      }
    };
  }

  const looksEmbeddable =
    /embed|player|iframe|loom\.com|wistia\.com|vidyard\.com/i.test(externalUrl);

  return {
    provider,
    externalUrl,
    embedUrl: kind === MediaAssetKind.VIDEO || looksEmbeddable ? externalUrl : null,
    publicUrl: looksEmbeddable ? null : externalUrl,
    playbackSourceType: kind === MediaAssetKind.VIDEO
      ? looksEmbeddable
        ? ProductVideoSourceType.EMBED
        : ProductVideoSourceType.DIRECT
      : null,
    metadata: {
      normalizedBy: looksEmbeddable ? "generic-embed" : "generic-url"
    }
  };
}

function inferProvider(hostname: string) {
  if (hostname === "drive.google.com" || hostname.endsWith(".drive.google.com")) {
    return "google-drive";
  }

  if (hostname === "youtu.be" || hostname.endsWith("youtube.com")) {
    return "youtube";
  }

  if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
    return "vimeo";
  }

  if (hostname.endsWith("loom.com")) {
    return "loom";
  }

  if (hostname.endsWith("wistia.com") || hostname.endsWith("wistia.net")) {
    return "wistia";
  }

  return hostname.replace(/^www\./, "");
}

function extractGoogleDriveFileId(url: URL) {
  const byQuery = url.searchParams.get("id");

  if (byQuery) {
    return byQuery;
  }

  const match = url.pathname.match(/\/file\/d\/([^/]+)/i);
  return match?.[1] ?? null;
}

function extractYouTubeVideoId(url: URL) {
  if (url.hostname.toLowerCase() === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  const byQuery = url.searchParams.get("v");

  if (byQuery) {
    return byQuery;
  }

  const embedMatch = url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/i);
  return embedMatch?.[1] ?? null;
}

function extractVimeoVideoId(url: URL) {
  const match = url.pathname.match(/\/(?:video\/)?(\d+)/i);
  return match?.[1] ?? null;
}
