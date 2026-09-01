import { Router } from "express";
import { ClassRoutineController } from "../controllers/classRoutineController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Metadata endpoint for dropdown selection (Classes, Academic Years, Subjects, Teachers)
router.get("/meta-data", ClassRoutineController.getRoutineMetaData);

// Student Schedule Endpoint
router.get("/student-schedule", requireAuth, ClassRoutineController.getStudentRoutine);

// Teacher Schedule Endpoint
router.get("/teacher-schedule", requireAuth, ClassRoutineController.getTeacherRoutine);

// Validate Conflicts Endpoint (Pre-submit real-time validation)
router.post("/validate-conflicts", requireAuth, ClassRoutineController.validateConflicts);

// CRUD Endpoints for Class Routines
router.get("/", requireAuth, ClassRoutineController.getAllRoutines);
router.get("/:id", requireAuth, ClassRoutineController.getRoutineById);
router.post("/", requireAuth, ClassRoutineController.createRoutine);
router.put("/:id", requireAuth, ClassRoutineController.updateRoutine);
router.delete("/:id", requireAuth, ClassRoutineController.deleteRoutine);

export default router;
