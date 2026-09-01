import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { upload } from "../middleware/fileUploadMiddleware";
import { createAcademicCalendar, getAcademicCalendars, updateAcademicCalendar } from "../controllers/naacAcademicCalendarController";
import { createProgram, getPrograms, updateProgram } from "../controllers/naacProgramController";
import { createCourse, getCourses, updateCourse } from "../controllers/naacCourseController";
import { createStudent, getStudents, updateStudent } from "../controllers/naacStudentController";
import { createStudentSupport, getStudentSupport, updateStudentSupport } from "../controllers/naacStudentSupportController";
import { createGrievance, getGrievances, updateGrievance } from "../controllers/naacGrievanceController";
import { createStudentActivity, getStudentActivities, updateStudentActivity } from "../controllers/naacStudentActivityController";
import { createPlacement, getPlacements, updatePlacement } from "../controllers/naacPlacementController";
import { createAlumni, getAlumni, updateAlumni } from "../controllers/naacAlumniController";
import { createNaacDoc, getNaacDocs, updateNaacDoc } from "../controllers/naacDocumentController";
import { createBestPractice, getBestPractices, updateBestPractice } from "../controllers/naacBestPracticeController";
import { createInstitutionalDistinctiveness, getInstitutionalDistinctiveness, updateInstitutionalDistinctiveness } from "../controllers/naacInstitutionalDistinctivenessController";
import { createFinancialDocument, getFinancialDocuments, updateFinancialDocument } from "../controllers/naacFinancialDocumentController";
import { createIqacDocument, getIqacDocuments, updateIqacDocument } from "../controllers/naacIqacDocumentController";
import { createGreenInitiative, getGreenInitiatives, updateGreenInitiative } from "../controllers/naacGreenInitiativeController";
import { createExtensionActivity, getExtensionActivities, updateExtensionActivity } from "../controllers/naacExtensionActivityController";
import { createAchievement, getAchievements, updateAchievement } from "../controllers/naacAchievementController";
import { createEvidence, getEvidence } from "../controllers/naacEvidenceController";
import { createAdmission, getAdmissions, updateAdmission } from "../controllers/naacAdmissionsController";
import { createExamResult, getExamResults, updateExamResult } from "../controllers/naacExamResultController";
import {
  createAccreditation,
  createCommittee,
  createDocument,
  createGoverningBody,
  createInstitution,
  createInstitutionalHistory,
  createVisionMission,
  updateInstitution,
  upsertNaacDocumentTitle,
  getInstitution,
  getVisionMission,
  getInstitutionalHistory,
  getGoverningBody,
  getCommittees,
  getAccreditations,
  getDocuments,
  getDocumentByTitleandinstitutionCode,
} from "../controllers/naacController";
import {
  createNaacFaculty,
  getNaacFaculty,
  createNaacPublications,
  getNaacPublications,
  createNaacFacultyAwards,
  getNaacFacultyAwards,
  createNaacPhdScholars,
  getNaacPhdScholars,
  createNaacResearchProjects,
  getNaacResearchProjects,
  createNaacPatents,
  getNaacPatents,
} from "../controllers/naacControllers";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

// ─── INSTITUTIONAL IDENTITY ────────────────────────────────────────────────
router.post("/institutions", upload.any(), createInstitution);
router.post("/institutions/:id", upload.any(), updateInstitution);
router.put("/institutions/:id", upload.any(), updateInstitution);
router.post("/vision-mission", upload.any(), createVisionMission);
router.post("/institutional-history", upload.any(), createInstitutionalHistory);
router.post("/governing-body", upload.any(), createGoverningBody);
router.post("/governing-body/:id", upload.any(), createGoverningBody);
router.put("/governing-body/:id", upload.any(), createGoverningBody);

router.post("/committees", upload.any(), createCommittee);
router.post("/committees/:id", upload.any(), createCommittee);
router.put("/committees/:id", upload.any(), createCommittee);

router.post("/accreditations", upload.any(), createAccreditation);
router.post("/accreditations/:id", upload.any(), createAccreditation);
router.put("/accreditations/:id", upload.any(), createAccreditation);

router.post("/documents", upload.any(), createDocument);
router.post("/document-by-title", upload.single("file_path"), upsertNaacDocumentTitle);

// ─── ACADEMIC & COURSES ───────────────────────────────────────────────────
router.post("/academic", upload.any(), createAcademicCalendar);
router.post("/courses", upload.any(), createCourse);
router.post("/students", upload.any(), createStudent);
router.post("/program", upload.any(), createProgram);

// ─── RESEARCH & INNOVATION ───────────────────────────────────────────────
router.post("/faculty", upload.any(), createNaacFaculty);
router.post("/faculty/:id", upload.any(), createNaacFaculty);
router.put("/faculty/:id", upload.any(), createNaacFaculty);

router.post("/publications", upload.any(), createNaacPublications);
router.post("/publications/:id", upload.any(), createNaacPublications);
router.put("/publications/:id", upload.any(), createNaacPublications);

