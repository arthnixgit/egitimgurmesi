import {
  BranchMembershipStatus,
  BranchStatus,
  ClassGroupStatus,
  GradeLevel,
  OrganizationStatus,
  StaffBranchRole,
  StudyTrack
} from "@ega/db";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min
} from "class-validator";

export class CreateOrganizationDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxNumber?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(220)
  supportEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  supportPhone?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  legalName?: string | null;

  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxNumber?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(220)
  supportEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  supportPhone?: string | null;
}

export class CreateEducationCenterDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  centerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(220)
  email?: string;
}

export class UpdateEducationCenterDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  legalName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  centerType?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(220)
  email?: string | null;

  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}

export class CreateBranchDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  educationCenterId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(220)
  email?: string;
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  educationCenterId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(220)
  email?: string | null;

  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}

export class AssignStaffToBranchDto {
  @IsString()
  staffUserId!: string;

  @IsEnum(StaffBranchRole)
  roleKey!: StaffBranchRole;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class AddStudentToBranchDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsEnum(BranchMembershipStatus)
  status?: BranchMembershipStatus;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ListStudentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  branchId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  page?: number;
}

export class ListStaffQueryDto extends ListStudentsQueryDto {
  @IsOptional()
  @IsEnum(StaffBranchRole)
  role?: StaffBranchRole;
}

export class UpdateBranchStaffAssignmentDto {
  @IsOptional()
  @IsEnum(StaffBranchRole)
  roleKey?: StaffBranchRole;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsIn(["ACTIVE", "REVOKED"])
  status?: "ACTIVE" | "REVOKED";
}

export class UpdateStudentMembershipDto {
  @IsOptional()
  @IsEnum(BranchMembershipStatus)
  status?: BranchMembershipStatus;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateClassGroupDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsEnum(GradeLevel)
  gradeLevel?: GradeLevel;

  @IsOptional()
  @IsEnum(StudyTrack)
  studyTrack?: StudyTrack;
}

export class UpdateClassGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @IsOptional()
  @IsEnum(GradeLevel)
  gradeLevel?: GradeLevel | null;

  @IsOptional()
  @IsEnum(StudyTrack)
  studyTrack?: StudyTrack | null;

  @IsOptional()
  @IsEnum(ClassGroupStatus)
  status?: ClassGroupStatus;
}
