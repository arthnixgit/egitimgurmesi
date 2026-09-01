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
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException
} from "@nestjs/common";
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
type NodeError = Error & { code?: string };

const DEFAULT_MEDIA_STORAGE_DIR = "storage/media";
const MEDIA_STORAGE_UNAVAILABLE_MESSAGE =
  "Medya depolama alanı kullanıma hazır değil. Lütfen sistem yöneticisine bildirin.";

@Injectable()
export class MediaService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await validateMediaStorageReady();
  }

  async listAssets(kind?: MediaAssetKind, options: { search?: string; take?: number } = {}) {
    const search = options.search?.trim();
    const assets = await this.prisma.mediaAsset.findMany({
      where: {
        ...(kind ? { kind } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { originalFileName: { contains: search, mode: "insensitive" } },
                { altText: { contains: search, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: {
        createdAt: "desc"
      },
      take: Math.min(Math.max(options.take ?? 48, 1), 100)
    });

    return assets.map((asset) => this.normalizeAsset(asset));
  }

  async uploadAsset(
    file: UploadedMediaFile | undefined,
    fields: UploadFields,
    auth: AuthenticatedRequestContext
  ) {
    requireWebsiteManage(auth);

    if (!file) {
      throw new BadRequestException("Yüklenecek medya dosyası zorunludur.");
    }

    const kind = parseMediaKind(fields.kind) ?? inferMediaKind(file.mimetype);
    validateUploadedMediaFile(file, kind);
    const assetId = randomUUID();
    const extension = sanitizeExtension(path.extname(file.originalname));
    const storageKey = createStorageKey(assetId, extension);
    const storageRoot = resolveMediaStorageRoot();
    const targetPath = resolveStoragePath(storageRoot, storageKey);
    const title = fields.title?.trim() || stripExtension(file.originalname) || "Untitled media";
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    const publicUrl = `${appEnv.mediaPublicBaseUrl()}/media/assets/${assetId}/file`;

    await validateMediaStorageReady(storageRoot);
    await writeLocalMediaFile(targetPath, file.buffer);

    let asset: MediaAssetRecord;
    try {
      asset = await this.prisma.$transaction(async (tx) => {
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
            originalFileName: sanitizeOriginalFileName(file.originalname),
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
    } catch {
      try {
        await removeFileIfExists(targetPath);
      } catch {
        throw new InternalServerErrorException(
          "Medya kaydı tamamlanamadı ve dosya temizlenemedi. Lütfen sistem yöneticisine bildirin."
        );
      }

      throw new InternalServerErrorException("Medya kaydı tamamlanamadı. Dosya yüklenmedi.");
    }

    return this.normalizeAsset(asset);
  }

  async createExternalAsset(payload: CreateExternalMediaDto, auth: AuthenticatedRequestContext) {
    requireWebsiteManage(auth);

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

    const storageRoot = resolveMediaStorageRoot();
    const filePath = resolveStoragePath(storageRoot, asset.storageKey);

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException("Medya dosyası depolama alanında bulunamadı.");
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
    if (
      !auth.actorId ||
      (!auth.isSuperAdmin && !auth.permissionKeys.includes(PERMISSION_KEYS.websiteManage))
    ) {
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

function requireWebsiteManage(auth: AuthenticatedRequestContext) {
  if (auth.isSuperAdmin || auth.permissionKeys.includes(PERMISSION_KEYS.websiteManage)) {
    return;
  }

  throw new ForbiddenException("Web sitesi yönetimini yalnızca yetkili kullanıcılar düzenleyebilir.");
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

const allowedUploadMimeTypes: Record<MediaAssetKind, readonly string[]> = {
  [MediaAssetKind.IMAGE]: ["image/png", "image/jpeg", "image/webp", "image/avif"],
  [MediaAssetKind.BRANDING]: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/avif",
    "image/x-icon",
    "image/vnd.microsoft.icon"
  ],
  [MediaAssetKind.DOCUMENT]: [
    "application/pdf",
    "application/zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ],
  [MediaAssetKind.VIDEO]: ["video/mp4", "video/webm", "video/quicktime"],
  [MediaAssetKind.AUDIO]: ["audio/mpeg", "audio/wav", "audio/webm"],
  [MediaAssetKind.OTHER]: []
};

const allowedUploadExtensions: Record<MediaAssetKind, readonly string[]> = {
  [MediaAssetKind.IMAGE]: [".png", ".jpg", ".jpeg", ".webp", ".avif"],
  [MediaAssetKind.BRANDING]: [".png", ".jpg", ".jpeg", ".webp", ".avif", ".ico"],
  [MediaAssetKind.DOCUMENT]: [".pdf", ".zip", ".docx", ".xlsx", ".pptx"],
  [MediaAssetKind.VIDEO]: [".mp4", ".webm", ".mov"],
  [MediaAssetKind.AUDIO]: [".mp3", ".wav", ".webm"],
  [MediaAssetKind.OTHER]: []
};

export function validateUploadedMediaFile(file: UploadedMediaFile, kind: MediaAssetKind) {
  if (file.size <= 0 || file.buffer.byteLength <= 0) {
    throw new BadRequestException("Boş medya dosyası yüklenemez.");
  }

  if (file.size > appEnv.mediaMaxUploadBytes()) {
    throw new BadRequestException("Yüklenen dosya izin verilen medya sınırından büyük.");
  }

  const extension = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === "image/svg+xml" || extension === ".svg") {
    throw new BadRequestException("SVG dosyaları güvenli şekilde temizlenmediği için yüklenemez.");
  }

  const allowedMimeTypes = allowedUploadMimeTypes[kind] ?? [];
  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException("Bu medya türü için desteklenmeyen MIME tipi.");
  }

  const allowedExtensions = allowedUploadExtensions[kind] ?? [];
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
    throw new BadRequestException("Bu medya türü için desteklenmeyen dosya uzantısı.");
  }

  if (!hasExpectedSignature(file.buffer, file.mimetype)) {
    throw new BadRequestException("Dosya içeriği bildirilen medya türüyle eşleşmiyor.");
  }
}

function hasExpectedSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }

  if (mimeType === "image/avif") {
    return buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }

  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 4).toString("ascii") === "%PDF";
  }

  if (mimeType.includes("zip") || mimeType.includes("officedocument")) {
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }

  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    return buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }

  if (mimeType === "video/webm" || mimeType === "audio/webm") {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }

  if (mimeType === "audio/mpeg") {
    return buffer.subarray(0, 3).toString("ascii") === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
  }

  if (mimeType === "audio/wav") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WAVE";
  }

  if (mimeType === "image/x-icon" || mimeType === "image/vnd.microsoft.icon") {
    return buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00;
  }

  return true;
}

