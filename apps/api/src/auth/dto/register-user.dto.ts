import { GradeLevel, StudyTrack } from "@ega/db";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class RegisterUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Şifre en az bir büyük harf içermelidir." })
  @Matches(/[a-z]/, { message: "Şifre en az bir küçük harf içermelidir." })
  @Matches(/[0-9]/, { message: "Şifre en az bir rakam içermelidir." })
  password!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsEnum(GradeLevel)
  gradeLevel?: GradeLevel;

  @IsOptional()
  @IsEnum(StudyTrack)
  studyTrack?: StudyTrack;

  @IsOptional()
  @IsString()
  schoolName?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(2025)
  targetExamYear?: number;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  marketingConsent!: boolean;

  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  kvkkConsent!: boolean;

  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  termsAccepted!: boolean;

  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  distanceSalesAccepted!: boolean;
}
