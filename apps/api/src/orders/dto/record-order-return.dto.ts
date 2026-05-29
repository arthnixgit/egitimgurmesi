import { IsIn, IsOptional, IsString } from "class-validator";

export class RecordOrderReturnDto {
  @IsIn(["success", "failure", "pending"])
  status!: "success" | "failure" | "pending";

  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsString()
  rawStatus?: string;
}
