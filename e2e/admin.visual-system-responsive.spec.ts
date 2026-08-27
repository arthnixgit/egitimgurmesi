import { expect, test, type Page } from "@playwright/test";

const mandatoryRoutes = [
  "/platform",
  "/sube",
  "/egitmen",
  "/koc",
  "/finans",
  "/saas",
  "/saas/personel-atamalari",
  "/saas/sinif-gruplar",
  "/operasyon",
  "/personel",
  "/icerik",
  "/medya",
  "/ticaret",
  "/denetim",
  "/guncellemeler"
];

const responsiveWidths = [1920, 1440, 1280, 1024, 768, 390];
const screenshotWidths = new Set([1440, 1024, 390]);
const now = "2026-08-26T09:00:00.000Z";

let activeRoute = "/platform";
let forceOrganizationsForbidden = false;

const branch = {
  id: "branch_a",
  organizationId: "org_a",
  educationCenterId: "center_a",
  slug: "merkez-sube",
  name: "Merkez Şube",
  status: "ACTIVE",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mahallesi",
  phone: "+90 212 000 00 00",
  createdAt: now,
  updatedAt: now,
  organization: { id: "org_a", name: "Eğitim Gurmesi", slug: "egitim-gurmesi" },
  educationCenter: { id: "center_a", name: "Merkez Eğitim Merkezi", slug: "merkez" },
  _count: { staffAssignments: 3, studentMemberships: 1, classGroups: 2 }
};

const classGroups = [
  {
    id: "group_a",
    organizationId: "org_a",
    branchId: "branch_a",
    slug: "lgs-8-a",
    name: "LGS 8-A Hazırlık Grubu",
    description: "Hafta içi sınıf grubu",
    gradeLevel: "LGS",
    studyTrack: "LGS",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    _count: { instructorAssignments: 1, coachAssignments: 1 }
  },
  {
    id: "group_b",
    organizationId: "org_a",
    branchId: "branch_a",
    slug: "tyt-sayisal",
    name: "TYT Sayısal Çalışma Grubu",
    description: "Hafta sonu çalışma grubu",
    gradeLevel: "TYT",
    studyTrack: "SAYISAL",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    _count: { instructorAssignments: 0, coachAssignments: 0 }
  }
];

const staffAssignments = [
  branchStaffAssignment("assignment_instructor", "staff_instructor", "Ece Eğitmen", "ece@example.com", "INSTRUCTOR", ["instructor"]),
  branchStaffAssignment("assignment_coach", "staff_coach", "Can Koç", "can@example.com", "COACH", ["coach"]),
  branchStaffAssignment("assignment_accountant", "staff_accountant", "Deniz Finans", "deniz@example.com", "ACCOUNTANT", ["accounting"])
];

test.beforeEach(async ({ page }) => {
  activeRoute = "/platform";
  forceOrganizationsForbidden = false;

  await page.addInitScript(() => {
    window.localStorage.setItem("ega_staff_access_token", "mock-access-token");
    window.localStorage.setItem("ega_staff_refresh_token", "mock-refresh-token");
  });

  await mockAdminApi(page);
});

