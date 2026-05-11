import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminContentController } from "./admin-content.controller";
import { AdminContentService } from "./admin-content.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminContentController],
  providers: [AdminContentService]
})
export class AdminContentModule {}
