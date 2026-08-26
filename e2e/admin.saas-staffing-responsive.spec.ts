import { expect, test } from "@playwright/test";

const routes = ["/saas/personel-atamalari", "/saas/sinif-gruplar", "/operasyon"];
const widths = [1920, 1440, 1280, 1024, 768, 390];
const now = "2026-08-24T09:00:00.000Z";

const scope = {
  actor: {
    actorId: "staff_branch_admin",
    email: "branch.admin@example.com",
    roleKeys: ["branch-admin"],
    organizationId: "org_a",
    primaryBranchId: "branch_a",
    branchIds: ["branch_a"],
    isSuperAdmin: false
  },
  counts: {
    organizations: 1,
    educationCenters: 1,
    branches: 1,
    classGroups: 2
  }
};

const branch = {
  id: "branch_a",
  organizationId: "org_a",
  slug: "merkez-sube",
  name: "Merkez Şube",
  status: "ACTIVE",
  city: "İstanbul",
  district: "Kadıköy",
  createdAt: now,
  updatedAt: now,
  _count: {
    staffAssignments: 3,
    studentMemberships: 0,
    classGroups: 2
  }
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
    _count: {
      instructorAssignments: 1,
      coachAssignments: 1
    }
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
    _count: {
      instructorAssignments: 0,
      coachAssignments: 0
    }
  }
];

const staffAssignments = [
  branchStaffAssignment("assignment_instructor", "staff_instructor", "Ece Eğitmen", "ece@example.com", "INSTRUCTOR", ["instructor"]),
  branchStaffAssignment("assignment_coach", "staff_coach", "Can Koç", "can@example.com", "COACH", ["coach"]),
  branchStaffAssignment("assignment_accountant", "staff_accountant", "Deniz Finans", "deniz@example.com", "ACCOUNTANT", ["accounting"])
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("ega_staff_access_token", "mock-access-token");
    window.localStorage.setItem("ega_staff_refresh_token", "mock-refresh-token");
  });

  await page.route("http://localhost:4000/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/v1/, "");

    if (path === "/staff/bootstrap-status") {
      await route.fulfill({ json: { requiresBootstrap: false } });
      return;
    }

    if (path === "/auth/me") {
      await route.fulfill({
        json: {
          actorType: "STAFF",
          staffUser: {
            id: "staff_branch_admin",
            email: "branch.admin@example.com",
            firstName: "Branch",
            lastName: "Admin",
            status: "ACTIVE",
            roleKeys: ["branch-admin"],
            permissionKeys: [
              "branches.read",
              "assignments.read",
              "assignments.manage",
              "classes.read",
              "classes.manage"
            ]
          }
        }
      });
      return;
    }

    if (path === "/staff/overview") {
      await route.fulfill({
        json: {
          actorType: "STAFF",
          actorId: "staff_branch_admin",
          roleKeys: ["branch-admin"],
          permissionKeys: [
            "branches.read",
            "assignments.read",
            "assignments.manage",
            "classes.read",
            "classes.manage"
          ]
        }
      });
      return;
    }

    if (path === "/admin-tenancy/scope") {
      await route.fulfill({ json: scope });
      return;
    }

    if (path === "/admin-tenancy/overview") {
      await route.fulfill({
        json: {
          organizationCount: 1,
          educationCenterCount: 1,
          branchCount: 1,
          classGroupCount: 2,
          staffAssignmentCount: 3,
          studentMembershipCount: 0,
          recentBranches: [branch],
          recentStaffAssignments: staffAssignments,
          recentStudentMemberships: [],
          currentScope: scope
        }
      });
      return;
    }

    if (path === "/admin-tenancy/branches") {
      await route.fulfill({ json: [branch] });
      return;
    }

    if (path === "/admin-tenancy/staff") {
      await route.fulfill({
        json: {
          total: 3,
          page: 1,
          limit: 50,
          items: [
            { id: "staff_instructor", name: "Ece Eğitmen", email: "ece@example.com", status: "ACTIVE" },
            { id: "staff_coach", name: "Can Koç", email: "can@example.com", status: "ACTIVE" },
            { id: "staff_accountant", name: "Deniz Finans", email: "deniz@example.com", status: "ACTIVE" }
          ]
        }
      });
      return;
    }

    if (path === "/admin-tenancy/branches/branch_a/staff-assignments") {
      await route.fulfill({ json: staffAssignments });
      return;
    }

    if (path === "/admin-tenancy/branches/branch_a/class-groups") {
      await route.fulfill({ json: classGroups });
      return;
    }

    if (path === "/admin-tenancy/students") {
      await route.fulfill({ json: { total: 0, page: 1, limit: 80, items: [] } });
      return;
    }

    if (path === "/operations/staff-dashboard") {
      await route.fulfill({
        json: {
          actor: {
            id: "staff_branch_admin",
            email: "branch.admin@example.com",
            roles: ["branch-admin"],
            permissions: ["classes.manage", "assignments.manage"],
            organizationId: "org_a",
            primaryBranchId: "branch_a",
            branchIds: ["branch_a"],
            isSuperAdmin: false
          },
          capability: {
            branchAdmin: true,
            instructor: false,
            coach: false,
            accountant: false
          },
          totals: {
            branches: 1,
            classGroups: 2,
            students: 0,
            instructors: 1,
            coaches: 1,
            upcomingSessions: 0,
            announcements: 0,
            recentPayments: 0,
            recentOrders: 0
          },
          branches: [branch],
          classGroups,
          upcomingSessions: [],
          announcements: [],
          finance: { recentPayments: [], recentOrders: [], placeholders: [] },
          instructor: { assignments: [], operationalBoundaries: [] },
          coach: { assignments: [], plans: [], notes: [], operationalBoundaries: [] }
        }
      });
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

    await route.fulfill({ status: 404, json: { message: `Unhandled mock route: ${path}` } });
  });
});

