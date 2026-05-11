import { Module } from "@nestjs/common";
import { PublicContentRepository } from "../data-access/public-content.repository";
import { PublicContentController } from "./public-content.controller";
import { PublicContentService } from "./public-content.service";

@Module({
  controllers: [PublicContentController],
  providers: [PublicContentService, PublicContentRepository]
})
export class PublicContentModule {}
