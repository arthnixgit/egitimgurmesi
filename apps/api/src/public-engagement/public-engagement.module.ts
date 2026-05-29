import { Module } from "@nestjs/common";
import { PublicEngagementController } from "./public-engagement.controller";
import { PublicEngagementService } from "./public-engagement.service";

@Module({
  controllers: [PublicEngagementController],
  providers: [PublicEngagementService]
})
export class PublicEngagementModule {}
