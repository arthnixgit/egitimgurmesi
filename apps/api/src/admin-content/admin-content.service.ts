import {
  AuditActorType,
  ContentStatus,
  Prisma
} from "@ega/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import {
  SaveCountdownPageDto,
  SaveFreeMaterialsDocumentDto,
  SaveMarketingPageDto,
  SaveNavigationMenuDto,
  SaveNavigationMenuItemDto,
  SaveStaffProfilesDocumentDto,
  SaveSuccessStoriesDocumentDto
} from "./dto/admin-content.dto";

const navigationInclude = {
  items: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.NavigationMenuInclude;

const marketingPagesInclude = {
  sections: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.MarketingPageInclude;

const staffGroupsInclude = {
  profiles: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.StaffProfileGroupInclude;

const freeMaterialCategoriesInclude = {
  items: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      countdownPage: {
        select: {
          slug: true
        }
      }
    }
  }
} satisfies Prisma.FreeMaterialCategoryInclude;

const countdownPagesInclude = {
  targets: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  },
  officialLinks: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  },
  articleSections: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.CountdownPageInclude;

type TransactionClient = Prisma.TransactionClient;

type NavigationMenuWithItems = Prisma.NavigationMenuGetPayload<{
  include: typeof navigationInclude;
}>;

type MarketingPageWithSections = Prisma.MarketingPageGetPayload<{
  include: typeof marketingPagesInclude;
}>;

type StaffGroupWithProfiles = Prisma.StaffProfileGroupGetPayload<{
  include: typeof staffGroupsInclude;
}>;

type FreeMaterialCategoryWithItems = Prisma.FreeMaterialCategoryGetPayload<{
  include: typeof freeMaterialCategoriesInclude;
}>;

type CountdownPageWithChildren = Prisma.CountdownPageGetPayload<{
  include: typeof countdownPagesInclude;
}>;

@Injectable()
export class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getNavigationMenu(key: string) {
    const menu = await this.prisma.navigationMenu.findUnique({
      where: { key },
      include: navigationInclude
    });

    if (!menu) {
      throw new NotFoundException("Navigation menu not found.");
    }

