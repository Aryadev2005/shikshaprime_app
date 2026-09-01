import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

import { RbacController } from "../controllers/rbacController";

const router = Router();

router.get("/permissions", RbacController.getMyPermissions);
router.get("/getAllUsers", RbacController.getAllUsers);
router.get("/roles", RbacController.getAllRoles);
router.get("/roles/:roleId", RbacController.getRoleById);
router.post("/createNewRole",requireAuth, requireRole("admin"), RbacController.createNewRole); //admin only middleware
router.put("/roles/:roleId", requireAuth, requireRole("admin"),RbacController.updateRole); //admin only middleware
router.delete("/roles/:roleId", requireAuth, requireRole("admin"), RbacController.deleteRole); //admin only middleware
router.get("/users/:userId", RbacController.getUserById);
router.get("/users/:userId/roles", RbacController.getUserRoles);
router.post("/users/:userId/roles", requireAuth, requireRole("admin"), RbacController.assignRolesToUser); //admin only middleware
router.get("/roles/:roleId/users", RbacController.getUsersByRole);
router.post("/roles/:roleId/users", requireAuth, requireRole("admin"), RbacController.assignUsersToRole); //admin only middleware
router.get("/modules", RbacController.getModules);
router.get("/modules/:moduleId/permissions", RbacController.getPermissionsByModule);
router.get("/roles/:roleId/permissions", RbacController.getRolePermissions);
router.post("/roles/:roleId/permissions", requireAuth, requireRole("admin"), RbacController.assignPermissionsToRole); //admin only middleware
router.get("/users/:userId/module-permissions", RbacController.getUserModulePermissions);
router.post("/users/:userId/module-permissions", requireAuth, requireRole("admin"), RbacController.assignModulePermissionsToUser); //admin only middleware
/* To UPDATE role_id+user_id Mapping in user_role (Table) ---->  UPDATE user_module_permissions (Table) when user
 selects tick boxes in Roles tab + Clicks "SAVE" button in Shiksha prime front-end*/
router.post("/users/:userId/role-module-permissions", requireAuth, requireRole("admin"), RbacController.assignRoleAndModulePermissions); //admin only middleware
/* To DELETE role_id+user_id Mapping in user_role (Table) ---->  DELETE user_module_permissions (Table) when user
 clicks "DELETE" in Shiksha prime front-end*/
router.delete("/users/:userId/roles/:roleId", requireAuth, requireRole("admin"), RbacController.removeRoleAndModulePermissions); //admin only middleware

export default router;