import { Controller, Get, Header, Param, Query } from "@nestjs/common";
import { PublicContentService } from "./public-content.service";

@Controller("public")
export class PublicContentController {
  constructor(private readonly publicContentService: PublicContentService) {}

  @Get("site-settings")
  @Header("Cache-Control", "no-store")
  siteSettings(@Query("key") key?: string) {
    return this.publicContentService.getSiteSettings(key ?? "default");
  }

  @Get("navigation")
  @Header("Cache-Control", "no-store")
  navigation(@Query("key") key?: string) {
    return this.publicContentService.getNavigationMenu(key ?? "primary");
  }

  @Get("pages/:slug")
  @Header("Cache-Control", "no-store")
  page(@Param("slug") slug: string) {
    return this.publicContentService.getMarketingPage(slug);
  }

  @Get("academic-staff")
  @Header("Cache-Control", "no-store")
  academicStaff() {
    return this.publicContentService.listStaffProfileGroups();
  }

  @Get("success-stories")
  @Header("Cache-Control", "no-store")
  successStories() {
    return this.publicContentService.listSuccessStories();
  }

  @Get("free-materials")
  @Header("Cache-Control", "no-store")
  freeMaterials() {
    return this.publicContentService.listFreeMaterials();
  }

  @Get("countdown-pages/:slug")
  @Header("Cache-Control", "no-store")
  countdownPage(@Param("slug") slug: string) {
    return this.publicContentService.getCountdownPage(slug);
  }
}
