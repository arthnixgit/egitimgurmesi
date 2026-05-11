# Egitim Gurmesi Akademi - Revised Project Roadmap

Last revised: `May 9, 2026`

This document has been updated to reflect the project's real state after the latest UX/UI iterations. The previous roadmap is no longer accurate, because the public site structure, information architecture, and content surface have expanded significantly.

## 1. Architectural Changes After the UX/UI Revisions

After the latest design cycle, the scope changed in these ways:

1. The navbar is no longer tied to homepage anchors.
2. `Paketlerimiz` has become a real catalog area with its own category and subcategory structure.
3. `Yuz Yuze Kocluk`, `Akademik Kadro`, `Basarilarimiz`, `Ucretsiz Materyaller`, and `Hakkimizda` now exist as separate pages.
4. `Ucretsiz Materyaller` is now an open-access content area and no longer depends on account creation.
5. The exam countdown pages have become separate SEO-oriented landing pages.
6. `Akademik Kadro` now requires a dedicated content type for academic staff profiles that will later be managed from the admin panel.
7. The homepage is now a much denser visual storefront; keeping it as large static JSX is not sustainable.
8. Navigation, package catalog content, free materials, academic staff, and success content now require proper database or CMS-backed management structures.

Result:
The public frontend is now visually far ahead, but the content and operations layers still need to catch up.

## 2. Current Architecture Snapshot

### Public Web

- `apps/web`
- Built on Next.js App Router
- Separate route structure is in place
- Navbar and public layout were rebuilt
- Package pages, coaching landing page, free materials page, and academic staff page exist

### Admin Web

- `apps/admin`
- Separate login and bootstrap flow exists
- Real operational screens do not exist yet
- At the moment it is only an auth/bootstrap shell

### API

- `apps/api`
- Built with NestJS
- Auth, bootstrap, and RBAC foundations are present
- Product, CMS, order, payment, LMS, and media modules do not exist yet

### Database

- `packages/db`
- Prisma schema, migration, and seed exist
- Auth, RBAC, product, order, payment, and LMS core models exist
- But the schema still lacks the menu/CMS/staff/content management structures required by the latest UI revisions

### UI Package

- `packages/ui`
- Shared UI component base exists
- The public side still uses a lot of custom page-specific CSS and JSX
- There is not yet a truly unified design system shared cleanly between public and admin

## 3. Fixed System Boundaries

These architecture decisions remain unchanged:

1. The main platform belongs to our system.
2. User auth, orders, LMS, and admin belong to our system.
3. Coaching payment redirection goes only to Unikazan.
4. The admin area is separate from the public user area.
5. Sensitive integrations must be server-side only.
6. The website language is Turkish.

## 4. Core Layers Already Completed

### Phase A - Project Skeleton

Completed:

1. Monorepo structure was created.
2. `apps/web`, `apps/admin`, `apps/api`, `packages/db`, and `packages/ui` were established.
3. Turbo and npm workspace flow were configured.
4. Local Docker development configuration was prepared.

### Phase B - Database Foundation

Completed:

1. Prisma schema was created.
2. The first migration was written and applied locally.
3. The seed flow was written.
4. Core auth and RBAC models were implemented.

### Phase C - Auth Foundation

Completed:

1. Student registration/login endpoints were built.
2. Staff login flow was built.
3. Access/refresh token flow was built.
4. The first super-admin bootstrap flow was built.
5. Permission guard foundation was built.

### Phase D - Public Site First Real Version

Largely completed:

1. The homepage has been heavily built out.
2. The sticky milky transparent navbar was built.
3. The packages mega menu was built.
4. The package listing and package detail flow were created.
5. The `Yuz Yuze Kocluk` page was created.
6. The `Akademik Kadro` page was created.
7. The `Basarilarimiz` page was created.
8. The `Ucretsiz Materyaller` and exam countdown pages were created.
9. The `Hakkimizda` page was created.
10. Login and registration were merged into a single page.

## 5. New Technical Requirements Caused by the UX/UI Revisions

These were not as critical before. Now they are:

1. Navigation must become admin-manageable.
2. Package categories and subcategories must become database- or CMS-manageable.
3. Package cards currently run on mock data and must be connected to real product records.
4. `Akademik Kadro` needs a dedicated content type.
5. `Basarilarimiz` needs a dedicated content type.
6. `Ucretsiz Materyaller` needs a dedicated content type plus media/document handling.
7. Countdown pages need SEO article blocks that can later be managed in admin.
8. The homepage should no longer remain a static page; it now needs section-based content management.

