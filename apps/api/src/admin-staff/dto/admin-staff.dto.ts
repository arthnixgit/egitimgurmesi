import { StaffStatus } from "@ega/db";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";

const roleKeyPattern = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;
const permissionKeyPattern = /^[a-z0-9][a-z0-9.-]{1,118}[a-z0-9]$/;

export class CreateStaffUserDto {
  @IsEmail()
  @MaxLength(220)
  email!: string;

  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(160)
  password!: string;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @IsArray()
  @ArrayNotEmpty()
  @Matches(roleKeyPattern, { each: true })
  roleKeys!: string[];
}

export class UpdateStaffUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(220)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Matches(roleKeyPattern, { each: true })
  roleKeys?: string[];
}

export class UpdateStaffPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(160)
  password!: string;
}

export class CreateRoleDto {
  @IsString()
  @Matches(roleKeyPattern)
  key!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsArray()
  @ArrayNotEmpty()
  @Matches(permissionKeyPattern, { each: true })
  permissionKeys!: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Matches(permissionKeyPattern, { each: true })
  permissionKeys?: string[];
}
