import { Controller, Get, Param, Query } from "@nestjs/common";
import { PublicContentService } from "./public-content.service";

@Controller("public")
export class PublicContentController {
  constructor(private readonly publicContentService: PublicContentService) {}

  @Get("site-settings")
  siteSettings(@Query("key") key?: string) {
    return this.publicContentService.getSiteSettings(key ?? "default");
  }

  @Get("navigation")
  navigation(@Query("key") key?: string) {
    return this.publicContentService.getNavigationMenu(key ?? "primary");
  }

  @Get("pages/:slug")
  page(@Param("slug") slug: string) {
    return this.publicContentService.getMarketingPage(slug);
  }

  @Get("academic-staff")
  academicStaff() {
    return this.publicContentService.listStaffProfileGroups();
  }

  @Get("success-stories")
  successStories() {
    return this.publicContentService.listSuccessStories();
  }

  @Get("free-materials")
  freeMaterials() {
    return this.publicContentService.listFreeMaterials();
  }

  @Get("countdown-pages/:slug")
  countdownPage(@Param("slug") slug: string) {
    return this.publicContentService.getCountdownPage(slug);
  }
}
