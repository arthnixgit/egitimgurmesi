import { PrismaClient } from "@prisma/client";
import { DEFAULT_PERMISSIONS, PERMISSION_KEYS, ROLE_KEYS } from "../src/rbac";

const prisma = new PrismaClient();

const websitePermissionKeys = [
  PERMISSION_KEYS.websiteRead,
  PERMISSION_KEYS.websiteManage,
  PERMISSION_KEYS.websitePublish
] as const;

const allowedRoleKeys = [ROLE_KEYS.superAdmin, ROLE_KEYS.branchAdmin] as const;

async function main() {
  const definitions = DEFAULT_PERMISSIONS.filter((permission) =>
    websitePermissionKeys.includes(permission.key as (typeof websitePermissionKeys)[number])
  );

  for (const permission of definitions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: permission
    });
  }

  const allowedRoles = await prisma.role.findMany({
    where: {
      key: {
        in: [...allowedRoleKeys]
      }
    },
    select: {
      id: true,
      key: true
    }
  });

  const permissionRecords = await prisma.permission.findMany({
    where: {
      key: {
        in: [...websitePermissionKeys]
      }
    },
    select: {
      id: true,
      key: true
    }
  });

  for (const role of allowedRoles) {
    for (const permission of permissionRecords) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  const removed = await prisma.rolePermission.deleteMany({
    where: {
      permission: {
        key: {
          in: [...websitePermissionKeys]
        }
      },
      role: {
        isSystem: true,
        key: {
          notIn: [...allowedRoleKeys]
        }
      }
    }
  });

  console.info(
    `Website editor RBAC synchronized. Removed ${removed.count} unrelated system role permission links.`
  );
}

main()
  .catch((error) => {
    console.error("Website editor RBAC synchronization failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
