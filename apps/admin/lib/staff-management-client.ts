import { requestWithStaffToken } from "./auth-client";

export type AdminStaffStatus = "INVITED" | "ACTIVE" | "SUSPENDED";

export type AdminPermission = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
};

export type AdminStaffRole = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  staffCount: number;
  permissionKeys: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminAssignedStaffRole = Pick<
  AdminStaffRole,
  "id" | "key" | "name" | "description" | "isSystem" | "permissionKeys"
>;

export type AdminStaffUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: AdminStaffStatus;
  inviteAcceptedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  roles: AdminAssignedStaffRole[];
  roleKeys: string[];
  permissionKeys: string[];
};

export type AdminStaffManagementOverview = {
  users: AdminStaffUser[];
  roles: AdminStaffRole[];
  permissions: AdminPermission[];
};

export function fetchAdminStaffManagementOverview() {
  return requestWithStaffToken<AdminStaffManagementOverview>("/admin-staff/overview");
}

export function createAdminStaffUser(payload: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  status: AdminStaffStatus;
  roleKeys: string[];
}) {
  return requestWithStaffToken<AdminStaffUser>("/admin-staff/users", {
    method: "POST",
    body: payload
  });
}

export function updateAdminStaffUser(
  staffUserId: string,
  payload: {
    email: string;
    firstName: string;
    lastName: string;
    status: AdminStaffStatus;
    roleKeys: string[];
  }
) {
  return requestWithStaffToken<AdminStaffUser>(`/admin-staff/users/${encodeURIComponent(staffUserId)}`, {
    method: "PATCH",
    body: payload
  });
}

export function updateAdminStaffPassword(staffUserId: string, password: string) {
  return requestWithStaffToken<AdminStaffUser>(
    `/admin-staff/users/${encodeURIComponent(staffUserId)}/password`,
    {
      method: "PATCH",
      body: { password }
    }
  );
}

export function createAdminStaffRole(payload: {
  key: string;
  name: string;
  description: string;
  permissionKeys: string[];
}) {
  return requestWithStaffToken<AdminStaffRole>("/admin-staff/roles", {
    method: "POST",
    body: payload
  });
}

export function updateAdminStaffRole(
  roleId: string,
  payload: {
    name: string;
    description: string;
    permissionKeys: string[];
  }
) {
  return requestWithStaffToken<AdminStaffRole>(`/admin-staff/roles/${encodeURIComponent(roleId)}`, {
    method: "PATCH",
    body: payload
  });
}
