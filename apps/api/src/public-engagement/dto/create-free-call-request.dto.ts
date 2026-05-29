import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateFreeCallRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  studentName?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(24)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  studyTrack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourcePage?: string;
}
