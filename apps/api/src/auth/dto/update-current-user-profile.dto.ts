import type { GradeLevel, StudyTrack } from "@ega/db";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";
import { GRADE_LEVEL_VALUES, STUDY_TRACK_VALUES } from "./student-profile-enum-values";

export class UpdateCurrentUserProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsEnum(GRADE_LEVEL_VALUES)
  gradeLevel?: GradeLevel;

  @IsOptional()
  @IsEnum(STUDY_TRACK_VALUES)
  studyTrack?: StudyTrack;

  @IsOptional()
  @IsString()
  schoolName?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null || value === "" ? undefined : Number(value)))
  @IsInt()
  @Min(2025)
  targetExamYear?: number;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  marketingConsent?: boolean;
}
