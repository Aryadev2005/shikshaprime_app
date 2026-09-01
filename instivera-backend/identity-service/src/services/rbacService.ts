import { col, fn, Op, UniqueConstraintError } from "sequelize";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

const USER_ATTRIBUTES = [
  "user_id",
  "username",
  "email",
  "first_name",
  "last_name",
  "role",
  "user_type",
  "is_active",
  "created_at",
  "updated_at",
];

export class RbacServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const isUniqueConstraintError = (error: unknown) =>
  error instanceof UniqueConstraintError;

function normalizePermissionAction(permissionKey: string) {
  const parts = permissionKey.split(".");
  return parts[parts.length - 1] || permissionKey;
}

function parseModuleIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item > 0);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0);
    }
  }

  return [];
}

function toPermissionBoolean(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return Boolean(value);
}

function hasSameModuleIds(firstIds: number[], secondIds: number[]) {
  if (firstIds.length !== secondIds.length) {
    return false;
  }

  const firstIdSet = new Set(firstIds);
  return secondIds.every((moduleId) => firstIdSet.has(moduleId));
}

export async function getUserPermissions(userId: number, tenant: string) {
  const {
  User,
  Role,
  Permission,
  Module,
} = getTenantModels(tenant);
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: "roles",
        through: { attributes: [] },
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
            include: [
              {
                model: Module,
                as: "module",
              },
            ],
          },
        ],
      },
    ],
  });

  if (!user) {
    return {};
  }

  const permissions: Record<string, string[]> = {};
  const plainUser = user.get({ plain: true }) as any;

  (plainUser.roles || []).forEach((role: any) => {
    (role.permissions || []).forEach((permission: any) => {
      const moduleName = permission.module?.module_name;
      if (!moduleName || !permission.permission_key) return;

      if (!permissions[moduleName]) {
        permissions[moduleName] = [];
      }

      const action = normalizePermissionAction(permission.permission_key);
      if (!permissions[moduleName].includes(action)) {
        permissions[moduleName].push(action);
      }
    });
  });

  return permissions;
}

export async function getAllUsers(tenant: string) {
  const { User, UserModulePermission } = getTenantModels(tenant);

  const users = await User.findAll({
    attributes: USER_ATTRIBUTES,
    order: [["created_at", "DESC"]],
    raw: true,
  });

  const userIds = users.map((u: any) => u.user_id);

  const modulePermissions = await UserModulePermission.findAll({
    where: {
      user_id: {
        [Op.in]: userIds,
      },
    },
    raw: true,
  });

  const modulesByUser: Record<number, any[]> = {};

  modulePermissions.forEach((item: any) => {
  if (!modulesByUser[item.user_id]) {
    modulesByUser[item.user_id] = [];
  }

  modulesByUser[item.user_id].push({
    module_id: item.module_id,
    can_view: item.can_view,
    can_edit: item.can_edit,
  });
});
  return users.map((user: any) => ({
    ...user,
    modules: modulesByUser[user.user_id] || [],
  }));
}


export async function getAllRoles(tenant: string) {
  const { Role, UserRole } = getTenantModels(tenant);

  const roles = await Role.findAll({
    attributes: [
      "role_id",
      "role_name",
      "module_ids",
      "is_system_role",
      "created_at",
      "updated_at",
      [fn("COUNT", col("userRoles.user_id")), "user_count"],
    ],
    include: [
      {
        model: UserRole,
        as: "userRoles",
        attributes: [],
        required: false,
      },
    ],
    group: [
      "Role.role_id",
      "Role.role_name",
      "Role.module_ids",
      "Role.is_system_role",
      "Role.created_at",
      "Role.updated_at",
    ],
    order: [["created_at", "DESC"]],
    raw: true,
  });

  const roleUserMappings = await UserRole.findAll({
  attributes: ["role_id", "user_id"],
  raw: true,
});

const usersByRole: Record<number, number[]> = {};

roleUserMappings.forEach((item: any) => {
  if (!usersByRole[item.role_id]) {
    usersByRole[item.role_id] = [];
  }

  usersByRole[item.role_id].push(item.user_id);
});

  return roles.map((role: any) => ({
  ...role,
  modules: parseModuleIds(role.module_ids),
  users: usersByRole[role.role_id] || [],
}));
}

export async function getRoleById(roleId: number, tenant: string) {
  const { Role, UserRole } = getTenantModels(tenant);
  const role = await Role.findByPk(roleId);

  if (!role) {
    throw new RbacServiceError("Role not found", 404);
  }

  const userCount = await UserRole.count({ where: { role_id: roleId } });
  const plainRole = role.get({ plain: true }) as any;

  return {
    ...plainRole,
    modules: parseModuleIds(plainRole.module_ids),
    user_count: userCount,
  };
}