router.post("/faculty-awards", upload.any(), createNaacFacultyAwards);
router.post("/faculty-awards/:id", upload.any(), createNaacFacultyAwards);
router.put("/faculty-awards/:id", upload.any(), createNaacFacultyAwards);

router.post("/phd-scholars", upload.any(), createNaacPhdScholars);
router.post("/phd-scholars/:id", upload.any(), createNaacPhdScholars);
router.put("/phd-scholars/:id", upload.any(), createNaacPhdScholars);

router.post("/research-projects", upload.any(), createNaacResearchProjects);
router.post("/research-projects/:id", upload.any(), createNaacResearchProjects);
router.put("/research-projects/:id", upload.any(), createNaacResearchProjects);

router.post("/patents", upload.any(), createNaacPatents);
router.post("/patents/:id", upload.any(), createNaacPatents);
router.put("/patents/:id", upload.any(), createNaacPatents);


// ─── STUDENT SUPPORT & PROGRESSION ────────────────────────────────────────
router.post("/student-support", upload.any(), createStudentSupport);
router.post("/grievances", upload.any(), createGrievance);
router.post("/student-activities", upload.any(), createStudentActivity);
router.post("/placements", upload.any(), createPlacement);
router.post("/alumni", upload.any(), createAlumni);

// ─── BEST PRACTICES & INSTITUTIONAL VALUES ────────────────────────────────
router.post("/naac-docs", upload.any(), createNaacDoc);
router.post("/best-practices", upload.any(), createBestPractice);
router.post("/institutional-distinctiveness", upload.any(), createInstitutionalDistinctiveness);
router.post("/financial-documents", upload.any(), createFinancialDocument);
router.post("/iqac-documents", upload.any(), createIqacDocument);
router.post("/green-initiatives", upload.any(), createGreenInitiative);
router.post("/extension-activities", upload.any(), createExtensionActivity);
router.post("/achievements", upload.any(), createAchievement);
router.post("/evidence", upload.any(), createEvidence);
router.post("/admission", upload.any(), createAdmission);
router.post("/examination", upload.any(), createExamResult);

// ─── GET HANDLERS ────────────────────────────────────────────────────────────
router.get("/institutions", getInstitution);
router.get("/vision-mission", getVisionMission);
router.get("/institutional-history", getInstitutionalHistory);
router.get("/governing-body", getGoverningBody);
router.get("/committees", getCommittees);
router.get("/accreditations", getAccreditations);
router.get("/documents", getDocuments);
router.get("/document-by-title", getDocumentByTitleandinstitutionCode);
router.get("/academic", getAcademicCalendars);
router.get("/program", getPrograms);
router.get("/courses", getCourses);
router.get("/students", getStudents);
router.get("/faculty", getNaacFaculty);
router.get("/publications", getNaacPublications);
router.get("/faculty-awards", getNaacFacultyAwards);
router.get("/phd-scholars", getNaacPhdScholars);
router.get("/research-projects", getNaacResearchProjects);
router.get("/patents", getNaacPatents);
router.get("/student-support", getStudentSupport);
router.get("/grievances", getGrievances);
router.get("/student-activities", getStudentActivities);
router.get("/placements", getPlacements);
router.get("/alumni", getAlumni);
router.get("/naac-docs", getNaacDocs);
router.get("/best-practices", getBestPractices);
router.get("/institutional-distinctiveness", getInstitutionalDistinctiveness);
router.get("/financial-documents", getFinancialDocuments);
router.get("/iqac-documents", getIqacDocuments);
router.get("/green-initiatives", getGreenInitiatives);
router.get("/extension-activities", getExtensionActivities);
router.get("/achievements", getAchievements);
router.get("/evidence", getEvidence);
router.get("/admission", getAdmissions);
router.get("/examination", getExamResults);

// ─── UPDATE HANDLERS ─────────────────────────────────────────────────────────
router.put("/academic/:id", upload.any(), updateAcademicCalendar);
router.put("/program/:id", upload.any(), updateProgram);
router.put("/courses/:id", upload.any(), updateCourse);
router.put("/students/:id", upload.any(), updateStudent);
router.put("/student-support/:id", upload.any(), updateStudentSupport);
router.put("/grievances/:id", upload.any(), updateGrievance);
router.put("/student-activities/:id", upload.any(), updateStudentActivity);
router.put("/placements/:id", upload.any(), updatePlacement);
router.put("/alumni/:id", upload.any(), updateAlumni);
router.put("/naac-docs/:id", upload.any(), updateNaacDoc);
router.put("/best-practices/:id", upload.any(), updateBestPractice);
router.put("/institutional-distinctiveness/:id", upload.any(), updateInstitutionalDistinctiveness);
router.put("/financial-documents/:id", upload.any(), updateFinancialDocument);
router.put("/iqac-documents/:id", upload.any(), updateIqacDocument);
router.put("/green-initiatives/:id", upload.any(), updateGreenInitiative);
router.put("/extension-activities/:id", upload.any(), updateExtensionActivity);
router.put("/achievements/:id", upload.any(), updateAchievement);
router.put("/admission/:id", upload.any(), updateAdmission);
router.put("/examination/:id", upload.any(), updateExamResult);

export default router;
