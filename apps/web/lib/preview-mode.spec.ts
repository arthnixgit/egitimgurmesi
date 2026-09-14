import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PREVIEW_QUERY_PARAM,
  appendPreviewToken,
  readPreviewTokenFromParams,
  readPreviewTokenFromSearch,
  resolveClientPreviewToken
} from "./preview-mode";

describe("preview mode", () => {
  it("appends the token to paths with and without an existing query", () => {
    assert.equal(appendPreviewToken("/public/pages/home", "abc"), "/public/pages/home?preview=abc");
    assert.equal(
      appendPreviewToken("/public/site-settings?key=default", "abc"),
      "/public/site-settings?key=default&preview=abc"
    );
  });

  it("leaves the path untouched without a token", () => {
    for (const token of [null, undefined, ""]) {
      assert.equal(appendPreviewToken("/public/pages/home", token), "/public/pages/home");
    }
  });

  it("escapes a token so it cannot inject extra query parameters", () => {
    const result = appendPreviewToken("/public/pages/home", "a&admin=1");

    assert.equal(result, "/public/pages/home?preview=a%26admin%3D1");
  });

  it("reads the token from a query string with or without a leading question mark", () => {
    assert.equal(readPreviewTokenFromSearch("?preview=abc"), "abc");
    assert.equal(readPreviewTokenFromSearch("preview=abc&other=1"), "abc");
    assert.equal(readPreviewTokenFromSearch("?other=1"), null);
    assert.equal(readPreviewTokenFromSearch(""), null);
    assert.equal(readPreviewTokenFromSearch(null), null);
  });

  it("ignores a blank token", () => {
    assert.equal(readPreviewTokenFromSearch("?preview="), null);
    assert.equal(readPreviewTokenFromSearch("?preview=%20"), null);
  });

  it("normalizes the server searchParams shapes", () => {
    assert.equal(readPreviewTokenFromParams("abc"), "abc");
    assert.equal(readPreviewTokenFromParams(["", "abc"]), "abc");
    assert.equal(readPreviewTokenFromParams([]), null);
    assert.equal(readPreviewTokenFromParams(undefined), null);
    assert.equal(readPreviewTokenFromParams("   "), null);
  });

  it("returns null during server rendering", () => {
    // No window: the server must never infer preview from ambient state.
    assert.equal(typeof window, "undefined");
    assert.equal(resolveClientPreviewToken(), null);
  });

  it("exposes the parameter name it reads, so callers cannot drift from it", () => {
    assert.equal(PREVIEW_QUERY_PARAM, "preview");
    assert.match(appendPreviewToken("/x", "t"), new RegExp(`[?&]${PREVIEW_QUERY_PARAM}=`));
  });
});
