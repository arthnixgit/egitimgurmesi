import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedRequestContext } from "./auth.types";

type ScopedRequest = Request & {
  auth?: AuthenticatedRequestContext;
  params: Record<string, string | undefined>;
  query: Record<string, string | string[] | undefined>;
};

@Injectable()
export class TenantScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const auth = getAuth(request);
    const requestedOrganizationId = getFirstValue(
      request.params.organizationId ??
        request.params.organizationIdOrSlug ??
        request.query.organizationId ??
        request.headers["x-organization-id"]
    );

    if (!requestedOrganizationId || auth.isSuperAdmin) {
      return true;
    }

    if (auth.organizationId === requestedOrganizationId) {
      return true;
    }

    throw new ForbiddenException("Bu kurum kapsamina erisim yetkiniz yok.");
  }
}

@Injectable()
export class BranchScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const auth = getAuth(request);
    const requestedBranchId = getFirstValue(
      request.params.branchId ?? request.query.branchId ?? request.headers["x-branch-id"]
    );

    if (!requestedBranchId || auth.isSuperAdmin) {
      return true;
    }

    if (auth.branchIds.includes(requestedBranchId)) {
      return true;
    }

    throw new ForbiddenException("Bu sube kapsamina erisim yetkiniz yok.");
  }
}

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private readonly tenantScopeGuard: TenantScopeGuard,
    private readonly branchScopeGuard: BranchScopeGuard
  ) {}

  canActivate(context: ExecutionContext) {
    return (
      this.tenantScopeGuard.canActivate(context) && this.branchScopeGuard.canActivate(context)
    );
  }
}

export function assertBranchAccess(auth: AuthenticatedRequestContext, branchId: string) {
  if (auth.isSuperAdmin || auth.branchIds.includes(branchId)) {
    return;
  }

  throw new ForbiddenException("Bu sube kapsamina erisim yetkiniz yok.");
}

export function assertOrganizationAccess(
  auth: AuthenticatedRequestContext,
  organizationId: string
) {
  if (auth.isSuperAdmin || auth.organizationId === organizationId) {
    return;
  }

  throw new ForbiddenException("Bu kurum kapsamina erisim yetkiniz yok.");
}

function getAuth(request: ScopedRequest) {
  if (!request.auth) {
    throw new UnauthorizedException("Kimlik dogrulamasi gerekli.");
  }

  return request.auth;
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