for (const routePath of mandatoryRoutes) {
  for (const width of responsiveWidths) {
    test(`admin visual system ${routePath} at ${width}px`, async ({ page }) => {
      activeRoute = routePath;
      await page.setViewportSize({ width, height: width === 390 ? 900 : 960 });
      await page.goto(routePath, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main").first()).toBeVisible();
      await page.waitForTimeout(120);

      await assertNoHorizontalOverflow(page);
      await assertButtonsAreReachable(page);
      await assertHeadingsAreReadable(page);
      await assertHeroRadius(page);

      if (routePath === "/sube") {
        await assertBranchDashboardKpis(page);
      }

      if (routePath === "/saas/personel-atamalari") {
        await page.getByRole("button", { name: /Sınıf \/ Gruba Görevlendir/ }).first().click();
        await expect(page.getByText("Sınıf / Grup Görevlendirmesi").first()).toBeVisible();
        await assertPanelsFitViewport(page);
      }

      if (routePath === "/saas/sinif-gruplar") {
        await page.getByRole("button", { name: /Görevlendirmeleri Yönet/ }).first().click();
        await expect(page.getByText("Eğitmen Ata").first()).toBeVisible();
        await assertPanelsFitViewport(page);
      }

      if (routePath === "/operasyon") {
        await page.locator("select.admin-select, select.admin-input").first().selectOption("group_a");
        await expect(page.getByText("Görevlendirme seçenekleri yükleniyor...").or(page.getByText("Eğitmen Ata")).first()).toBeVisible();
        await assertPanelsFitViewport(page);
      }

      if (process.env.EGA_ADMIN_VISUAL_SCREENSHOTS === "1" && screenshotWidths.has(width)) {
        await page.screenshot({
          path: `test-results/admin-ui-p23/${slugFor(routePath)}-${width}.png`,
          fullPage: true
        });
      }
    });
  }
}

test("mobile navigation remains usable", async ({ page }) => {
  activeRoute = "/sube";
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/sube", { waitUntil: "domcontentloaded" });
  await expect(page.locator('#admin-sidebar .admin-app-nav__item[href="/sube"]')).toHaveCount(1);
  await page.locator(".admin-app-menu-button").click();
  await expect(page.locator(".admin-app-frame")).toHaveAttribute("data-sidebar-open", "true");
  await expect(page.locator('#admin-sidebar .admin-app-nav__item[href="/sube"]')).toBeVisible();
  await page.locator(".admin-app-sidebar__close").click();
  await expect(page.locator(".admin-app-frame")).toHaveAttribute("data-sidebar-open", "false");
});

test("admin forms remain operable and focus-visible", async ({ page }) => {
  activeRoute = "/saas/personel-atamalari";
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/saas/personel-atamalari", { waitUntil: "domcontentloaded" });
  const firstControl = page.locator(".admin-field input, .admin-field select, .admin-field textarea").first();
  await expect(firstControl).toBeVisible();
  await firstControl.focus();
  await expect(firstControl).toBeFocused();
});

test("media picker dialog fits the viewport", async ({ page }) => {
  activeRoute = "/ticaret";
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/ticaret", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Paket Yönetimi/ }).click();
  await page.getByRole("button", { name: /Medyadan Seç/ }).first().click();
  await expect(page.locator(".admin-media-picker__panel")).toBeVisible();
  await assertPanelsFitViewport(page);
});

test("commerce order statuses remain Turkish", async ({ page }) => {
  activeRoute = "/ticaret";
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/ticaret", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Sipariş Yönetimi/ }).click();
  const visibleStatusLabel = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLSelectElement>("select")).some(
      (select) => select.selectedOptions[0]?.textContent?.trim() === "Ödendi"
    )
  );
  expect(visibleStatusLabel).toBe(true);
  await expect(page.locator("main")).not.toContainText("PAID");
});

test("forbidden admin requests do not clear staff session", async ({ page }) => {
  activeRoute = "/saas/organizasyonlar";
  forceOrganizationsForbidden = true;
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/saas/organizasyonlar", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toContainText(/yetki|Yetki|ulaşılamadı|yüklenemedi/);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("ega_staff_access_token")))
    .toBe("mock-access-token");
});

