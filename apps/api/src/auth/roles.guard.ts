import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { AuthenticatedRequestContext } from "./auth.types";
import { REQUIRED_ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { auth?: AuthenticatedRequestContext }>();
    const auth = request.auth;

    if (!auth) {
      throw new UnauthorizedException("Kimlik dogrulamasi gerekli.");
    }

    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (requiredRoles.length === 0 || auth.isSuperAdmin) {
      return true;
    }

    const hasRequiredRole = requiredRoles.some((role) => auth.roleKeys.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException("Bu islem icin gerekli role sahip degilsiniz.");
    }

    return true;
  }
}
