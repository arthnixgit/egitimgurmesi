import { LeadStatus } from "@ega/db";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ListLeadsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourcePage?: string;
}

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status!: LeadStatus;
}
