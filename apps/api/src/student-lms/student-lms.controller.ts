import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentAuth } from "../auth/current-auth.decorator";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { StudentLmsService } from "./student-lms.service";

@Controller("lms")
@UseGuards(AccessTokenGuard)
export class StudentLmsController {
  constructor(private readonly studentLmsService: StudentLmsService) {}

  @Get("my-courses")
  listMyCourses(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.studentLmsService.listMyCourses(auth);
  }

  @Get("my-operational-overview")
  getMyOperationalOverview(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.studentLmsService.getMyOperationalOverview(auth);
  }

  @Get("my-courses/:courseSlug")
  getMyCourse(
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Param("courseSlug") courseSlug: string,
    @Query("lesson") lessonSlug?: string
  ) {
    return this.studentLmsService.getMyCourse(auth, courseSlug, lessonSlug);
  }
}
