import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContentStatus, FreeMaterialItemType } from "@ega/db";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PublicContentRepository } from "../data-access/public-content.repository";
import { PublicContentService } from "./public-content.service";

describe("PublicContentService navigation", () => {
  it("returns an explicit enabled database snapshot with valid top-level items in menu order", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({ id: "nav_about", itemKey: "about", label: "Hakkımızda", href: "/hakkimizda" }),
          navItem({ id: "nav_packages", itemKey: "packages", label: "Paketlerimiz", href: "/paketlerimiz" }),
          navItem({ id: "nav_free", itemKey: "free-materials", label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" })
        ])
    });

    const menu = await service.getNavigationMenu("primary");

    assert.equal(menu.enabled, true);
    assert.equal(menu.source, "database");
    assert.equal(menu.catalogStatus, "ready");
    assert.ok(menu.generatedAt);
    assert.deepEqual(menu.items.map((item) => item.label), [
      "Hakkımızda",
      "Paketlerimiz",
      "Ücretsiz Materyaller"
    ]);
  });

  it("composes Paketlerimiz children from active catalog categories instead of legacy menu rows", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({ id: "nav_packages", itemKey: "packages", label: "Paketlerimiz", href: "/paketlerimiz" }),
          navItem({
            id: "legacy_child",
            parentId: "nav_packages",
            itemKey: "packages-old-online",
            label: "Eski Online",
            href: "/paketlerimiz?kategori=stale"
          }),
          navItem({ id: "nav_about", itemKey: "about", label: "Hakkımızda", href: "/hakkimizda" })
        ]),
      listPackageNavigationCategories: async () => [
        packageRoot({
          id: "root_online",
          slug: "online-kocluk",
          name: "Online Koçluk Güncel",
          description: "Güncel açıklama",
          ctaHref: "/paketlerimiz?kategori=online-kocluk",
          childCategories: [
            packageChild({
              id: "child_lgs",
              slug: "online-kocluk--lgs",
              name: "LGS Yeni",
              ctaHref: "/paketlerimiz?kategori=online-kocluk&alt=lgs"
            }),
            packageChild({
              id: "child_yks",
              slug: "online-kocluk--yks",
              name: "YKS Yeni",
              ctaHref: "/paketlerimiz?kategori=online-kocluk&alt=yks"
            })
          ]
        }),
        packageRoot({
          id: "root_custom",
          slug: "ozel-ders",
          name: "Özel Ders",
          ctaHref: "/ozel-dersler",
          childCategories: []
        })
      ]
    });

    const menu = await service.getNavigationMenu("primary");
    const packages = menu.items.find((item) => item.itemKey === "packages");

    assert.equal(menu.enabled, true);
    assert.ok(packages);
    assert.deepEqual(
      packages.children.map((item) => item.label),
      ["Online Koçluk Güncel", "Özel Ders"]
    );
    assert.deepEqual(
      packages.children[0].children.map((item) => item.label),
      ["LGS Yeni", "YKS Yeni"]
    );
    assert.equal(packages.children[0].description, "Güncel açıklama");
    assert.equal(packages.children[0].href, "/paketlerimiz?kategori=online-kocluk");
    assert.equal(packages.children[1].href, "/ozel-dersler");
    assert.equal(
      JSON.stringify(packages).includes("Eski Online"),
      false
    );
    assert.equal(menu.items.find((item) => item.itemKey === "about")?.label, "Hakkımızda");
  });

  it("reflects catalog rename and sort order in the package subtree", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({ id: "nav_packages", itemKey: "packages", label: "Paketlerimiz", href: "/paketlerimiz" })
        ]),
      listPackageNavigationCategories: async () => [
        packageRoot({
          id: "root_second",
          slug: "second",
          name: "Second Root",
          sortOrder: 20,
          childCategories: []
        }),
        packageRoot({
          id: "root_first",
          slug: "first",
          name: "Renamed First Root",
          sortOrder: 10,
          childCategories: [
            packageChild({
              id: "child_second",
              slug: "second-child",
              name: "Second Child",
              sortOrder: 20
            }),
            packageChild({
              id: "child_first",
              slug: "first-child",
              name: "Renamed First Child",
              sortOrder: 10
            })
          ]
        })
      ]
    });

    const menu = await service.getNavigationMenu("primary");
    const packages = menu.items.find((item) => item.itemKey === "packages");

    assert.ok(packages);
    assert.deepEqual(packages.children.map((item) => item.label), [
      "Renamed First Root",
      "Second Root"
    ]);
    assert.deepEqual(packages.children[0].children.map((item) => item.label), [
      "Renamed First Child",
      "Second Child"
    ]);
  });

  it("keeps only the safe top-level Paketlerimiz link when catalog composition fails", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({ id: "nav_packages", itemKey: "packages", label: "Paketlerimiz", href: "/paketlerimiz" }),
          navItem({
            id: "legacy_child",
            parentId: "nav_packages",
            itemKey: "packages-stale",
            label: "Pasif Eski Kategori",
            href: "/paketlerimiz?kategori=pasif"
          })
        ]),
      listPackageNavigationCategories: async () => {
        throw new Error("catalog unavailable");
      }
    });

    const menu = await service.getNavigationMenu("primary");
    const packages = menu.items[0];

    assert.equal(menu.enabled, true);
    assert.equal(menu.catalogStatus, "unavailable");
    assert.equal(packages.itemKey, "packages");
    assert.equal(packages.href, "/paketlerimiz");
    assert.deepEqual(packages.children, []);
  });

  it("does not inject package categories when NavigationMenu disables the top-level item", async () => {
    const service = createService({
      getNavigationMenu: async () => navigationMenu([navItem({ id: "nav_about", itemKey: "about", label: "Hakkımızda", href: "/hakkimizda" })]),
      listPackageNavigationCategories: async () => [
        packageRoot({ slug: "online-kocluk", name: "Online Koçluk", childCategories: [] })
      ]
    });

    const menu = await service.getNavigationMenu("primary");

    assert.deepEqual(menu.items.map((item) => item.itemKey), ["about"]);
  });

  it("keeps Paketlerimiz as a direct link when no package categories are active", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({ id: "nav_packages", itemKey: "packages", label: "Paketlerimiz", href: "/paketlerimiz" }),
          navItem({ id: "nav_about", itemKey: "about", label: "About", href: "/hakkimizda" })
        ]),
      listPackageNavigationCategories: async () => []
    });

    const menu = await service.getNavigationMenu("primary");
    const packages = menu.items.find((item) => item.itemKey === "packages");

    assert.ok(packages);
    assert.equal(packages.href, "/paketlerimiz");
    assert.deepEqual(packages.children, []);
    assert.deepEqual(menu.items.map((item) => item.itemKey), ["packages", "about"]);
  });

  it("returns an explicit disabled snapshot when the NavigationMenu is inactive", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({ id: "nav_about", itemKey: "about", label: "Hakkımızda", href: "/hakkimizda" })
        ], { isActive: false })
    });

    const menu = await service.getNavigationMenu("primary");

    assert.equal(menu.enabled, false);
    assert.equal(menu.source, "disabled");
    assert.deepEqual(menu.items, []);
  });

  it("uses the safe fallback when the primary NavigationMenu is missing", async () => {
    const service = createService({
      getNavigationMenu: async () => null
    });

    const menu = await service.getNavigationMenu("primary");

    assert.equal(menu.enabled, true);
    assert.equal(menu.source, "fallback");
    assert.deepEqual(menu.items.map((item) => item.label), [
      "Paketlerimiz",
      "Akademik Kadro",
      "Başarılarımız",
      "Ücretsiz Materyaller",
      "Hakkımızda"
    ]);
    assert.deepEqual(menu.items[0].children, []);
  });

  it("does not return an unexplained successful empty result for an active empty menu", async () => {
    const service = createService({
      getNavigationMenu: async () => navigationMenu([])
    });

    const menu = await service.getNavigationMenu("primary");

    assert.equal(menu.enabled, true);
    assert.equal(menu.source, "fallback");
    assert.notDeepEqual(menu.items, []);
  });

  it("rejects unsafe hrefs from the public snapshot and falls back when none remain", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({ id: "bad_js", itemKey: "bad", label: "Bad", href: "javascript:alert(1)" })
        ])
    });

    const menu = await service.getNavigationMenu("primary");

    assert.equal(menu.source, "fallback");
    assert.equal(menu.items[0].itemKey, "packages");
  });

  it("deduplicates duplicate item keys deterministically without losing unrelated links", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({ id: "nav_about_1", itemKey: "about", label: "Hakkımızda", href: "/hakkimizda" }),
          navItem({ id: "nav_about_2", itemKey: "about", label: "Duplicate", href: "/duplicate" }),
          navItem({ id: "nav_free", itemKey: "free-materials", label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" })
        ])
    });

    const menu = await service.getNavigationMenu("primary");

    assert.equal(menu.source, "database");
    assert.deepEqual(menu.items.map((item) => item.label), ["Hakkımızda", "Ücretsiz Materyaller"]);
  });
  it("rejects package child keys outside the Paketlerimiz subtree", async () => {
    const service = createService({
      getNavigationMenu: async () =>
        navigationMenu([
          navItem({
            id: "nav_stale_package",
            itemKey: "packages-stale-root",
            label: "Stale Package Root",
            href: "/paketlerimiz?kategori=stale"
          }),
          navItem({ id: "nav_about", itemKey: "about", label: "About", href: "/hakkimizda" })
        ])
    });

    const menu = await service.getNavigationMenu("primary");

    assert.equal(menu.source, "fallback");
    assert.equal(menu.items[0].itemKey, "packages");
  });
});

