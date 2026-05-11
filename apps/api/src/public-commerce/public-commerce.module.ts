import { Module } from "@nestjs/common";
import { PublicCommerceController } from "./public-commerce.controller";
import { PublicCommerceService } from "./public-commerce.service";

@Module({
  controllers: [PublicCommerceController],
  providers: [PublicCommerceService]
})
export class PublicCommerceModule {}