    return normalizeNavigationMenu(menu);
  }

  async saveNavigationMenu(
    key: string,
    payload: SaveNavigationMenuDto,
    auth: AuthenticatedRequestContext
  ) {
    const menu = await this.prisma.$transaction(async (tx) => {
      const record = await tx.navigationMenu.upsert({
        where: { key },
        update: {
          name: payload.name,
          location: payload.location,
          description: payload.description,
          isActive: payload.isActive ?? true
        },
        create: {
          key,
          name: payload.name,
          location: payload.location,
          description: payload.description,
          isActive: payload.isActive ?? true
        }
      });

      await tx.navigationMenuItem.deleteMany({
        where: { menuId: record.id }
      });

      await createNavigationItems(tx, record.id, payload.items);

      await recordAuditLog(tx, auth, {
        action: "cms.navigation.save",
        entityType: "NavigationMenu",
        entityId: record.id,
        summary: `Saved navigation menu ${key}.`
      });

      const saved = await tx.navigationMenu.findUnique({
        where: { id: record.id },
        include: navigationInclude
      });

      if (!saved) {
        throw new NotFoundException("Saved navigation menu could not be reloaded.");
      }

      return saved;
    });

    return normalizeNavigationMenu(menu);
  }

  async listMarketingPages() {
    const pages = await this.prisma.marketingPage.findMany({
      include: marketingPagesInclude,
      orderBy: [{ pageType: "asc" }, { createdAt: "asc" }]
    });

    return pages.map(normalizeMarketingPage);
  }

  async saveMarketingPage(
    key: string,
    payload: SaveMarketingPageDto,
    auth: AuthenticatedRequestContext
  ) {
    const page = await this.prisma.$transaction(async (tx) => {
      const record = await tx.marketingPage.upsert({
        where: { key },
        update: {
          slug: payload.slug,
          title: payload.title,
          excerpt: payload.excerpt,
          description: payload.description,
          pageType: payload.pageType,
          publishStatus: payload.publishStatus ?? ContentStatus.PUBLISHED,
          seoTitle: payload.seoTitle,
          seoDescription: payload.seoDescription,
          heroImageUrl: payload.heroImageUrl,
          metadata: toNullableJsonInput(payload.metadata)
        },
        create: {
          key,
          slug: payload.slug,
          title: payload.title,
          excerpt: payload.excerpt,
          description: payload.description,
          pageType: payload.pageType,
          publishStatus: payload.publishStatus ?? ContentStatus.PUBLISHED,
          seoTitle: payload.seoTitle,
          seoDescription: payload.seoDescription,
          heroImageUrl: payload.heroImageUrl,
          metadata: toNullableJsonInput(payload.metadata)
        }
      });

      await tx.marketingPageSection.deleteMany({
        where: { pageId: record.id }
      });

      if (payload.sections.length > 0) {
        await tx.marketingPageSection.createMany({
          data: payload.sections.map((section, index) => ({
            pageId: record.id,
            sectionKey: section.sectionKey,
            eyebrow: section.eyebrow,
            title: section.title,
            body: section.body,
            variantKey: section.variantKey,
            payload: toNullableJsonInput(section.payload),
            sortOrder: section.sortOrder ?? (index + 1) * 10,
            isActive: section.isActive ?? true,
            publishStatus: section.publishStatus ?? ContentStatus.PUBLISHED
          }))
        });
      }

      await recordAuditLog(tx, auth, {
        action: "cms.marketing-page.save",
        entityType: "MarketingPage",
        entityId: record.id,
        summary: `Saved marketing page ${key}.`
      });

      const saved = await tx.marketingPage.findUnique({
        where: { id: record.id },
        include: marketingPagesInclude
      });

      if (!saved) {
        throw new NotFoundException("Saved marketing page could not be reloaded.");
      }

      return saved;
    });

    return normalizeMarketingPage(page);
  }

  async getStaffProfilesDocument() {
    const groups = await this.prisma.staffProfileGroup.findMany({
      include: staffGroupsInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return {
      groups: groups.map(normalizeStaffGroup)
    };
  }

  async saveStaffProfilesDocument(
    payload: SaveStaffProfilesDocumentDto,
    auth: AuthenticatedRequestContext
  ) {
    const groups = await this.prisma.$transaction(async (tx) => {
      await tx.staffProfile.deleteMany();
      await tx.staffProfileGroup.deleteMany();

      for (let groupIndex = 0; groupIndex < payload.groups.length; groupIndex += 1) {
        const group = payload.groups[groupIndex];
        const record = await tx.staffProfileGroup.create({
          data: {
            key: group.key,
            label: group.label,
            eyebrow: group.eyebrow,
            description: group.description,
            sortOrder: group.sortOrder ?? (groupIndex + 1) * 10,
            publishStatus: group.publishStatus ?? ContentStatus.PUBLISHED
          }
        });

        if (group.profiles.length > 0) {
          await tx.staffProfile.createMany({
            data: group.profiles.map((profile, profileIndex) => ({
              groupId: record.id,
              slug: profile.slug,
              fullName: profile.fullName,
              title: profile.title,
              city: profile.city,
              biography: profile.biography,
              photoUrl: profile.photoUrl,
              sortOrder: profile.sortOrder ?? (profileIndex + 1) * 10,
              publishStatus: profile.publishStatus ?? ContentStatus.PUBLISHED
            }))
          });
        }
      }

      await recordAuditLog(tx, auth, {
        action: "cms.staff-profiles.save",
        entityType: "StaffProfileGroup",
        entityId: "all",
        summary: "Saved academic staff groups and profiles."
      });

      return tx.staffProfileGroup.findMany({
        include: staffGroupsInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      });
    });

    return {
      groups: groups.map(normalizeStaffGroup)
    };
  }

  async getSuccessStoriesDocument() {
    const stories = await this.prisma.successStory.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return {
      stories
    };
  }

  async saveSuccessStoriesDocument(
    payload: SaveSuccessStoriesDocumentDto,
    auth: AuthenticatedRequestContext
  ) {
    const stories = await this.prisma.$transaction(async (tx) => {
      await tx.successStory.deleteMany();

      if (payload.stories.length > 0) {
        await tx.successStory.createMany({
          data: payload.stories.map((story, index) => ({
            slug: story.slug,
            studentName: story.studentName,
            city: story.city,
            examLabel: story.examLabel,
            resultTitle: story.resultTitle,
            highlight: story.highlight,
            story: story.story,
            avatarUrl: story.avatarUrl,
            isFeatured: story.isFeatured ?? false,
            sortOrder: story.sortOrder ?? (index + 1) * 10,
            publishStatus: story.publishStatus ?? ContentStatus.PUBLISHED
          }))
        });
      }

      await recordAuditLog(tx, auth, {
        action: "cms.success-stories.save",
        entityType: "SuccessStory",
        entityId: "all",
        summary: "Saved success stories."
      });

      return tx.successStory.findMany({
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      });
    });

    return {
      stories
    };
  }

  async getFreeMaterialsDocument() {
    const [categories, countdownPages] = await Promise.all([
      this.prisma.freeMaterialCategory.findMany({
        include: freeMaterialCategoriesInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }),
      this.prisma.countdownPage.findMany({
        include: countdownPagesInclude,
        orderBy: [{ createdAt: "asc" }]
      })
    ]);

    return normalizeFreeMaterialsDocument(categories, countdownPages);
  }

  async saveFreeMaterialsDocument(
    payload: SaveFreeMaterialsDocumentDto,
    auth: AuthenticatedRequestContext
  ) {
    const document = await this.prisma.$transaction(async (tx) => {
      await tx.freeMaterialItem.deleteMany();
      await tx.freeMaterialCategory.deleteMany();
      await tx.countdownTarget.deleteMany();
      await tx.countdownOfficialLink.deleteMany();
      await tx.countdownArticleSection.deleteMany();
      await tx.countdownPage.deleteMany();

      const countdownIdBySlug = new Map<string, string>();

      for (const countdownPage of payload.countdownPages) {
        const record = await createCountdownPage(tx, countdownPage);
        countdownIdBySlug.set(record.slug, record.id);
      }

      for (let categoryIndex = 0; categoryIndex < payload.categories.length; categoryIndex += 1) {
        const category = payload.categories[categoryIndex];
        const categoryRecord = await tx.freeMaterialCategory.create({
          data: {
            key: category.key,
            label: category.label,
            description: category.description,
            sortOrder: category.sortOrder ?? (categoryIndex + 1) * 10,
            publishStatus: category.publishStatus ?? ContentStatus.PUBLISHED
          }
        });

        if (category.items.length > 0) {
          for (let itemIndex = 0; itemIndex < category.items.length; itemIndex += 1) {
            const item = category.items[itemIndex];

            await tx.freeMaterialItem.create({
              data: {
                categoryId: categoryRecord.id,
                slug: item.slug,
                title: item.title,
                itemType: item.itemType,
                badgeLabel: item.badgeLabel,
                summary: item.summary,
                href: item.href,
                buttonLabel: item.buttonLabel,
                opensInNewTab: item.opensInNewTab ?? false,
                sortOrder: item.sortOrder ?? (itemIndex + 1) * 10,
                isFeatured: item.isFeatured ?? false,
                publishStatus: item.publishStatus ?? ContentStatus.PUBLISHED,
                countdownPageId: item.countdownPageSlug
                  ? countdownIdBySlug.get(item.countdownPageSlug)
                  : undefined
              }
            });
          }
        }
      }

      await recordAuditLog(tx, auth, {
        action: "cms.free-materials.save",
        entityType: "FreeMaterialCategory",
        entityId: "all",
        summary: "Saved free materials and countdown pages."
      });

      const [categories, countdownPages] = await Promise.all([
        tx.freeMaterialCategory.findMany({
          include: freeMaterialCategoriesInclude,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }),
        tx.countdownPage.findMany({
          include: countdownPagesInclude,
          orderBy: [{ createdAt: "asc" }]
        })
      ]);

      return normalizeFreeMaterialsDocument(categories, countdownPages);
    });

    return document;
  }
}

async function createNavigationItems(
  tx: TransactionClient,
  menuId: string,
  items: readonly SaveNavigationMenuItemDto[],
  parentId?: string
) {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const record = await tx.navigationMenuItem.create({
      data: {
        menuId,
        parentId,
        itemKey: item.itemKey,
        label: item.label,
        href: item.href,
        description: item.description,
        target: item.target,
        isActive: item.isActive ?? true,
        sortOrder: item.sortOrder ?? (index + 1) * 10
      }
    });

    if (item.children?.length) {
      await createNavigationItems(tx, menuId, item.children, record.id);
    }
  }
}