async function mockAdminApi(page: Page) {
  await page.route("http://localhost:4000/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/v1/, "");
    const access = accessForRoute(activeRoute);

    if (path === "/staff/bootstrap-status") {
      await route.fulfill({ json: { requiresBootstrap: false } });
      return;
    }

    if (path === "/auth/me") {
      await route.fulfill({ json: staffMe(access) });
      return;
    }

    if (path === "/staff/overview") {
      await route.fulfill({ json: staffOverview(access) });
      return;
    }

    if (path === "/admin-deploy/status") {
      await route.fulfill({ json: deploymentStatus() });
      return;
    }

    if (path === "/admin-tenancy/scope") {
      await route.fulfill({ json: tenancyScope(access) });
      return;
    }

    if (path === "/admin-tenancy/overview") {
      await route.fulfill({ json: tenancyOverview(access) });
      return;
    }

    if (path === "/admin-tenancy/beta-readiness") {
      await route.fulfill({ json: betaReadiness(access) });
      return;
    }

    if (path === "/admin-tenancy/organizations") {
      if (forceOrganizationsForbidden) {
        await route.fulfill({ status: 403, json: { message: "Bu işlem için yetkiniz bulunmuyor." } });
        return;
      }

      await route.fulfill({ json: organizations() });
      return;
    }

    if (path.startsWith("/admin-tenancy/organizations/org_a/education-centers")) {
      await route.fulfill({ json: educationCenters() });
      return;
    }

    if (path === "/admin-tenancy/branches") {
      await route.fulfill({ json: [branch] });
      return;
    }

    if (path === "/admin-tenancy/staff") {
      await route.fulfill({ json: staffSearchResponse() });
      return;
    }

    if (path === "/admin-tenancy/students") {
      await route.fulfill({ json: studentSearchResponse() });
      return;
    }

    if (path === "/admin-tenancy/branches/branch_a/staff-assignments") {
      await route.fulfill({ json: staffAssignments });
      return;
    }

    if (path === "/admin-tenancy/branches/branch_a/student-memberships") {
      await route.fulfill({ json: studentMemberships() });
      return;
    }

    if (path === "/admin-tenancy/branches/branch_a/class-groups") {
      await route.fulfill({ json: classGroups });
      return;
    }

    if (path === "/operations/staff-dashboard") {
      await route.fulfill({ json: operationsDashboard(access) });
      return;
    }

    if (path === "/operations/class-groups/group_a/roster") {
      await route.fulfill({ json: roster() });
      return;
    }

    if (path === "/operations/class-groups/group_a/assignment-candidates") {
      await route.fulfill({ json: assignmentCandidates() });
      return;
    }

    if (path === "/operations/branches/branch_a/staff/staff_instructor/class-group-assignments") {
      await route.fulfill({ json: staffClassGroupAssignments("instructor") });
      return;
    }

    if (path === "/operations/branches/branch_a/staff/staff_coach/class-group-assignments") {
      await route.fulfill({ json: staffClassGroupAssignments("coach") });
      return;
    }

    if (path === "/operations/class-groups/group_a/instructors" || path === "/operations/class-groups/group_a/coaches") {
      await route.fulfill({ json: { id: "assignment_new", classGroupId: "group_a", staffUserId: "staff_instructor", assignedAt: now } });
      return;
    }

    if (path === "/admin-staff/overview") {
      await route.fulfill({ json: staffManagementOverview() });
      return;
    }

    if (path === "/admin-media") {
      await route.fulfill({ json: mediaAssets() });
      return;
    }

    if (path === "/admin-content/navigation/primary") {
      await route.fulfill({ json: navigationMenu() });
      return;
    }

    if (path === "/admin-content/marketing-pages") {
      await route.fulfill({ json: marketingPages() });
      return;
    }

    if (path === "/admin-content/staff-profiles") {
      await route.fulfill({ json: { groups: [] } });
      return;
    }

    if (path === "/admin-content/success-stories") {
      await route.fulfill({ json: { stories: [] } });
      return;
    }

    if (path === "/admin-content/free-materials") {
      await route.fulfill({ json: { categories: [], countdownPages: [] } });
      return;
    }

    if (path === "/admin-commerce/categories") {
      await route.fulfill({ json: categories() });
      return;
    }

    if (path === "/admin-commerce/products") {
      await route.fulfill({ json: products() });
      return;
    }

    if (path === "/admin-commerce/orders") {
      await route.fulfill({ json: [orderSummary()] });
      return;
    }

    if (path === "/admin-commerce/orders/ORD-1") {
      await route.fulfill({ json: orderDetail() });
      return;
    }

    if (path === "/admin-audit/logs") {
      await route.fulfill({ json: auditLogs() });
      return;
    }

    if (path === "/admin-audit/logs/audit_1") {
      await route.fulfill({ json: auditLogDetail() });
      return;
    }

    if (path === "/admin-engagement/leads") {
      await route.fulfill({ json: leads() });
      return;
    }

    if (path === "/admin-engagement/leads/lead_1") {
      await route.fulfill({ json: leadDetail() });
      return;
    }

    await route.fulfill({ json: {} });
  });
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement;
    return documentElement.scrollWidth - documentElement.clientWidth;
  });
  const offenders =
    overflow > 2
      ? await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>("body *"))
            .filter((element) => !element.closest(".admin-app-sidebar[aria-hidden='true']"))
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                tag: element.tagName.toLowerCase(),
                className: typeof element.className === "string" ? element.className : "",
                text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90) ?? "",
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              };
            })
            .filter((item) => item.width > 0 && (item.right > window.innerWidth + 2 || item.left < -2))
            .slice(0, 12)
        )
      : [];
  expect(overflow, JSON.stringify(offenders, null, 2)).toBeLessThanOrEqual(2);
}

