import { Router } from "express";
import { hierarchyController } from "../controllers/hierarchyController";
import { requireAuth } from "../middleware/authMiddleware";
import { tenantMiddleware } from "../middleware/tenantMiddleware";

const router = Router();

// Publicly available within tenant context but requires authentication
router.get("/departments", requireAuth, tenantMiddleware, hierarchyController.getDepartments);
router.get("/programs", requireAuth, tenantMiddleware, hierarchyController.getPrograms);
router.get("/classes", requireAuth, tenantMiddleware, hierarchyController.getClasses);
router.get("/semesters", requireAuth, tenantMiddleware, hierarchyController.getSemesters);
router.get("/subjects", requireAuth, tenantMiddleware, hierarchyController.getSubjects);
router.get("/academic-years", requireAuth, tenantMiddleware, hierarchyController.getAcademicYears);

export default router;
