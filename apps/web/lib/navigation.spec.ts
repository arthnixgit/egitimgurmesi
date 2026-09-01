import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  getNavigationItems,
  getNavigationSnapshot,
  requestNavigationSnapshot
} from "./public-content-api";
import {
  createFallbackNavigationSnapshot,
  isValidNavigationSnapshot,
  publicNavigationItems,
  validateNavigationItems
} from "./navigation";

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

  it("treats an unexpected 200 empty navigation response as invalid fallback data", async () => {
    let requestCount = 0;
    (globalThis as { fetch?: typeof fetch }).fetch = async () => {
      requestCount += 1;
      return jsonResponse({
        key: "primary",
        enabled: true,
        version: 4,
        generatedAt: "2026-09-01T00:00:00.000Z",
        items: []
      });
    };

    const snapshot = await getNavigationSnapshot();

    assert.equal(requestCount, 1);
    assert.equal(snapshot.source, "fallback");
    assert.deepEqual(snapshot.items.map((item) => item.id), publicNavigationItems.map((item) => item.id));
  });

  it("accepts explicitly disabled navigation as the only authoritative empty snapshot", async () => {
    (globalThis as { fetch?: typeof fetch }).fetch = async () =>
      jsonResponse({
        key: "primary",
        enabled: false,
        version: 7,
        generatedAt: "2026-09-01T00:00:00.000Z",
        source: "disabled",
        items: []
      });

    const snapshot = await requestNavigationSnapshot();

    assert.equal(snapshot.enabled, false);
    assert.equal(snapshot.source, "disabled");
    assert.deepEqual(snapshot.items, []);
    assert.equal(isValidNavigationSnapshot(snapshot), true);
  });

  it("normalizes valid package children and rejects duplicate item keys", async () => {
    (globalThis as { fetch?: typeof fetch }).fetch = async () =>
      jsonResponse({
        key: "primary",
        enabled: true,
        version: 5,
        generatedAt: "2026-09-01T00:00:00.000Z",
        items: [
          navigationNode({
            itemKey: "packages",
            label: "Paketlerimiz",
            href: "/paketlerimiz",
            children: [
              navigationNode({
                itemKey: "packages-online",
                label: "Online",
                href: "/paketlerimiz?kategori=online",
                children: [
                  navigationNode({
                    itemKey: "packages-online-yks",
                    label: "YKS",
                    href: "/paketlerimiz?kategori=online&alt=yks"
                  })
                ]
              })
            ]
          }),
          navigationNode({ itemKey: "about", label: "About", href: "/hakkimizda" })
        ]
      });

    const snapshot = await requestNavigationSnapshot();

    assert.equal(snapshot.source, undefined);
    assert.equal(snapshot.items[0].megaMenuColumns?.[0].label, "Online");
    assert.equal(snapshot.items[0].megaMenuColumns?.[0].items?.[0].label, "YKS");
    assert.equal(validateNavigationItems([
      ...snapshot.items,
      {
        id: "about",
        label: "Duplicate",
        href: "/duplicate"
      }
    ]), "duplicate-item-key");
  });

  it("validates fallback snapshots as active non-empty navigation", () => {
    const snapshot = createFallbackNavigationSnapshot();

    assert.equal(isValidNavigationSnapshot(snapshot), true);
    assert.equal(validateNavigationItems([]), "empty-active-navigation");
  });
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function navigationNode(input: {
  itemKey: string;
  label: string;
  href: string;
  children?: unknown[];
}) {
  return {
    id: input.itemKey,
    itemKey: input.itemKey,
    label: input.label,
    href: input.href,
    description: null,
    target: null,
    children: input.children ?? []
  };
}