async function assertButtonsAreReachable(page: Page) {
  const clipped = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("button, a, input, select, textarea, [role='button']")
    );

    return elements
      .filter((element) => {
        if (element.closest(".admin-app-sidebar[aria-hidden='true']") || element.closest(".admin-app-sidebar-backdrop")) {
          return false;
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0 &&
          (rect.left < -2 || rect.right > viewportWidth + 2 || rect.bottom < -2)
        );
      })
      .map((element) => element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName);
  });

  expect(clipped).toEqual([]);
}

async function assertHeadingsAreReadable(page: Page) {
  const broken = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
      .filter((heading) => {
        const text = heading.textContent?.trim() ?? "";
        const words = text.split(/\s+/).filter(Boolean);
        const rect = heading.getBoundingClientRect();
        const style = window.getComputedStyle(heading);
        const lineHeight = Number.parseFloat(style.lineHeight) || 24;

        return words.length >= 3 && rect.width < 150 && rect.height > lineHeight * 2.6;
      })
      .map((heading) => heading.textContent?.trim());
  });

  expect(broken).toEqual([]);
}

async function assertHeroRadius(page: Page) {
  const hero = page.locator(".admin-dashboard-hero, .admin-saas-hero, .admin-ops-hero, .admin-deploy-hero").first();

  if (!(await hero.count())) {
    return;
  }

  const radius = await hero.evaluate((element) => Number.parseFloat(window.getComputedStyle(element).borderTopLeftRadius));
  expect(radius).toBeGreaterThanOrEqual(20);
}

async function assertBranchDashboardKpis(page: Page) {
  await expect(page.locator(".admin-dashboard-kpi__icon").first()).toBeVisible();
  const gap = await page.evaluate(() => {
    const grid = document.querySelector<HTMLElement>(".admin-dashboard-kpi-grid");
    const next = grid?.nextElementSibling as HTMLElement | null;

    if (!grid || !next) {
      return 0;
    }

    return next.getBoundingClientRect().top - grid.getBoundingClientRect().bottom;
  });

  expect(gap).toBeGreaterThanOrEqual(23);
}

async function assertPanelsFitViewport(page: Page) {
  const offenders = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>(".admin-saas-staffing-panel, .admin-media-picker__panel"))
      .filter((panel) => {
        const style = window.getComputedStyle(panel);
        const rect = panel.getBoundingClientRect();

        if (style.display === "none" || rect.width <= 0) {
          return false;
        }

        const horizontallyClipped = rect.left < -2 || rect.right > window.innerWidth + 2;

        if (panel.classList.contains("admin-media-picker__panel")) {
          return horizontallyClipped || rect.top < -2 || rect.bottom > window.innerHeight + 6;
        }

        return horizontallyClipped || rect.height > window.innerHeight + 6;
      })
      .map((panel) => panel.className);
  });

  expect(offenders).toEqual([]);
}

function accessForRoute(pathname: string) {
  if (pathname === "/sube" || pathname.includes("personel-atamalari") || pathname.includes("sinif-gruplar")) {
    return {
      roleKeys: ["branch-admin"],
      permissionKeys: ["branches.read", "assignments.read", "assignments.manage", "classes.read", "classes.manage"]
    };
  }

  if (pathname === "/egitmen") {
    return { roleKeys: ["instructor"], permissionKeys: ["classes.read"] };
  }

  if (pathname === "/koc") {
    return { roleKeys: ["coach"], permissionKeys: ["classes.read"] };
  }

  if (pathname === "/finans") {
    return { roleKeys: ["accounting"], permissionKeys: ["orders.read", "products.manage"] };
  }

  return {
    roleKeys: ["super-admin"],
    permissionKeys: [
      "organizations.manage",
      "branches.read",
      "assignments.manage",
      "classes.manage",
      "staff.manage",
      "cms.manage",
      "products.manage",
      "orders.read",
      "audit.read",
      "maintenance.manage",
      "leads.manage"
    ]
  };
}

