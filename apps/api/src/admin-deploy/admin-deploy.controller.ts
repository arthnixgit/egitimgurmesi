import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { AccessTokenGuard } from "../auth/access-token.guard";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/current-auth.decorator";
import { RequirePermissions, StaffOnly } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AdminDeployService } from "./admin-deploy.service";
import { TriggerDeploymentDto } from "./dto/trigger-deployment.dto";

@Controller("admin-deploy")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
@RequirePermissions(PERMISSION_KEYS.maintenanceManage)
export class AdminDeployController {
  constructor(private readonly adminDeployService: AdminDeployService) {}

  @Get("status")
  getStatus() {
    return this.adminDeployService.getStatus();
  }

  @Post("trigger")
  triggerDeployment(
    @Body() dto: TriggerDeploymentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminDeployService.triggerDeployment(dto, auth);
  }
}
