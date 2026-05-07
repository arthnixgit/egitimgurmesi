import { Body, Controller, Get, Headers, Ip, Post, UseGuards } from "@nestjs/common";
import { CurrentAuth } from "./current-auth.decorator";
import type { AuthenticatedRequestContext } from "./auth.types";
import { AccessTokenGuard } from "./access-token.guard";
import { AuthService } from "./auth.service";
import { LoginStaffDto } from "./dto/login-staff.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterUserDto } from "./dto/register-user.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  registerUser(
    @Body() dto: RegisterUserDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.registerUser(dto, {
      ipAddress,
      userAgent
    });
  }

  @Post("login")
  loginUser(
    @Body() dto: LoginUserDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.loginUser(dto, {
      ipAddress,
      userAgent
    });
  }

  @Post("staff/login")
  loginStaff(
    @Body() dto: LoginStaffDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.loginStaff(dto, {
      ipAddress,
      userAgent
    });
  }

  @Post("refresh")
  refreshToken(
    @Body() dto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.refresh(dto, {
      ipAddress,
      userAgent
    });
  }

  @UseGuards(AccessTokenGuard)
  @Post("logout")
  logout(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.authService.logout(auth);
  }

  @UseGuards(AccessTokenGuard)
  @Get("me")
  me(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.authService.me(auth);
  }
}
