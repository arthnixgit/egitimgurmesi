import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminEngagementController } from "./admin-engagement.controller";
import { AdminEngagementService } from "./admin-engagement.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminEngagementController],
  providers: [AdminEngagementService]
})
export class AdminEngagementModule {}
