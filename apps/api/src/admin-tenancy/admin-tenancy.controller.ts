import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { AccessTokenGuard } from "../auth/access-token.guard";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/current-auth.decorator";
import { RequirePermissions, StaffOnly } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { BranchScopeGuard, TenantScopeGuard } from "../auth/scope.guard";
import { AdminTenancyService } from "./admin-tenancy.service";
import {
  AddStudentToBranchDto,
  AssignStaffToBranchDto,
  CreateBranchDto,
  CreateClassGroupDto,
  CreateEducationCenterDto,
  CreateOrganizationDto,
  ListStaffQueryDto,
  ListStudentsQueryDto,
  UpdateBranchDto,
  UpdateBranchStaffAssignmentDto,
  UpdateClassGroupDto,
  UpdateEducationCenterDto,
  UpdateOrganizationDto,
  UpdateStudentMembershipDto
} from "./dto/admin-tenancy.dto";

@Controller("admin-tenancy")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
export class AdminTenancyController {
  constructor(private readonly adminTenancyService: AdminTenancyService) {}

  @Get("scope")
  @RequirePermissions(PERMISSION_KEYS.branchesRead)
  getScope(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminTenancyService.getScopeOverview(auth);
  }

  @Get("overview")
  @RequirePermissions(PERMISSION_KEYS.branchesRead)
  getOverview(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminTenancyService.getOverview(auth);
  }

  @Get("beta-readiness")
  @RequirePermissions(PERMISSION_KEYS.branchesRead)
  getBetaReadiness(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminTenancyService.getBetaReadiness(auth);
  }

  @Get("students")
  @RequirePermissions(PERMISSION_KEYS.assignmentsRead)
  listStudents(
    @Query() query: ListStudentsQueryDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.listStudents(query, auth);
  }

  @Get("staff")
  @RequirePermissions(PERMISSION_KEYS.assignmentsRead)
  listStaff(@Query() query: ListStaffQueryDto, @CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminTenancyService.listStaff(query, auth);
  }

  @Get("organizations")
  @RequirePermissions(PERMISSION_KEYS.organizationsRead)
  listOrganizations(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminTenancyService.listOrganizations(auth);
  }

  @Post("organizations")
  @RequirePermissions(PERMISSION_KEYS.organizationsManage)
  createOrganization(
    @Body() dto: CreateOrganizationDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.createOrganization(dto, auth);
  }

  @Patch("organizations/:organizationId")
  @UseGuards(TenantScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.organizationsManage)
  updateOrganization(
    @Param("organizationId") organizationId: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.updateOrganization(organizationId, dto, auth);
  }

  @Get("organizations/:organizationId/education-centers")
  @UseGuards(TenantScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.organizationsRead)
  listEducationCenters(
    @Param("organizationId") organizationId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.listEducationCenters(organizationId, auth);
  }

  @Post("organizations/:organizationId/education-centers")
  @UseGuards(TenantScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.organizationsManage)
  createEducationCenter(
    @Param("organizationId") organizationId: string,
    @Body() dto: CreateEducationCenterDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.createEducationCenter(organizationId, dto, auth);
  }

  @Patch("education-centers/:centerId")
  @RequirePermissions(PERMISSION_KEYS.organizationsManage)
  updateEducationCenter(
    @Param("centerId") centerId: string,
    @Body() dto: UpdateEducationCenterDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.updateEducationCenter(centerId, dto, auth);
  }

  @Get("branches")
  @RequirePermissions(PERMISSION_KEYS.branchesRead)
  listBranches(
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Query("organizationId") organizationId?: string
  ) {
    return this.adminTenancyService.listBranches(auth, organizationId);
  }

  @Post("organizations/:organizationId/branches")
  @UseGuards(TenantScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.branchesManage)
  createBranch(
    @Param("organizationId") organizationId: string,
    @Body() dto: CreateBranchDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.createBranch(organizationId, dto, auth);
  }

  @Patch("branches/:branchId")
  @UseGuards(BranchScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.branchesManage)
  updateBranch(
    @Param("branchId") branchId: string,
    @Body() dto: UpdateBranchDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.updateBranch(branchId, dto, auth);
  }

  @Post("branches/:branchId/staff-assignments")
  @UseGuards(BranchScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.assignmentsManage)
  assignStaffToBranch(
    @Param("branchId") branchId: string,
    @Body() dto: AssignStaffToBranchDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.assignStaffToBranch(branchId, dto, auth);
  }

  @Get("branches/:branchId/staff-assignments")
  @UseGuards(BranchScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.assignmentsRead)
  listBranchStaffAssignments(
    @Param("branchId") branchId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.listBranchStaffAssignments(branchId, auth);
  }

  @Patch("branch-staff-assignments/:assignmentId")
  @RequirePermissions(PERMISSION_KEYS.assignmentsManage)
  updateBranchStaffAssignment(
    @Param("assignmentId") assignmentId: string,
    @Body() dto: UpdateBranchStaffAssignmentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.updateBranchStaffAssignment(assignmentId, dto, auth);
  }

  @Post("branches/:branchId/student-memberships")
  @UseGuards(BranchScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.assignmentsManage)
  addStudentToBranch(
    @Param("branchId") branchId: string,
    @Body() dto: AddStudentToBranchDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.addStudentToBranch(branchId, dto, auth);
  }

  @Get("branches/:branchId/student-memberships")
  @UseGuards(BranchScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.assignmentsRead)
  listBranchStudentMemberships(
    @Param("branchId") branchId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.listBranchStudentMemberships(branchId, auth);
  }

  @Patch("student-memberships/:membershipId")
  @RequirePermissions(PERMISSION_KEYS.assignmentsManage)
  updateStudentMembership(
    @Param("membershipId") membershipId: string,
    @Body() dto: UpdateStudentMembershipDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.updateStudentMembership(membershipId, dto, auth);
  }

  @Get("branches/:branchId/class-groups")
  @UseGuards(BranchScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.classesRead)
  listClassGroups(
    @Param("branchId") branchId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.listClassGroups(branchId, auth);
  }

  @Post("branches/:branchId/class-groups")
  @UseGuards(BranchScopeGuard)
  @RequirePermissions(PERMISSION_KEYS.classesManage)
  createClassGroup(
    @Param("branchId") branchId: string,
    @Body() dto: CreateClassGroupDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.createClassGroup(branchId, dto, auth);
  }

  @Patch("class-groups/:classGroupId")
  @RequirePermissions(PERMISSION_KEYS.classesManage)
  updateClassGroup(
    @Param("classGroupId") classGroupId: string,
    @Body() dto: UpdateClassGroupDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminTenancyService.updateClassGroup(classGroupId, dto, auth);
  }
}
