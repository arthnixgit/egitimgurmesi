import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthActorType } from "@ega/db";
import type { Request } from "express";
import { REQUIRED_PERMISSIONS_KEY, STAFF_ONLY_KEY } from "./permissions.decorator";
import type { AuthenticatedRequestContext } from "./auth.types";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { auth?: AuthenticatedRequestContext }>();
    const auth = request.auth;

    if (!auth) {
      throw new UnauthorizedException("Kimlik doğrulaması gerekli.");
    }

    const staffOnly = this.reflector.getAllAndOverride<boolean>(STAFF_ONLY_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (staffOnly && auth.actorType !== AuthActorType.STAFF) {
      throw new ForbiddenException("Bu alan yalnızca personel erişimine açıktır.");
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    if (auth.actorType !== AuthActorType.STAFF) {
      throw new ForbiddenException("Bu işlem için personel yetkisi gereklidir.");
    }

    const missingPermission = requiredPermissions.find(
      (permission) => !auth.permissionKeys.includes(permission)
    );

    if (missingPermission) {
      throw new ForbiddenException("Bu işlem için gerekli yetkiye sahip değilsiniz.");
    }

    return true;
  }
}
