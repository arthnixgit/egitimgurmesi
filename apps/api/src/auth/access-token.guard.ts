import { AuthActorType, StaffStatus, UserStatus } from "@ega/db";
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ROLE_KEYS } from "@ega/db";
import type { Request } from "express";
import { AuthSessionsRepository } from "../data-access/auth-sessions.repository";
import { StaffUsersRepository, type StaffUserWithAccess } from "../data-access/staff-users.repository";
import { UsersRepository } from "../data-access/users.repository";
import { AuthTokenService } from "./auth-token.service";
import type { AuthenticatedRequestContext } from "./auth.types";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly staffUsersRepository: StaffUsersRepository
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { auth?: AuthenticatedRequestContext }>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token zorunludur.");
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();
    const payload = await this.authTokenService.verifyAccessToken(token);
    const session = await this.authSessionsRepository.findActiveBySessionFamily(payload.sessionFamily);

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.actorType !== payload.actorType
    ) {
      throw new UnauthorizedException("Oturum artık geçerli değil.");
    }

    if (payload.actorType === AuthActorType.USER) {
      if (session.userId !== payload.sub) {
        throw new UnauthorizedException("Oturum kullanıcı eşleşmesi geçersiz.");
      }

      const user = await this.usersRepository.findById(payload.sub);

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException("Kullanıcı oturumu aktif değil.");
      }

      request.auth = {
        actorId: user.id,
        email: user.email,
        actorType: AuthActorType.USER,
        sessionFamily: session.sessionFamily,
        roleKeys: [],
        permissionKeys: [],
        organizationId: user.organizationId,
        primaryBranchId:
          user.primaryBranchId ??
          user.branchMemberships.find((membership) => membership.isPrimary)?.branchId ??
          user.branchMemberships[0]?.branchId ??
          null,
        branchIds: user.branchMemberships.map((membership) => membership.branchId),
        isSuperAdmin: false,
        branchRoles: user.branchMemberships.map((membership) => ({
          organizationId: membership.organizationId,
          branchId: membership.branchId,
          roleKey: "STUDENT",
          isPrimary: membership.isPrimary
        }))
      };

      return true;
    }

    if (session.staffUserId !== payload.sub) {
      throw new UnauthorizedException("Personel oturumu eşleşmesi geçersiz.");
    }

    const staffUser = await this.staffUsersRepository.findByIdWithAccess(payload.sub);

    if (!staffUser || staffUser.status !== StaffStatus.ACTIVE) {
      throw new UnauthorizedException("Personel oturumu aktif değil.");
    }

    const { roleKeys, permissionKeys } = mapStaffAccess(staffUser);
    const isSuperAdmin = roleKeys.includes(ROLE_KEYS.superAdmin);

    request.auth = {
      actorId: staffUser.id,
      email: staffUser.email,
      actorType: AuthActorType.STAFF,
      sessionFamily: session.sessionFamily,
      roleKeys,
      permissionKeys,
      organizationId:
        staffUser.organizationId ??
        staffUser.branchAssignments.find((assignment) => assignment.isPrimary)?.organizationId ??
        staffUser.branchAssignments[0]?.organizationId ??
        null,
      primaryBranchId:
        staffUser.primaryBranchId ??
        staffUser.branchAssignments.find((assignment) => assignment.isPrimary)?.branchId ??
        staffUser.branchAssignments[0]?.branchId ??
        null,
      branchIds: staffUser.branchAssignments.map((assignment) => assignment.branchId),
      isSuperAdmin,
      branchRoles: staffUser.branchAssignments.map((assignment) => ({
        organizationId: assignment.organizationId,
        branchId: assignment.branchId,
        roleKey: assignment.roleKey,
        isPrimary: assignment.isPrimary
      }))
    };

    return true;
  }
}

function mapStaffAccess(staffUser: StaffUserWithAccess) {
  const roleKeys = staffUser.roles.map((assignment) => assignment.role.key);
  const permissionKeys = Array.from(
    new Set(
      staffUser.roles.flatMap((assignment) =>
        assignment.role.permissions.map((rolePermission) => rolePermission.permission.key)
      )
    )
  );

  return {
    roleKeys,
    permissionKeys
  };
}