function createStorageKey(assetId: string, extension: string) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `${year}/${month}/${assetId}${extension}`;
}

function sanitizeOriginalFileName(fileName: string) {
  const cleaned = path
    .basename(fileName)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "media-file";
}

function sanitizeExtension(extension: string) {
  const cleaned = extension.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return cleaned && cleaned.length <= 12 ? cleaned : "";
}

function stripExtension(fileName: string) {
  return path.basename(fileName, path.extname(fileName)).trim();
}

export function resolveMediaStorageRoot(configuredDir = appEnv.mediaStorageDir()) {
  const trimmed = configuredDir.trim();

  if (trimmed && path.isAbsolute(trimmed)) {
    return path.resolve(trimmed);
  }

  return path.resolve(resolveProjectRoot(), trimmed || DEFAULT_MEDIA_STORAGE_DIR);
}

export async function validateMediaStorageReady(storageRoot = resolveMediaStorageRoot()) {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const probePath = resolveStoragePath(
      storageRoot,
      `.media-storage-ready-${process.pid}-${randomUUID()}.tmp`
    );

    await fs.writeFile(probePath, "ready", { flag: "wx" });
    await fs.unlink(probePath);
  } catch (error) {
    throw mapMediaStorageError(error, MEDIA_STORAGE_UNAVAILABLE_MESSAGE);
  }
}

export function mapMediaStorageError(error: unknown, fallbackMessage?: string) {
  const code = getNodeErrorCode(error);

  if (code === "EACCES" || code === "EPERM") {
    return new ServiceUnavailableException(
      "Medya depolama alanına yazma izni yok. Lütfen sistem yöneticisine bildirin."
    );
  }

  if (code === "EROFS") {
    return new ServiceUnavailableException(
      "Medya depolama alanı salt okunur. Lütfen sistem yöneticisine bildirin."
    );
  }

  if (code === "ENOENT") {
    return new ServiceUnavailableException(
      "Medya depolama klasörü hazırlanamadı. Lütfen sistem yöneticisine bildirin."
    );
  }

  if (code === "ENOSPC") {
    return new HttpException(
      "Medya depolama alanında yeterli boş yer yok. Lütfen sistem yöneticisine bildirin.",
      507
    );
  }

  return new ServiceUnavailableException(fallbackMessage ?? MEDIA_STORAGE_UNAVAILABLE_MESSAGE);
}

export function resolveStoragePath(storageRoot: string, storageKey: string) {
  const filePath = path.resolve(storageRoot, storageKey);
  const relative = path.relative(storageRoot, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new BadRequestException("Medya depolama anahtarı geçerli değil.");
  }

  return filePath;
}

async function writeLocalMediaFile(targetPath: string, buffer: Buffer) {
  const tempPath = `${targetPath}.${randomUUID()}.tmp`;

  try {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(tempPath, buffer, { flag: "wx" });
    await fs.rename(tempPath, targetPath);
  } catch (error) {
    await removeFileIfExists(tempPath);
    throw mapMediaStorageError(error);
  }
}

async function removeFileIfExists(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code = getNodeErrorCode(error);

    if (code !== "ENOENT") {
      throw error;
    }
  }
}

function getNodeErrorCode(error: unknown) {
  return error instanceof Error ? (error as NodeError).code : undefined;
}

function resolveProjectRoot() {
  return path.resolve(__dirname, "../../../..");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
