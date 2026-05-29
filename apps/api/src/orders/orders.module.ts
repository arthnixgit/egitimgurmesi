import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { IyzicoAdapterService } from "./iyzico-adapter.service";
import { PaytrAdapterService } from "./paytr-adapter.service";
import { OrdersController } from "./orders.controller";
import { OrdersPublicController } from "./orders-public.controller";
import { OrdersService } from "./orders.service";
import { UnikazanAdapterService } from "./unikazan-adapter.service";

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, OrdersPublicController],
  providers: [OrdersService, UnikazanAdapterService, IyzicoAdapterService, PaytrAdapterService]
})
export class OrdersModule {}
