import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@prisma/client";
import { backfillMarketingPages } from "./seed-marketing-pages";

type Call = { method: string; args: unknown };

/**
 * A stand-in for PrismaClient that records what was asked of it.
 *
 * The property under test is what this script must *not* do. Running the real
 * seed against production would delete the customer's homepage sections, so the
 * guarantees worth pinning down are negative ones — no update, no delete, and
 * nothing addressed to `home` — and those are provable without a database.
 */
function createRecordingClient(existingKeys: string[]) {
  const calls: Call[] = [];

  const client = {
    marketingPage: {
      findFirst(args: { where: { OR: Array<{ key?: string; slug?: string }> } }) {
        calls.push({ method: "findFirst", args });
        const wanted = args.where.OR.map((clause) => clause.key ?? clause.slug);
        const hit = wanted.find((value) => value && existingKeys.includes(value));
        return Promise.resolve(hit ? { key: hit } : null);
      },
      create(args: unknown) {
        calls.push({ method: "create", args });
        return Promise.resolve({ id: "generated" });
      },
      update(args: unknown) {
        calls.push({ method: "update", args });
        return Promise.resolve({ id: "generated" });
      },
      upsert(args: unknown) {
        calls.push({ method: "upsert", args });
        return Promise.resolve({ id: "generated" });
      },
      deleteMany(args: unknown) {
        calls.push({ method: "deleteMany", args });
        return Promise.resolve({ count: 0 });
      }
    },
    marketingPageSection: {
      deleteMany(args: unknown) {
        calls.push({ method: "section.deleteMany", args });
        return Promise.resolve({ count: 0 });
      },
      createMany(args: unknown) {
        calls.push({ method: "section.createMany", args });
        return Promise.resolve({ count: 0 });
      }
    }
  };

  return { client: client as unknown as PrismaClient, calls };
}

describe("additive marketing page backfill", () => {
  it("creates the pages that are missing", async () => {
    const { client } = createRecordingClient(["home"]);

    const summary = await backfillMarketingPages(client);

    assert.deepEqual(summary.created.sort(), [
      "about",
      "academic-staff",
      "free-materials",
      "in-person-coaching",
      "packages",
      "success-stories"
    ]);
  });

  it("never writes to the home page, which holds live customer content", async () => {
    const { client, calls } = createRecordingClient(["home"]);

    const summary = await backfillMarketingPages(client);

    assert.deepEqual(summary.skippedProtected, ["home"]);
    assert.equal(
      calls.some((call) => JSON.stringify(call.args).includes('"home"')),
      false,
      "no query should mention the home page at all"
    );
  });

  it("issues no update, upsert or delete of any kind", async () => {
    const { client, calls } = createRecordingClient(["home"]);

    await backfillMarketingPages(client);

    const forbidden = calls.filter((call) => call.method !== "findFirst" && call.method !== "create");

    assert.deepEqual(forbidden, [], "the backfill must only read and create");
  });

  it("skips a page that already exists under its key or its slug", async () => {
    // A slug renamed in the admin panel must still be recognised, rather than
    // producing a duplicate or a unique-constraint failure.
    const { client } = createRecordingClient(["home", "about", "paketlerimiz"]);

    const summary = await backfillMarketingPages(client);

    assert.equal(summary.created.includes("about"), false);
    assert.equal(summary.created.includes("packages"), false);
    assert.deepEqual(summary.skippedExisting.sort(), ["about", "packages"]);
  });

  it("is a no-op on a fully seeded environment", async () => {
    const { client, calls } = createRecordingClient([
      "home",
      "packages",
      "in-person-coaching",
      "academic-staff",
      "success-stories",
      "free-materials",
      "about"
    ]);

    const summary = await backfillMarketingPages(client);

    assert.deepEqual(summary.created, []);
    assert.equal(
      calls.some((call) => call.method === "create"),
      false
    );
  });

  it("creates new pages as drafts, so placeholder copy never goes live on its own", async () => {
    const { client, calls } = createRecordingClient(["home"]);

    await backfillMarketingPages(client);

    const creates = calls.filter((call) => call.method === "create");

    assert.equal(creates.length, 6);

    for (const call of creates) {
      const data = (call.args as { data: { publishStatus: string; sections?: { create: Array<{ publishStatus: string }> } } }).data;

      assert.equal(data.publishStatus, "DRAFT");

      for (const section of data.sections?.create ?? []) {
        assert.equal(section.publishStatus, "DRAFT");
      }
    }
  });
});
