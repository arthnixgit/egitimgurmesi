import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { AccessTokenGuard } from "../auth/access-token.guard";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/current-auth.decorator";
import { RequirePermissions, StaffOnly } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { OperationsService } from "./operations.service";
import {
  AddClassGroupStudentDto,
  AssignClassGroupStaffDto,
  CreateAnnouncementDto,
  CreateCoachingNoteDto,
  CreateCoachingPlanDto,
  CreateLiveSessionDto,
  ListOperationalQueryDto,
  UpdateLiveSessionStatusDto
} from "./dto/operations.dto";

@Controller("operations")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
@RequirePermissions(PERMISSION_KEYS.dashboardRead)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get("staff-dashboard")
  getStaffDashboard(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.operationsService.getStaffDashboard(auth);
  }

  @Get("class-groups/:classGroupId/roster")
  getClassGroupRoster(
    @Param("classGroupId") classGroupId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.listClassGroupRoster(classGroupId, auth);
  }

  @Post("class-groups/:classGroupId/students")
  addStudentToClassGroup(
    @Param("classGroupId") classGroupId: string,
    @Body() dto: AddClassGroupStudentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.addStudentToClassGroup(classGroupId, dto, auth);
  }

  @Post("class-groups/:classGroupId/instructors")
  assignInstructorToClassGroup(
    @Param("classGroupId") classGroupId: string,
    @Body() dto: AssignClassGroupStaffDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.assignInstructorToClassGroup(classGroupId, dto, auth);
  }

  @Post("class-groups/:classGroupId/coaches")
  assignCoachToClassGroup(
    @Param("classGroupId") classGroupId: string,
    @Body() dto: AssignClassGroupStaffDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.assignCoachToClassGroup(classGroupId, dto, auth);
  }

  @Get("live-sessions")
  listLiveSessions(
    @Query() query: ListOperationalQueryDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.listLiveSessions(query, auth);
  }

  @Post("live-sessions")
  createLiveSession(
    @Body() dto: CreateLiveSessionDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.createLiveSession(dto, auth);
  }

  @Patch("live-sessions/:sessionId/status")
  updateLiveSessionStatus(
    @Param("sessionId") sessionId: string,
    @Body() dto: UpdateLiveSessionStatusDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.updateLiveSessionStatus(sessionId, dto, auth);
  }

  @Get("announcements")
  listAnnouncements(
    @Query() query: ListOperationalQueryDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.listAnnouncements(query, auth);
  }

  @Post("announcements")
  createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.createAnnouncement(dto, auth);
  }

  @Get("coaching-plans")
  listCoachingPlans(
    @Query() query: ListOperationalQueryDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.listCoachingPlans(query, auth);
  }

  @Post("coaching-plans")
  createCoachingPlan(
    @Body() dto: CreateCoachingPlanDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.createCoachingPlan(dto, auth);
  }

  @Post("coaching-notes")
  createCoachingNote(
    @Body() dto: CreateCoachingNoteDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.operationsService.createCoachingNote(dto, auth);
  }
}
