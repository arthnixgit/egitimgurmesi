import { Module } from "@nestjs/common";
import { AdminEngagementModule } from "./admin-engagement/admin-engagement.module";
import { AdminStaffModule } from "./admin-staff/admin-staff.module";
import { AdminTenancyModule } from "./admin-tenancy/admin-tenancy.module";
import { AdminAuditModule } from "./admin-audit/admin-audit.module";
import { AdminCommerceModule } from "./admin-commerce/admin-commerce.module";
import { AdminContentModule } from "./admin-content/admin-content.module";
import { AdminDeployModule } from "./admin-deploy/admin-deploy.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { MediaModule } from "./media/media.module";
import { OperationsModule } from "./operations/operations.module";
import { OrdersModule } from "./orders/orders.module";
import { PublicCommerceModule } from "./public-commerce/public-commerce.module";
import { PublicContentModule } from "./public-content/public-content.module";
import { PublicEngagementModule } from "./public-engagement/public-engagement.module";
import { StudentLmsModule } from "./student-lms/student-lms.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    PublicContentModule,
    PublicEngagementModule,
    AdminContentModule,
    PublicCommerceModule,
    AdminCommerceModule,
    AdminDeployModule,
    AdminEngagementModule,
    AdminStaffModule,
    AdminTenancyModule,
    AdminAuditModule,
    MediaModule,
    OperationsModule,
    OrdersModule,
    StudentLmsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
