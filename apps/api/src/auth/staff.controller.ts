import { Body, Controller, Get, Headers, Ip, Post, UseGuards } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { CurrentAuth } from "./current-auth.decorator";
import type { AuthenticatedRequestContext } from "./auth.types";
import { AccessTokenGuard } from "./access-token.guard";
import { BootstrapStaffDto } from "./dto/bootstrap-staff.dto";
import { PermissionsGuard } from "./permissions.guard";
import { RequirePermissions, StaffOnly } from "./permissions.decorator";
import { StaffBootstrapService } from "./staff-bootstrap.service";

@Controller("staff")
export class StaffController {
  constructor(private readonly staffBootstrapService: StaffBootstrapService) {}

  @Get("bootstrap-status")
  bootstrapStatus() {
    return this.staffBootstrapService.getBootstrapStatus();
  }

  @Post("bootstrap")
  bootstrap(
    @Body() dto: BootstrapStaffDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.staffBootstrapService.bootstrap(dto, {
      ipAddress,
      userAgent
    });
  }

  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @StaffOnly()
  @RequirePermissions(PERMISSION_KEYS.dashboardRead)
  @Get("overview")
  overview(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return {
      actorType: auth.actorType,
      actorId: auth.actorId,
      roleKeys: auth.roleKeys,
      permissionKeys: auth.permissionKeys
    };
  }
}
