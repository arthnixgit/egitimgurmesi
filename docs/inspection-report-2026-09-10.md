# Eğitim Gurmesi — Platform Inspection Report

**Date:** 2026-09-10 · **Commit inspected:** `ff2f545` *Fix dynamic navbar logo rendering*
**Scope:** whole monorepo, with depth on the web admin panel (`apps/admin`) and the Website Management module (`/web-sitesi`)
**Method:** full static read of `apps/admin`, `apps/api/src/admin-content`, `apps/web`; git history and working-tree analysis; execution of the existing unit specs; live check of `https://egitimgurmesi.com`

---

## 1. Executive summary

The platform is substantially built. The API surface is broad and well-organised, RBAC is real and enforced, the data model is mature, and the admin panel already covers 15 modules. This is not a project in trouble architecturally.

The customer's dissatisfaction is nevertheless justified, and it traces to **four concrete defects**, not to vague "UX polish":

1. **"Taslağı Kaydet" (Save Draft) does not save anything.** Across all six website save endpoints, the draft branch writes an audit row and returns — it never persists content. The UI reports *"Taslak kaydedildi."* The editor then reloads published data. The customer's work is silently destroyed, and the panel tells them it succeeded.
2. **"Önizle" (Preview) leads nowhere.** The API mints a preview token; no route in the public site consumes it. The button prints an expiry time and does nothing else.
3. **The builder canvas is not the website.** Except for the homepage hero slider, every section renders in the editor as a generic grey box with a title and a paragraph. What the customer sees while editing has no relationship to what visitors see.
4. **Most of what visitors see cannot be edited at all.** The homepage, About page, and every free-materials sub-page hold their copy in hardcoded TypeScript arrays. The CMS reaches roughly six section slots across three pages.

The net experience for the customer is: open the panel, edit, save, see a success message, lose the work — and for the parts that do save, watch the live site not change. That is a coherent explanation for the complaint, and all four are fixable.

Separately, the **live production site is currently serving placeholder copy** — a "Ürün tanıtım videosu veya görsel anlatım eklenebilir" slot, invented lesson titles, and a footer describing the platform as *"…olarak kurgulanıyor"* (being designed). The customer cannot remove any of it from the panel today.

**Recommended first step: Sprint 1 — "An editor you can trust."** Make draft, preview and publish behave the way the buttons claim. Details in §6.

---

## 2. What the platform is

| Layer | Stack | Size |
|---|---|---|
| `apps/api` | NestJS 11, Prisma, Argon2, JWT, Iyzipay, Nodemailer | 26,717 LOC |
| `apps/admin` | Next.js 15 (App Router), React 19, no CSS framework | 22,719 LOC |
| `apps/web` | Next.js 15, React 19 | 14,334 LOC |
| `packages/db` | Prisma schema, migrations, seeds, RBAC | 5,651 LOC |
| `packages/ui` | Shared presentation components | 833 LOC |

Monorepo on npm workspaces + Turborepo. Deploy is PM2 + Nginx on a VPS per the runbook; a Docker/Caddy workflow exists but is explicitly marked experimental. Media is stored on the local filesystem of the API host.

The admin panel exposes 15 modules across 8 permission groups (Kontrol Merkezi, Kurum & Şube, Öğrenci Operasyonu, Eğitim Operasyonu, Web Sitesi, Paket & Satış, Finans, Sistem & Güvenlik), gated by role and permission predicates in `admin-frame.tsx`. That gating logic is clean and worth keeping.

---

## 3. Blocking defects (P0)

### P0-1 — Save Draft persists nothing
`apps/api/src/admin-content/admin-content.service.ts`, lines 215, 437, 565, 741, 916, 1072.

Every one of the six save methods — site settings, navigation, marketing pages, staff profiles, success stories, free materials — contains the same shape:

