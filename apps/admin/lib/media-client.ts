import { requestFormWithStaffToken, requestWithStaffToken } from "./auth-client";

export type AdminMediaKind = "IMAGE" | "DOCUMENT" | "VIDEO" | "AUDIO" | "BRANDING" | "OTHER";
export type AdminMediaSourceType = "LOCAL_UPLOAD" | "EXTERNAL_URL";

export type AdminMediaAsset = {
  id: string;
  kind: AdminMediaKind;
  sourceType: AdminMediaSourceType;
  title: string;
  altText?: string | null;
  mimeType?: string | null;
  originalFileName?: string | null;
  sizeBytes?: number | null;
  publicUrl?: string | null;
  externalProvider?: string | null;
  externalUrl?: string | null;
  embedUrl?: string | null;
  thumbnailUrl?: string | null;
  url?: string | null;
  playbackSourceType?: "DIRECT" | "EMBED" | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

export function fetchAdminMedia(kind?: AdminMediaKind) {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  return requestWithStaffToken<AdminMediaAsset[]>(`/admin-media${query}`);
}

export function createExternalMedia(payload: {
  kind: AdminMediaKind;
  title: string;
  altText?: string;
  externalUrl: string;
  thumbnailUrl?: string;
  mimeType?: string;
}) {
  return requestWithStaffToken<AdminMediaAsset>("/admin-media/external", {
    method: "POST",
    body: payload
  });
}

export function uploadAdminMedia(payload: {
  file: File;
  kind?: AdminMediaKind;
  title?: string;
  altText?: string;
}) {
  const formData = new FormData();
  formData.append("file", payload.file);

  if (payload.kind) {
    formData.append("kind", payload.kind);
  }

  if (payload.title) {
    formData.append("title", payload.title);
  }

  if (payload.altText) {
    formData.append("altText", payload.altText);
  }

  return requestFormWithStaffToken<AdminMediaAsset>("/admin-media/upload", formData);
}