function staffMe(access: ReturnType<typeof accessForRoute>) {
  return {
    actorType: "STAFF",
    staffUser: {
      id: "staff_admin",
      email: "admin@example.com",
      firstName: "Ada",
      lastName: "Yönetici",
      status: "ACTIVE",
      roleKeys: access.roleKeys,
      permissionKeys: access.permissionKeys
    }
  };
}

function staffOverview(access: ReturnType<typeof accessForRoute>) {
  return {
    actorType: "STAFF",
    actorId: "staff_admin",
    roleKeys: access.roleKeys,
    permissionKeys: access.permissionKeys
  };
}

function tenancyScope(access: ReturnType<typeof accessForRoute>) {
  return {
    actor: {
      actorId: "staff_admin",
      email: "admin@example.com",
      roleKeys: access.roleKeys,
      organizationId: "org_a",
      primaryBranchId: "branch_a",
      branchIds: ["branch_a"],
      isSuperAdmin: access.roleKeys.includes("super-admin")
    },
    counts: { organizations: 1, educationCenters: 1, branches: 1, classGroups: 2 }
  };
}

function tenancyOverview(access: ReturnType<typeof accessForRoute>) {
  return {
    organizationCount: 1,
    educationCenterCount: 1,
    branchCount: 1,
    classGroupCount: 2,
    staffAssignmentCount: 3,
    studentMembershipCount: 1,
    recentBranches: [branch],
    recentStaffAssignments: staffAssignments,
    recentStudentMemberships: studentMemberships(),
    currentScope: tenancyScope(access)
  };
}

function betaReadiness(access: ReturnType<typeof accessForRoute>) {
  return {
    generatedAt: now,
    readinessPercentage: 82,
    readyCount: 9,
    totalCount: 11,
    missingItems: [{ key: "media", label: "Medya kontrolü", count: 0, ready: false }],
    items: [{ key: "branch", label: "Şube", count: 1, ready: true }],
    counts: { branches: 1, products: 1 },
    demoData: {
      staffCount: 3,
      studentCount: 1,
      organizationCount: 1,
      branchCount: 1,
      productCount: 1,
      publicProductCount: 1,
      publicCategoryCount: 1,
      announcementCount: 1,
      liveSessionCount: 1,
      publicExposureRisk: false,
      productionSeedBlockedByDefault: true
    },
    scope: {
      isSuperAdmin: access.roleKeys.includes("super-admin"),
      organizationId: "org_a",
      branchIds: ["branch_a"],
      roleKeys: access.roleKeys
    }
  };
}

function operationsDashboard(access: ReturnType<typeof accessForRoute>) {
  return {
    actor: {
      id: "staff_admin",
      email: "admin@example.com",
      roles: access.roleKeys,
      permissions: access.permissionKeys,
      organizationId: "org_a",
      primaryBranchId: "branch_a",
      branchIds: ["branch_a"],
      isSuperAdmin: access.roleKeys.includes("super-admin")
    },
    capability: {
      branchAdmin: access.roleKeys.includes("branch-admin") || access.roleKeys.includes("super-admin"),
      instructor: access.roleKeys.includes("instructor"),
      coach: access.roleKeys.includes("coach"),
      accountant: access.roleKeys.includes("accounting")
    },
    totals: {
      branches: 1,
      classGroups: 2,
      students: 1,
      instructors: 1,
      coaches: 1,
      upcomingSessions: 1,
      announcements: 1,
      recentPayments: 1,
      recentOrders: 1
    },
    branches: [branch],
    classGroups,
    upcomingSessions: [{ id: "session_1", title: "LGS Matematik", startsAt: now, branch, classGroup: classGroups[0] }],
    announcements: [{ id: "ann_1", title: "Haftalık duyuru", body: "Program güncellendi.", createdAt: now }],
    finance: { recentPayments: [], recentOrders: [], placeholders: [] },
    instructor: { assignments: [], operationalBoundaries: [] },
    coach: { assignments: [], plans: [], notes: [], operationalBoundaries: [] }
  };
}

