import { Controller, Get, Header, Param, Query, Res } from "@nestjs/common";
import type { Response } from "express";
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

  @Get("free-materials/:itemId/download")
  @Header("Cache-Control", "no-store")
  async downloadFreeMaterial(
    @Param("itemId") itemId: string,
    @Res() response: Response
  ) {
    const download = await this.publicContentService.resolveFreeMaterialDownload(itemId);

    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFilename(download.filename)}"; filename*=UTF-8''${encodeURIComponent(
        download.filename
      )}`
    );

    if (download.contentType) {
      response.setHeader("Content-Type", download.contentType);
    }

    if (download.contentLength) {
      response.setHeader("Content-Length", String(download.contentLength));
    }

    if (download.kind === "local") {
      return response.sendFile(download.filePath);
    }

    return response.send(download.data);
  }

  @Get("countdown-pages/:slug")
  @Header("Cache-Control", "no-store")
  countdownPage(@Param("slug") slug: string) {
    return this.publicContentService.getCountdownPage(slug);
  }
}

function asciiFilename(value: string) {
  return value.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
}
