import { Module } from "@nestjs/common";
import { PublicContentRepository } from "../data-access/public-content.repository";
import { MediaModule } from "../media/media.module";
import { PublicContentController } from "./public-content.controller";
import { PublicContentService } from "./public-content.service";

@Module({
  imports: [MediaModule],
  controllers: [PublicContentController],
  providers: [PublicContentService, PublicContentRepository]
})
export class PublicContentModule {}
