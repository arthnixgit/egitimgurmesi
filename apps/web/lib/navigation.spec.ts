import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getNavigationItems } from "./public-content-api";
import { publicNavigationItems } from "./navigation";

describe("public navbar fallback navigation", () => {
  afterEach(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it("keeps Paketlerimiz as a safe top-level link without hardcoded package children", () => {
    const packages = publicNavigationItems.find((item) => item.id === "packages");

    assert.ok(packages);
    assert.equal(packages.href, "/paketlerimiz");
    assert.equal(packages.megaMenuColumns, undefined);
    assert.equal(JSON.stringify(publicNavigationItems).includes("online-coaching"), false);
  });

  it("does not loop requests or restore stale package children when the API fails", async () => {
    let requestCount = 0;
    (globalThis as { fetch?: typeof fetch }).fetch = async () => {
      requestCount += 1;
      throw new TypeError("network down");
    };

    const items = await getNavigationItems();
    const packages = items.find((item) => item.id === "packages");

    assert.equal(requestCount, 1);
    assert.ok(packages);
    assert.equal(packages.href, "/paketlerimiz");
    assert.equal(packages.megaMenuColumns, undefined);
    assert.equal(JSON.stringify(items).includes("in-person-coaching"), false);
  });
});
