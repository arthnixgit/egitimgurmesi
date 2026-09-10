#!/usr/bin/env node
/**
 * Unit test runner for the egitim-gurmesi-akademi workspace.
 *
 * The repository's unit tests are written against Node's built-in test runner
 * (`node:test`) in TypeScript. Node cannot discover `*.spec.ts` files on its
 * own — its default patterns only cover `*.test.js` and friends — so this
 * script finds them explicitly and hands the list to `node --test`.
 *
 * Usage:
 *   node scripts/run-unit-tests.mjs [root ...]
 *
 * With no arguments it scans the current working directory, which is what the
 * per-workspace `npm test` scripts rely on. From the repository root, pass the
 * workspace roots explicitly: `node scripts/run-unit-tests.mjs apps packages`.
 *
 * Environment:
 *   EGA_TSX_IMPORT   Module specifier passed to `node --import` for TypeScript
 *                    support. Defaults to "tsx", resolved from node_modules.
 *                    Override it when tsx lives outside the workspace, for
 *                    example in a container whose node_modules was installed
 *                    for a different platform.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  ".turbo",
  ".git",
  ".worktrees",
  "dist",
  "build",
  "coverage",
  "generated",
  "playwright-report",
  "test-results",
  "e2e" // Playwright end-to-end suites run via `npm run test:e2e`.
]);

const SPEC_PATTERN = /\.spec\.tsx?$/;

function collectSpecFiles(directory, found = []) {
  let entries;

  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".") {
      continue;
    }

    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        collectSpecFiles(fullPath, found);
      }
      continue;
    }

    if (entry.isFile() && SPEC_PATTERN.test(entry.name)) {
      found.push(fullPath);
    }
  }

  return found;
}

const roots = (process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["."])
  .map((root) => resolve(process.cwd(), root))
  .filter((root) => {
    if (existsSync(root) && statSync(root).isDirectory()) {
      return true;
    }
    console.warn(`Skipping missing directory: ${relative(process.cwd(), root) || root}`);
    return false;
  });

const specFiles = [...new Set(roots.flatMap((root) => collectSpecFiles(root)))].sort();

if (specFiles.length === 0) {
  console.log("No *.spec.ts files found; nothing to run.");
  process.exit(0);
}

console.log(`Running ${specFiles.length} unit test file(s) with node:test.`);

const tsxImport = process.env.EGA_TSX_IMPORT ?? "tsx";
const result = spawnSync(
  process.execPath,
  ["--import", tsxImport, "--test", ...specFiles.map((file) => relative(process.cwd(), file))],
  { stdio: "inherit" }
);

if (result.error) {
  console.error(`Failed to start the test runner: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
