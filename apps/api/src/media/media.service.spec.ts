import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import { AuthActorType, MediaAssetKind, PERMISSION_KEYS } from "@ega/db";
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException
} from "@nestjs/common";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import {
  mapMediaStorageError,
  MediaService,
  resolveMediaStorageRoot,
  resolveStoragePath,
  validateMediaStorageReady,
  validateUploadedMediaFile
} from "./media.service";

type UploadCandidate = Parameters<typeof validateUploadedMediaFile>[0];
type MediaRecord = Awaited<ReturnType<MediaService["getAsset"]>>;

const originalEnv = {
  MEDIA_STORAGE_DIR: process.env.MEDIA_STORAGE_DIR,
  MEDIA_PUBLIC_BASE_URL: process.env.MEDIA_PUBLIC_BASE_URL,
  MEDIA_MAX_UPLOAD_BYTES: process.env.MEDIA_MAX_UPLOAD_BYTES,
  NODE_ENV: process.env.NODE_ENV
};
const tempDirs: string[] = [];

afterEach(async () => {
  restoreEnv();

  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop();

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
});

describe("MediaService upload validation", () => {
  it("rejects zero-byte, oversized, SVG, MIME, extension, and signature failures", () => {
    assert.throws(
      () => validateUploadedMediaFile(file("empty.png", "image/png", Buffer.alloc(0)), MediaAssetKind.IMAGE),
      { message: /medya/ }
    );

    process.env.MEDIA_MAX_UPLOAD_BYTES = "8";
    assert.throws(
      () => validateUploadedMediaFile(file("large.png", "image/png", Buffer.alloc(9)), MediaAssetKind.IMAGE),
      { message: /sınır/ }
    );
    delete process.env.MEDIA_MAX_UPLOAD_BYTES;

    assert.throws(
      () =>
        validateUploadedMediaFile(
          file("logo.svg", "image/svg+xml", Buffer.from("<svg></svg>")),
          MediaAssetKind.BRANDING
        ),
      { message: /SVG/ }
    );

    assert.throws(
      () =>
        validateUploadedMediaFile(
          file("setup.exe", "application/octet-stream", Buffer.from("MZ executable")),
          MediaAssetKind.DOCUMENT
        ),
      { message: /MIME/ }
    );

    assert.throws(
      () => validateUploadedMediaFile(file("logo.gif", "image/png", pngSignature()), MediaAssetKind.IMAGE),
      { message: /uzant/ }
    );

    assert.throws(
      () => validateUploadedMediaFile(file("logo.png", "image/png", Buffer.from("not a png")), MediaAssetKind.IMAGE),
      { message: /Dosya/ }
    );
  });

  it("accepts supported PNG, JPEG, WebP, favicon, and document signatures", () => {
    assert.doesNotThrow(() =>
      validateUploadedMediaFile(file("logo.png", "image/png", pngSignature()), MediaAssetKind.IMAGE)
    );
    assert.doesNotThrow(() =>
      validateUploadedMediaFile(file("logo.jpg", "image/jpeg", jpegSignature()), MediaAssetKind.BRANDING)
    );
    assert.doesNotThrow(() =>
      validateUploadedMediaFile(file("logo.webp", "image/webp", webpSignature()), MediaAssetKind.BRANDING)
    );
    assert.doesNotThrow(() =>
      validateUploadedMediaFile(
        file("favicon.ico", "image/x-icon", Buffer.from([0x00, 0x00, 0x01, 0x00, 0x10])),
        MediaAssetKind.BRANDING
      )
    );
    assert.doesNotThrow(() =>
      validateUploadedMediaFile(file("plan.pdf", "application/pdf", Buffer.from("%PDF-1.7\n")), MediaAssetKind.DOCUMENT)
    );
  });
});

describe("MediaService storage resolution and readiness", () => {
  it("preserves absolute storage paths and roots the default under the project", () => {
    const absolutePath = path.resolve(os.tmpdir(), "ega-media-absolute");

    assert.equal(resolveMediaStorageRoot(absolutePath), absolutePath);
    assert.match(resolveMediaStorageRoot(""), /storage[\\/]media$/);
    assert.notEqual(resolveMediaStorageRoot(""), path.resolve(process.cwd(), "../../storage/media"));
  });

  it("prepares and probes storage readiness without leaving probe files", async () => {
    const storageRoot = await makeTempDir();

    await validateMediaStorageReady(storageRoot);

    assert.deepEqual(await listFiles(storageRoot), []);
  });

  it("prevents storage-key traversal outside the storage root", async () => {
    const storageRoot = await makeTempDir();

    assert.throws(() => resolveStoragePath(storageRoot, "../outside.png"), BadRequestException);
  });

  it("maps missing, unwritable, read-only, full-storage, and unknown filesystem failures", () => {
    assertMediaStorageError("ENOENT", 503, "Medya depolama klasörü hazırlanamadı.");
    assertMediaStorageError("EACCES", 503, "Medya depolama alanına yazma izni yok.");
    assertMediaStorageError("EPERM", 503, "Medya depolama alanına yazma izni yok.");
    assertMediaStorageError("EROFS", 503, "Medya depolama alanı salt okunur.");
    assertMediaStorageError("ENOSPC", 507, "Medya depolama alanında yeterli boş yer yok.");
    assertMediaStorageError("EUNKNOWN", 503, "Medya depolama alanı kullanıma hazır değil.");
  });
});