```ts
if (action === "draft") {
  await this.prisma.$transaction(async (tx) => {
    await recordWebsiteRevision(tx, auth, { … afterData: draft });
    await recordAuditLog(tx, auth, { … afterData: draft });
  });
  return { ...draft, draftStatus: "DRAFT" };
}
```

No write to `siteSetting`, `marketingPage`, `marketingPageSection`, or any content table. The client receives its own payload back, sets `lastSavedAt`, and shows *"Taslak kaydedildi."* On reload, `fetchAdminMarketingPages()` returns published rows and the edits are gone.

The content is technically recoverable from the revision table's `afterData`, but the builder never loads it on open — so from the customer's seat, it is lost.

**Impact:** silent data loss on the panel's primary action, with a false success message. This alone would produce the reported dissatisfaction.

### P0-2 — No draft/published separation; publish writes straight to live
There is one row per page. `saveMarketingPage` with `action: "publish"` upserts the live record and defaults `publishStatus` to `PUBLISHED`. There is no staging copy, so the only way to persist any change is to publish it to visitors immediately. A cautious editor has no safe path.

### P0-3 — Preview is a dead end
`createPreviewToken` (service line 385) issues a token with scope `global-website-preview`. Nothing in `apps/web` consumes it — there is no preview route, no cookie handshake, no draft-rendering path. `requestPreviewToken()` in the builder only sets a status string:

> `Önizleme oturumu hazır. Süre sonu: 19:42`

The button looks functional and is inert.

### P0-4 — The canvas is a mock, not a preview
`apps/admin/app/web-sitesi/components/builder-canvas.tsx`. Only `showcase-hero` renders a real component (`HomeShowcaseHero` from `@ega/ui`). Everything else falls through to:

```tsx
<section className="admin-generic-section-preview" data-variant={…}>
  <span>{eyebrow}</span><h3>{title}</h3><p>{body}</p>
</section>
```

Header, footer, materials, staff and success stories each get a small hand-written approximation that does not share code with the public site. `docs/website-builder.md` states the canvas *"gerçek public sunum bileşenlerini … gösterir"* — the documentation describes an intention, not the code. That gap is itself a source of expectation mismatch.

### P0-5 — The widget palette produces content the site cannot render
`widget-registry.ts` offers ~20 insertable widgets: heading, rich-text, image, video, button, divider, spacer, one/two/three-column, card-grid, hero, slider, gallery, cta, faq, and more. The public site matches section variants by hardcoded key in exactly three files, and recognises exactly six: `showcase-hero`, `logo-rail`, `packages-surface`, `about-intro`, `directory-intro`, `guarantee-ribbon`.

Insert a FAQ or a gallery, publish it, and it is written to the database and never displayed. The panel offers a capability the site does not have.

### P0-6 — Most public content is hardcoded, not CMS-driven
`apps/web/app/page.tsx` is 1,079 lines and holds `heroSlides`, `logoRailItems`, `sampleVideos`, `featureHighlights`, `quickStats`, `faqs`, `showcaseSlides` and `packLibrary` as `as const` arrays. `hakkimizda/page.tsx` pulls only `intro.title` and `intro.body` from the CMS; its four value cards and two highlight cards are hardcoded. Every `ucretsiz-materyaller` sub-page (blog, faydalı linkler, PDF dokümanlar, maarif simülasyonları, YKS Atlas, Türkiye geneli deneme, puan hesapla) carries its own hardcoded arrays.

The customer's stated requirement — "fully edit and manage the website, the pages and contents from the admin panel" — is structurally unmet. Fixing the editor will not fix this; the content has to be migrated into the CMS.

### P0-7 — Pages cannot be created or deleted
`admin-content.controller.ts` exposes `GET /marketing-pages` and `PUT /marketing-pages/:key` only. No POST, no DELETE. The set of pages is fixed at seed time. "Manage the pages" is not currently possible in any form.

---

## 4. High-severity issues (P1)

