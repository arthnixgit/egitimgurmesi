import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminCommerceController } from "./admin-commerce.controller";
import { AdminCommerceService } from "./admin-commerce.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminCommerceController],
  providers: [AdminCommerceService]
})
export class AdminCommerceModule {}