describe("MediaService local uploads", () => {
  it("uploads PNG, JPEG, and WebP branding assets through temp-file atomic writes", async () => {
    const storageRoot = await makeTempDir();
    process.env.MEDIA_STORAGE_DIR = storageRoot;
    process.env.MEDIA_PUBLIC_BASE_URL = "http://localhost:4000/v1";
    const harness = createMediaHarness();
    const service = new MediaService(harness.prisma as never);

    for (const candidate of [
      file("logo.png", "image/png", pngSignature()),
      file("logo.jpg", "image/jpeg", jpegSignature()),
      file("logo.webp", "image/webp", webpSignature())
    ]) {
      const asset = await service.uploadAsset(candidate, { kind: MediaAssetKind.BRANDING }, branchAdminAuth);

      assert.equal(asset.kind, MediaAssetKind.BRANDING);
      assert.equal(asset.mimeType, candidate.mimetype);
      assert.match(asset.publicUrl ?? "", /^http:\/\/localhost:4000\/v1\/media\/assets\/.+\/file$/);
    }

    const files = await listFiles(storageRoot);
    assert.equal(files.length, 3);
    assert.equal(files.some((entry) => entry.endsWith(".tmp")), false);
    assert.equal(harness.state.assets.length, 3);
  });

  it("uses the public production media URL when production override is not configured", async () => {
    const storageRoot = await makeTempDir();
    process.env.MEDIA_STORAGE_DIR = storageRoot;
    delete process.env.MEDIA_PUBLIC_BASE_URL;
    process.env.NODE_ENV = "production";
    const service = new MediaService(createMediaHarness().prisma as never);

    const asset = await service.uploadAsset(
      file("logo.png", "image/png", pngSignature()),
      { kind: MediaAssetKind.BRANDING },
      superAdminAuth
    );

    assert.match(
      asset.publicUrl ?? "",
      /^https:\/\/api\.egitimgurmesi\.com\/v1\/media\/assets\/.+\/file$/
    );
  });

  it("removes the written file when the database or audit transaction fails", async () => {
    const storageRoot = await makeTempDir();
    process.env.MEDIA_STORAGE_DIR = storageRoot;
    const service = new MediaService(createMediaHarness({ failTransaction: true }).prisma as never);

    await assert.rejects(
      () =>
        service.uploadAsset(
          file("logo.png", "image/png", pngSignature()),
          { kind: MediaAssetKind.BRANDING },
          branchAdminAuth
        ),
      (error: unknown) => {
        assert.ok(error instanceof InternalServerErrorException);
        assert.equal(error.message, "Medya kaydı tamamlanamadı. Dosya yüklenmedi.");
        return true;
      }
    );

    assert.deepEqual(await listFiles(storageRoot), []);
  });

  it("resolves public local file retrieval without exposing paths in not-found errors", async () => {
    const storageRoot = await makeTempDir();
    process.env.MEDIA_STORAGE_DIR = storageRoot;
    const harness = createMediaHarness();
    const service = new MediaService(harness.prisma as never);
    const asset = await service.uploadAsset(
      file("logo.png", "image/png", pngSignature()),
      { kind: MediaAssetKind.BRANDING },
      branchAdminAuth
    );

    const localFile = await service.getLocalAssetFile(asset.id);

    assert.equal((await fs.stat(localFile.filePath)).isFile(), true);
    assert.equal(localFile.asset.id, asset.id);

    harness.state.assets[0].storageKey = "missing.png";
    await assert.rejects(
      () => service.getLocalAssetFile(asset.id),
      (error: unknown) => {
        assert.equal(error instanceof Error ? error.message : "", "Medya dosyası depolama alanında bulunamadı.");
        assert.equal(String(error).includes(storageRoot), false);
        return true;
      }
    );
  });

  it("allows Super Admin and Branch Admin website managers while rejecting other roles", async () => {
    const storageRoot = await makeTempDir();
    process.env.MEDIA_STORAGE_DIR = storageRoot;

    await assert.doesNotReject(() =>
      new MediaService(createMediaHarness().prisma as never).uploadAsset(
        file("logo.png", "image/png", pngSignature()),
        { kind: MediaAssetKind.BRANDING },
        superAdminAuth
      )
    );
    await assert.doesNotReject(() =>
      new MediaService(createMediaHarness().prisma as never).uploadAsset(
        file("logo.jpg", "image/jpeg", jpegSignature()),
        { kind: MediaAssetKind.BRANDING },
        branchAdminAuth
      )
    );

    await assert.rejects(
      () =>
        new MediaService(createMediaHarness().prisma as never).uploadAsset(
          file("logo.webp", "image/webp", webpSignature()),
          { kind: MediaAssetKind.BRANDING },
          instructorAuth
        ),
      (error: unknown) => {
        assert.ok(error instanceof ForbiddenException);
        assert.equal(error.getStatus(), 403);
        return true;
      }
    );
  });
});

