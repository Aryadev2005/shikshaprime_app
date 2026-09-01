import { Request, Response, NextFunction } from "express";
import {
  RbacServiceError,
  // assignPermissionsToUser as assignPermissionsToUserService,
  assignPermissionsToRole as assignPermissionsToRoleService,
  assignRolesToUser as assignRolesToUserService,
  assignUsersToRole as assignUsersToRoleService,
  createNewRole as createNewRoleService,
  deleteRole as deleteRoleService,
  getAllRoles as getAllRolesService,
  getAllUsers as getAllUsersService,
  getModules as getModulesService,
  getPermissionsByModule as getPermissionsByModuleService,
  getRoleById as getRoleByIdService,
  getRolePermissions as getRolePermissionsService,
  getUserById as getUserByIdService,
  getUserPermissions as getUserPermissionsService,
  getUserRoles as getUserRolesService,
  getUsersByRole as getUsersByRoleService,
  isUniqueConstraintError,
  // removePermissionFromUser as removePermissionFromUserService,
  getUserModulePermissions as getUserModulePermissionsService,
  assignModulePermissionsToUser as assignModulePermissionsToUserService,
  updateRole as updateRoleService,
  // user selects Roles checkboxes for a user ---> Update user_role(Table) ---> update user_module_permission(Table)
  assignRoleAndModulePermissions as assignRoleAndModulePermissionsService,
   // user deletes permissions from user_module_permissions (Table) ---> deletes user_id+role_id association from user_roles (Table)
  removeRoleAndModulePermissions as removeRoleAndModulePermissionsService,
} from "../services/rbacService";

function handleRbacError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
  logLabel: string
) {

  // TEST
  console.error("===== RBAC ERROR =====");
  console.error(error);
  
  if (error instanceof RbacServiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(`${logLabel} failed:`, error);
  return res.status(500).json({ message: fallbackMessage });
}

function getTenant(req: Request) {
  return (req as any).tenant as string;
}

function getRoleIdFromRequest(req: Request) {
  const queryRoleId = Number(req.query.roleId);
  if (Number.isInteger(queryRoleId) && queryRoleId > 0) {
    return queryRoleId;
  }

  const bodyRoleId = Number((req.body as any)?.roleId);
  if (Number.isInteger(bodyRoleId) && bodyRoleId > 0) {
    return bodyRoleId;
  }

  const referer = req.get("referer") || req.get("referrer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererRoleId = Number(refererUrl.searchParams.get("roleId"));
      if (Number.isInteger(refererRoleId) && refererRoleId > 0) {
        return refererRoleId;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function toNumberArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.map((item) => Number(item));
}

function parseModuleIds(value: unknown): number[] | null {
  if (value === undefined) {
    return [];
  }

  let parsed: unknown = value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      parsed = trimmed.split(",").map((item) => item.trim());
    }
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const moduleIds = parsed.map((item) => Number(item));
  const hasInvalidValue = moduleIds.some(
    (item) => !Number.isInteger(item) || item <= 0
  );

  if (hasInvalidValue) {
    return null;
  }

  return Array.from(new Set(moduleIds));
}


export class RbacController {
static async getMyPermissions(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {

  try {
    const userId = Number((req as any).user?.user_id ?? req.query.user_id);
    const data = await getUserPermissionsService(userId, getTenant(req));

    res.status(200).json({
      status: 1,
      data,
      message: "Permissions fetched successfully",
    });
  } catch (error) {
  next(error);
  }
}


// GET ALL USERS
static async getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await getAllUsersService(getTenant(req));
    res.status(200).json({
  status: 1,
  data: users,
  message: "Users fetched successfully",
});
  } catch (error) {
  next(error);
}
}



// GET ALL ROLES
static async getAllRoles(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const roles = await getAllRolesService(getTenant(req));

    res.status(200).json({
    status: 1,
    data: roles,
    message: "Roles fetched successfully",
});
  } catch (error) {
  next(error);
}
}



// GET SINGLE ROLE
  static async getRoleById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const roleId = Number(req.params.roleId);

    if (!roleId) {
      res.status(400).json({
      message: "Invalid roleId",
    });
    return;
  }

    const role = await getRoleByIdService(roleId, getTenant(req));

    res.status(200).json({
    status: 1,
    data: role,
    message: "Role fetched successfully",
    });
  } catch (error) {
  next(error);
}
}



