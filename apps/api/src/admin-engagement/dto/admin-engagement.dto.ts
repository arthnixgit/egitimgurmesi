import type { LeadStatus } from "@ega/db";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { LEAD_STATUS_VALUES } from "./lead-status-enum-values";

export class ListLeadsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;

  @IsOptional()
  @IsEnum(LEAD_STATUS_VALUES)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourcePage?: string;
}

export class UpdateLeadStatusDto {
  @IsEnum(LEAD_STATUS_VALUES)
  status!: LeadStatus;
}