function file(originalname: string, mimetype: string, buffer: Buffer): UploadCandidate {
  return {
    originalname,
    mimetype,
    size: buffer.byteLength,
    buffer
  };
}

function pngSignature() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
}

function jpegSignature() {
  return Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
}

function webpSignature() {
  const buffer = Buffer.alloc(16);
  buffer.write("RIFF", 0, "ascii");
  buffer.write("WEBP", 8, "ascii");
  return buffer;
}

async function makeTempDir() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ega-media-test-"));
  tempDirs.push(tempDir);
  return tempDir;
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? (await listFiles(entryPath)).map((child) => path.join(entry.name, child))
        : [entry.name];
    })
  );

  return files.flat().sort();
}

function assertMediaStorageError(code: string, status: number, messagePrefix: string) {
  const exception = mapMediaStorageError(Object.assign(new Error(code), { code }));

  assert.equal(exception.getStatus(), status);
  assert.match(exception.message, new RegExp(`^${escapeRegExp(messagePrefix)}`));
}

function createMediaHarness(options: { failTransaction?: boolean } = {}) {
  const state = {
    assets: [] as MediaRecord[]
  };
  const tx = {
    mediaAsset: {
      create: async (args: { data: Record<string, unknown> }) => {
        const now = new Date("2026-09-01T00:00:00.000Z");
        const asset = {
          id: String(args.data.id),
          organizationId: null,
          branchId: null,
          kind: args.data.kind,
          sourceType: args.data.sourceType,
          title: String(args.data.title),
          altText: args.data.altText ?? null,
          mimeType: args.data.mimeType ?? null,
          storageKey: args.data.storageKey ?? null,
          publicUrl: args.data.publicUrl ?? null,
          externalProvider: null,
          externalUrl: null,
          embedUrl: null,
          thumbnailUrl: null,
          originalFileName: args.data.originalFileName ?? null,
          sizeBytes: args.data.sizeBytes ?? null,
          metadata: args.data.metadata ?? null,
          createdByStaffUserId: args.data.createdByStaffUserId ?? null,
          createdAt: now,
          updatedAt: now
        } as MediaRecord;

        state.assets.push(asset);
        return asset;
      }
    },
    auditLog: {
      create: async () => ({ id: "audit_1" })
    }
  };
  const prisma = {
    mediaAsset: {
      findMany: async () => state.assets,
      findUnique: async (args: { where: { id: string } }) =>
        state.assets.find((asset) => asset.id === args.where.id) ?? null
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => {
      const result = await callback(tx);

      if (options.failTransaction) {
        throw new Error("audit transaction failed");
      }

      return result;
    }
  };

  return { prisma, state };
}

function restoreEnv() {
  restoreEnvKey("MEDIA_STORAGE_DIR", originalEnv.MEDIA_STORAGE_DIR);
  restoreEnvKey("MEDIA_PUBLIC_BASE_URL", originalEnv.MEDIA_PUBLIC_BASE_URL);
  restoreEnvKey("MEDIA_MAX_UPLOAD_BYTES", originalEnv.MEDIA_MAX_UPLOAD_BYTES);
  restoreEnvKey("NODE_ENV", originalEnv.NODE_ENV);
}

function restoreEnvKey(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const baseAuth = {
  actorId: "staff_1",
  email: "staff@example.com",
  actorType: AuthActorType.STAFF,
  sessionFamily: "session",
  organizationId: null,
  primaryBranchId: null,
  branchIds: [],
  branchRoles: []
} satisfies Omit<AuthenticatedRequestContext, "roleKeys" | "permissionKeys" | "isSuperAdmin">;

const superAdminAuth: AuthenticatedRequestContext = {
  ...baseAuth,
  actorId: "staff_super",
  roleKeys: ["super-admin"],
  permissionKeys: [],
  isSuperAdmin: true
};

const branchAdminAuth: AuthenticatedRequestContext = {
  ...baseAuth,
  actorId: "staff_branch",
  roleKeys: ["branch-admin"],
  permissionKeys: [PERMISSION_KEYS.websiteManage],
  organizationId: "org_1",
  primaryBranchId: "branch_1",
  branchIds: ["branch_1"],
  isSuperAdmin: false
};

const instructorAuth: AuthenticatedRequestContext = {
  ...baseAuth,
  actorId: "staff_instructor",
  roleKeys: ["instructor"],
  permissionKeys: [],
  isSuperAdmin: false
};
