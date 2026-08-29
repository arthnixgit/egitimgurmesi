import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

const migrationRelativePath = path.join(
  "prisma",
  "migrations",
  "20260828090000_add_website_builder_settings",
  "migration.sql"
);

function findMigrationPath() {
  const candidates = [
    path.resolve(process.cwd(), migrationRelativePath),
    path.resolve(process.cwd(), "packages", "db", migrationRelativePath)
  ];

  const match = candidates.find((candidate) => existsSync(candidate));
  if (!match) {
    throw new Error(`Migration file was not found at ${migrationRelativePath}`);
  }

  return match;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function stripSqlComments(sql: string) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function splitSqlStatements(sql: string) {
  const statements: string[] = [];
  let start = 0;
  let index = 0;
  let inSingleQuote = false;
  let dollarTag: string | null = null;

  while (index < sql.length) {
    const char = sql[index];

    if (dollarTag) {
      if (sql.startsWith(dollarTag, index)) {
        index += dollarTag.length;
        dollarTag = null;
        continue;
      }

      index += 1;
      continue;
    }

    if (inSingleQuote) {
      if (char === "'" && sql[index + 1] === "'") {
        index += 2;
        continue;
      }

      if (char === "'") {
        inSingleQuote = false;
      }

      index += 1;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      index += 1;
      continue;
    }

    if (char === "$") {
      const tagMatch = sql.slice(index).match(/^\$[A-Za-z0-9_]*\$/);
      if (tagMatch) {
        dollarTag = tagMatch[0];
        index += dollarTag.length;
        continue;
      }
    }

    if (char === ";") {
      const statement = sql.slice(start, index).trim();
      if (statement) {
        statements.push(statement);
      }
      start = index + 1;
    }

    index += 1;
  }

  const finalStatement = sql.slice(start).trim();
  if (finalStatement) {
    statements.push(finalStatement);
  }

  return statements;
}

function quoteIdent(identifier: string) {
  assertCondition(
    /^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier),
    `Unsafe SQL identifier: ${identifier}`
  );

  return `"${identifier}"`;
}

