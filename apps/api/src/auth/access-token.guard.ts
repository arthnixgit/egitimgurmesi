import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthTokenService } from "./auth-token.service";
import type { AuthenticatedRequestContext } from "./auth.types";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { auth?: AuthenticatedRequestContext }>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token zorunludur.");
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();
    const payload = await this.authTokenService.verifyAccessToken(token);

    request.auth = {
      actorId: payload.sub,
      email: payload.email,
      actorType: payload.actorType,
      sessionFamily: payload.sessionFamily,
      roleKeys: payload.roleKeys ?? [],
      permissionKeys: payload.permissionKeys ?? []
    };

    return true;
  }
}
