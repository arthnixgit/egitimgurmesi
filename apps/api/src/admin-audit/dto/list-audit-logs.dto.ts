import { Type } from "class-transformer";
import { AuditActorType } from "@ega/db";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ListAuditLogsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsEnum(AuditActorType)
  actorType?: AuditActorType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;
}
