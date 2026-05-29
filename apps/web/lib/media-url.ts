export function normalizeVideoEmbedUrl(rawUrl: string) {
  const url = rawUrl.trim();

  if (!url) {
    return url;
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const host = parsed.hostname.toLowerCase();

  if (host === "drive.google.com" || host.endsWith(".drive.google.com")) {
    const fileId = parsed.searchParams.get("id") ?? parsed.pathname.match(/\/file\/d\/([^/]+)/i)?.[1];
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
  }

  if (host === "youtu.be") {
    const videoId = parsed.pathname.split("/").filter(Boolean)[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (host.endsWith("youtube.com")) {
    const videoId = parsed.searchParams.get("v") ?? parsed.pathname.match(/\/(?:embed|shorts)\/([^/]+)/i)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const videoId = parsed.pathname.match(/\/(?:video\/)?(\d+)/i)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }

  return url;
}

export function isDirectVideoUrl(rawUrl: string) {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(rawUrl.trim());
}

export function isEmbeddableVideoUrl(rawUrl: string) {
  const normalized = normalizeVideoEmbedUrl(rawUrl);
  return !isDirectVideoUrl(normalized);
}
