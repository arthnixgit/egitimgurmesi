import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  SaveSiteSettingsDto,
  SaveStaffProfilesDocumentDto,
  SaveSuccessStoriesDocumentDto
} from "./dto/admin-content.dto";

@Controller("admin-content")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
@RequirePermissions(PERMISSION_KEYS.websiteRead)
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get("site-settings")
  getSiteSettings(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminContentService.getSiteSettings(auth);
  }

  @Put("site-settings")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  saveSiteSettings(
    @Body() payload: SaveSiteSettingsDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.saveSiteSettings(payload, auth, "draft");
  }

  @Post("site-settings/publish")
  @RequirePermissions(PERMISSION_KEYS.websitePublish)
  publishSiteSettings(
    @Body() payload: SaveSiteSettingsDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.saveSiteSettings(payload, auth, "publish");
  }

  @Get("revisions")
  getRevisions(
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Query("entityType") entityType?: string,
    @Query("entityKey") entityKey?: string
  ) {
    return this.adminContentService.listRevisions(auth, { entityType, entityKey });
  }

  @Post("revisions/:revisionId/restore")
  @RequirePermissions(PERMISSION_KEYS.websitePublish)
  restoreRevision(
    @Param("revisionId") revisionId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.restoreRevision(revisionId, auth);
  }

  @Post("preview-token")
  getPreviewToken(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminContentService.createPreviewToken(auth);
  }

  @Get("navigation/:key")
  getNavigationMenu(
    @Param("key") key: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.getNavigationMenu(key, auth);
  }

  @Put("navigation/:key")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  saveNavigationMenu(
    @Param("key") key: string,
    @Body() payload: SaveNavigationMenuDto,
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Query("action") action?: string
  ) {
    return this.adminContentService.saveNavigationMenu(key, payload, auth, parseWebsiteAction(action));
  }

  @Get("marketing-pages")
  listMarketingPages(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminContentService.listMarketingPages(auth);
  }

  @Put("marketing-pages/:key")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  saveMarketingPage(
    @Param("key") key: string,
    @Body() payload: SaveMarketingPageDto,
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Query("action") action?: string
  ) {
    return this.adminContentService.saveMarketingPage(key, payload, auth, parseWebsiteAction(action));
  }

  @Get("staff-profiles")
  getStaffProfilesDocument(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminContentService.getStaffProfilesDocument(auth);
  }

  @Put("staff-profiles")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  saveStaffProfilesDocument(
    @Body() payload: SaveStaffProfilesDocumentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Query("action") action?: string
  ) {
    return this.adminContentService.saveStaffProfilesDocument(payload, auth, parseWebsiteAction(action));
  }

  @Get("success-stories")
  getSuccessStoriesDocument(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminContentService.getSuccessStoriesDocument(auth);
  }

  @Put("success-stories")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  saveSuccessStoriesDocument(
    @Body() payload: SaveSuccessStoriesDocumentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Query("action") action?: string
  ) {
    return this.adminContentService.saveSuccessStoriesDocument(payload, auth, parseWebsiteAction(action));
  }

  @Get("free-materials")
  getFreeMaterialsDocument(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminContentService.getFreeMaterialsDocument(auth);
  }

  @Put("free-materials")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  saveFreeMaterialsDocument(
    @Body() payload: SaveFreeMaterialsDocumentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Query("action") action?: string
  ) {
    return this.adminContentService.saveFreeMaterialsDocument(payload, auth, parseWebsiteAction(action));
  }

  @Post("free-materials/categories/:categoryKey/archive")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  archiveMaterialCategory(
    @Param("categoryKey") categoryKey: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.archiveMaterialCategory(categoryKey, auth);
  }

  @Post("free-materials/categories/:categoryKey/restore")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  restoreMaterialCategory(
    @Param("categoryKey") categoryKey: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.restoreMaterialCategory(categoryKey, auth);
  }

  @Delete("free-materials/categories/:categoryKey")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  deleteMaterialCategory(
    @Param("categoryKey") categoryKey: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.deleteMaterialCategory(categoryKey, auth);
  }

  @Post("free-materials/items/:itemIdOrSlug/archive")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  archiveMaterialCard(
    @Param("itemIdOrSlug") itemIdOrSlug: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.archiveMaterialCard(itemIdOrSlug, auth);
  }

  @Post("free-materials/items/:itemIdOrSlug/restore")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  restoreMaterialCard(
    @Param("itemIdOrSlug") itemIdOrSlug: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.restoreMaterialCard(itemIdOrSlug, auth);
  }

  @Delete("free-materials/items/:itemIdOrSlug")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  deleteMaterialCard(
    @Param("itemIdOrSlug") itemIdOrSlug: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.deleteMaterialCard(itemIdOrSlug, auth);
  }

  @Patch("free-materials/items/:itemIdOrSlug/move")
  @RequirePermissions(PERMISSION_KEYS.websiteManage)
  moveMaterialCard(
    @Param("itemIdOrSlug") itemIdOrSlug: string,
    @Body() payload: { direction?: -1 | 1 },
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminContentService.moveMaterialCard(itemIdOrSlug, payload.direction === -1 ? -1 : 1, auth);
  }
}

function parseWebsiteAction(action?: string) {
  return action === "publish" ? "publish" : "draft";
}
