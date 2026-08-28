import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContentStatus, FreeMaterialItemType } from "@ega/db";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PublicContentService } from "./public-content.service";

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
