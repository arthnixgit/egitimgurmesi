import { PrismaClient } from "@prisma/client";
import { DEFAULT_PERMISSIONS, PERMISSION_KEYS, ROLE_KEYS } from "../src/rbac";

const prisma = new PrismaClient();

const catalogWritePermissionKeys = [
  PERMISSION_KEYS.productsManage,
  PERMISSION_KEYS.pricingManage,
  PERMISSION_KEYS.couponsManage
];

async function main() {
  const permissionDefinitions = DEFAULT_PERMISSIONS.filter((permission) =>
    catalogWritePermissionKeys.includes(permission.key)
  );

  for (const permission of permissionDefinitions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      create: {
        key: permission.key,
        name: permission.name,
        description: permission.description
      },
      update: {
        name: permission.name,
        description: permission.description
      }
    });
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { key: ROLE_KEYS.superAdmin }
  });

  if (!superAdminRole) {
    throw new Error("super-admin role was not found. Run the normal RBAC bootstrap before restricting catalog access.");
  }

  const catalogPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: catalogWritePermissionKeys
      }
    },
    select: {
      id: true,
      key: true
    }
  });

  for (const permission of catalogPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      },
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id
      },
      update: {}
    });
  }

  const removed = await prisma.rolePermission.deleteMany({
    where: {
      permission: {
        key: {
          in: catalogWritePermissionKeys
        }
      },
      role: {
        isSystem: true,
        key: {
          not: ROLE_KEYS.superAdmin
        }
      }
    }
  });

  console.log(
    `Restricted global catalog permissions. Removed ${removed.count} non-super role-permission link(s).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
