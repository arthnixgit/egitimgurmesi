import {
  AnnouncementAudience,
  AnnouncementStatus,
  ClassGroupStudentStatus,
  LiveSessionStatus
} from "@ega/db";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength
} from "class-validator";

export class ListOperationalQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  classGroupId?: string;

  @IsOptional()
  @IsEnum(LiveSessionStatus)
  status?: LiveSessionStatus;
}

export class AddClassGroupStudentDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsEnum(ClassGroupStudentStatus)
  status?: ClassGroupStudentStatus;
}

export class AssignClassGroupStaffDto {
  @IsString()
  staffUserId!: string;
}

export class CreateLiveSessionDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  classGroupId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  instructorStaffUserId?: string;

  @IsOptional()
  @IsString()
  coachStaffUserId?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  participantUserIds?: string[];
}

export class UpdateLiveSessionStatusDto {
  @IsEnum(LiveSessionStatus)
  status!: LiveSessionStatus;
}

export class CreateAnnouncementDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MaxLength(3000)
  body!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  classGroupId?: string;

  @IsOptional()
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;

  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class CreateCoachingPlanDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  coachStaffUserId?: string;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  summary?: string;

  @IsOptional()
  @IsDateString()
  weekStartsAt?: string;

  @IsOptional()
  @IsDateString()
  weekEndsAt?: string;
}

export class CreateCoachingNoteDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  coachStaffUserId?: string;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MaxLength(3000)
  body!: string;

  @IsOptional()
  @IsDateString()
  followUpAt?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