async function createCountdownPage(tx: TransactionClient, page: SaveCountdownPageDto) {
  const record = await tx.countdownPage.create({
    data: {
      slug: page.slug,
      eyebrow: page.eyebrow,
      title: page.title,
      description: page.description,
      updatedLabel: page.updatedLabel,
      videoTitle: page.videoTitle,
      videoNote: page.videoNote,
      publishStatus: page.publishStatus ?? ContentStatus.PUBLISHED
    }
  });

  if (page.targets.length > 0) {
    await tx.countdownTarget.createMany({
      data: page.targets.map((target, index) => ({
        countdownPageId: record.id,
        label: target.label,
        targetAt: target.targetAt ? new Date(target.targetAt) : null,
        dateLabel: target.dateLabel,
        note: target.note,
        sortOrder: target.sortOrder ?? (index + 1) * 10
      }))
    });
  }

  if (page.officialLinks.length > 0) {
    await tx.countdownOfficialLink.createMany({
      data: page.officialLinks.map((link, index) => ({
        countdownPageId: record.id,
        title: link.title,
        linkType: link.linkType,
        summary: link.summary,
        href: link.href,
        buttonLabel: link.buttonLabel,
        sortOrder: link.sortOrder ?? (index + 1) * 10
      }))
    });
  }

  if (page.articleSections.length > 0) {
    await tx.countdownArticleSection.createMany({
      data: page.articleSections.map((section, index) => ({
        countdownPageId: record.id,
        title: section.title,
        body: section.body,
        sortOrder: section.sortOrder ?? (index + 1) * 10
      }))
    });
  }

  return record;
}

