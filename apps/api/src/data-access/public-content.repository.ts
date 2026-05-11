import { ContentStatus, Prisma } from "@ega/db";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const marketingPageInclude = {
  sections: {
    where: {
      isActive: true,
      publishStatus: ContentStatus.PUBLISHED
    },
    orderBy: {
      sortOrder: "asc"
    }
  }
} satisfies Prisma.MarketingPageInclude;

const staffGroupInclude = {
  profiles: {
    where: {
      publishStatus: ContentStatus.PUBLISHED
    },
    orderBy: {
      sortOrder: "asc"
    }
  }
} satisfies Prisma.StaffProfileGroupInclude;

const freeMaterialCategoryInclude = {
  items: {
    where: {
      publishStatus: ContentStatus.PUBLISHED
    },
    orderBy: {
      sortOrder: "asc"
    },
    include: {
      countdownPage: {
        select: {
          slug: true,
          title: true,
          updatedLabel: true
        }
      }
    }
  }
} satisfies Prisma.FreeMaterialCategoryInclude;

const countdownPageInclude = {
  targets: {
    orderBy: {
      sortOrder: "asc"
    }
  },
  officialLinks: {
    orderBy: {
      sortOrder: "asc"
    }
  },
  articleSections: {
    orderBy: {
      sortOrder: "asc"
    }
  }
} satisfies Prisma.CountdownPageInclude;

@Injectable()
export class PublicContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  getSiteSetting(key: string) {
    return this.prisma.siteSetting.findUnique({
      where: { key }
    });
  }

  getNavigationMenu(key: string) {
    return this.prisma.navigationMenu.findUnique({
      where: { key },
      include: {
        items: {
          where: {
            isActive: true
          },
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "asc" }
          ]
        }
      }
    });
  }

  getMarketingPageBySlug(slug: string) {
    return this.prisma.marketingPage.findFirst({
      where: {
        slug,
        publishStatus: ContentStatus.PUBLISHED
      },
      include: marketingPageInclude
    });
  }

  listStaffProfileGroups() {
    return this.prisma.staffProfileGroup.findMany({
      where: {
        publishStatus: ContentStatus.PUBLISHED
      },
      include: staffGroupInclude,
      orderBy: {
        sortOrder: "asc"
      }
    });
  }

  listSuccessStories() {
    return this.prisma.successStory.findMany({
      where: {
        publishStatus: ContentStatus.PUBLISHED
      },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }]
    });
  }

  listFreeMaterialCategories() {
    return this.prisma.freeMaterialCategory.findMany({
      where: {
        publishStatus: ContentStatus.PUBLISHED
      },
      include: freeMaterialCategoryInclude,
      orderBy: {
        sortOrder: "asc"
      }
    });
  }

  getCountdownPageBySlug(slug: string) {
    return this.prisma.countdownPage.findFirst({
      where: {
        slug,
        publishStatus: ContentStatus.PUBLISHED
      },
      include: countdownPageInclude
    });
  }
}