function deploymentStatus() {
  return {
    enabled: true,
    canTrigger: true,
    missingConfig: [],
    currentVersion: { sha: "75227b3", shortSha: "75227b3", branch: "main" },
    github: {
      repository: "arthnixgit/egitimgurmesi",
      branch: "main",
      workflowId: "deploy.yml",
      latestCommit: {
        sha: "75227b35569a1b2f33a90ee345ec2cfe1ca7fb91",
        shortSha: "75227b3",
        message: "Fix responsive class staffing workflow",
        authorName: "Codex",
        authoredAt: now,
        url: "https://github.com/arthnixgit/egitimgurmesi/commit/75227b3"
      },
      recentRuns: [
        { id: 1, name: "Deploy", branch: "main", sha: "75227b3", shortSha: "75227b3", status: "completed", conclusion: "success", url: "#", createdAt: now, updatedAt: now }
      ],
      error: null
    },
    updateAvailable: false,
    checkedAt: now
  };
}

function organizations() {
  return [{ id: "org_a", slug: "egitim-gurmesi", name: "Eğitim Gurmesi", legalName: "Eğitim Gurmesi A.Ş.", status: "ACTIVE", createdAt: now, updatedAt: now, _count: { educationCenters: 1, branches: 1, staffUsers: 3 } }];
}

function educationCenters() {
  return [{ id: "center_a", organizationId: "org_a", slug: "merkez", name: "Merkez Eğitim Merkezi", status: "ACTIVE", city: "İstanbul", district: "Kadıköy", createdAt: now, updatedAt: now, _count: { branches: 1 } }];
}

function staffSearchResponse() {
  return {
    total: 3,
    page: 1,
    limit: 50,
    items: [
      { id: "staff_instructor", name: "Ece Eğitmen", firstName: "Ece", lastName: "Eğitmen", email: "ece@example.com", status: "ACTIVE", roles: [{ id: "role_instructor", key: "instructor", name: "Eğitmen" }], assignedBranches: [] },
      { id: "staff_coach", name: "Can Koç", firstName: "Can", lastName: "Koç", email: "can@example.com", status: "ACTIVE", roles: [{ id: "role_coach", key: "coach", name: "Koç" }], assignedBranches: [] },
      { id: "staff_accountant", name: "Deniz Finans", firstName: "Deniz", lastName: "Finans", email: "deniz@example.com", status: "ACTIVE", roles: [{ id: "role_accounting", key: "accounting", name: "Finans" }], assignedBranches: [] }
    ]
  };
}

function studentSearchResponse() {
  return {
    total: 1,
    page: 1,
    limit: 80,
    items: [{ id: "student_1", name: "Ayşe Öğrenci", email: "ayse@example.com", status: "ACTIVE", currentBranches: [] }]
  };
}

function studentMemberships() {
  return [{ id: "membership_1", organizationId: "org_a", branchId: "branch_a", userId: "student_1", status: "ACTIVE", isPrimary: true, joinedAt: now, branch, user: { id: "student_1", email: "ayse@example.com", firstName: "Ayşe", lastName: "Öğrenci", status: "ACTIVE" } }];
}

function branchStaffAssignment(id: string, staffUserId: string, name: string, email: string, roleKey: string, roleKeys: string[]) {
  const [firstName, ...lastNameParts] = name.split(" ");
  return {
    id,
    organizationId: "org_a",
    branchId: "branch_a",
    staffUserId,
    roleKey,
    status: "ACTIVE",
    isPrimary: roleKey === "INSTRUCTOR",
    assignedAt: now,
    revokedAt: null,
    branch,
    staffUser: {
      id: staffUserId,
      email,
      firstName,
      lastName: lastNameParts.join(" "),
      status: "ACTIVE",
      roles: roleKeys.map((key) => ({ id: `role_${key}`, key, name: key }))
    }
  };
}

function roster() {
  return {
    classGroup: classGroups[0],
    branch,
    students: [],
    instructors: [{ id: "ia_1", staffUserId: "staff_instructor", assignedAt: now, staffUser: staffAssignments[0].staffUser }],
    coaches: [{ id: "ca_1", staffUserId: "staff_coach", assignedAt: now, staffUser: staffAssignments[1].staffUser }]
  };
}

