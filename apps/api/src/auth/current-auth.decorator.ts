import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequestContext } from "./auth.types";

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRequestContext => {
    const request = context.switchToHttp().getRequest<{ auth: AuthenticatedRequestContext }>();
    return request.auth;
  }
);
