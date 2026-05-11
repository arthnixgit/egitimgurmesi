import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { AuthActorType, StaffStatus, UserStatus } from "@ega/db";
import { randomUUID } from "node:crypto";
import { appEnv } from "../config/env";
import { AuthSessionsRepository } from "../data-access/auth-sessions.repository";
import { StaffUsersRepository, type StaffUserWithAccess } from "../data-access/staff-users.repository";
import { UsersRepository, type UserWithProfile } from "../data-access/users.repository";
import type {
  AccessTokenPayload,
  AuthenticatedRequestContext,
  RefreshTokenPayload
} from "./auth.types";
import { normalizeEmail, normalizePhone } from "./auth.utils";
import { LoginStaffDto } from "./dto/login-staff.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UpdateCurrentUserProfileDto } from "./dto/update-current-user-profile.dto";
import { PasswordService } from "./password.service";
import { AuthTokenService } from "./auth-token.service";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly staffUsersRepository: StaffUsersRepository,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly passwordService: PasswordService,
    private readonly authTokenService: AuthTokenService
  ) {}

  async registerUser(dto: RegisterUserDto, meta: RequestMeta) {
    if (!dto.kvkkConsent || !dto.termsAccepted || !dto.distanceSalesAccepted) {
      throw new BadRequestException("KVKK, mesafeli satış ve kullanım sözleşmesi onayları zorunludur.");
    }

    const email = normalizeEmail(dto.email);
    const phone = normalizePhone(dto.phone);
    const parentPhone = normalizePhone(dto.parentPhone);

    const existingByEmail = await this.usersRepository.findByEmail(email);

    if (existingByEmail) {
      throw new ConflictException("Bu e-posta adresi zaten kayıtlı.");
    }

    if (phone) {
      const existingByPhone = await this.usersRepository.findByPhone(phone);

      if (existingByPhone) {
        throw new ConflictException("Bu telefon numarası zaten kayıtlı.");
      }
    }

    const now = new Date();
    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.usersRepository.createUser({
      email,
      phone,
      passwordHash,
      status: UserStatus.ACTIVE,
      profile: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        city: dto.city?.trim(),
        district: dto.district?.trim(),
        parentName: dto.parentName?.trim(),
        parentPhone,
        marketingConsent: dto.marketingConsent,
        kvkkConsentAt: now,
        termsAcceptedAt: now,
        distanceSalesConsentAt: now
      },
      studentProfile:
        dto.gradeLevel || dto.studyTrack || dto.schoolName || dto.targetExamYear
          ? {
              gradeLevel: dto.gradeLevel,
              studyTrack: dto.studyTrack,
              schoolName: dto.schoolName?.trim(),
              targetExamYear: dto.targetExamYear
            }
          : undefined
    });

    return this.createAuthResponseForUser(user, meta);
  }

  async loginUser(dto: LoginUserDto, meta: RequestMeta) {
    const email = normalizeEmail(dto.email);
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("E-posta veya şifre hatalı.");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("Bu hesap askıya alınmıştır.");
    }

    const isValid = await this.passwordService.verify(user.passwordHash, dto.password);

    if (!isValid) {
      throw new UnauthorizedException("E-posta veya şifre hatalı.");
    }

    return this.createAuthResponseForUser(user, meta);
  }

  async loginStaff(dto: LoginStaffDto, meta: RequestMeta) {
    const email = normalizeEmail(dto.email);
    const staffUser = await this.staffUsersRepository.findByEmailWithAccess(email);

    if (!staffUser?.passwordHash) {
      throw new UnauthorizedException("Yetkili hesap bulunamadı.");
    }

    if (staffUser.status !== StaffStatus.ACTIVE) {
      throw new UnauthorizedException("Bu personel hesabı aktif değil.");
    }

    const isValid = await this.passwordService.verify(staffUser.passwordHash, dto.password);

    if (!isValid) {
      throw new UnauthorizedException("Yetkili hesap doğrulanamadı.");
    }

    return this.createAuthResponseForStaff(staffUser, meta);
  }

  async createAuthResponseForBootstrap(staffUser: StaffUserWithAccess, meta: RequestMeta) {
    return this.createAuthResponseForStaff(staffUser, meta);
  }

  async refresh(dto: RefreshTokenDto, meta: RequestMeta) {
    const payload = await this.authTokenService.verifyRefreshToken(dto.refreshToken);
    const session = await this.authSessionsRepository.findActiveBySessionFamily(payload.sessionFamily);

    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Oturum yenileme isteği geçersiz.");
    }

    const isValid = await this.passwordService.verify(session.refreshTokenHash, dto.refreshToken);

    if (!isValid) {
      throw new UnauthorizedException("Yenileme belirteci oturumla eşleşmiyor.");
    }

    if (payload.actorType === AuthActorType.USER) {
      const user = await this.usersRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException("Kullanıcı bulunamadı.");
      }

      return this.rotateSessionForUser(user, payload, meta);
    }

    const staffUser = await this.staffUsersRepository.findByIdWithAccess(payload.sub);

    if (!staffUser) {
      throw new UnauthorizedException("Personel hesabı bulunamadı.");
    }

    return this.rotateSessionForStaff(staffUser, payload, meta);
  }

  async logout(context: AuthenticatedRequestContext) {
    await this.authSessionsRepository.revoke(context.sessionFamily);

    return {
      success: true
    };
  }

  async me(context: AuthenticatedRequestContext) {
    if (context.actorType === AuthActorType.USER) {
      const user = await this.usersRepository.findById(context.actorId);

      if (!user) {
        throw new UnauthorizedException("Kullanıcı bulunamadı.");
      }

      return {
        actorType: AuthActorType.USER,
        user: this.mapUser(user)
      };
    }

    const staffUser = await this.staffUsersRepository.findByIdWithAccess(context.actorId);

    if (!staffUser) {
      throw new UnauthorizedException("Personel hesabı bulunamadı.");
    }

    return {
      actorType: AuthActorType.STAFF,
      staffUser: this.mapStaff(staffUser)
    };
  }

  async updateMe(context: AuthenticatedRequestContext, dto: UpdateCurrentUserProfileDto) {
    if (context.actorType !== AuthActorType.USER) {
      throw new UnauthorizedException("Only student accounts can update this profile.");
    }

    const user = await this.usersRepository.findById(context.actorId);

    if (!user) {
      throw new UnauthorizedException("Kullanıcı bulunamadı.");
    }

    const phone =
      dto.phone !== undefined ? normalizePhone(dto.phone) || null : (user.phone ?? null);
    const parentPhone =
      dto.parentPhone !== undefined
        ? normalizePhone(dto.parentPhone) || null
        : (user.profile?.parentPhone ?? null);

    if (phone && phone !== user.phone) {
      const existingByPhone = await this.usersRepository.findByPhone(phone);

      if (existingByPhone && existingByPhone.id !== user.id) {
        throw new ConflictException("Bu telefon numarası zaten kayıtlı.");
      }
    }

    const updated = await this.usersRepository.updateUserProfile(user.id, {
      phone,
      profile: {
        firstName: dto.firstName?.trim() ?? user.profile?.firstName ?? undefined,
        lastName: dto.lastName?.trim() ?? user.profile?.lastName ?? undefined,
        city: dto.city !== undefined ? dto.city.trim() || null : (user.profile?.city ?? null),
        district:
          dto.district !== undefined
            ? dto.district.trim() || null
            : (user.profile?.district ?? null),
        parentName:
          dto.parentName !== undefined
            ? dto.parentName.trim() || null
            : (user.profile?.parentName ?? null),
        parentPhone,
        marketingConsent:
          dto.marketingConsent !== undefined
            ? dto.marketingConsent
            : (user.profile?.marketingConsent ?? false)
      },
      studentProfile: {
        gradeLevel:
          dto.gradeLevel !== undefined ? dto.gradeLevel : (user.studentProfile?.gradeLevel ?? null),
        studyTrack:
          dto.studyTrack !== undefined ? dto.studyTrack : (user.studentProfile?.studyTrack ?? null),
        schoolName:
          dto.schoolName !== undefined
            ? dto.schoolName.trim() || null
            : (user.studentProfile?.schoolName ?? null),
        targetExamYear:
          dto.targetExamYear !== undefined
            ? dto.targetExamYear
            : (user.studentProfile?.targetExamYear ?? null)
      }
    });

    return {
      actorType: AuthActorType.USER,
      user: this.mapUser(updated)
    };
  }

  private async createAuthResponseForUser(user: UserWithProfile, meta: RequestMeta) {
    await this.usersRepository.touchLastLogin(user.id);

    const tokenSet = await this.issueTokenSet({
      actorId: user.id,
      email: user.email,
      actorType: AuthActorType.USER,
      roleKeys: [],
      permissionKeys: [],
      meta
    });

    return {
      actorType: AuthActorType.USER,
      ...tokenSet,
      user: this.mapUser(user)
    };
  }

  private async createAuthResponseForStaff(staffUser: StaffUserWithAccess, meta: RequestMeta) {
    await this.staffUsersRepository.touchLastLogin(staffUser.id);

    const mappedStaff = this.mapStaff(staffUser);
    const tokenSet = await this.issueTokenSet({
      actorId: staffUser.id,
      email: staffUser.email,
      actorType: AuthActorType.STAFF,
      roleKeys: mappedStaff.roleKeys,
      permissionKeys: mappedStaff.permissionKeys,
      meta
    });

    return {
      actorType: AuthActorType.STAFF,
      ...tokenSet,
      staffUser: mappedStaff
    };
  }

  private async rotateSessionForUser(
    user: UserWithProfile,
    payload: RefreshTokenPayload,
    meta: RequestMeta
  ) {
    const tokenSet = await this.rotateTokenSet({
      actorId: user.id,
      email: user.email,
      actorType: AuthActorType.USER,
      sessionFamily: payload.sessionFamily,
      roleKeys: [],
      permissionKeys: [],
      meta
    });

    return {
      actorType: AuthActorType.USER,
      ...tokenSet,
      user: this.mapUser(user)
    };
  }

  private async rotateSessionForStaff(
    staffUser: StaffUserWithAccess,
    payload: RefreshTokenPayload,
    meta: RequestMeta
  ) {
    const mappedStaff = this.mapStaff(staffUser);
    const tokenSet = await this.rotateTokenSet({
      actorId: staffUser.id,
      email: staffUser.email,
      actorType: AuthActorType.STAFF,
      sessionFamily: payload.sessionFamily,
      roleKeys: mappedStaff.roleKeys,
      permissionKeys: mappedStaff.permissionKeys,
      meta
    });

    return {
      actorType: AuthActorType.STAFF,
      ...tokenSet,
      staffUser: mappedStaff
    };
  }

  private async issueTokenSet(input: {
    actorId: string;
    email: string;
    actorType: AuthActorType;
    roleKeys: string[];
    permissionKeys: string[];
    meta: RequestMeta;
  }) {
    const sessionFamily = randomUUID();
    const accessTokenPayload = this.buildAccessPayload({
      actorId: input.actorId,
      email: input.email,
      actorType: input.actorType,
      sessionFamily,
      roleKeys: input.roleKeys,
      permissionKeys: input.permissionKeys
    });

    const refreshTokenPayload = this.buildRefreshPayload({
      actorId: input.actorId,
      email: input.email,
      actorType: input.actorType,
      sessionFamily
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.authTokenService.signAccessToken(accessTokenPayload),
      this.authTokenService.signRefreshToken(refreshTokenPayload)
    ]);

    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    await this.authSessionsRepository.create({
      actorType: input.actorType,
      userId: input.actorType === AuthActorType.USER ? input.actorId : undefined,
      staffUserId: input.actorType === AuthActorType.STAFF ? input.actorId : undefined,
      sessionFamily,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + appEnv.refreshTokenTtlSeconds * 1000),
      userAgent: input.meta.userAgent,
      ipAddress: input.meta.ipAddress
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: appEnv.accessTokenTtlSeconds,
      refreshTokenExpiresIn: appEnv.refreshTokenTtlSeconds
    };
  }

  private async rotateTokenSet(input: {
    actorId: string;
    email: string;
    actorType: AuthActorType;
    sessionFamily: string;
    roleKeys: string[];
    permissionKeys: string[];
    meta: RequestMeta;
  }) {
    const accessTokenPayload = this.buildAccessPayload({
      actorId: input.actorId,
      email: input.email,
      actorType: input.actorType,
      sessionFamily: input.sessionFamily,
      roleKeys: input.roleKeys,
      permissionKeys: input.permissionKeys
    });

    const refreshTokenPayload = this.buildRefreshPayload({
      actorId: input.actorId,
      email: input.email,
      actorType: input.actorType,
      sessionFamily: input.sessionFamily
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.authTokenService.signAccessToken(accessTokenPayload),
      this.authTokenService.signRefreshToken(refreshTokenPayload)
    ]);

    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    await this.authSessionsRepository.rotate(
      input.sessionFamily,
      refreshTokenHash,
      new Date(Date.now() + appEnv.refreshTokenTtlSeconds * 1000)
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: appEnv.accessTokenTtlSeconds,
      refreshTokenExpiresIn: appEnv.refreshTokenTtlSeconds
    };
  }

  private buildAccessPayload(input: {
    actorId: string;
    email: string;
    actorType: AuthActorType;
    sessionFamily: string;
    roleKeys: string[];
    permissionKeys: string[];
  }): Omit<AccessTokenPayload, "type"> {
    return {
      sub: input.actorId,
      email: input.email,
      actorType: input.actorType,
      sessionFamily: input.sessionFamily,
      roleKeys: input.roleKeys,
      permissionKeys: input.permissionKeys
    };
  }

  private buildRefreshPayload(input: {
    actorId: string;
    email: string;
    actorType: AuthActorType;
    sessionFamily: string;
  }): Omit<RefreshTokenPayload, "type"> {
    return {
      sub: input.actorId,
      email: input.email,
      actorType: input.actorType,
      sessionFamily: input.sessionFamily
    };
  }

  private mapUser(user: UserWithProfile) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      profile: user.profile,
      studentProfile: user.studentProfile,
      externalAccounts: user.externalAccounts.map((entry) => ({
        id: entry.id,
        provider: entry.provider,
        externalEmail: entry.externalEmail,
        linkedAt: entry.linkedAt
      }))
    };
  }

  private mapStaff(staffUser: StaffUserWithAccess) {
    const roleKeys = staffUser.roles.map((assignment) => assignment.role.key);
    const permissionKeys = Array.from(
      new Set(
        staffUser.roles.flatMap((assignment) =>
          assignment.role.permissions.map((rolePermission) => rolePermission.permission.key)
        )
      )
    );

    return {
      id: staffUser.id,
      email: staffUser.email,
      firstName: staffUser.firstName,
      lastName: staffUser.lastName,
      status: staffUser.status,
      roleKeys,
      permissionKeys
    };
  }
}
