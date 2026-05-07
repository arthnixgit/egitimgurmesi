import type { AuthActorType } from "@ega/db";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  actorType: AuthActorType;
  sessionFamily: string;
  roleKeys?: string[];
  permissionKeys?: string[];
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  email: string;
  actorType: AuthActorType;
  sessionFamily: string;
  type: "refresh";
};

export type AuthenticatedRequestContext = {
  actorId: string;
  email: string;
  actorType: AuthActorType;
  sessionFamily: string;
  roleKeys: string[];
  permissionKeys: string[];
};
