import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { uploadAssignmentFiles } from "../middleware/fileUploadMiddleware";
import dbBreaker from "../breakers/dbBreaker";

import {
    createFaculty,
    getAllFaculty,
    getFacultyById,
    getFacultyByEmployeeId,
    updateFaculty,
    deleteFaculty,
    searchFaculty,
    getFacultyByDepartment,
    getFacultyStats,
    getTeacherDashboard,
    getMyTeacherProfilePage,
    createAssignment,
    getFacultyAssignments,
    createFacultyAssignment,
    deleteFacultyAssignment,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    uploadAssignmentFiles as uploadFiles,
    getAssignmentAttachments,
    serveAssignmentFile,
    deleteAssignmentAttachment,
    getSemesters,
    getPrograms,
    getDepartments,
    getSubjects,
    getAcademicYears,
    getClasses,
    getSubmittedAssignmentsByFacultyId,
    getFacultyByUserId,
    getSubmittedAssignmentBySubmissionId,
    gradeSubmission,
} from "../controllers/facultyController";

const router = Router();

router.get("/health", (req, res) => res.status(200).json({ status: "success", message: "Health check passed", data: "ok" }));
router.get("/ready", async (req, res) => {
    const dbReady = await dbBreaker.fire();
    if (dbReady) {
        res.status(200).json({ status: "success", message: "Service is ready", data: "READY" });
    } else {
        res.status(500).json({ status: "error", message: "Service is not ready", data: "NOT READY" });
    }
});

router.get("/faculty/search", requireAuth, searchFaculty);
router.get("/faculty/stats", requireAuth, requireRole("admin"), getFacultyStats);
router.get("/dashboard/teacher", requireAuth, requireRole("teacher", "admin", "superadmin", "super_admin"), getTeacherDashboard);
router.get("/faculty/me/profile", requireAuth, requireRole("teacher", "admin", "superadmin", "super_admin"), getMyTeacherProfilePage);
router.get("/faculty/by-department/:departmentId", requireAuth, getFacultyByDepartment);
router.get("/faculty/by-employee-id/:employeeId", requireAuth, getFacultyByEmployeeId);

router.post("/faculty", requireAuth, requireRole("admin"), createFaculty);
router.get("/faculty", requireAuth, getAllFaculty);
router.get("/faculty/:id", requireAuth, getFacultyById);
router.put("/faculty/:id", requireAuth, requireRole("admin"), updateFaculty);
router.delete("/faculty/:id", requireAuth, requireRole("admin"), deleteFaculty);
router.get("/faculty/user/:id", requireAuth, getFacultyByUserId);

// Assignment Routes
router.post("/assignments", requireAuth, uploadAssignmentFiles, createAssignment); // Now supports file uploads
router.get("/assignments", requireAuth, getFacultyAssignments); // Get current user's assignments
router.get("/assignments/submitted", requireAuth, requireRole('teacher'), getSubmittedAssignmentsByFacultyId); 
router.get("/faculty/:facultyId/assignments", requireAuth, getFacultyAssignments); // Keep for backward compatibility
router.get("/assignments/:assignmentId", requireAuth, getAssignmentById);
router.put("/assignments/:assignmentId", requireAuth, uploadAssignmentFiles, updateAssignment);
router.delete("/assignments/:assignmentId", requireAuth, deleteAssignment);

// Assignment submissions (teacher grading)
router.get("/submissions/:submissionId", requireAuth, requireRole('teacher'), getSubmittedAssignmentBySubmissionId);
router.put("/submissions/:submissionId/grade", requireAuth, requireRole('teacher'), gradeSubmission);

// Assignment File Management Routes
router.post("/assignments/:assignmentId/files", requireAuth, uploadAssignmentFiles, uploadFiles);
router.get("/assignments/:assignmentId/attachments", requireAuth, getAssignmentAttachments);
router.get("/assignments/:assignmentId/files/:filename", serveAssignmentFile); // Public file access
router.delete("/assignments/:assignmentId/attachments/:attachmentId", requireAuth, deleteAssignmentAttachment);

// Legacy routes for compatibility
router.post("/faculty/:id/assignments", requireAuth, requireRole("admin"), createFacultyAssignment);
router.get("/faculty/:id/assignments", requireAuth, getFacultyAssignments);
router.delete("/faculty-assignments/:assignmentId", requireAuth, requireRole("admin"), deleteFacultyAssignment);

// Metadata Routes
router.get("/metadata/semesters", requireAuth, getSemesters);
router.get("/metadata/programs", requireAuth, getPrograms);
router.get("/metadata/departments", requireAuth, getDepartments);
router.get("/metadata/subjects", requireAuth, getSubjects);
router.get("/metadata/academic-years", requireAuth, getAcademicYears);
router.get("/metadata/classes", requireAuth, getClasses);

export default router;
