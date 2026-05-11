import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { UnikazanAdapterService } from "./unikazan-adapter.service";

@Module({
  imports: [AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, UnikazanAdapterService]
})
export class OrdersModule {}
