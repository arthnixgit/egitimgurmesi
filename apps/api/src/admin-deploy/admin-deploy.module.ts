import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminDeployController } from "./admin-deploy.controller";
import { AdminDeployService } from "./admin-deploy.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminDeployController],
  providers: [AdminDeployService]
})
export class AdminDeployModule {}
