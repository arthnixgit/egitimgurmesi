import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AccessTokenGuard } from "./access-token.guard";
import { AuthNotificationsService } from "./auth-notifications.service";
import { AuthService } from "./auth.service";
import { AuthTokenService } from "./auth-token.service";
import { PasswordService } from "./password.service";
import { UsersRepository } from "../data-access/users.repository";
import { StaffUsersRepository } from "../data-access/staff-users.repository";
import { AuthSessionsRepository } from "../data-access/auth-sessions.repository";
import { EmailVerificationCodesRepository } from "../data-access/email-verification-codes.repository";
import { PasswordResetTokensRepository } from "../data-access/password-reset-tokens.repository";
import { RolesRepository } from "../data-access/roles.repository";
import { PermissionsGuard } from "./permissions.guard";
import { RolesGuard } from "./roles.guard";
import { BranchScopeGuard, ScopeGuard, TenantScopeGuard } from "./scope.guard";
import { StaffBootstrapService } from "./staff-bootstrap.service";
import { StaffController } from "./staff.controller";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, StaffController],
  providers: [
    AuthService,
    AuthNotificationsService,
    AuthTokenService,
    PasswordService,
    AccessTokenGuard,
    PermissionsGuard,
    RolesGuard,
    TenantScopeGuard,
    BranchScopeGuard,
    ScopeGuard,
    StaffBootstrapService,
    UsersRepository,
    StaffUsersRepository,
    AuthSessionsRepository,
    EmailVerificationCodesRepository,
    PasswordResetTokensRepository,
    RolesRepository
  ],
  exports: [
    AccessTokenGuard,
    PermissionsGuard,
    RolesGuard,
    TenantScopeGuard,
    BranchScopeGuard,
    ScopeGuard,
    AuthTokenService,
    PasswordService,
    UsersRepository,
    StaffUsersRepository,
    AuthSessionsRepository
  ]
})
export class AuthModule {}
