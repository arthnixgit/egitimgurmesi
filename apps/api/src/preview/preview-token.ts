import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Signed, short-lived tokens that let the admin panel view unpublished content
 * on the public site.
 *
 * The admin panel has minted these since the website builder was written, but
 * nothing ever verified one: there was no preview route, so "Önizle" printed an
 * expiry time and did nothing. This module is the missing half — minting and
 * verification in one place, so the two can never drift.
 *
 * A token grants read access to drafts only. It carries no write authority, and
 * it is deliberately short-lived so a URL pasted into a chat stops working
 * quickly.
 */
export const PREVIEW_TOKEN_SCOPE = "global-website-preview";
export const PREVIEW_TOKEN_TTL_SECONDS = 15 * 60;

export type PreviewTokenPayload = {
  actorId: string | null;
  scope: string;
  exp: number;
  nonce: string;
};

export function createPreviewToken(
  secret: string,
  actorId: string | null,
  nowSeconds: number = Math.floor(Date.now() / 1000)
) {
  const expiresAt = nowSeconds + PREVIEW_TOKEN_TTL_SECONDS;
  const body = encodeBody({
    actorId,
    scope: PREVIEW_TOKEN_SCOPE,
    exp: expiresAt,
    nonce: randomUUID()
  });

  return {
    token: `${body}.${sign(body, secret)}`,
    expiresAt
  };
}

/**
 * Returns the payload for a token that is well formed, correctly signed, in
 * scope and unexpired; null for anything else. Callers treat null as "show
 * published content", never as an error, so a stale preview link degrades into
 * the live site rather than a failure page.
 */
export function verifyPreviewToken(
  token: string | null | undefined,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): PreviewTokenPayload | null {
  if (typeof token !== "string" || !token) {
    return null;
  }

  const separator = token.lastIndexOf(".");

  if (separator <= 0 || separator === token.length - 1) {
    return null;
  }

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!matchesSignature(body, signature, secret)) {
    return null;
  }

  const payload = decodeBody(body);

  if (!payload || payload.scope !== PREVIEW_TOKEN_SCOPE) {
    return null;
  }

  if (!Number.isFinite(payload.exp) || payload.exp <= nowSeconds) {
    return null;
  }

  return payload;
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function matchesSignature(body: string, signature: string, secret: string) {
  const expected = Buffer.from(sign(body, secret));
  const provided = Buffer.from(signature);

  // timingSafeEqual throws on length mismatch, and the length itself is not a
  // secret, so compare it first and then compare contents in constant time.
  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}

function encodeBody(payload: PreviewTokenPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeBody(body: string): PreviewTokenPayload | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    return {
      actorId: typeof record.actorId === "string" ? record.actorId : null,
      scope: typeof record.scope === "string" ? record.scope : "",
      exp: typeof record.exp === "number" ? record.exp : Number.NaN,
      nonce: typeof record.nonce === "string" ? record.nonce : ""
    };
  } catch {
    return null;
  }
}
