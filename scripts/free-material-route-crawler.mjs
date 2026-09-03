#!/usr/bin/env node

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg.startsWith("--")) {
    args.set(arg.slice(2), process.argv[index + 1]);
    index += 1;
  }
}

const webBaseUrl = normalizeBaseUrl(args.get("web-base-url") ?? process.env.WEB_BASE_URL ?? "http://localhost:3000");
const apiBaseUrl = normalizeBaseUrl(args.get("api-base-url") ?? process.env.API_BASE_URL ?? "http://localhost:4000/v1");
const apiPath = args.get("api-path") ?? "/public/free-materials";
const materialApiUrl = joinApiUrl(apiBaseUrl, apiPath);
const knownCountdownSlugs = [
  "tyt-kac-gun-kaldi",
  "ayt-kac-gun-kaldi",
  "ydt-kac-gun-kaldi",
  "2026-lgs-kac-gun-kaldi"
];

const results = [];
let failures = 0;
let items = [];

try {
  const categories = await requestJson(materialApiUrl);
  items = unwrapCollection(categories).flatMap((category) =>
    unwrapCollection(category.items).map((item) => ({ category, item }))
  );
} catch (error) {
  failures += 1;
  results.push({
    id: "public-api",
    slug: "",
    categoryKey: "",
    type: "PUBLIC_API",
    destination: materialApiUrl,
    mode: "API",
    status: error instanceof Error ? error.message : "PUBLIC_API_FAILED"
  });
}

for (const { category, item } of items) {
  const destination = resolveCrawlerDestination(item);
  const result = {
    id: item.id ?? "",
    slug: item.slug ?? "",
    categoryKey: category.key ?? "",
    type: item.itemType ?? item.destinationMode ?? "UNKNOWN",
    destination: destination.href ?? "",
    mode: destination.mode,
    status: "SKIPPED"
  };

  if (!destination.ok) {
    result.status = destination.reason;
    failures += 1;
    results.push(result);
    continue;
  }

  if (destination.mode === "DOWNLOAD") {
    const response = await fetch(joinApiUrl(apiBaseUrl, destination.href), { method: "GET", redirect: "manual" });
    result.status = `${response.status} ${response.headers.get("content-disposition") ? "attachment" : "no-attachment"}`;
    if (response.status >= 500 || response.status === 404 || !response.headers.get("content-disposition")) {
      failures += 1;
    }
  } else if (destination.href?.startsWith("/")) {
    const response = await fetch(joinWebUrl(webBaseUrl, destination.href), { method: "GET", redirect: "manual" });
    result.status = String(response.status);
    if (response.status >= 500) {
      failures += 1;
    }
  } else {
    const response = await fetch(destination.href, { method: "HEAD", redirect: "manual" }).catch(() => null);
    result.status = response ? String(response.status) : "UNREACHABLE";
    if (!response || response.status >= 500) {
      failures += 1;
    }
  }

  results.push(result);
}

for (const slug of knownCountdownSlugs) {
  const href = `/ucretsiz-materyaller/${slug}`;
  const result = {
    id: `bundled:${slug}`,
    slug,
    categoryKey: "bundled-countdown",
    type: "COUNTDOWN",
    destination: href,
    mode: "KNOWN_COUNTDOWN",
    status: "SKIPPED",
    finalUrl: ""
  };

  const response = await fetch(joinWebUrl(webBaseUrl, href), { method: "GET", redirect: "follow" });
  result.status = String(response.status);
  result.finalUrl = response.url;

  if (response.status === 404 || response.status === 500 || response.status === 502 || response.status >= 503) {
    failures += 1;
  }

  results.push(result);
}

console.table(results);
console.log(JSON.stringify({
  publicApi: materialApiUrl,
  webBaseUrl,
  apiBaseUrl,
  items: results.length,
  internalDestinations: results.filter((item) => item.mode === "INTERNAL").length,
  downloadDestinations: results.filter((item) => item.mode === "DOWNLOAD").length,
  knownCountdownRoutes: results.filter((item) => item.mode === "KNOWN_COUNTDOWN").length,
  failures
}, null, 2));

if (failures > 0) {
  process.exitCode = 1;
}

function resolveCrawlerDestination(item) {
  if (item.destinationMode === "DOWNLOAD" || item.downloadHref) {
    return item.downloadHref
      ? { ok: true, mode: "DOWNLOAD", href: item.downloadHref }
      : { ok: false, mode: "DOWNLOAD", reason: "MISSING_DOWNLOAD_ENDPOINT" };
  }

  if (!item.href) {
    return { ok: false, mode: "UNKNOWN", reason: "MISSING_DESTINATION" };
  }

  if (item.href.startsWith("/")) {
    return { ok: true, mode: "INTERNAL", href: item.href };
  }

  if (/^https:\/\//i.test(item.href)) {
    return { ok: true, mode: "EXTERNAL", href: item.href };
  }

  return { ok: false, mode: "UNKNOWN", reason: "UNSAFE_DESTINATION" };
}

async function requestJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Free material API failed: ${response.status} ${url}`);
  }
  return response.json();
}

function unwrapCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.value)) {
    return payload.value;
  }
  return [];
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function joinApiUrl(base, path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = new URL(`${normalizeBaseUrl(base)}/`);
  const normalizedPath = path.replace(/^\/+/, "");

  if (/^(v\d+|api)\//i.test(normalizedPath)) {
    return new URL(`/${normalizedPath}`, baseUrl.origin).toString();
  }

  const basePath = baseUrl.pathname.replace(/\/+$/, "").replace(/^\/+/, "");
  return new URL(`/${[basePath, normalizedPath].filter(Boolean).join("/")}`, baseUrl.origin).toString();
}

function joinWebUrl(base, path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = new URL(`${normalizeBaseUrl(base)}/`);
  return new URL(path, baseUrl.origin).toString();
}
