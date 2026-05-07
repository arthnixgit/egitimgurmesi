import { PrismaClient } from "@prisma/client";
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES, ROLE_KEYS } from "../src";

const prisma = new PrismaClient();

async function seedPermissions() {
  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: {
        key: permission.key,
        name: permission.name,
        description: permission.description
      }
    });
  }
}

async function seedRoles() {
  const permissions = await prisma.permission.findMany();
  const permissionIdByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));

  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description
      }
    });
  }

  const roles = await prisma.role.findMany({
    where: {
      key: {
        in: DEFAULT_ROLES.map((role) => role.key)
      }
    }
  });

  for (const role of roles) {
    const roleDefinition = DEFAULT_ROLES.find((item) => item.key === role.key);

    if (!roleDefinition) {
      continue;
    }

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    if (roleDefinition.permissions.length === 0) {
      continue;
    }

    await prisma.rolePermission.createMany({
      data: roleDefinition.permissions.map((permissionKey) => ({
        roleId: role.id,
        permissionId: permissionIdByKey.get(permissionKey)!
      }))
    });
  }
}

async function seedSuperAdminPlaceholder() {
  const existingSuperAdmin = await prisma.staffUser.findFirst({
    where: {
      roles: {
        some: {
          role: {
            key: ROLE_KEYS.superAdmin
          }
        }
      }
    }
  });

  if (existingSuperAdmin) {
    return;
  }

  console.info(
    "No super-admin staff account exists yet. Create one manually after initial migration and password setup."
  );
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedSuperAdminPlaceholder();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
