import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AccessTokenGuard } from "./access-token.guard";
import { AuthService } from "./auth.service";
import { AuthTokenService } from "./auth-token.service";
import { PasswordService } from "./password.service";
import { UsersRepository } from "../data-access/users.repository";
import { StaffUsersRepository } from "../data-access/staff-users.repository";
import { AuthSessionsRepository } from "../data-access/auth-sessions.repository";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    PasswordService,
    AccessTokenGuard,
    UsersRepository,
    StaffUsersRepository,
    AuthSessionsRepository
  ]
})
export class AuthModule {}