function withSchema(databaseUrl: string, schema: string) {
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

function withoutSchema(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("schema");
  return url.toString();
}

function runStaticChecks(migrationSql: string) {
  const uncommentedSql = stripSqlComments(migrationSql);
  const insertMatch = uncommentedSql.match(
    /INSERT INTO "site_settings"\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT \("key"\) DO UPDATE SET\s*([\s\S]*?)$/m
  );

  assertCondition(insertMatch, "site_settings upsert was not found.");

  const [, insertColumns, insertValues, conflictUpdate] = insertMatch;
  const columnNames = Array.from(insertColumns.matchAll(/"([^"]+)"/g)).map((match) => match[1]);

  assertCondition(
    columnNames.slice(-3).join(",") === "createdAt,updatedAt,publishedAt",
    'site_settings INSERT must end with "createdAt", "updatedAt", and "publishedAt".'
  );

  assertCondition(
    /CURRENT_TIMESTAMP\s*,\s*CURRENT_TIMESTAMP\s*,\s*CURRENT_TIMESTAMP\s*$/m.test(
      insertValues.trim()
    ),
    "site_settings INSERT must provide createdAt, updatedAt, and publishedAt timestamps."
  );

  assertCondition(
    /"updatedAt"\s*=\s*CURRENT_TIMESTAMP/.test(conflictUpdate),
    'site_settings ON CONFLICT update must refresh "updatedAt".'
  );

  const unsafeAddColumns = uncommentedSql
    .split(/\r?\n/)
    .filter((line) => /\bALTER TABLE\b.*\bADD COLUMN\b/.test(line))
    .filter((line) => !/\bADD COLUMN IF NOT EXISTS\b/.test(line));

  assertCondition(
    unsafeAddColumns.length === 0,
    `ALTER TABLE ADD COLUMN must use IF NOT EXISTS:\n${unsafeAddColumns.join("\n")}`
  );

  assertCondition(
    /CREATE TABLE IF NOT EXISTS "website_content_revisions"/.test(uncommentedSql),
    "website_content_revisions must be created with IF NOT EXISTS."
  );

  const unsafeIndexes = uncommentedSql
    .split(/\r?\n/)
    .filter((line) => /\bCREATE INDEX\b/.test(line))
    .filter((line) => !/\bCREATE INDEX IF NOT EXISTS\b/.test(line));

  assertCondition(
    unsafeIndexes.length === 0,
    `CREATE INDEX must use IF NOT EXISTS:\n${unsafeIndexes.join("\n")}`
  );

  const destructivePatterns = [
    /\bDROP\s+TABLE\b/i,
    /\bDROP\s+COLUMN\b/i,
    /\bTRUNCATE\b/i,
    /\bDELETE\s+FROM\b/i,
    /ALTER\s+COLUMN\s+"updatedAt"\s+DROP\s+NOT\s+NULL/i,
    /"updatedAt"\s+TIMESTAMP\(3\)[^;]*DEFAULT/i
  ];

  for (const pattern of destructivePatterns) {
    assertCondition(!pattern.test(uncommentedSql), `Migration contains forbidden SQL: ${pattern}`);
  }

  for (const preservedValue of [
    "+90 531 855 38 27",
    "+905318553827",
    "905318553827",
    "/paketlerimiz",
    "/ucretsiz-materyaller",
    "/hakkimizda",
    "/giris",
    "/branding/ega-logo-official.png",
    "4834. Sok.",
    "Ankara"
  ]) {
    assertCondition(
      migrationSql.includes(preservedValue),
      `Backfill value was not preserved: ${preservedValue}`
    );
  }
}

async function executeSql(client: PrismaClient, sql: string) {
  for (const statement of splitSqlStatements(sql)) {
    await client.$executeRawUnsafe(statement);
  }
}

async function createBaselineSchema(client: PrismaClient, fullItemTypeEnum = false) {
  await executeSql(
    client,
    `
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "FreeMaterialItemType" AS ENUM (${
      fullItemTypeEnum
        ? "'TOOL', 'LINK', 'PDF', 'GUIDANCE', 'EXTERNAL', 'DOWNLOAD', 'INTERNAL_PAGE', 'EXTERNAL_LINK', 'COUNTDOWN', 'CALCULATOR', 'BLOG', 'SIMULATION', 'SYSTEM_TOOL'"
        : "'TOOL', 'LINK', 'PDF', 'GUIDANCE', 'EXTERNAL'"
    });

CREATE TABLE "navigation_menus" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "items" JSONB NOT NULL DEFAULT '[]',
  "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "marketing_pages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "staff_profile_groups" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "success_stories" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "highlight" TEXT NOT NULL,
  "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "free_material_categories" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "free_material_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "categoryId" TEXT NOT NULL,
  "slug" TEXT UNIQUE,
  "title" TEXT NOT NULL,
  "itemType" "FreeMaterialItemType" NOT NULL,
  "href" TEXT,
  "buttonLabel" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "countdown_pages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "eyebrow" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "videoTitle" TEXT NOT NULL,
  "videoNote" TEXT NOT NULL,
  "publishStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "site_settings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "siteName" TEXT NOT NULL,
  "siteTitle" TEXT NOT NULL,
  "tagline" TEXT,
  "supportEmail" TEXT,
  "supportPhone" TEXT,
  "supportWhatsappNumber" TEXT,
  "logoPrimaryUrl" TEXT,
  "logoMarkUrl" TEXT,
  "footerNotice" TEXT,
  "defaultSeoTitle" TEXT,
  "defaultSeoDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

INSERT INTO "marketing_pages" ("id", "slug", "title")
VALUES ('existing_marketing_page', 'existing-page', 'Existing page');

INSERT INTO "free_material_categories" ("id", "key", "label")
VALUES ('existing_material_category', 'existing-category', 'Existing category');

INSERT INTO "free_material_items" ("id", "categoryId", "slug", "title", "itemType")
VALUES ('existing_material_item', 'existing_material_category', 'existing-item', 'Existing item', 'PDF');
`
  );
}

async function assertMigrationResult(client: PrismaClient) {
  const settingsRows = await client.$queryRawUnsafe<
    Array<{
      key: string;
      createdAt: Date | null;
      updatedAt: Date | null;
      publishedAt: Date | null;
      supportPhone: string | null;
      canonicalPhone: string | null;
      supportWhatsappNumber: string | null;
      footerQuickLinks: unknown;
    }>
  >(
    `SELECT "key", "createdAt", "updatedAt", "publishedAt", "supportPhone", "canonicalPhone", "supportWhatsappNumber", "footerQuickLinks"
     FROM "site_settings"
     WHERE "key" = 'default'`
  );

  assertCondition(settingsRows.length === 1, "Default site_settings row was not created.");
  const [settings] = settingsRows;

  assertCondition(settings.createdAt, "createdAt is null after migration.");
  assertCondition(settings.updatedAt, "updatedAt is null after migration.");
  assertCondition(settings.publishedAt, "publishedAt is null after migration.");
  assertCondition(
    settings.supportPhone === "+90 531 855 38 27",
    "Display phone backfill changed."
  );
  assertCondition(settings.canonicalPhone === "+905318553827", "Canonical phone backfill changed.");
  assertCondition(
    settings.supportWhatsappNumber === "905318553827",
    "WhatsApp number backfill changed."
  );

  const quickLinks = JSON.stringify(settings.footerQuickLinks);
  for (const route of ["/paketlerimiz", "/ucretsiz-materyaller", "/hakkimizda", "/giris"]) {
    assertCondition(quickLinks.includes(route), `Footer quick link missing after migration: ${route}`);
  }

  const preservedRows = await client.$queryRawUnsafe<Array<{ source: string; count: bigint }>>(
    `
SELECT 'marketing_pages' AS "source", COUNT(*) AS "count"
FROM "marketing_pages"
WHERE "id" = 'existing_marketing_page'
UNION ALL
SELECT 'free_material_items' AS "source", COUNT(*) AS "count"
FROM "free_material_items"
WHERE "id" = 'existing_material_item'
`
  );

  for (const row of preservedRows) {
    assertCondition(Number(row.count) === 1, `Existing content was not preserved: ${row.source}`);
  }
}

async function runScenario(
  databaseUrl: string,
  label: string,
  migrationSql: string,
  preparePartialState = false
) {
  const schemaName = `website_builder_${label}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const adminClient = new PrismaClient({
    datasources: {
      db: {
        url: withoutSchema(databaseUrl)
      }
    }
  });

  await adminClient.$executeRawUnsafe(`CREATE SCHEMA ${quoteIdent(schemaName)}`);

  const client = new PrismaClient({
    datasources: {
      db: {
        url: withSchema(databaseUrl, schemaName)
      }
    }
  });

  try {
    await createBaselineSchema(client, preparePartialState);

    if (preparePartialState) {
      const insertIndex = migrationSql.indexOf('INSERT INTO "site_settings"');
      assertCondition(insertIndex > -1, "site_settings INSERT was not found for partial simulation.");
      await executeSql(client, migrationSql.slice(0, insertIndex));
    }

    await executeSql(client, migrationSql);
    await assertMigrationResult(client);
    console.log(`${label}: PostgreSQL migration simulation passed.`);
  } finally {
    await client.$disconnect();
    await adminClient.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${quoteIdent(schemaName)} CASCADE`);
    await adminClient.$disconnect();
  }
}

async function main() {
  const migrationPath = findMigrationPath();
  const migrationSql = readFileSync(migrationPath, "utf8");

  runStaticChecks(migrationSql);
  console.log("static: website builder migration checks passed.");

  const databaseUrl = process.env.MIGRATION_TEST_DATABASE_URL;
  if (!databaseUrl) {
    console.log("database: skipped because MIGRATION_TEST_DATABASE_URL is not set.");
    return;
  }

  await runScenario(databaseUrl, "clean", migrationSql);
  await runScenario(databaseUrl, "partial", migrationSql, true);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
