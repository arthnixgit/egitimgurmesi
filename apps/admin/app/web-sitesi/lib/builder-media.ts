import type { AdminMediaKind } from "../../../lib/media-client";

const maxClientUploadBytes = 12 * 1024 * 1024;

const allowedMimeByKind: Record<AdminMediaKind, readonly string[]> = {
  IMAGE: ["image/png", "image/jpeg", "image/webp", "image/avif"],
  BRANDING: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/x-icon", "image/vnd.microsoft.icon"],
  DOCUMENT: [
    "application/pdf",
    "application/zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
  AUDIO: ["audio/mpeg", "audio/wav", "audio/webm"],
  OTHER: []
};

export function validateClientMediaFile(file: File, kind: AdminMediaKind) {
  if (file.size <= 0) {
    return "Boş dosya yüklenemez.";
  }

  if (file.size > maxClientUploadBytes) {
    return "Dosya boyutu izin verilen sınırı aşıyor.";
  }

  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return "SVG dosyaları güvenli şekilde temizlenmediği için yüklenemez.";
  }

  const allowed = allowedMimeByKind[kind] ?? [];
  if (allowed.length > 0 && !allowed.includes(file.type)) {
    return "Bu alan için desteklenmeyen dosya türü seçildi.";
  }

  return "";
}

export function shouldStartMediaUpload(file: File | null | undefined, isUploading: boolean) {
  return Boolean(file) && !isUploading;
}

export function getMediaUploadErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Dosya yüklenemedi.";
}

export function formatBytes(value?: number | null) {
  if (!value) {
    return "Boyut bilinmiyor";
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(value / 1024)} KB`;
}

export function mediaKindLabel(kind: AdminMediaKind) {
  const labels: Record<AdminMediaKind, string> = {
    IMAGE: "Görsel",
    DOCUMENT: "Doküman",
    VIDEO: "Video",
    AUDIO: "Ses",
    BRANDING: "Marka",
    OTHER: "Diğer"
  };

  return labels[kind];
}
