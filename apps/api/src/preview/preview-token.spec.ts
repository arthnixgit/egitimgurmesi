import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PREVIEW_TOKEN_TTL_SECONDS,
  createPreviewToken,
  verifyPreviewToken
} from "./preview-token";

const SECRET = "test-auth-secret-value";
const NOW = 1_760_000_000;

describe("preview tokens", () => {
  it("round-trips a freshly minted token", () => {
    const { token, expiresAt } = createPreviewToken(SECRET, "staff_1", NOW);
    const payload = verifyPreviewToken(token, SECRET, NOW);

    assert.ok(payload);
    assert.equal(payload.actorId, "staff_1");
    assert.equal(payload.scope, "global-website-preview");
    assert.equal(expiresAt, NOW + PREVIEW_TOKEN_TTL_SECONDS);
  });

  it("rejects a token signed with a different secret", () => {
    const { token } = createPreviewToken(SECRET, "staff_1", NOW);

    assert.equal(verifyPreviewToken(token, "another-secret", NOW), null);
  });

  it("rejects a tampered payload", () => {
    const { token } = createPreviewToken(SECRET, "staff_1", NOW);
    const [body, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ actorId: "attacker", scope: "global-website-preview", exp: NOW + 9999, nonce: "x" })
    ).toString("base64url");

    assert.equal(verifyPreviewToken(`${forged}.${signature}`, SECRET, NOW), null);
    assert.notEqual(body, forged);
  });

  it("expires exactly at its expiry second", () => {
    const { token, expiresAt } = createPreviewToken(SECRET, "staff_1", NOW);

    assert.ok(verifyPreviewToken(token, SECRET, expiresAt - 1));
    assert.equal(verifyPreviewToken(token, SECRET, expiresAt), null);
    assert.equal(verifyPreviewToken(token, SECRET, expiresAt + 1), null);
  });

  it("rejects a token whose scope is not the website preview scope", () => {
    const body = Buffer.from(
      JSON.stringify({ actorId: "staff_1", scope: "some-other-scope", exp: NOW + 600, nonce: "n" })
    ).toString("base64url");
    const { token } = createPreviewToken(SECRET, "staff_1", NOW);
    const signature = token.slice(token.lastIndexOf(".") + 1);

    // Even with a valid-looking shape, an out-of-scope token must not pass.
    assert.equal(verifyPreviewToken(`${body}.${signature}`, SECRET, NOW), null);
  });

  it("treats malformed input as absent rather than throwing", () => {
    for (const value of [null, undefined, "", "no-separator", ".", "a.", ".b", "%%%.%%%"]) {
      assert.equal(verifyPreviewToken(value, SECRET, NOW), null);
    }
  });

  it("gives every token a distinct nonce so one cannot be recognised by value", () => {
    const first = createPreviewToken(SECRET, "staff_1", NOW);
    const second = createPreviewToken(SECRET, "staff_1", NOW);

    assert.notEqual(first.token, second.token);
  });
});
