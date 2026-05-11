import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards
} from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentAuth } from "../auth/current-auth.decorator";
import { StaffOnly, RequirePermissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { AdminContentService } from "./admin-content.service";
import {
  SaveFreeMaterialsDocumentDto,
  SaveMarketingPageDto,
  SaveNavigationMenuDto,
  SaveStaffProfilesDocumentDto,
  SaveSuccessStoriesDocumentDto
} from "./dto/admin-content.dto";

@Controller("admin-content")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
@RequirePermissions(PERMISSION_KEYS.cmsManage)
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get("navigation/:key")
  getNavigationMenu(@Param("key") key: string) {
    return this.adminContentService.getNavigationMenu(key);
  }

  @Put("navigation/:key")
  saveNavigationMenu(
    @Param("key") key: string,
    @Body() payload: SaveNavigationMenuDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.saveNavigationMenu(key, payload, auth);
  }

  @Get("marketing-pages")
  listMarketingPages() {
    return this.adminContentService.listMarketingPages();
  }

  @Put("marketing-pages/:key")
  saveMarketingPage(
    @Param("key") key: string,
    @Body() payload: SaveMarketingPageDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.saveMarketingPage(key, payload, auth);
  }

  @Get("staff-profiles")
  getStaffProfilesDocument() {
    return this.adminContentService.getStaffProfilesDocument();
  }

  @Put("staff-profiles")
  saveStaffProfilesDocument(
    @Body() payload: SaveStaffProfilesDocumentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.saveStaffProfilesDocument(payload, auth);
  }

  @Get("success-stories")
  getSuccessStoriesDocument() {
    return this.adminContentService.getSuccessStoriesDocument();
  }

  @Put("success-stories")
  saveSuccessStoriesDocument(
    @Body() payload: SaveSuccessStoriesDocumentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.saveSuccessStoriesDocument(payload, auth);
  }

  @Get("free-materials")
  getFreeMaterialsDocument() {
    return this.adminContentService.getFreeMaterialsDocument();
  }

  @Put("free-materials")
  saveFreeMaterialsDocument(
    @Body() payload: SaveFreeMaterialsDocumentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.saveFreeMaterialsDocument(payload, auth);
  }
}
