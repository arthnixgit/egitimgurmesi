import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { AccessTokenGuard } from "../auth/access-token.guard";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/current-auth.decorator";
import { RequirePermissions, StaffOnly } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AdminStaffService } from "./admin-staff.service";
import {
  CreateRoleDto,
  CreateStaffUserDto,
  UpdateRoleDto,
  UpdateStaffPasswordDto,
  UpdateStaffUserDto
} from "./dto/admin-staff.dto";

@Controller("admin-staff")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
export class AdminStaffController {
  constructor(private readonly adminStaffService: AdminStaffService) {}

  @Get("overview")
  @RequirePermissions(PERMISSION_KEYS.staffManage)
  overview() {
    return this.adminStaffService.getOverview();
  }

  @Get("users")
  @RequirePermissions(PERMISSION_KEYS.staffManage)
  listUsers() {
    return this.adminStaffService.listUsers();
  }

  @Post("users")
  @RequirePermissions(PERMISSION_KEYS.staffManage)
  createUser(@Body() dto: CreateStaffUserDto, @CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminStaffService.createUser(dto, auth);
  }

  @Patch("users/:staffUserId")
  @RequirePermissions(PERMISSION_KEYS.staffManage)
  updateUser(
    @Param("staffUserId") staffUserId: string,
    @Body() dto: UpdateStaffUserDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminStaffService.updateUser(staffUserId, dto, auth);
  }

  @Patch("users/:staffUserId/password")
  @RequirePermissions(PERMISSION_KEYS.staffManage)
  updateUserPassword(
    @Param("staffUserId") staffUserId: string,
    @Body() dto: UpdateStaffPasswordDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminStaffService.updateUserPassword(staffUserId, dto, auth);
  }

  @Get("roles")
  @RequirePermissions(PERMISSION_KEYS.rolesManage)
  listRoles() {
    return this.adminStaffService.listRoles();
  }

  @Post("roles")
  @RequirePermissions(PERMISSION_KEYS.rolesManage)
  createRole(@Body() dto: CreateRoleDto, @CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminStaffService.createRole(dto, auth);
  }

  @Patch("roles/:roleId")
  @RequirePermissions(PERMISSION_KEYS.rolesManage)
  updateRole(
    @Param("roleId") roleId: string,
    @Body() dto: UpdateRoleDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminStaffService.updateRole(roleId, dto, auth);
  }
}
