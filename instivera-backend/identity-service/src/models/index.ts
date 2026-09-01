// src/models/index.ts
import { config } from "../config";
import { Sequelize } from "sequelize";

// Global (shared) Sequelize instance – for system tables, tenant registry, etc.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: Number(config.db.port),
  dialect: "mysql",
  dialectOptions: {
    connectTimeout: 60000
  }
});

// Test the global connection
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

export function getMainModels() {
  const Tenant = defineTenant(sequelize);
  return { Tenant};
}
import { defineUser } from "./tenant/Users";
import { getTenantSequelize } from "../server";
import { defineNotice } from "./tenant/Notice";
import { defineModule } from "./tenant/Modules";
import { definePermission } from "./tenant/Permissions";
import { defineRole } from "./tenant/Roles";
import { defineRolePermission } from "./tenant/RolePermissions";
import { defineUserRole } from "./tenant/UserRoles";
import { defineUserModulePermission } from "./tenant/UserModulePermissions";
import { defineTenant } from "./main/Tenants";
import { defineClassRoutine } from "./tenant/ClassRoutine";
import { defineClassRoutineEntry } from "./tenant/ClassRoutineEntry";


// Tenant‑aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  const User = defineUser(sequelize);
  const Notice = defineNotice(sequelize);
  const Role = defineRole(sequelize);
  const Permission = definePermission(sequelize);
  const Module = defineModule(sequelize);
  const UserRole = defineUserRole(sequelize);
  const RolePermission = defineRolePermission(sequelize);
  const UserModulePermission = defineUserModulePermission(sequelize);
  const ClassRoutine = defineClassRoutine(sequelize);
  const ClassRoutineEntry = defineClassRoutineEntry(sequelize);

  if (!User.associations.roles) {
    User.belongsToMany(Role, {
      through: UserRole,
      foreignKey: "user_id",
      otherKey: "role_id",
      as: "roles",
    });
  }

  if (!Role.associations.users) {
    Role.belongsToMany(User, {
      through: UserRole,
      foreignKey: "role_id",
      otherKey: "user_id",
      as: "users",
    });
  }

  if (!Role.associations.permissions) {
    Role.belongsToMany(Permission, {
      through: RolePermission,
      foreignKey: "role_id",
      otherKey: "permission_id",
      as: "permissions",
    });
  }

  if (!Permission.associations.roles) {
    Permission.belongsToMany(Role, {
      through: RolePermission,
      foreignKey: "permission_id",
      otherKey: "role_id",
      as: "roles",
    });
  }

  if (!Module.associations.permissions) {
    Module.hasMany(Permission, {
      foreignKey: "module_id",
      as: "permissions",
    });
  }

  if (!Permission.associations.module) {
    Permission.belongsTo(Module, {
      foreignKey: "module_id",
      as: "module",
    });
  }

  if (!User.associations.userRoles) {
    User.hasMany(UserRole, {
      foreignKey: "user_id",
      as: "userRoles",
    });
  }

  if (!Role.associations.userRoles) {
    Role.hasMany(UserRole, {
      foreignKey: "role_id",
      as: "userRoles",
    });
  }

  if (!UserRole.associations.user) {
    UserRole.belongsTo(User, {
      foreignKey: "user_id",
      as: "user",
    });
  }

  if (!UserRole.associations.role) {
    UserRole.belongsTo(Role, {
      foreignKey: "role_id",
      as: "role",
    });
  }

  if (!User.associations.modulePermissions) {
  User.hasMany(UserModulePermission, {
    foreignKey: "user_id",
    as: "modulePermissions",
  });
}

if (!Module.associations.UserModulePermissions) {
  Module.hasMany(UserModulePermission, {
    foreignKey: "module_id",
    as: "UserModulePermissions",
  });
}

if (!UserModulePermission.associations.user) {
  UserModulePermission.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
}

if (!UserModulePermission.associations.module) {
  UserModulePermission.belongsTo(Module, {
    foreignKey: "module_id",
    as: "module",
  });
}

  if (!Role.associations.rolePermissions) {
    Role.hasMany(RolePermission, {
      foreignKey: "role_id",
      as: "rolePermissions",
    });
  }

  if (!Permission.associations.rolePermissions) {
    Permission.hasMany(RolePermission, {
      foreignKey: "permission_id",
      as: "rolePermissions",
    });
  }

  if (!RolePermission.associations.role) {
    RolePermission.belongsTo(Role, {
      foreignKey: "role_id",
      as: "role",
    });
  }

  if (!RolePermission.associations.permission) {
    RolePermission.belongsTo(Permission, {
      foreignKey: "permission_id",
      as: "permission",
    });
  }

  if (!ClassRoutine.associations.entries) {
    ClassRoutine.hasMany(ClassRoutineEntry, {
      foreignKey: "routine_id",
      as: "entries",
    });
  }

  if (!ClassRoutineEntry.associations.routine) {
    ClassRoutineEntry.belongsTo(ClassRoutine, {
      foreignKey: "routine_id",
      as: "routine",
    });
  }

  return {
    User,
    Notice,
    Role,
    Permission,
    Module,
    UserRole,
    RolePermission,
    UserModulePermission,
    ClassRoutine,
    ClassRoutineEntry,
  };
}
