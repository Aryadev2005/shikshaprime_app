import { Router } from 'express';
import { upload } from '../middleware/fileUploadMiddleware';
import { registerApplicant } from '../controllers/registrationController';
import { getAddressDetails, getDepertment, getDocuments, getGuardianDetails, getPersonalDetails, getPreview, getProgram, getProgramSelection, getSubject, getTenthResultDetails, getTwelfthResultDetails, previewConfirm, saveAddress, saveDocuments, saveGuardianDetails, saveHigherSecondaryResult, savePersonalDetails, saveSecondaryResult, saveSubject } from '../controllers/applicationController';
import { approveStudentForReadmission, autoCreatePendingReadmission, checkEligibilityForReadmission, getReadmissionDetailsForStudent, getReadmissionRequest, getReadmissionRules, readmissionConfirmationByStudent } from '../controllers/readmissionController';
import { requireAuth } from '../middleware/authMiddleware';
import { bulkUpdateRegistrationStatus, createStudent, getAllStudent, getAllStudentReports, getStudentById, getStudentDetails, semesters, updateStudent } from '../controllers/studentDetailsController';
import { requireRole } from "../middleware/roleMiddleware";
import { allStudentUpdate } from '../controllers/studentAdmissionController';
import { allSubjects, studentResult, studentResultUpload } from '../controllers/studentResultController';

const router = Router();

router.post("/registerApplicant", upload.any(), registerApplicant);
router.get("/application/program-selection", requireAuth, getProgramSelection);
router.get("/application/program", requireAuth, getProgram);
router.post("/application/personal-details",
  requireAuth,
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "bank_proof_document", maxCount: 1 }
  ]),
  savePersonalDetails
);
router.post("/application/address-details", requireAuth, saveAddress);
router.post("/application/guardian-details", requireAuth, saveGuardianDetails);
router.post("/application/secondary-result", requireAuth, saveSecondaryResult);
router.post("/application/higher-seconday-result", requireAuth, saveHigherSecondaryResult);
router.post("/application/upload-documents",
  requireAuth,
  upload.fields([
    { name: "identity_proof", maxCount: 1 },
    { name: "tenth_marksheet", maxCount: 1 },
    { name: "twelfth_marksheet", maxCount: 1 },
    { name: "age_proof", maxCount: 1 }
  ]),
  saveDocuments
);
router.get("/application/preview", requireAuth, getPreview);
router.get("/application/personal-details", requireAuth, getPersonalDetails);
router.get("/application/address-details", requireAuth, getAddressDetails);
router.get("/application/guardian-details", requireAuth, getGuardianDetails);
router.get("/application/secondary-result", requireAuth, getTenthResultDetails);
router.get("/application/higher-seconday-result", requireAuth, getTwelfthResultDetails);
router.get("/application/documents", requireAuth, getDocuments);

router.post("/application/preview-confirm", requireAuth, previewConfirm);
router.get("/readmission/eligibility/:studentId", checkEligibilityForReadmission);
// Admin create readmission process
router.post("/readmission/autocreate-requests", autoCreatePendingReadmission);
// Admin panel all student readmission list
router.get("/readmission/autocreate-requests", getReadmissionRequest);
// Student part Redmission details
router.get("/readmission/details/:studentId", getReadmissionDetailsForStudent);
// Admin approve by readmission request by student
router.post("/readmission/approve-requests", approveStudentForReadmission);

router.post("/confirm-readmission/:studentId", requireAuth, readmissionConfirmationByStudent); // subject")
router.get("/application/department/:departmentId", requireAuth, getDepertment); // subject
router.post('/application/subject', requireAuth, saveSubject);
router.get('/application/subject', requireAuth, getSubject)

router.get('/application/registrations', requireAuth, getStudentDetails);
router.get('/application/student/:studentId', requireAuth, getStudentById);
router.post("/application/registrations/bulk-status", requireAuth, requireRole("admin"), bulkUpdateRegistrationStatus);
router.get("/application/semesters/:classId/:programId", semesters);
router.post("/application/student/create", requireAuth, createStudent);
router.get("/application/student-all", requireAuth, getAllStudent);
router.get("/application/student-reports", requireAuth, getAllStudentReports);
router.patch("/application/student/:userId", requireAuth, updateStudent)
// Excel all student upload
router.post("/application/bulk-student-upload", requireAuth, allStudentUpdate);

router.get("/readmission/rules", requireAuth, getReadmissionRules);
// Excel Student result upload
router.post("/result/upload", requireAuth, studentResultUpload);
// Get student result
router.get("/student/result/:id", requireAuth, studentResult);
// last semester call this api get all semester subjects
router.get("/student/all-subjects/:studentId/:programId", allSubjects)

export default router;