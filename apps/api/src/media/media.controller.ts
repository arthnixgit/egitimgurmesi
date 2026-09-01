import {
  ArgumentsHost,
  Body,
  Catch,
  Controller,
  ExceptionFilter,
  Get,
  Param,
  PayloadTooLargeException,
  Post,
  Query,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MediaAssetKind, PERMISSION_KEYS } from "@ega/db";
import type { Response } from "express";
import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentAuth } from "../auth/current-auth.decorator";
import { RequirePermissions, StaffOnly } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { appEnv } from "../config/env";
import { CreateExternalMediaDto } from "./dto/admin-media.dto";
import { MediaService } from "./media.service";

type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Catch(PayloadTooLargeException)
class MediaUploadExceptionFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(400).json({
      statusCode: 400,
      message: "Yüklenen dosya izin verilen medya sınırından büyük.",
      error: "Bad Request"
    });
  }
}

@Controller("admin-media")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
@RequirePermissions(PERMISSION_KEYS.websiteManage)
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  listMedia(
    @Query("kind") kind?: string,
    @Query("search") search?: string,
    @Query("take") take?: string
  ) {
    return this.mediaService.listAssets(parseKind(kind), {
      search,
      take: parseTake(take)
    });
  }

  @Post("upload")
  @UseFilters(MediaUploadExceptionFilter)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: appEnv.mediaMaxUploadBytes()
      }
    })
  )
  uploadMedia(
    @UploadedFile() file: UploadedMediaFile | undefined,
    @Body() body: { kind?: string; title?: string; altText?: string },
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.mediaService.uploadAsset(file, body, auth);
  }

  @Post("external")
  createExternalMedia(
    @Body() payload: CreateExternalMediaDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.mediaService.createExternalAsset(payload, auth);
  }
}

@Controller("media")
export class PublicMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get("assets/:assetId")
  async getMediaAsset(@Param("assetId") assetId: string) {
    const asset = await this.mediaService.getAsset(assetId);
    return this.mediaService.normalizeAsset(asset);
  }

  @Get("assets/:assetId/file")
  async serveMediaAssetFile(
    @Param("assetId") assetId: string,
    @Res() response: Response
  ) {
    const { asset, filePath } = await this.mediaService.getLocalAssetFile(assetId);

    if (asset.mimeType) {
      response.setHeader("Content-Type", asset.mimeType);
    }

    if (asset.sizeBytes) {
      response.setHeader("Content-Length", String(asset.sizeBytes));
    }

    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.setHeader("Content-Disposition", `inline; filename="${asset.originalFileName ?? asset.id}"`);
    return response.sendFile(filePath);
  }
}

function parseKind(value?: string) {
  if (!value) {
    return undefined;
  }

  return Object.values(MediaAssetKind).includes(value as MediaAssetKind)
    ? (value as MediaAssetKind)
    : undefined;
}

function parseTake(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
