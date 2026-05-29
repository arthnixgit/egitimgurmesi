# Beta Onboarding Checklist

This checklist is for controlled operational beta testing before Monday onboarding. It is for the real admin team preparing real branches, staff, students, packages, and operational flows.

## Critical Seed Warning

Do not run the main seed for beta preparation. The main seed is destructive or catalog-reset oriented and can overwrite CMS/catalog demo content.

Use only the safe beta seed when a local or controlled beta test dataset is needed:

```powershell
npm run seed:beta
```

The beta seed is idempotent, uses upserts, and does not delete existing records. It is blocked in production unless `ALLOW_BETA_SEED_IN_PRODUCTION=true` is explicitly set for a controlled beta environment.

## Demo Data Safety

Default local-only demo password: `BetaDemo2026!`

Override it before running the seed when needed:

```powershell
$env:BETA_SEED_PASSWORD="use-a-new-internal-password"
npm run seed:beta
```

Demo credentials must not be shared with real customers. Demo passwords are not displayed in the admin UI. Demo packages created by the safe seed are kept out of the public catalog unless intentionally published by an admin.

| Role | Email |
| --- | --- |
| Super Admin | `beta.superadmin@egitimgurmesi.local` |
| Branch Admin | `beta.branch.admin@egitimgurmesi.local` |
| Instructor | `beta.instructor@egitimgurmesi.local` |
| Coach | `beta.coach@egitimgurmesi.local` |
| Accountant | `beta.accountant@egitimgurmesi.local` |
| Student LGS | `beta.student.lgs@egitimgurmesi.local` |
| Student TYT | `beta.student.tyt@egitimgurmesi.local` |
| Student IELTS | `beta.student.ielts@egitimgurmesi.local` |

## Real Data Preparation Steps

1. Login as Super Admin.
2. Open `SaaS Yönetimi`.
3. Create or verify the real organization.
4. Create or verify the real education center.
5. Create or verify the real branch.
6. Create branch admin, instructor, coach, accountant, and student users from `Personel ve Roller` and the relevant membership screens.
7. Assign staff to the correct branch.
8. Add students to the correct branch.
9. Create class groups.
10. Assign instructors, coaches, and students to the class groups from `Operasyon Merkezi`.
11. Create at least one announcement.
12. Create at least one upcoming live session.
13. Create or verify platform packages in `Ürün ve Sipariş`.
14. Confirm Unikazan placeholder packages are clearly marked and not confused with local platform packages.
15. Open `Beta Hazırlık` and confirm required items are complete.

## Role Login QA Plan

For each role, verify login, dashboard routing, visible data, and forbidden areas.

| Role | Must See | Must Not See |
| --- | --- | --- |
| Super Admin | SaaS overview, all branches, staff, students, operations, packages, beta readiness | Nothing outside authenticated admin scope |
| Branch Admin | Own branch, own class groups, branch students, branch staff, branch operations | Other branches, global platform controls |
| Instructor | Assigned classes, assigned students, lessons/schedule placeholders | Finance, other branches, super admin controls |
| Coach | Assigned students, coaching plans/notes, upcoming sessions | Finance, unrelated students, super admin controls |
| Accountant | Finance/order placeholders and permitted branch finance summary | CMS, role management, unrelated branch data |
| Student | Own dashboard, branch, group, package, sessions, announcements | Admin routes, other students, staff data |

## Manual Smoke Flow

1. Login as Super Admin and open `/beta-readiness`.
2. Confirm demo safety warning is visible if demo records exist.
3. Confirm public demo package count is `0`.
4. Open `/saas` and verify organization, education center, branch, staff assignments, memberships, and class groups.
5. Open `/operasyon` and verify roster, live sessions, announcements, and role-filtered panels.
6. Open the website and confirm public catalog does not expose branch/private demo packages.
7. Login as a student and verify `Hesabım` / operational overview shows only that student’s own data.
8. Login as instructor, coach, accountant, and branch admin and verify the role matrix above.

## Rollback / Check Procedure

If a beta admin reports broken data or wrong visibility:

1. Stop public sharing of the affected test account.
2. Check `/beta-readiness` for demo exposure and missing required data.
3. Check the affected user’s branch membership and staff assignment.
4. Check class group roster and live session participant assignments.
5. If package visibility is wrong, set the package to `DRAFT` or remove branch visibility until reviewed.
6. Review API logs and audit logs for the last admin change.
7. Re-run only safe validation commands; do not run the main seed.

## Monday Beta Readiness Checklist

- `Beta Hazırlık` page has no public demo exposure warning.
- At least one real organization exists.
- At least one real education center exists.
- At least one real branch exists.
- Branch admin, instructor, coach, accountant, and student users exist.
- At least one class group has assigned instructor, coach, and students.
- At least one live session is scheduled.
- At least one announcement is published.
- At least one real public package is published.
- Branch/private packages are not visible in the public catalog.
- Student dashboard shows only the logged-in student’s own records.
- Branch Admin cannot see other branches.
- Instructor and Coach cannot see finance or global admin controls.

## Known Limitations

- PayTR production is not active yet.
- Unikazan production credentials/API activation are not active yet.
- Simulations are not active yet.
- AI tutor is not active yet.
- Accounting is operational-placeholder level, not full invoice/refund automation.
