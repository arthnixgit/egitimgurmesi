import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES, PERMISSION_KEYS, ROLE_KEYS } from "../src";

const prisma = new PrismaClient();

async function main() {
  const staffManagePermission = DEFAULT_PERMISSIONS.find(
    (permission) => permission.key === PERMISSION_KEYS.staffManage
  );
  const adminRole = DEFAULT_ROLES.find((role) => role.key === ROLE_KEYS.admin);

  if (!staffManagePermission || !adminRole) {
    throw new Error("Required RBAC definitions are missing.");
  }

  await prisma.$transaction(async (tx) => {
    const permission = await tx.permission.upsert({
      where: { key: staffManagePermission.key },
      create: {
        key: staffManagePermission.key,
        name: staffManagePermission.name,
        description: staffManagePermission.description
      },
      update: {
        name: staffManagePermission.name,
        description: staffManagePermission.description
      }
    });

    const role = await tx.role.upsert({
      where: { key: adminRole.key },
      create: {
        key: adminRole.key,
        name: adminRole.name,
        description: adminRole.description,
        isSystem: true
      },
      update: {
        name: adminRole.name,
        description: adminRole.description,
        isSystem: true
      }
    });

    await tx.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id
        }
      },
      create: {
        roleId: role.id,
        permissionId: permission.id
      },
      update: {}
    });
  });

  console.log("Scoped RBAC upsert complete: admin -> staff.manage");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
