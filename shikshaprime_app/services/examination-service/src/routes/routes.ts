import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { createExam, deleteExam, getAdminExamSummary, getAllExams, getExamById, getExamSchedulesWithDetails, getTeacherExams, getTeacherExamStudents, updateExam } from "../controllers/examController";
import { requireRole } from "../middleware/roleMiddleware";
import { addComponentToExam, createComponentTemplate, deleteComponentMapping, 
  deleteComponentTemplate, getAllTemplates, getComponentsByExam, getComponentTemplateById, 
  getTeacherExamComponents, 
  getTeacherExamMarks, 
  reorderComponents, saveTeacherMarks, submitTeacherMarks, updateComponentMapping, updateComponentTemplate } from "../controllers/examComponentController";
import { checkRoomAvailability, createExamSchedule, deleteExamSchedule, getAllExamSchedules, getExamSchedules, getUpcomingExamSchedules, updateExamSchedule } from "../controllers/examScheduleController";
import { assignExaminer, getAssignedExaminers, getEligibleExaminers, getTeacherExamSummary } from "../controllers/examinerController";
import { calculateExamResults, finaliseExamResults, getExamResults, getStudentResultDetails, getStudentResults, publishExamResults } from "../controllers/examResultController";

const router = Router();

router.get("/all", requireAuth, getAllExams);
router.post("/create", requireAuth, requireRole("admin"), createExam);
router.get("/:id", requireAuth, getExamById);
router.put("/:id", requireAuth, requireRole("admin"), updateExam);
router.delete("/:id", requireAuth, requireRole("admin"), deleteExam);

router.get("/templates/all", requireAuth, getAllTemplates);
router.post(
  "/template",
  requireAuth,
  requireRole("admin"),
  createComponentTemplate
);

// Get all components for an exam
router.get("/:examId/components", requireAuth, getComponentsByExam);

// Get specific component template
router.get(
  "/components/:templateId",
  requireAuth,
  getComponentTemplateById
);

// Update component template
router.put(
  "/components/:templateId",
  requireAuth,
  requireRole("admin"),
  updateComponentTemplate
);
// Delete component template
router.delete(
  "/components/:templateId",
  requireAuth,
  requireRole("admin"),
  deleteComponentTemplate
);

// Reorder components
router.post(
  "/:examId/components/reorder",
  requireAuth,
  requireRole("admin"),
  reorderComponents
);

router.post(
  "/:examId/components/add",
  requireAuth,
  requireRole("admin"),
  addComponentToExam
);
router.post(
  "/mappings/:mappingId",
  requireAuth,
  requireRole("admin"),
  updateComponentMapping
);
// Delete component mapping
router.delete(
  "/:examId/components/:templateId",
  requireAuth,
  requireRole("admin"),
  deleteComponentMapping
);
router.get("/schedules/details/:examId", getExamSchedulesWithDetails);

router.post("/schedule", requireAuth, createExamSchedule);
router.get("/schedules/all", getAllExamSchedules);
router.get("/schedules/upcoming", getUpcomingExamSchedules);
router.get("/schedules/:examId", requireAuth, getExamSchedules);
router.put("/schedule/update", requireAuth, updateExamSchedule);
router.delete("/schedule/:id", deleteExamSchedule);
router.post("/schedule/check-room", checkRoomAvailability);
router.get(
  "/exams/:examId/eligible-examiners",
  requireAuth,
  getEligibleExaminers
);
router.post(
  "/exams/:examId/assign-examiner",
  requireAuth,
  assignExaminer
);
router.get(
  "/exams/:examId/examiners",
  requireAuth,
  getAssignedExaminers
);
router.get("/teacher/exams/list", requireAuth, getTeacherExams);
router.get("/teacher/exams/:examId/students", requireAuth, getTeacherExamStudents);
router.get("/teacher/exams/:examId/components", requireAuth, getTeacherExamComponents);
router.get("/teacher/exams/:examId/marks", requireAuth, getTeacherExamMarks);
router.post("/teacher/marks/save", requireAuth, saveTeacherMarks);
router.post("/teacher/:examId/marks/submit", requireAuth, submitTeacherMarks);
router.get("/teacher/exams/:examId/summary",  requireAuth, getTeacherExamSummary);
router.post("/admin/exams/:examId/calculate", requireAuth, calculateExamResults);
router.post("/admin/exams/:examId/finalise-results", requireAuth, finaliseExamResults);
router.post("/admin/exams/:examId/publish", requireAuth, publishExamResults);
router.get("/admin/exams/:examId/summary", requireAuth, getAdminExamSummary);
router.get("/admin/exams/:examId/result", requireAuth, getExamResults);

router.get("/student/results", requireAuth, getStudentResults);
router.get("/student/results/:examId", requireAuth, getStudentResultDetails);

export default router;