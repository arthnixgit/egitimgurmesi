import { Module } from "@nestjs/common";
import { AdminCommerceModule } from "./admin-commerce/admin-commerce.module";
import { AdminContentModule } from "./admin-content/admin-content.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { OrdersModule } from "./orders/orders.module";
import { PublicCommerceModule } from "./public-commerce/public-commerce.module";
import { PublicContentModule } from "./public-content/public-content.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    PublicContentModule,
    AdminContentModule,
    PublicCommerceModule,
    AdminCommerceModule,
    OrdersModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