**P1-1 — Cross-area edits are lost on navigation.** `saveCurrent()` saves only the area currently selected, but `isDirty` is a single global flag and undo history spans all areas. Switching area calls `router.replace()` and reloads; only `beforeunload` guards, which does not fire on in-app navigation. Edit the footer, switch to Sayfalar, save — the footer work is gone with no warning.

**P1-2 — "Canlı Sayfa" opens the admin panel.** `builder-toolbar.tsx`: `<Link href="/" target="_blank">`. A correct `resolveWebsiteUrl()` helper exists in `admin-frame.tsx` but the toolbar does not use it. `NEXT_PUBLIC_SITE_URL` is also missing from `apps/admin/.env.example`, so the helper's fallback path is what runs in production.

**P1-3 — Dead controls in the toolbar.** The zoom `<select>` has no `value`, no `onChange` and no state. It is decoration.

**P1-4 — Production is serving placeholder copy.** Verified live on `https://egitimgurmesi.com`: *"Ürün tanıtım videosu veya görsel anlatım eklenebilir."*; four invented lesson titles under "Öğrencilerimize Canlı Ders Yapan Hocalar"; an internal-facing bullet *"Kolay öğrenilen yönetim paneli"* presented as a customer benefit; and a footer describing the platform as *"…yeni nesil bir eğitim satış platformu olarak kurgulanıyor."* None of it is removable from the panel.

**P1-5 — SEO exposure on the marketing site.** `apps/web/app/page.tsx` is a client component that fetches content in `useEffect`; `public-content-api.ts` uses `cache: "no-store"` throughout. Content is absent from the initial HTML and every request hits the API with no ISR. For a Turkish education business competing on organic search, this is a commercial cost, not just a technical one.

---

## 5. Engineering health (P2) — why velocity has been dropping

These do not break features, but they are why each change has been getting slower and riskier.

**P2-1 — The git working tree is unreviewable.** 171 files show as modified: 76,002 insertions and 76,002 deletions — exactly equal. `git diff --ignore-cr-at-eol` returns **empty**. There is no `.gitattributes` and `core.autocrlf` is unset, so every file is CRLF on disk and LF in the index. Consequence: `git diff` shows whole-file rewrites, real changes are invisible inside the noise, and any merge is at high risk of clobbering work. This is a half-day fix and it unblocks every review from here on.

**P2-2 — 26 test files, zero test runners.** The specs use `node:test`. No package.json in the repo declares vitest, jest or a `test` script. They have never been run in CI. I executed them: **95 of 95 assertions pass** across `apps/admin`, `apps/web` and `packages`. The API specs need `@ega/db` built first. The suite is healthy and simply unwired — this is cheap, high-value coverage sitting idle.

**P2-3 — No linting.** ESLint appears in no package.json in the workspace.

**P2-4 — No CI gate.** `.github/workflows/` contains one file: a manual `workflow_dispatch` deploy, itself marked experimental and not the official strategy. Nothing runs typecheck, tests or build on push or PR.

**P2-5 — God components.**

| File | Lines | `useState` calls |
|---|---|---|
| `apps/admin/app/ticaret/page.tsx` | 3,336 | 38 |
| `apps/admin/app/saas/saas-management-page.tsx` | 2,427 | 53 |
| `apps/admin/app/web-sitesi/website-builder-client.tsx` | 1,472 | 31 |
| `apps/web/app/page.tsx` | 1,079 | — |

Fifty-three independent `useState` hooks in one component is where "many bugs" comes from: no single source of truth, no way to reason about which combinations of state are valid.

**P2-6 — 6,892-line hand-written `globals.css`** with 1,226 class selectors, 12 CSS custom properties, and 16 ad-hoc media queries. No design tokens for spacing, type scale or radii; no component primitives. Every new admin screen re-invents its layout, which is why the panel feels inconsistent.

**P2-7 — ~300 uses of `any` / `as any` / `@ts-ignore`** across the three apps, concentrated at API boundaries — exactly where types would catch contract drift.

