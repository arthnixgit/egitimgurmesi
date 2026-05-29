import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminTenancyController } from "./admin-tenancy.controller";
import { AdminTenancyService } from "./admin-tenancy.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminTenancyController],
  providers: [AdminTenancyService]
})
export class AdminTenancyModule {}