export async function createNewRole(
  tenant: string,
  params: {
    role_name: string;
    module_ids?: number[];
    is_system_role?: boolean;
  }
) {
  const { Role } = getTenantModels(tenant);
  return Role.create({
    role_name: params.role_name.trim(),
    module_ids:
      params.module_ids && params.module_ids.length > 0
        ? JSON.stringify(params.module_ids)
        : null,
    is_system_role: Boolean(params.is_system_role),
  });
}

export async function updateRole(
  roleId: number,
  tenant: string,
  params: {
    role_name?: string;
    module_ids?: number[];
    is_system_role?: boolean;
  }
) {
  const { Role } = getTenantModels(tenant);

  const role = await Role.findByPk(roleId);

  if (!role) {
    throw new RbacServiceError("Role not found", 404);
  }

  // NO SYSTEM ROLE RESTRICTION

  if (params.role_name !== undefined) {
    role.role_name = params.role_name.trim();
  }

  if (params.module_ids !== undefined) {
    role.module_ids =
      params.module_ids.length > 0
        ? JSON.stringify(params.module_ids)
        : null;
  }

  if (params.is_system_role !== undefined) {
    role.is_system_role = params.is_system_role;
  }

  await role.save();

  return role.reload();
}

export async function deleteRole(roleId: number, tenant: string) {
  const { Role, UserRole } = getTenantModels(tenant);
  const role = await Role.findByPk(roleId);

  if (!role) {
    throw new RbacServiceError("Role not found", 404);
  }

  if (role.is_system_role) {
    throw new RbacServiceError("Active roles cannot be deleted. Please deactivate the role before deleting it.", 403);
  }                           

  const assignedUserCount = await UserRole.count({ where: { role_id: roleId } });

  if (assignedUserCount > 0) {
    throw new RbacServiceError("Role is assigned to users and cannot be deleted", 400);
  }

  await role.destroy();
}

export async function getUserById(userId: number, tenant: string) {
  const { User } = getTenantModels(tenant);
  const user = await User.findByPk(userId, {
    attributes: USER_ATTRIBUTES,
    raw: true,
  });

  if (!user) {
    throw new RbacServiceError("User not found", 404);
  }

  return user;
}

export async function getUserRoles(userId: number, tenant: string) {
  const { Role, User } = getTenantModels(tenant);

  const roles = await Role.findAll({
    attributes: [
      "role_id",
      "role_name",
      "module_ids",
      "is_system_role",
      "created_at",
      "updated_at",
    ],
    include: [
      {
        model: User,
        as: "users",
        attributes: [],
        through: { attributes: [] },
        where: { user_id: userId },
      },
    ],
    raw: true,
  });

  return roles.map((role: any) => ({
    ...role,
    modules: parseModuleIds(role.module_ids),
  }));
}

export async function assignRolesToUser(userId: number, roleIds: number[], tenant: string) {
  const { User, Role, UserRole } = getTenantModels(tenant);
  const sequelize = getTenantSequelize(tenant);

  const user = await User.findByPk(userId, { attributes: ["user_id"] });
  if (!user) {
    throw new RbacServiceError("User not found", 404);
  }

  if (roleIds.length > 0) {
    const roleCount = await Role.count({
      where: { role_id: { [Op.in]: roleIds } },
    });

    if (roleCount !== roleIds.length) {
      throw new RbacServiceError("One or more roleIds are invalid", 400);
    }
  }

  await sequelize.transaction(async (transaction) => {
    await UserRole.destroy({
      where: { user_id: userId },
      transaction,
    });

    if (roleIds.length > 0) {
      await UserRole.bulkCreate(
        roleIds.map((roleId) => ({
          user_id: userId,
          role_id: roleId,
        })),
        { transaction }
      );
    }
  });
}

export async function getUsersByRole(roleId: number, tenant: string) {
  const { User, Role } = getTenantModels(tenant);

  return User.findAll({
    attributes: [
      "user_id",
      "username",
      "email",
      "first_name",
      "last_name",
      "is_active",
      "created_at",
    ],
    include: [
      {
        model: Role,
        as: "roles",
        attributes: [],
        through: { attributes: [] },
        where: { role_id: roleId },
      },
    ],
    order: [["created_at", "DESC"]],
    raw: true,
  });
}

export async function assignUsersToRole(roleId: number, userIds: number[], tenant: string) {
  const { Role, User, UserRole } = getTenantModels(tenant);
  const sequelize = getTenantSequelize(tenant);

  const role = await Role.findByPk(roleId, { attributes: ["role_id"] });
  if (!role) {
    throw new RbacServiceError("Role not found", 404);
  }

  if (userIds.length > 0) {
    const userCount = await User.count({
      where: { user_id: { [Op.in]: userIds } },
    });

    if (userCount !== userIds.length) {
      throw new RbacServiceError("One or more userIds are invalid", 400);
    }
  }

  await sequelize.transaction(async (transaction) => {
    await UserRole.destroy({
      where: { role_id: roleId },
      transaction,
    });

    if (userIds.length > 0) {
      await UserRole.bulkCreate(
        userIds.map((userId) => ({
          user_id: userId,
          role_id: roleId,
        })),
        { transaction }
      );
    }
  });
}

