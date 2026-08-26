# Admin UI P2.3 Visual System

P2.3 unifies the Admin Panel visual layer through shared CSS tokens and existing Admin primitives. It does not change authorization, payments, package business rules, authentication, tenant isolation, or the Prisma schema.

## Tokens

Core tokens live in `apps/admin/app/globals.css` under the `Admin UI P2.3 shared visual system` section.

- Color: deep navy `--admin-color-navy-950`, secondary navy `--admin-color-navy-900`, teal `--admin-color-teal-700`, warm amber `--admin-color-amber-500`, warm background `--admin-color-bg`, white surface `--admin-color-surface`, soft surface `--admin-color-surface-soft`, warm highlight `--admin-color-surface-warm`, muted text `--admin-color-muted`, border `--admin-color-border`.
- Module accents: student operations green, institution and branch teal, education operations blue, content and media restrained violet-blue, commerce amber, finance olive-gold, system slate.
- Typography: page and hero headings use controlled `clamp()` scales, line-height at or above `1.08` for large Turkish headings, and letter spacing no tighter than `-0.025em` in shared hero treatments.
- Spacing: `--admin-space-1` through `--admin-space-16` map to 4, 8, 12, 16, 20, 24, 32, 40, 48, and 64px rhythm.
- Radius: controls `12px`, cards `18px`, large sections `22px`, heroes/dialogs `26px`.
- Shadows: default cards use `--admin-shadow-card`; heroes and floating panels use `--admin-shadow-panel` and `--admin-shadow-floating`.
- Motion: shared hover and focus transitions use `--admin-motion-fast` and honor `prefers-reduced-motion`.

## Primitives

The visual system standardizes the existing class primitives rather than adding a new UI framework:

- Page shell: `.admin-shell`, `.admin-app-frame`, `.admin-app-header`, `.admin-app-sidebar`
- Hero: `.admin-dashboard-hero`, `.admin-saas-hero`, `.admin-ops-hero`, `.admin-welcome-card`, `.admin-deploy-hero`
- Cards and lists: `.admin-card`, `.admin-dashboard-kpi`, `.admin-dashboard-action-card`, `.admin-record-item`, `.admin-order-item`, `.admin-list__item`
- Forms: `.admin-field`, `.admin-input`, `.admin-select`, `.admin-textarea`, `.admin-form-grid`
- Actions: `.admin-button`, `.admin-button--ghost`, `.admin-button--compact`, `.admin-actions`, `.admin-toolbar`
- Navigation and tabs: `.admin-app-nav__item`, `.admin-tab`, `.admin-saas-tab`
- Status and feedback: `.admin-badge`, `.admin-pill`, `.admin-order-pill`, `.admin-status-pill`, `.admin-message`, `.admin-empty-state`
- Overlays and advanced panels: `.admin-media-picker`, `.admin-session-modal`, `.admin-advanced-details`

## Usage Examples

Use module tones on dashboard cards and action cards:

```tsx
<Link className="admin-dashboard-kpi" data-tone="green" href="/saas/ogrenci-uyelikleri">
  ...
</Link>
```

Use closed advanced details for technical payloads:

```tsx
<details className="admin-advanced-details">
  <summary>
    <span className="admin-badge">Ek Bilgi</span>
    <span>Teknik veriyi göster</span>
  </summary>
  <pre className="admin-code-block">...</pre>
</details>
```

## Route Migration Status

All routes under `apps/admin/app` are covered by shared primitives and the P2.3 CSS layer.

| Route | Status | Notes |
| --- | --- | --- |
| `/` | Migrated | Uses shared auth card styles. |
| `/giris` | Migrated | Login hero and form use shared hero, card, field, and button treatment. |
| `/kurulum` | Migrated | Setup card and form use shared card, field, alert, and button treatment. |
| error boundary | Migrated | Error state uses shared card and badge treatment. |
| `/platform` | Migrated | Role dashboard hero, KPI cards, quick actions, lists. |
| `/sube` | Migrated | Role dashboard hero, KPI cards, quick actions, lists. |
| `/egitmen` | Migrated | Role dashboard hero, KPI cards, quick actions, lists. |
| `/koc` | Migrated | Role dashboard hero, KPI cards, quick actions, lists. |
| `/finans` | Migrated | Role dashboard and finance entry use shared treatment. |
| `/saas` | Migrated | Hero, tabs, setup cards, branch shortcuts, and diagnostics. |
| `/saas/organizasyonlar` | Migrated | Shared SaaS cards, forms, records. |
| `/saas/egitim-merkezleri` | Migrated | Shared SaaS cards, forms, records. |
| `/saas/subeler` | Migrated | Branch cards and forms use shared card and field treatment. |
| `/saas/personel-atamalari` | Migrated | Dedicated responsive personnel staffing layout retained and visually unified. |
| `/saas/ogrenci-uyelikleri` | Migrated | Membership forms and records use shared SaaS primitives. |
| `/saas/sinif-gruplar` | Migrated | Group cards and staffing panels use shared card/action/panel treatment. |
| `/saas/kapsam` | Migrated | Permission diagnostics and advanced JSON use shared cards. |
| `/operasyon` | Migrated | Hero, roster, assignment controls, forms, and lists. |
| `/personel` | Migrated | Personnel cards, role cards, permissions, forms, and alerts. |
| `/icerik` | Migrated | Editor panels, nested cards, warnings, save controls, media picker. |
| `/medya` | Migrated | Upload forms, asset cards, filters, details, picker. |
| `/ticaret` | Migrated | Visual consistency only for tabs, product/category/order cards, status badges, and forms. Package business flow unchanged. |
| `/denetim` | Migrated | Audit rows and summary cards unified; technical payloads hidden by default in advanced details. |
| `/guncellemeler` | Migrated | Deployment hero, confirmation modal, status cards, and technical details. |
| `/leadler` | Migrated | Lead cards and detail panel use shared record/card primitives. |
| `/beta-readiness` | Migrated | Readiness hero, cards, and loading states use shared primitives. |

No Admin route is intentionally excluded from P2.3.
