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
import { RolesRepository } from "../data-access/roles.repository";
import { PermissionsGuard } from "./permissions.guard";
import { StaffBootstrapService } from "./staff-bootstrap.service";
import { StaffController } from "./staff.controller";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, StaffController],
  providers: [
    AuthService,
    AuthTokenService,
    PasswordService,
    AccessTokenGuard,
    PermissionsGuard,
    StaffBootstrapService,
    UsersRepository,
    StaffUsersRepository,
    AuthSessionsRepository,
    RolesRepository
  ],
  exports: [AccessTokenGuard, PermissionsGuard, AuthTokenService]
})
export class AuthModule {}
