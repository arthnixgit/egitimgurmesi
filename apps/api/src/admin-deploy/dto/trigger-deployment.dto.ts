import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class TriggerDeploymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-zA-Z0-9._/@:-]+$/)
  ref?: string;
}
