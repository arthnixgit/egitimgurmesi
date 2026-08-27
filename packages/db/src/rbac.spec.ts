import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_ROLES, PERMISSION_KEYS, ROLE_KEYS } from "./rbac";

const catalogWritePermissions = [
  PERMISSION_KEYS.productsManage,
  PERMISSION_KEYS.pricingManage,
  PERMISSION_KEYS.couponsManage
];

describe("default RBAC catalog policy", () => {
  it("keeps global catalog-writing permissions on Super Admin only", () => {
    const superAdminRole = DEFAULT_ROLES.find((role) => role.key === ROLE_KEYS.superAdmin);
    assert.ok(superAdminRole);

    for (const permission of catalogWritePermissions) {
      assert.ok(superAdminRole.permissions.includes(permission));
    }

    for (const role of DEFAULT_ROLES.filter((entry) => entry.key !== ROLE_KEYS.superAdmin)) {
      for (const permission of catalogWritePermissions) {
        assert.equal(
          role.permissions.includes(permission),
          false,
          `${role.key} must not include ${permission}`
        );
      }
    }
  });

  it("preserves order visibility for operational non-super roles", () => {
    const rolesWithOrderRead = new Set(
      DEFAULT_ROLES.filter((role) => role.permissions.includes(PERMISSION_KEYS.ordersRead)).map(
        (role) => role.key
      )
    );

    assert.ok(rolesWithOrderRead.has(ROLE_KEYS.admin));
    assert.ok(rolesWithOrderRead.has(ROLE_KEYS.branchAdmin));
    assert.ok(rolesWithOrderRead.has(ROLE_KEYS.accountant));
    assert.ok(rolesWithOrderRead.has(ROLE_KEYS.accounting));
  });
});