## 6. Revised Roadmap

The project should now proceed in this order:

### Phase 1 - Lock the Public Content Architecture

Goal:
Extract a real data model from the current design iterations.

Tasks:

1. Define a manageable data model for the navigation tree.
2. Define a data model for package categories, subcategories, and landing pages.
3. Define a data model for academic staff cards.
4. Define a data model for success stories.
5. Define a data model for free materials, useful links, PDF documents, guidance content, and countdown pages.
6. Define a section-based content model for the homepage.

Output:
The frontend can stop depending on static helper files and begin consuming manageable data sources.

### Phase 2 - Extend the Missing Database Schema

Goal:
Add the tables and relations needed to support the expanded public content surface.

Tables or structures to add/revise:

1. `navigation_menus`
2. `navigation_menu_items`
3. `marketing_pages`
4. `marketing_page_sections`
5. `staff_profiles`
6. `success_stories`
7. `free_material_items`
8. `free_material_categories`
9. `countdown_pages`
10. `countdown_targets`
11. `seo_articles`
12. `media_assets`
13. `site_settings`

Note:
The current schema covers auth and commerce core concepts, but the marketing/CMS layer is still missing.

### Phase 3 - Build the Public Content API Layer

Goal:
Serve the public content that is currently living in static files through the API.

Tasks:

1. Navigation endpoints
2. Package category and product endpoints
3. Package detail endpoints
4. Academic staff endpoints
5. Success story endpoints
6. Free materials endpoints
7. Countdown page endpoints
8. Homepage section endpoints

### Phase 4 - Turn the Admin Panel Into a Real Production Tool

Goal:
Make all visible public content manageable through admin.

First mandatory admin modules:

1. Dashboard
2. Navigation management
3. Homepage section management
4. Package category and package management
5. Academic staff management
6. Success story management
7. Free materials management
8. Countdown content management
9. Site settings and logo/contact management

### Phase 5 - Complete the Commerce Engine

Goal:
Connect the public storefront to real product and purchase flows.

Tasks:

1. Product CRUD API
2. Connect product cards to database data
3. Order creation flow
4. Cart infrastructure
5. Local payment provider integration
6. Order detail and order history screens
7. Accounting visibility

### Phase 6 - Build the Unikazan Adapter Layer

Goal:
Create a local order record + secure external redirect flow for coaching products.

Tasks:

1. Separate `provider = unikazan` products
2. Store external product code mappings
3. Create a local order before redirect
4. Implement server-side redirect or token generation
5. Implement callback / status verification flow
6. Store accounting reconciliation traces

### Phase 7 - Student Panel and LMS MVP

Goal:
Open the first real post-purchase student experience.

First-release modules:

1. Account dashboard
2. Purchased products list
3. Video/course access
4. Course module / lesson listing
5. Video playback
6. Material downloads
7. Order history
8. Coaching order status

### Phase 8 - Security, Operations, and Release Preparation

Goal:
Finish the functional build tonight, and finish polish and release hardening tomorrow.

Tasks:

1. Email verification
2. Password reset
3. Rate limiting
4. Admin session hardening
5. Error logging
6. SEO metadata completion
7. Sitemap / robots
8. Smoke test scenarios

## 7. Exact Execution Order for Tonight

This is the correct build order for tonight:

1. Add the missing CMS/content schema
2. Write the migration
3. Revise the seed
4. Build the public content API modules
5. Move packages from mock files to API data
6. Move academic staff and free materials to API data
7. Open admin MVP screens for content management
8. Open product CRUD and category management
9. Build the order core
10. Build the Unikazan redirect adapter skeleton
11. Feed the account page with real data
12. Open the LMS skeleton

## 8. Polish and Hardening Order for Tomorrow

1. UI spacing and responsive polish
2. Typography cleanup
3. Turkish encoding cleanup
4. SEO metadata fine-tuning
5. Error state and empty state cleanup
6. Admin UX refinement
7. Test checklist pass
8. Git cleanup and release preparation

## 9. Critical External Blockers

These still block a fully production-ready system:

1. The local payment provider is not finalized.
2. The video provider is not finalized.
3. SMTP / transactional email provider is not finalized.
4. The WhatsApp number and lead handling flow are not finalized.
5. Unikazan callback / verification behavior is not finalized.
6. Final domain and hosting topology are not finalized.

## 10. Conclusion

The frontend visibility layer is farther along than expected.
The backend and admin operations layers are not yet far enough along to feed this new storefront properly.

So the remaining main work is no longer design. It is data modeling, content management, commerce, and LMS backbone construction.
