import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MediaAssetKind } from "@ega/db";
import { validateUploadedMediaFile } from "./media.service";

type UploadCandidate = Parameters<typeof validateUploadedMediaFile>[0];

describe("MediaService upload validation", () => {
  it("rejects zero-byte files, SVG, and unsupported executable uploads", () => {
    assert.throws(() => validateUploadedMediaFile(file("empty.png", "image/png", Buffer.alloc(0)), MediaAssetKind.IMAGE), {
      message: /medya/
    });

    assert.throws(
      () => validateUploadedMediaFile(file("logo.svg", "image/svg+xml", Buffer.from("<svg></svg>")), MediaAssetKind.BRANDING),
      { message: /SVG/ }
    );

    assert.throws(
      () =>
        validateUploadedMediaFile(
          file("setup.exe", "application/octet-stream", Buffer.from("MZ executable")),
          MediaAssetKind.DOCUMENT
        ),
      { message: /desteklenmeyen MIME/ }
    );
  });

  it("rejects media whose extension or signature does not match the declared type", () => {
    assert.throws(
      () => validateUploadedMediaFile(file("logo.gif", "image/png", pngSignature()), MediaAssetKind.IMAGE),
      { message: /uzant/ }
    );

    assert.throws(
      () => validateUploadedMediaFile(file("logo.png", "image/png", Buffer.from("not a png")), MediaAssetKind.IMAGE),
      { message: /Dosya/ }
    );
  });

  it("accepts supported image, favicon, and document signatures", () => {
    assert.doesNotThrow(() => validateUploadedMediaFile(file("logo.png", "image/png", pngSignature()), MediaAssetKind.IMAGE));
    assert.doesNotThrow(() =>
      validateUploadedMediaFile(file("favicon.ico", "image/x-icon", Buffer.from([0x00, 0x00, 0x01, 0x00, 0x10])), MediaAssetKind.BRANDING)
    );
    assert.doesNotThrow(() =>
      validateUploadedMediaFile(file("plan.pdf", "application/pdf", Buffer.from("%PDF-1.7\n")), MediaAssetKind.DOCUMENT)
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
