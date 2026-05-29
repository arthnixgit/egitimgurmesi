import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { StudentLmsController } from "./student-lms.controller";
import { StudentLmsService } from "./student-lms.service";

@Module({
  imports: [AuthModule],
  controllers: [StudentLmsController],
  providers: [StudentLmsService]
})
export class StudentLmsModule {}