// CREATE NEW ROLE
static async createNewRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const role_name = req.body.role_name ?? req.body.roleName;
    const { is_system_role } = req.body;
    const module_ids = parseModuleIds(
      req.body.module_ids ?? req.body.modules
    );

    if (!role_name || typeof role_name !== "string") {
      res.status(400).json({
        message: "role_name is required",
      });
      return;
    }

    if (!module_ids) {
      res.status(400).json({
        message:
          "module_ids/modules must be an array of positive integers",
      });
      return;
    }

    const role = await createNewRoleService(
      getTenant(req),
      {
        role_name,
        is_system_role,
        module_ids,
      }
    );

    res.status(201).json({
      status: 1,
      data: role,
      message: "Role created successfully",
    });

  } catch (error) {

    if (isUniqueConstraintError(error)) {
      res.status(409).json({
        message: "Role already exists",
      });
      return;
    }

    next(error);
  }
}


static async updateRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const roleId = Number(req.params.roleId);

    if (!roleId || isNaN(roleId)) {
      res.status(400).json({
        message: "Invalid roleId",
      });
      return;
    }

    const role_name = req.body.role_name ?? req.body.roleName;
    const is_system_role = req.body.is_system_role;

    const hasModuleIds =
      req.body.module_ids !== undefined ||
      req.body.modules !== undefined;

    const module_ids = hasModuleIds
      ? parseModuleIds(req.body.module_ids ?? req.body.modules)
      : undefined;

    if (
      role_name !== undefined &&
      (typeof role_name !== "string" || !role_name.trim())
    ) {
      res.status(400).json({
        message: "Invalid role_name",
      });
      return;
    }

    if (module_ids === null) {
      res.status(400).json({
        message:
          "module_ids/modules must be an array of positive integers",
      });
      return;
    }

    const role = await updateRoleService(
      roleId,
      getTenant(req),
      {
        role_name,
        module_ids,
        is_system_role,
      }
    );

    res.status(200).json({
      status: 1,
      data: role,
      message: "Role updated successfully",
    });

  } catch (error) {

    if (isUniqueConstraintError(error)) {
      res.status(409).json({
        message: "Role name already exists",
      });
      return;
    }

    next(error);
  }
}



// DELETE ROLE
static async deleteRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const roleId = Number(req.params.roleId);

    if (!roleId) {
      res.status(400).json({
        message: "Invalid roleId",
      });
      return;
    }

    await deleteRoleService(
      roleId,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      message: "Role deleted successfully",
    });

  } catch (error) {
    next(error);
  }
}


// GET SINGLE USER
static async getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      res.status(400).json({
        message: "Invalid userId",
      });
      return;
    }

    const user = await getUserByIdService(
      userId,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      data: user,
      message: "User fetched successfully",
    });

  } catch (error) {
    next(error);
  }
}




// GET USER ROLES
static async getUserRoles(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      res.status(400).json({
        message: "Invalid userId",
      });
      return;
    }

    const roles = await getUserRolesService(
      userId,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      data: roles,
      message: "User roles fetched successfully",
    });

  } catch (error) {
    next(error);
  }
}


// GET USER PERMISSIONS
static async getUserPermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);

    if (!userId || isNaN(userId)) {
      res.status(400).json({
        message: "Invalid userId",
      });
      return;
    }

    const permissions = await getUserPermissionsService(
      userId,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      data: permissions,
      message: "User permissions fetched successfully",
    });

  } catch (error) {
    next(error);
  }
}




// ASSIGN ROLES TO USER
static async assignRolesToUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);
    const roleIds = toNumberArray(req.body.roleIds);

    if (!userId) {
      res.status(400).json({
        message: "Invalid userId",
      });
      return;
    }

    if (!roleIds) {
      res.status(400).json({
        message: "roleIds must be an array",
      });
      return;
    }

    await assignRolesToUserService(
      userId,
      roleIds,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      message: "Roles assigned to user successfully",
    });

  } catch (error) {
    next(error);
  }
}



// GET USERS BY ROLE
static async getUsersByRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const roleId = Number(req.params.roleId);

    if (!roleId) {
      res.status(400).json({
        message: "Invalid roleId",
      });
      return;
    }

    const users = await getUsersByRoleService(
      roleId,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      data: users,
      message: "Users for role fetched successfully",
    });

  } catch (error) {
    next(error);
  }
}


// ASSIGN USERS TO ROLE
static async assignUsersToRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const roleId = Number(req.params.roleId);
    const userIds = toNumberArray(req.body.userIds);

    if (!roleId) {
      res.status(400).json({
        message: "Invalid roleId",
      });
      return;
    }

    if (!userIds) {
      res.status(400).json({
        message: "userIds must be an array",
      });
      return;
    }

    await assignUsersToRoleService(
      roleId,
      userIds,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      message: "Users assigned to role successfully",
    });

  } catch (error) {
    next(error);
  }
}