function normalizeNavigationMenu(menu: NavigationMenuWithItems) {
  return {
    id: menu.id,
    key: menu.key,
    name: menu.name,
    location: menu.location,
    description: menu.description,
    isActive: menu.isActive,
    items: buildNavigationTree(menu.items)
  };
}

type NavigationTreeNode = {
  id: string;
  itemKey: string;
  label: string;
  href: string;
  description: string | null;
  target: string | null;
  sortOrder: number;
  isActive: boolean;
  children: NavigationTreeNode[];
};

function buildNavigationTree(
  items: NavigationMenuWithItems["items"],
  parentId: string | null = null
): NavigationTreeNode[] {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      id: item.id,
      itemKey: item.itemKey,
      label: item.label,
      href: item.href,
      description: item.description,
      target: item.target,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      children: buildNavigationTree(items, item.id)
    }));
}

function toNullableJsonInput(
  value?: Record<string, unknown> | null
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function normalizeMarketingPage(page: MarketingPageWithSections) {
  return {
    id: page.id,
    key: page.key,
    slug: page.slug,
    title: page.title,
    excerpt: page.excerpt,
    description: page.description,
    pageType: page.pageType,
    publishStatus: page.publishStatus,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    heroImageUrl: page.heroImageUrl,
    metadata: page.metadata,
    sections: page.sections.map((section) => ({
      id: section.id,
      sectionKey: section.sectionKey,
      eyebrow: section.eyebrow,
      title: section.title,
      body: section.body,
      variantKey: section.variantKey,
      payload: section.payload,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
      publishStatus: section.publishStatus
    }))
  };
}

function normalizeStaffGroup(group: StaffGroupWithProfiles) {
  return {
    id: group.id,
    key: group.key,
    label: group.label,
    eyebrow: group.eyebrow,
    description: group.description,
    sortOrder: group.sortOrder,
    publishStatus: group.publishStatus,
    profiles: group.profiles.map((profile) => ({
      id: profile.id,
      slug: profile.slug,
      fullName: profile.fullName,
      title: profile.title,
      city: profile.city,
      biography: profile.biography,
      photoUrl: profile.photoUrl,
      sortOrder: profile.sortOrder,
      publishStatus: profile.publishStatus
    }))
  };
}

function normalizeFreeMaterialsDocument(
  categories: readonly FreeMaterialCategoryWithItems[],
  countdownPages: readonly CountdownPageWithChildren[]
) {
  return {
    categories: categories.map((category) => ({
      id: category.id,
      key: category.key,
      label: category.label,
      description: category.description,
      sortOrder: category.sortOrder,
      publishStatus: category.publishStatus,
      items: category.items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        itemType: item.itemType,
        badgeLabel: item.badgeLabel,
        summary: item.summary,
        href: item.href,
        buttonLabel: item.buttonLabel,
        opensInNewTab: item.opensInNewTab,
        sortOrder: item.sortOrder,
        isFeatured: item.isFeatured,
        publishStatus: item.publishStatus,
        countdownPageSlug: item.countdownPage?.slug ?? null
      }))
    })),
    countdownPages: countdownPages.map((page) => ({
      id: page.id,
      slug: page.slug,
      eyebrow: page.eyebrow,
      title: page.title,
      description: page.description,
      updatedLabel: page.updatedLabel,
      videoTitle: page.videoTitle,
      videoNote: page.videoNote,
      publishStatus: page.publishStatus,
      targets: page.targets.map((target) => ({
        id: target.id,
        label: target.label,
        targetAt: target.targetAt?.toISOString() ?? null,
        dateLabel: target.dateLabel,
        note: target.note,
        sortOrder: target.sortOrder
      })),
      officialLinks: page.officialLinks.map((link) => ({
        id: link.id,
        title: link.title,
        linkType: link.linkType,
        summary: link.summary,
        href: link.href,
        buttonLabel: link.buttonLabel,
        sortOrder: link.sortOrder
      })),
      articleSections: page.articleSections.map((section) => ({
        id: section.id,
        title: section.title,
        body: section.body,
        sortOrder: section.sortOrder
      }))
    }))
  };
}

async function recordAuditLog(
  tx: TransactionClient,
  auth: AuthenticatedRequestContext,
  payload: {
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
  }
) {
  if (!auth.actorId || !auth.permissionKeys.includes(PERMISSION_KEYS.cmsManage)) {
    return;
  }

  await tx.auditLog.create({
    data: {
      actorType: AuditActorType.STAFF_USER,
      staffUserId: auth.actorId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      summary: payload.summary
    }
  });
}
