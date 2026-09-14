import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { RENDERABLE_SECTION_VARIANTS, isRenderableSectionVariant } from "@ega/ui";
import { HOME_SECTION_KEYS } from "./home-sections";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The other half of the contract asserted in
 * apps/admin/lib/website-builder-ui.spec.ts. That spec proves the builder
 * never offers a variant the site cannot render; this one proves the site
 * renders every variant the contract advertises, so the list cannot grow
 * without a renderer landing first.
 */
const rendererSources = [
  "../app/page.tsx",
  "../app/hakkimizda/page.tsx",
  "../app/paketlerimiz/page.tsx",
  "./public-content-api.ts",
  "./home-sections.ts"
].map((relativePath) => readFileSync(resolve(here, relativePath), "utf8"));

describe("public section rendering contract", () => {
  it("renders every variant the admin panel is allowed to offer", () => {
    for (const variant of RENDERABLE_SECTION_VARIANTS) {
      const rendered = rendererSources.some((source) => source.includes(variant));

      assert.ok(rendered, `No public renderer references the "${variant}" section variant`);
    }
  });

  it("keeps every homepage section key inside the contract", () => {
    for (const key of Object.values(HOME_SECTION_KEYS)) {
      assert.ok(isRenderableSectionVariant(key), `Homepage section "${key}" is missing from the contract`);
    }
  });

  it("rejects variants that are not part of the contract", () => {
    assert.equal(isRenderableSectionVariant("faq"), false);
    assert.equal(isRenderableSectionVariant(null), false);
    assert.equal(isRenderableSectionVariant(undefined), false);
  });
});