export async function getModules(tenant: string) {
  const { Module } = getTenantModels(tenant);

  return Module.findAll({
    attributes: ["module_id", "module_name", "module_key", "created_at"],
    order: [["module_name", "ASC"]],
    raw: true,
  });
}

export async function getPermissionsByModule(moduleId: number, tenant: string) {
  const { Permission } = getTenantModels(tenant);

  return Permission.findAll({
    attributes: [
      "permission_id",
      "module_id",
      "permission_key",
      "permission_name",
      "created_at",
    ],
    where: { module_id: moduleId },
    order: [["permission_key", "ASC"]],
    raw: true,
  });
}

export async function getRolePermissions(roleId: number, tenant: string) {
  const { RolePermission, Permission, Module } = getTenantModels(tenant);
  const rolePermissions = await RolePermission.findAll({
    attributes: ["role_id"],
    where: { role_id: roleId },
    include: [
      {
        model: Permission,
        as: "permission",
        attributes: ["permission_id", "module_id", "permission_key", "permission_name"],
        include: [
          {
            model: Module,
            as: "module",
            attributes: ["module_name", "module_key"],
          },
        ],
      },
    ],
  });

  return rolePermissions
    .map((rolePermission) => {
      const item = rolePermission.get({ plain: true }) as any;
      const permission = item.permission;

      return {
        role_id: item.role_id,
        permission_id: permission?.permission_id,
        module_id: permission?.module_id,
        module_name: permission?.module?.module_name,
        module_key: permission?.module?.module_key,
        permission_key: permission?.permission_key,
        permission_name: permission?.permission_name,
      };
    })
    .sort((first, second) => {
      const moduleCompare = String(first.module_name || "").localeCompare(
        String(second.module_name || "")
      );

      if (moduleCompare !== 0) {
        return moduleCompare;
      }

      return String(first.permission_key || "").localeCompare(
        String(second.permission_key || "")
      );
    });
}


export async function getUserModulePermissions(
  userId: number,
  tenant: string
) {
  const models = getTenantModels(tenant);

  return await models.UserModulePermission.findAll({
    where: { user_id: userId },
    include: [
      {
        model: models.Module,
        as: "module",
      },
    ],
  });
}



export async function assignModulePermissionsToUser(
  userId: number,
  permissions: {
    module_id: number;
    can_view: boolean;
    can_edit: boolean;
  }[],
  tenant: string,
  roleId?: number
) {
  const models = getTenantModels(tenant);
  const sequelize = getTenantSequelize(tenant);

  const user = await models.User.findByPk(userId, { attributes: ["user_id"] });
  if (!user) {
    throw new RbacServiceError("User not found", 404);
  }

  const normalizedPermissions = permissions
    .map((permission) => ({
      module_id: Number(permission.module_id),
      can_view: toPermissionBoolean(permission.can_view),
      can_edit: toPermissionBoolean(permission.can_edit),
    }))
    .filter(
      (permission) =>
        Number.isInteger(permission.module_id) && permission.module_id > 0
    );

  if (normalizedPermissions.length !== permissions.length) {
    throw new RbacServiceError("One or more module_ids are invalid", 400);
  }

  const moduleIds = Array.from(
    new Set(normalizedPermissions.map((permission) => permission.module_id))
  );

  if (moduleIds.length === 0) {
    return true;
  }

  const moduleCount = await models.Module.count({
    where: { module_id: { [Op.in]: moduleIds } },
  });

  if (moduleCount !== moduleIds.length) {
    throw new RbacServiceError("One or more module_ids are invalid", 400);
  }

  let roleIdsToSync: number[] = [];

  if (roleId !== undefined) {
    const targetRole = await models.Role.findByPk(roleId, {
      attributes: ["role_id", "module_ids"],
      raw: true,
    });

    if (!targetRole) {
      throw new RbacServiceError("Role not found", 404);
    }

    const targetRoleModuleIds = parseModuleIds((targetRole as any).module_ids);

    if (!hasSameModuleIds(targetRoleModuleIds, moduleIds)) {
      throw new RbacServiceError("module_ids do not match role", 400);
    }

    roleIdsToSync = [Number((targetRole as any).role_id)];
  } else {
    const roles = await models.Role.findAll({
      attributes: ["role_id", "module_ids"],
      raw: true,
    });

    roleIdsToSync = roles
      .filter((role: any) => {
        const roleModuleIds = parseModuleIds(role.module_ids);
        return hasSameModuleIds(roleModuleIds, moduleIds);
      })
      .map((role: any) => Number(role.role_id))
      .filter((candidateRoleId: number) => Number.isInteger(candidateRoleId) && candidateRoleId > 0);
  }

  await sequelize.transaction(async (transaction) => {
    await models.UserModulePermission.destroy({
      where: {
        user_id: userId,
        module_id: { [Op.in]: moduleIds },
      },
      transaction,
    });

    const rowsToInsert = normalizedPermissions
      .filter((permission) => permission.can_view || permission.can_edit)
      .map((permission) => ({
        user_id: userId,
        module_id: permission.module_id,
        can_view: permission.can_view,
        can_edit: permission.can_edit,
      }));

    if (rowsToInsert.length > 0) {
      await models.UserModulePermission.bulkCreate(rowsToInsert, {
        transaction,
      });
    }

    if (roleIdsToSync.length > 0) {
      await models.UserRole.destroy({
        where: {
          user_id: userId,
          role_id: { [Op.in]: roleIdsToSync },
        },
        transaction,
      });

      if (rowsToInsert.length > 0) {
        await models.UserRole.bulkCreate(
          roleIdsToSync.map((currentRoleId) => ({
            user_id: userId,
            role_id: currentRoleId,
          })),
          { transaction }
        );
      }
    }
  });

  return true;
}