**P2-8 — No server state library.** Data fetching is hand-rolled `fetch` wrappers plus `useEffect`, with no caching, deduplication, retry, or stale-invalidation. Refetch-after-save is manual and inconsistent.

**P2-9 — Tokens in `localStorage`.** `auth-client.ts` stores both access and refresh tokens in `localStorage`. Any XSS in the admin panel yields a full, persistent admin session. For a panel that controls the public website, httpOnly cookies are the right target.

**P2-10 — Repo clutter.** 12 stale `codex/*` branches plus 2 `backup/*` branches; `.tmp-*.log` files and a 452 KB `api.local.log` in the repository root.

---

## 6. Recommended starting point

> **Sprint 1 — "An editor you can trust."**
> Nothing else is worth building until saving works. Every hour spent on UI polish, new widgets or content migration is wasted while the primary button destroys the customer's work.

**Sprint goal:** *The customer can edit any managed area, save a draft, close the browser, come back tomorrow, see their draft intact, preview it exactly as visitors will see it, and publish it deliberately.*

**Proposed sprint backlog, in dependency order:**

| # | Item | Why it is first |
|---|---|---|
| 1.0 | **Repo gate** — add `.gitattributes` + renormalize; add `test` scripts wiring the existing `node:test` specs; add an ESLint baseline; add a CI workflow running typecheck + tests on push/PR | Half a day. Without it, no change after this is reviewable, and we cannot prove we haven't broken anything |
| 1.1 | **Real draft persistence** — a `ContentDraft` store keyed by `entityType + entityKey`; save-draft writes it; GET returns the draft with an explicit "unpublished changes" state; publish promotes draft → live and clears it; add an explicit Discard action | Fixes P0-1 and P0-2, the root cause |
| 1.2 | **Working preview** — a token-validating preview route in `apps/web` that renders pages from draft data; "Önizle" opens it in a new tab | Fixes P0-3; makes drafts meaningful |
| 1.3 | **Unsaved-changes guard** — per-area dirty tracking; block area switching and in-app navigation with a confirm | Fixes P1-1, the second data-loss path |
| 1.4 | **Truth in the toolbar** — fix the "Canlı Sayfa" URL, add `NEXT_PUBLIC_SITE_URL` to the env examples, remove or implement the zoom control, and correct `docs/website-builder.md` to describe what exists | Fixes P1-2/P1-3; stops the panel making claims it cannot keep |

**Definition of done for Sprint 1:** a Playwright scenario that edits the footer, saves a draft, reloads the panel, confirms the draft is still there, opens the preview and asserts the change is visible there and *not* on the live site, then publishes and asserts it is live — green in CI.

### Then, in order

- **Sprint 2 — Real WYSIWYG.** Make the canvas render the actual public components. The architectural decision here is genuine and worth making deliberately (see the question below), because it also determines how P0-5 gets resolved.
- **Sprint 3 — Content liberation.** Migrate the hardcoded copy out of `apps/web/app/page.tsx`, `hakkimizda`, and the free-materials pages into CMS sections; add page create/delete (P0-7). This is what actually delivers "fully edit and manage the website."
- **Sprint 4 — Admin UX system.** Design tokens and shared primitives, then break up `ticaret` and `saas`. Do this after Sprint 2, so the new components are built against a system rather than retro-fitted.

---

## 7. Working constraints for this engagement

- The repo is connected: `origin → github.com/arthnixgit/egitimgurmesi.git`, on `main`, level with `origin/main`.
- `node_modules` is Windows-installed. Builds, typechecks and `next dev` must run in your PowerShell; the Linux-side shell here can read, search and edit the files, and can run the unit specs with an isolated toolchain (already verified).
- Git operations that need GitHub credentials should run in your PowerShell; file-level git work can run from here.
- Fixing the CRLF problem (P2-1) touches every file in one commit. It needs a clean moment — no other work in flight — which is why it is item 1.0 rather than something to slot in later.