test.describe("admin staffing responsive layout", () => {
  for (const route of routes) {
    for (const width of widths) {
      test(`${route} has no clipped staffing controls at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: width <= 390 ? 900 : 960 });
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(500);

        await expect(page).not.toHaveURL(/\/giris(?:\?|$)/);

        if (route === "/saas/personel-atamalari") {
          await page.getByRole("button", { name: /Sınıf \/ Gruba Görevlendir/i }).first().click();
          await expect(page.getByText("Aktif Sınıf / Gruplar").first()).toBeVisible();
        }

        if (route === "/saas/sinif-gruplar") {
          await page.getByRole("button", { name: "Görevlendirmeleri Yönet" }).first().click();
          await expect(page.getByText("Mevcut Eğitmenler").first()).toBeVisible();
        }

        if (route === "/operasyon") {
          await page.locator("select").first().selectOption("group_a");
          await expect(page.getByText("Roster ve görevli atamaları").first()).toBeVisible();
        }

        if (process.env.EGA_RESPONSIVE_SCREENSHOTS === "1") {
          const routeName = route.replaceAll("/", "_").replace(/^_/, "");
          await page.screenshot({
            path: `test-results/${routeName}-${width}.png`,
            fullPage: true
          });
        }

        const horizontalOverflow = await page.evaluate(() => {
          const pageWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
          );
          return pageWidth - window.innerWidth;
        });
        expect(horizontalOverflow).toBeLessThanOrEqual(1);

        const wordByWordHeadings = await page.locator("h1, h2, h3").evaluateAll((headings) =>
          headings
            .filter((heading) => {
              const text = heading.textContent?.trim() || "";
              const rect = heading.getBoundingClientRect();
              return text.includes(" ") && text.length > 12 && rect.width > 0 && rect.width < 120;
            })
            .map((heading) => heading.textContent?.trim() || "unnamed")
        );
        expect(wordByWordHeadings).toEqual([]);

        const clippedControls = await page
          .locator("button, a.admin-button, a.admin-button--ghost, a.admin-button--compact")
          .evaluateAll((controls) =>
            controls
              .filter((control) => {
                if (control.closest(".admin-app-sidebar")) {
                  return false;
                }

                const rect = control.getBoundingClientRect();
                const style = window.getComputedStyle(control);

                if (rect.width === 0 || rect.height === 0 || style.visibility === "hidden") {
                  return false;
                }

                const leaksViewport = rect.left < -1 || rect.right > window.innerWidth + 1;
                const clipsOwnText =
                  control.scrollWidth > control.clientWidth + 12 &&
                  control.scrollWidth / Math.max(control.clientWidth, 1) > 1.08;

                return leaksViewport || clipsOwnText;
              })
              .map((control) => control.textContent?.trim() || control.getAttribute("aria-label") || "unnamed")
          );

        expect(clippedControls).toEqual([]);
      });
    }
  }
});

function branchStaffAssignment(
  id: string,
  staffUserId: string,
  displayName: string,
  email: string,
  roleKey: string,
  roleKeys: string[]
) {
  return {
    id,
    organizationId: "org_a",
    branchId: "branch_a",
    branch,
    staffUserId,
    staffUser: {
      id: staffUserId,
      displayName,
      firstName: displayName.split(" ")[0],
      lastName: displayName.split(" ").slice(1).join(" "),
      email,
      status: "ACTIVE",
      roles: roleKeys.map((key) => ({ id: `role_${key}`, key, name: key }))
    },
    roleKey,
    status: "ACTIVE",
    isPrimary: roleKey !== "COACH",
    assignedAt: now
  };
}

function roster() {
  return {
    classGroup: {
      ...classGroups[0],
      branch,
      counts: {
        students: 0,
        instructorAssignments: 1,
        coachAssignments: 1,
        liveSessions: 0
      }
    },
    students: [],
    instructors: [
      {
        id: "instructor_assignment_1",
        staffUserId: "staff_instructor",
        name: "Ece Eğitmen",
        email: "ece@example.com",
        startsAt: now
      }
    ],
    coaches: [
      {
        id: "coach_assignment_1",
        staffUserId: "staff_coach",
        name: "Can Koç",
        email: "can@example.com",
        startsAt: now
      }
    ]
  };
}

function assignmentCandidates() {
  return {
    classGroup: {
      id: "group_a",
      branchId: "branch_a",
      organizationId: "org_a",
      name: "LGS 8-A Hazırlık Grubu"
    },
    instructors: [
      {
        staffUserId: "staff_instructor_candidate",
        name: "Ada Eğitmen",
        email: "ada@example.com",
        branchAssignmentId: "assignment_instructor_candidate"
      }
    ],
    coaches: [
      {
        staffUserId: "staff_coach_candidate",
        name: "Mert Koç",
        email: "mert@example.com",
        branchAssignmentId: "assignment_coach_candidate"
      }
    ]
  };
}

function staffClassGroupAssignments(role: "instructor" | "coach") {
  return {
    staff: {
      id: role === "instructor" ? "staff_instructor" : "staff_coach",
      name: role === "instructor" ? "Ece Eğitmen" : "Can Koç",
      email: role === "instructor" ? "ece@example.com" : "can@example.com"
    },
    branch: { id: "branch_a", name: "Merkez Şube" },
    roles: { instructor: role === "instructor", coach: role === "coach" },
    classGroups,
    instructorAssignments:
      role === "instructor"
        ? [
            {
              assignmentId: "instructor_assignment_1",
              classGroupId: "group_a",
              classGroupName: "LGS 8-A Hazırlık Grubu",
              isActive: true,
              startsAt: now
            }
          ]
        : [],
    coachAssignments:
      role === "coach"
        ? [
            {
              assignmentId: "coach_assignment_1",
              classGroupId: "group_a",
              classGroupName: "LGS 8-A Hazırlık Grubu",
              isActive: true,
              startsAt: now
            }
          ]
        : [],
    availableInstructorClassGroups: role === "instructor" ? [classGroups[1]] : [],
    availableCoachClassGroups: role === "coach" ? [classGroups[1]] : []
  };
}
