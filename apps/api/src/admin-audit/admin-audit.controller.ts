import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { AccessTokenGuard } from "../auth/access-token.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions, StaffOnly } from "../auth/permissions.decorator";
import { AdminAuditService } from "./admin-audit.service";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

@Controller("admin-audit")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
@RequirePermissions(PERMISSION_KEYS.auditRead)
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get("logs")
  listLogs(@Query() query: ListAuditLogsDto) {
    return this.adminAuditService.listLogs(query);
  }

  @Get("logs/:auditLogId")
  getLog(@Param("auditLogId") auditLogId: string) {
    return this.adminAuditService.getLog(auditLogId);
  }
}