export async function assignPermissionsToRole(
  roleId: number,
  permissionIds: number[],
  tenant: string
) {
  const { Role, Permission, RolePermission } = getTenantModels(tenant);
  const sequelize = getTenantSequelize(tenant);

  const role = await Role.findByPk(roleId, { attributes: ["role_id"] });
  if (!role) {
    throw new RbacServiceError("Role not found", 404);
  }

  if (permissionIds.length > 0) {
    const permissionCount = await Permission.count({
      where: { permission_id: { [Op.in]: permissionIds } },
    });

    if (permissionCount !== permissionIds.length) {
      throw new RbacServiceError("One or more permissionIds are invalid", 400);
    }
  }

  await sequelize.transaction(async (transaction) => {
    await RolePermission.destroy({
      where: { role_id: roleId },
      transaction,
    });

    if (permissionIds.length > 0) {
      await RolePermission.bulkCreate(
        permissionIds.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        })),
        { transaction }
      );
    }
  });
}

/* RBAC Tab on Nav Panel ---> user selects checkboxes for a 
      user ---> 
      Update user_role(Table) ---> 
      update user_module_permission(Table)
*/
export async function assignRoleAndModulePermissions(
  tenant: string,
  userId: number,
  roleId: number,
  permissions: {
    module_id: number;
    can_view: boolean;
    can_edit: boolean;
  }[]
) {
  const models = getTenantModels(tenant);
  const sequelize = getTenantSequelize(tenant);

  const user = await models.User.findByPk(userId);

  if (!user) {
    throw new RbacServiceError("User not found", 404);
  }

  const role = await models.Role.findByPk(roleId);

  if (!role) {
    throw new RbacServiceError("Role not found", 404);
  }


  await sequelize.transaction(async (transaction) => {

    const existingRole = await models.UserRole.findOne({
      where: {
        user_id: userId,
        role_id: roleId,
      },
      transaction,
    });

    if (!existingRole) {
      await models.UserRole.create(
        {
          user_id: userId,
          role_id: roleId,
        },
        { transaction }
      );
    }

    for (const permission of permissions) {
      await models.UserModulePermission.upsert(
        {
          user_id: userId,
          role_id: roleId,
          module_id: permission.module_id,
          can_view: permission.can_view,
          can_edit: permission.can_edit,
        },
        {
          transaction,
        }
      );
    }
  });

  return {
    user_id: userId,
    role_id: roleId,
  };
}


/* RBAC Tab on Nav Panel ---> user clicks "DELETE" for a 
      user ---> 
      DELETE row mapping user_id-role_id-module_id-permissions(for that nodule) in user_role(Table) ---->
      DELETE row mapping user_id-role_id in user_role(Table) ---> 
*/
export async function removeRoleAndModulePermissions(
  tenant: string,
  userId: number,
  roleId: number
) {
  const models = getTenantModels(tenant);
  const sequelize = getTenantSequelize(tenant);

  await sequelize.transaction(async (transaction) => {

    await models.UserModulePermission.destroy({
      where: {
        user_id: userId,
        role_id: roleId,
      },
      transaction,
    });

    await models.UserRole.destroy({
      where: {
        user_id: userId,
        role_id: roleId,
      },
      transaction,
    });

  });

  return {
    user_id: userId,
    role_id: roleId,
  };
}
