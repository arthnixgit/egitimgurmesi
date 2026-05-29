import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { AccessTokenGuard } from "../auth/access-token.guard";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/current-auth.decorator";
import { RequirePermissions, StaffOnly } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AdminEngagementService } from "./admin-engagement.service";
import { ListLeadsDto, UpdateLeadStatusDto } from "./dto/admin-engagement.dto";

@Controller("admin-engagement")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
@RequirePermissions(PERMISSION_KEYS.whatsappRead)
export class AdminEngagementController {
  constructor(private readonly adminEngagementService: AdminEngagementService) {}

  @Get("leads")
  listLeads(@Query() query: ListLeadsDto) {
    return this.adminEngagementService.listLeads(query);
  }

  @Get("leads/:leadId")
  getLead(@Param("leadId") leadId: string) {
    return this.adminEngagementService.getLead(leadId);
  }

  @Patch("leads/:leadId/status")
  updateLeadStatus(
    @Param("leadId") leadId: string,
    @Body() payload: UpdateLeadStatusDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminEngagementService.updateLeadStatus(leadId, payload, auth);
  }
}
