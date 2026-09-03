import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const routeSource = readFileSync(
  join(process.cwd(), "apps", "web", "app", "ucretsiz-materyaller", "[slug]", "page.tsx"),
  "utf8"
);

describe("free-material dynamic route rendering contract", () => {
  it("stays explicitly dynamic instead of mixing no-store fetches with static params", () => {
    assert.match(routeSource, /export const dynamic = ["']force-dynamic["']/);
    assert.match(routeSource, /export const dynamicParams = true/);
    assert.doesNotMatch(routeSource, /export async function generateStaticParams/);
    assert.doesNotMatch(routeSource, /export function generateStaticParams/);
  });

  it("uses request-scoped loaders for metadata and page rendering", () => {
    assert.match(routeSource, /cache\(\(\) => getFreeMaterialsContent\(\)\)/);
    assert.match(routeSource, /cache\(\(slug: string\) => getCountdownPageBySlugResult\(slug\)\)/);
    assert.match(routeSource, /generateMetadata/);
  });
});
