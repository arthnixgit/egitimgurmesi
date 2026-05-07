import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { appEnv } from "../config/env";
import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.types";

@Injectable()
export class AuthTokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: Omit<AccessTokenPayload, "type">) {
    return this.jwtService.signAsync(
      {
        ...payload,
        type: "access"
      } satisfies AccessTokenPayload,
      {
        secret: `${appEnv.authSecret()}:access`,
        expiresIn: appEnv.accessTokenTtlSeconds
      }
    );
  }

  async signRefreshToken(payload: Omit<RefreshTokenPayload, "type">) {
    return this.jwtService.signAsync(
      {
        ...payload,
        type: "refresh"
      } satisfies RefreshTokenPayload,
      {
        secret: `${appEnv.authSecret()}:refresh`,
        expiresIn: appEnv.refreshTokenTtlSeconds
      }
    );
  }

  async verifyAccessToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: `${appEnv.authSecret()}:access`
      });

      if (payload.type !== "access") {
        throw new UnauthorizedException("Geçersiz erişim belirteci.");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Oturum doğrulanamadı.");
    }
  }

  async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: `${appEnv.authSecret()}:refresh`
      });

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Geçersiz yenileme belirteci.");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Yenileme belirteci doğrulanamadı.");
    }
  }
}
