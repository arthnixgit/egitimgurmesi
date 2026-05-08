import { SetMetadata } from "@nestjs/common";

export const REQUIRED_PERMISSIONS_KEY = "requiredPermissions";
export const STAFF_ONLY_KEY = "staffOnly";

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

export const StaffOnly = () => SetMetadata(STAFF_ONLY_KEY, true);
