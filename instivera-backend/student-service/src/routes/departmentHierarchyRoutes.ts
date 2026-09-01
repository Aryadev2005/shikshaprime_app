
import express from "express";
import { getMasterDepartments, getChildDepartments, getSubjects } from "../controllers/departmentHierarchyController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/master", requireAuth, getMasterDepartments);
router.get("/master/:masterId/child", requireAuth, getChildDepartments);
router.get("/child/:childId/subjects", requireAuth, getSubjects);

export default router;