describe("PublicContentRepository package navigation query", () => {
  it("queries only active global roots and active global children in sort order", async () => {
    let queryArgs: unknown = null;
    const repository = new PublicContentRepository({
      productCategory: {
        findMany: async (args: unknown) => {
          queryArgs = args;
          return [];
        }
      }
    } as never);

    await repository.listPackageNavigationCategories();

    assert.deepEqual(queryArgs, {
      where: {
        parentCategoryId: null,
        isActive: true,
        organizationId: null,
        branchId: null
      },
      include: {
        childCategories: {
          where: {
            isActive: true,
            organizationId: null,
            branchId: null
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
  });

  it("uses one bounded active-global query for root and child package categories", async () => {
    let findManyCalls = 0;
    const repository = new PublicContentRepository({
      productCategory: {
        findMany: async (args: unknown) => {
          findManyCalls += 1;
          assert.deepEqual(args, {
            where: {
              parentCategoryId: null,
              isActive: true,
              organizationId: null,
              branchId: null
            },
            include: {
              childCategories: {
                where: {
                  isActive: true,
                  organizationId: null,
                  branchId: null
                },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
              }
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          });
          return [];
        }
      }
    } as never);

    await repository.listPackageNavigationCategories();

    assert.equal(findManyCalls, 1);
  });
});

describe("PublicContentService free materials", () => {
  it("maps published download cards to same-origin download actions without exposing raw URLs", async () => {
    const service = createService({
      listFreeMaterialCategories: async () => [
        {
          id: "cat_1",
          key: "pdf-documents",
          label: "PDF Dokümanlar",
          description: "Planlar",
          sortOrder: 10,
          publishStatus: ContentStatus.PUBLISHED,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: "item_1",
              categoryId: "cat_1",
              slug: "tyt-plan",
              title: "TYT Plan",
              itemType: FreeMaterialItemType.DOWNLOAD,
              badgeLabel: "PDF",
              summary: "Haftalık plan",
              href: "https://cdn.example.com/raw-plan.pdf",
              buttonLabel: "İndir",
              iconKey: "pdf",
              tone: "blue",
              coverImageUrl: null,
              downloadUrl: "https://cdn.example.com/raw-plan.pdf",
              mediaAssetId: null,
              displayFilename: "tyt-plan.pdf",
              mimeType: "application/pdf",
              fileSizeBytes: 2048,
              accessibilityLabel: null,
              opensInNewTab: true,
              sortOrder: 10,
              isFeatured: false,
              publishStatus: ContentStatus.PUBLISHED,
              version: 1,
              countdownPageId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              countdownPage: null
            }
          ]
        }
      ]
    });

    const categories = await service.listFreeMaterials();
    const item = categories[0].items[0];

    assert.equal(item.href, "/v1/public/free-materials/item_1/download");
    assert.equal(item.downloadHref, "/v1/public/free-materials/item_1/download");
    assert.equal(item.opensInNewTab, false);
    assert.equal(item.accessibilityLabel, "TYT Plan dosyasını indir");
    assert.equal(JSON.stringify(item).includes("raw-plan.pdf"), false);
  });

  it("rejects missing or inactive public download items", async () => {
    const service = createService({
      getPublishedDownloadMaterialItem: async () => null
    });

    await assert.rejects(
      () => service.resolveFreeMaterialDownload("draft-item"),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.equal(error.getStatus(), 404);
        return true;
      }
    );
  });

  it("rejects non-HTTPS download URLs with a controlled message", async () => {
    const service = createService({
      getPublishedDownloadMaterialItem: async () => downloadItem({ downloadUrl: "http://example.com/file.pdf" })
    });

    await assertBadRequest(
      () => service.resolveFreeMaterialDownload("item_1"),
      "İndirilebilir materyal bağlantısı HTTPS olmalıdır."
    );
  });

  it("rejects private-network download URLs before proxying", async () => {
    const service = createService({
      getPublishedDownloadMaterialItem: async () => downloadItem({ downloadUrl: "https://127.0.0.1/file.pdf" })
    });

    await assertBadRequest(
      () => service.resolveFreeMaterialDownload("item_1"),
      "İndirilebilir materyal bağlantısı güvenli değil."
    );
  });
});

function createService(repositoryOverrides: Record<string, unknown>) {
  const repository = {
    getSiteSetting: async () => null,
    getNavigationMenu: async () => null,
    getMarketingPageBySlug: async () => null,
    listStaffProfileGroups: async () => [],
    listSuccessStories: async () => [],
    listFreeMaterialCategories: async () => [],
    getPublishedDownloadMaterialItem: async () => null,
    getCountdownPageBySlug: async () => null,
    listPackageNavigationCategories: async () => [],
    ...repositoryOverrides
  };
  const mediaService = {
    getAsset: async () => {
      throw new Error("not used");
    },
    getLocalAssetFile: async () => {
      throw new Error("not used");
    }
  };

  return new PublicContentService(repository as never, mediaService as never);
}

function navigationMenu(
  items: ReturnType<typeof navItem>[],
  overrides: { isActive?: boolean } = {}
) {
  return {
    id: "menu_1",
    key: "primary",
    name: "Ana Menü",
    location: "PRIMARY",
    isActive: overrides.isActive ?? true,
    version: 4,
    items
  };
}

function navItem(input: {
  id: string;
  itemKey: string;
  label: string;
  href: string;
  parentId?: string | null;
  description?: string | null;
  target?: string | null;
}) {
  return {
    id: input.id,
    itemKey: input.itemKey,
    label: input.label,
    href: input.href,
    parentId: input.parentId ?? null,
    description: input.description ?? null,
    target: input.target ?? null
  };
}

function packageRoot(input: {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  ctaHref?: string | null;
  sortOrder?: number;
  childCategories: ReturnType<typeof packageChild>[];
}) {
  return {
    id: input.id ?? `root_${input.slug}`,
    organizationId: null,
    branchId: null,
    parentCategoryId: null,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    seoTitle: null,
    seoDescription: null,
    ctaHref: input.ctaHref ?? null,
    sortOrder: input.sortOrder ?? 10,
    isActive: true,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    childCategories: input.childCategories
  };
}

function packageChild(input: {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  ctaHref?: string | null;
  sortOrder?: number;
}) {
  return {
    id: input.id,
    organizationId: null,
    branchId: null,
    parentCategoryId: "root_1",
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    seoTitle: null,
    seoDescription: null,
    ctaHref: input.ctaHref ?? null,
    sortOrder: input.sortOrder ?? 10,
    isActive: true,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z")
  };
}

function downloadItem(overrides: Partial<ReturnType<typeof downloadItemBase>> = {}) {
  return {
    ...downloadItemBase(),
    ...overrides
  };
}

function downloadItemBase() {
  const now = new Date();

  return {
    id: "item_1",
    categoryId: "cat_1",
    slug: "tyt-plan",
    title: "TYT Plan",
    itemType: FreeMaterialItemType.DOWNLOAD,
    badgeLabel: "PDF",
    summary: "Haftalık plan",
    href: null,
    buttonLabel: "İndir",
    iconKey: "pdf",
    tone: "blue",
    coverImageUrl: null,
    downloadUrl: "https://cdn.example.com/file.pdf",
    mediaAssetId: null,
    displayFilename: "tyt-plan.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 2048,
    accessibilityLabel: "TYT Plan dosyasını indir",
    opensInNewTab: false,
    sortOrder: 10,
    isFeatured: false,
    publishStatus: ContentStatus.PUBLISHED,
    version: 1,
    countdownPageId: null,
    createdAt: now,
    updatedAt: now
  };
}

async function assertBadRequest(call: () => Promise<unknown>, message: string) {
  await assert.rejects(call, (error: unknown) => {
    assert.ok(error instanceof BadRequestException);
    assert.equal(error.getStatus(), 400);
    assert.equal(error.message, message);
    return true;
  });
}