function assignmentCandidates() {
  return {
    classGroup: classGroups[0],
    branch,
    instructors: [{ staffUserId: "staff_instructor_2", name: "Mert Eğitmen", email: "mert@example.com", branchRoleKey: "INSTRUCTOR", roleKeys: ["instructor"] }],
    coaches: [{ staffUserId: "staff_coach_2", name: "Selin Koç", email: "selin@example.com", branchRoleKey: "COACH", roleKeys: ["coach"] }]
  };
}

function staffClassGroupAssignments(role: "instructor" | "coach") {
  const assignment = role === "instructor" ? staffAssignments[0] : staffAssignments[1];

  return {
    staff: {
      id: assignment.staffUser.id,
      name: `${assignment.staffUser.firstName} ${assignment.staffUser.lastName}`,
      email: assignment.staffUser.email
    },
    branch: { id: branch.id, name: branch.name },
    roles: {
      instructor: role === "instructor",
      coach: role === "coach"
    },
    classGroups: classGroups.map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      status: group.status
    })),
    instructorAssignments:
      role === "instructor"
        ? [{ assignmentId: "ia_1", classGroupId: "group_a", classGroupName: classGroups[0].name, isActive: true, startsAt: now }]
        : [],
    coachAssignments:
      role === "coach"
        ? [{ assignmentId: "ca_1", classGroupId: "group_a", classGroupName: classGroups[0].name, isActive: true, startsAt: now }]
        : [],
    availableInstructorClassGroups:
      role === "instructor"
        ? [{ id: "group_b", name: classGroups[1].name, slug: classGroups[1].slug, status: classGroups[1].status }]
        : [],
    availableCoachClassGroups:
      role === "coach"
        ? [{ id: "group_b", name: classGroups[1].name, slug: classGroups[1].slug, status: classGroups[1].status }]
        : []
  };
}

function staffManagementOverview() {
  return {
    scope: { kind: "super", hasValidScope: true, organizationId: "org_a", branchIds: ["branch_a"], assignableRoleKeys: null, canManageRoles: true, canCreateUnassignedStaff: true },
    organizations: organizations().map(({ id, name, slug }) => ({ id, name, slug })),
    branches: [{ id: "branch_a", organizationId: "org_a", name: "Merkez Şube", slug: "merkez-sube" }],
    users: [
      { id: "staff_instructor", organizationId: "org_a", primaryBranchId: "branch_a", organization: { id: "org_a", name: "Eğitim Gurmesi", slug: "egitim-gurmesi" }, primaryBranch: { id: "branch_a", organizationId: "org_a", name: "Merkez Şube", slug: "merkez-sube" }, branchAssignments: [], email: "ece@example.com", firstName: "Ece", lastName: "Eğitmen", status: "ACTIVE", createdAt: now, updatedAt: now, roles: [{ id: "role_instructor", key: "instructor", name: "Eğitmen", isSystem: true, permissionKeys: ["classes.read"] }], roleKeys: ["instructor"], permissionKeys: ["classes.read"] }
    ],
    roles: [
      { id: "role_instructor", key: "instructor", name: "Eğitmen", description: "Ders yönetimi", isSystem: true, staffCount: 1, permissionKeys: ["classes.read"], createdAt: now, updatedAt: now },
      { id: "role_custom", key: "editor", name: "Editör", description: "İçerik", isSystem: false, staffCount: 0, permissionKeys: ["cms.manage"], createdAt: now, updatedAt: now }
    ],
    permissions: [{ id: "perm_cms", key: "cms.manage", name: "İçerik yönetimi", description: "İçerik düzenler" }]
  };
}

function mediaAssets() {
  return [{ id: "media_1", kind: "IMAGE", sourceType: "EXTERNAL_URL", title: "Kampüs Görseli", altText: "Eğitim merkezi", externalUrl: "https://example.com/image.jpg", thumbnailUrl: "https://example.com/image.jpg", url: "https://example.com/image.jpg", createdAt: now, updatedAt: now }];
}

function navigationMenu() {
  return { id: "nav_1", key: "primary", name: "Ana Menü", location: "HEADER", isActive: true, items: [{ id: "nav_item_1", itemKey: "home", label: "Ana Sayfa", href: "/", sortOrder: 1, isActive: true, children: [] }] };
}

