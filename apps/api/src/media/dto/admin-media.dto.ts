import { IsEnum, IsOptional, IsString } from "class-validator";
import { MediaAssetKind } from "@ega/db";

export class CreateExternalMediaDto {
  @IsEnum(MediaAssetKind)
  kind!: MediaAssetKind;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsString()
  externalUrl!: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
