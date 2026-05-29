import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  AuditActorType,
  MediaAssetKind,
  MediaAssetSourceType,
  PERMISSION_KEYS,
  Prisma
} from "@ega/db";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { appEnv } from "../config/env";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { CreateExternalMediaDto } from "./dto/admin-media.dto";
import { normalizeExternalMediaUrl } from "./media-url-normalizer";

type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type UploadFields = {
  kind?: string;
  title?: string;
  altText?: string;
};

type MediaAssetRecord = Prisma.MediaAssetGetPayload<object>;

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async listAssets(kind?: MediaAssetKind) {
    const assets = await this.prisma.mediaAsset.findMany({
      where: kind ? { kind } : undefined,
      orderBy: {
        createdAt: "desc"
      },
      take: 200
    });

    return assets.map((asset) => this.normalizeAsset(asset));
  }

  async uploadAsset(
    file: UploadedMediaFile | undefined,
    fields: UploadFields,
    auth: AuthenticatedRequestContext
  ) {
    if (!file) {
      throw new BadRequestException("A media file is required.");
    }

    if (file.size > appEnv.mediaMaxUploadBytes()) {
      throw new BadRequestException("Uploaded file is larger than the configured media limit.");
    }

    const kind = parseMediaKind(fields.kind) ?? inferMediaKind(file.mimetype);
    const assetId = randomUUID();
    const extension = sanitizeExtension(path.extname(file.originalname));
    const storageKey = createStorageKey(assetId, extension);
    const storageRoot = getStorageRoot();
    const targetPath = resolveStoragePath(storageRoot, storageKey);
    const title = fields.title?.trim() || stripExtension(file.originalname) || "Untitled media";
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    const publicUrl = `${appEnv.mediaPublicBaseUrl()}/media/assets/${assetId}/file`;

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, file.buffer);

    const asset = await this.prisma.$transaction(async (tx) => {
      const record = await tx.mediaAsset.create({
        data: {
          id: assetId,
          kind,
          sourceType: MediaAssetSourceType.LOCAL_UPLOAD,
          title,
          altText: fields.altText?.trim() || null,
          mimeType: file.mimetype || null,
          storageKey,
          publicUrl,
          originalFileName: file.originalname,
          sizeBytes: file.size,
          metadata: {
            checksumSha256: checksum,
            storage: "local-filesystem"
          },
          createdByStaffUserId: auth.actorId ?? null
        }
      });

      await this.recordAuditLog(tx, auth, {
        action: "media.upload",
        entityId: record.id,
        summary: `Uploaded media asset ${record.title}.`
      });

      return record;
    });

    return this.normalizeAsset(asset);
  }

  async createExternalAsset(payload: CreateExternalMediaDto, auth: AuthenticatedRequestContext) {
    const normalized = normalizeExternalMediaUrl(payload.externalUrl, payload.kind);
    const title = payload.title.trim();

    if (!title) {
      throw new BadRequestException("Media title is required.");
    }

    const asset = await this.prisma.$transaction(async (tx) => {
      const record = await tx.mediaAsset.create({
        data: {
          kind: payload.kind,
          sourceType: MediaAssetSourceType.EXTERNAL_URL,
          title,
          altText: payload.altText?.trim() || null,
          mimeType: payload.mimeType?.trim() || null,
          publicUrl: normalized.publicUrl,
          externalProvider: normalized.provider,
          externalUrl: normalized.externalUrl,
          embedUrl: normalized.embedUrl,
          thumbnailUrl: payload.thumbnailUrl?.trim() || null,
          metadata: {
            ...normalized.metadata,
            playbackSourceType: normalized.playbackSourceType
          },
          createdByStaffUserId: auth.actorId ?? null
        }
      });

      await this.recordAuditLog(tx, auth, {
        action: "media.external.create",
        entityId: record.id,
        summary: `Registered external media asset ${record.title}.`
      });

      return record;
    });

    return this.normalizeAsset(asset);
  }

  async getAsset(assetId: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: {
        id: assetId
      }
    });

    if (!asset) {
      throw new NotFoundException("Media asset not found.");
    }

    return asset;
  }

  async getLocalAssetFile(assetId: string) {
    const asset = await this.getAsset(assetId);

    if (asset.sourceType !== MediaAssetSourceType.LOCAL_UPLOAD || !asset.storageKey) {
      throw new NotFoundException("Media file is not stored locally.");
    }

    const storageRoot = getStorageRoot();
    const filePath = resolveStoragePath(storageRoot, asset.storageKey);

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException("Media file is missing from storage.");
    }

    return {
      asset,
      filePath
    };
  }

  normalizeAsset(asset: MediaAssetRecord) {
    const metadata = isRecord(asset.metadata) ? asset.metadata : {};
    const playbackSourceType =
      typeof metadata.playbackSourceType === "string" ? metadata.playbackSourceType : null;

    return {
      id: asset.id,
      kind: asset.kind,
      sourceType: asset.sourceType,
      title: asset.title,
      altText: asset.altText,
      mimeType: asset.mimeType,
      originalFileName: asset.originalFileName,
      sizeBytes: asset.sizeBytes,
      publicUrl: asset.publicUrl,
      externalProvider: asset.externalProvider,
      externalUrl: asset.externalUrl,
      embedUrl: asset.embedUrl,
      thumbnailUrl: asset.thumbnailUrl,
      url: asset.embedUrl ?? asset.publicUrl ?? asset.externalUrl,
      playbackSourceType,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      metadata
    };
  }

  private async recordAuditLog(
    tx: Prisma.TransactionClient,
    auth: AuthenticatedRequestContext,
    payload: {
      action: string;
      entityId: string;
      summary: string;
    }
  ) {
    if (!auth.actorId || !auth.permissionKeys.includes(PERMISSION_KEYS.cmsManage)) {
      return;
    }

    await tx.auditLog.create({
      data: {
        actorType: AuditActorType.STAFF_USER,
        staffUserId: auth.actorId,
        action: payload.action,
        entityType: "MediaAsset",
        entityId: payload.entityId,
        summary: payload.summary
      }
    });
  }
}

function parseMediaKind(value?: string) {
  if (!value) {
    return null;
  }

  return Object.values(MediaAssetKind).includes(value as MediaAssetKind)
    ? (value as MediaAssetKind)
    : null;
}

function inferMediaKind(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return MediaAssetKind.IMAGE;
  }

  if (mimeType.startsWith("video/")) {
    return MediaAssetKind.VIDEO;
  }

  if (mimeType.startsWith("audio/")) {
    return MediaAssetKind.AUDIO;
  }

  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("presentation") ||
    mimeType.includes("spreadsheet")
  ) {
    return MediaAssetKind.DOCUMENT;
  }

  return MediaAssetKind.OTHER;
}

function createStorageKey(assetId: string, extension: string) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `${year}/${month}/${assetId}${extension}`;
}

function sanitizeExtension(extension: string) {
  const cleaned = extension.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return cleaned && cleaned.length <= 12 ? cleaned : "";
}

function stripExtension(fileName: string) {
  return path.basename(fileName, path.extname(fileName)).trim();
}

function getStorageRoot() {
  return path.resolve(process.cwd(), appEnv.mediaStorageDir());
}

function resolveStoragePath(storageRoot: string, storageKey: string) {
  const filePath = path.resolve(storageRoot, storageKey);
  const relative = path.relative(storageRoot, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new BadRequestException("Invalid media storage key.");
  }

  return filePath;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