function marketingPages() {
  return [{ id: "page_1", key: "home", slug: "anasayfa", title: "Ana Sayfa", pageType: "LANDING", publishStatus: "PUBLISHED", sections: [{ id: "section_1", sectionKey: "hero", title: "Başarıya hazırlık", body: "Eğitim programları", sortOrder: 1, isActive: true, publishStatus: "PUBLISHED" }] }];
}

function categories() {
  return [
    { id: "cat_online", slug: "online-kocluk", name: "Online Koçluk", parentSlug: null, description: "Online koçluk", sortOrder: 1, isActive: true },
    { id: "cat_yks", slug: "online-kocluk--yks", name: "YKS", parentSlug: "online-kocluk", parentName: "Online Koçluk", description: "YKS hazırlık", sortOrder: 1, isActive: true }
  ];
}

function products() {
  return [{ id: "product_1", slug: "yks-hazirlik", name: "YKS Hazırlık Paketi", categorySlug: "online-kocluk--yks", categoryName: "YKS", rootCategorySlug: "online-kocluk", rootCategoryName: "Online Koçluk", shortDescription: "Video ve koçluk", description: "YKS hazırlık içeriği", type: "HYBRID_PACKAGE", provider: "LOCAL", publishStatus: "PUBLISHED", isFeatured: true, sortOrder: 1, accentColor: "teal", coverImageUrl: "", variants: [{ id: "variant_1", title: "Aylık", sku: "YKS-AYLIK", price: "1200", currency: "TRY", isDefault: true, isActive: true, sortOrder: 1 }], features: [{ id: "feature_1", title: "Canlı ders", description: "Haftalık ders", sortOrder: 1 }] }];
}

function orderSummary() {
  return { id: "order_1", orderNumber: "ORD-1", userEmail: "veli@example.com", status: "PAID", currency: "TRY", subtotalAmount: "1200", discountAmount: "0", totalAmount: "1200", paidAt: now, createdAt: now, updatedAt: now, note: "Kontrol edildi", paymentStatus: "PAID", paymentProvider: "PAYTR", redirectMode: false, externalOrderStatus: null, items: [{ id: "item_1", titleSnapshot: "LGS Hazırlık Paketi", skuSnapshot: "LGS-AYLIK", quantity: 1, unitPrice: "1200", totalAmount: "1200", provider: "LOCAL", variantTitle: "Aylık", productSlug: "lgs-hazirlik" }], externalOrders: [] };
}

function orderDetail() {
  return { ...orderSummary(), userId: "student_1", couponCode: null, taxAmount: "0", payments: [{ id: "payment_1", provider: "PAYTR", method: "CARD", status: "PAID", amount: "1200", currency: "TRY", paidAt: now, createdAt: now, updatedAt: now, attempts: [] }], externalOrders: [], timeline: [{ timestamp: now, label: "Ödeme alındı", description: "PayTR ödemesi tamamlandı.", source: "payment", tone: "success" }] };
}

function auditLogs() {
  return { total: 1, take: 80, logs: [{ id: "audit_1", action: "STAFF_UPDATED", entityType: "StaffUser", entityId: "staff_instructor", summary: "Personel güncellendi", actorType: "STAFF_USER", actor: { id: "staff_admin", name: "Ada Yönetici", email: "admin@example.com" }, createdAt: now }] };
}

function auditLogDetail() {
  return { ...auditLogs().logs[0], beforeData: { status: "INVITED" }, afterData: { status: "ACTIVE" }, metadata: { source: "admin" }, ipAddress: "127.0.0.1", userAgent: "Playwright" };
}

function leads() {
  return { total: 1, counts: { NEW: 1, CONTACTED: 0, QUALIFIED: 0, CLOSED: 0 }, sourcePages: [{ value: "home", count: 1 }], leads: [{ id: "lead_1", status: "NEW", sourcePage: "home", fullName: "Veli Aday", email: "veli@example.com", city: "İstanbul", preview: "Bilgi almak istiyorum.", createdAt: now }] };
}

function leadDetail() {
  return { id: "lead_1", status: "NEW", sourcePage: "home", message: "Bilgi almak istiyorum.", createdAt: now, updatedAt: now, structuredFields: [{ label: "Sınıf", value: "8" }] };
}

function slugFor(routePath: string) {
  return routePath === "/" ? "root" : routePath.replace(/^\/+/, "").replace(/\//g, "_");
}