// GET ALL MODULES
static async getModules(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const modules = await getModulesService(
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      data: modules,
      message: "Modules fetched successfully",
    });

  } catch (error) {
    next(error);
  }
}





// GET PERMISSIONS BY MODULE
static async getPermissionsByModule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const moduleId = Number(req.params.moduleId);

    if (!moduleId) {
      res.status(400).json({
        message: "Invalid moduleId",
      });
      return;
    }

    const permissions = await getPermissionsByModuleService(
      moduleId,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      data: permissions,
      message: "Permissions fetched successfully",
    });

  } catch (error) {
    next(error);
  }
}


// GET PERMISSIONS OF A ROLE
static async getRolePermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const roleId = Number(req.params.roleId);

    if (!roleId || isNaN(roleId)) {
      res.status(400).json({
        message: "Invalid roleId",
      });
      return;
    }

    const permissions = await getRolePermissionsService(
      roleId,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      data: permissions,
      message: "Role permissions fetched successfully",
    });

  } catch (error) {
    next(error);
  }
}





// ASSIGN PERMISSIONS TO ROLE
static async assignPermissionsToRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const roleId = Number(req.params.roleId);
    const permissionIds = toNumberArray(req.body.permissionIds);

    if (!roleId || isNaN(roleId)) {
      res.status(400).json({
        message: "Invalid roleId",
      });
      return;
    }

    if (!permissionIds) {
      res.status(400).json({
        message: "permissionIds must be an array",
      });
      return;
    }

    await assignPermissionsToRoleService(
      roleId,
      permissionIds,
      getTenant(req)
    );

    res.status(200).json({
      status: 1,
      message: "Permissions assigned to role successfully",
    });

  } catch (error) {
    next(error);
  }
}




// Get User Module Permissions
static async getUserModulePermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);

    if (!userId || isNaN(userId)) {
      res.status(400).json({
        message: "Invalid userId",
      });
      return;
    }

    const permissions =
      await getUserModulePermissionsService(
        userId,
        getTenant(req)
      );

    res.status(200).json({
      status: 1,
      data: permissions,
      message: "User module permissions fetched successfully",
    });

  } catch (error) {
    next(error);
  }
}

//Assign permissions to user
static async assignModulePermissionsToUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);

    if (!userId || isNaN(userId)) {
      res.status(400).json({
        message: "Invalid userId",
      });
      return;
    }

    const permissions = req.body.permissions;
    const roleId = getRoleIdFromRequest(req);

    if (!Array.isArray(permissions)) {
      res.status(400).json({
        message: "permissions must be an array",
      });
      return;
    }

    await assignModulePermissionsToUserService(
      userId,
      permissions,
      getTenant(req),
      roleId ?? undefined
    );

    res.status(200).json({
      status: 1,
      message: "User module permissions updated successfully",
    });

  } catch (error) {
    next(error);
  }
}


/* Roles Tab on Nav Panel ---> user selects checkboxes for a 
      user ---> 
      Update user_role(Table) ---> 
      update user_module_permission(Table)
*/
static async assignRoleAndModulePermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);

    const { role_id, permissions } = req.body;

    if (!userId) {
      res.status(400).json({
        message: "Invalid userId",
      });
      return;
    }

    if (!role_id) {
      res.status(400).json({
        message: "role_id is required",
      });
      return;
    }

    if (!Array.isArray(permissions)) {
      res.status(400).json({
        message: "permissions must be an array",
      });
      return;
    }

    const result =
      await assignRoleAndModulePermissionsService(
        getTenant(req),
        userId,
        role_id,
        permissions
      );

    res.status(200).json({
      status: 1,
      data: result,
      message:
        "Role and module permissions assigned successfully",
    });

  } catch (error) {
    next(error);
  }
}




/* Roles Tab on Nav Panel ---> user clicks "DELETE" for a 
      user ---> 
      DELETE row mapping user_id-role_id-module_id-permissions(for that nodule) in user_role(Table) ---->
      DELETE row mapping user_id-role_id in user_role(Table) ---> 
*/
static async removeRoleAndModulePermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);
    const roleId = Number(req.params.roleId);

    if (!userId) {
      res.status(400).json({
        message: "Invalid userId",
      });
      return;
    }

    if (!roleId) {
      res.status(400).json({
        message: "Invalid roleId",
      });
      return;
    }

    const result =
      await removeRoleAndModulePermissionsService(
        getTenant(req),
        userId,
        roleId
      );

    res.status(200).json({
      status: 1,
      data: result,
      message:
        "Role and module permissions removed successfully",
    });

  } catch (error) {
    next(error);
  }
}

}
