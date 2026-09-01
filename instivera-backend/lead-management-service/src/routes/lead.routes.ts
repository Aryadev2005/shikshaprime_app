
import { Router } from "express";
import { addCommunication, addFollowup, assignLead, bulkLeadUpload, 
    campusVisit, 
    convertLead, createLead, createPublicLead, getCounselorList, getEligibleCounsellors, getLeadDetails, getLeadList, 
    leadNurture, 
    qualifyLead,
    updateLead} from "../controller/leadController";
import multer from "multer";

const router = Router();

const upload = multer({
  dest: "uploads/",
});

// POST /api/leads
router.post("/public/leads", createPublicLead);

// POST /api/leads
router.post("/", createLead);
router.patch("/:id/update", updateLead);
// GET /api/leads
router.get("/", getLeadList);
// GET /api/leads/:id
router.get("/:id", getLeadDetails);
// POST /api/leads/:id/followups
router.post("/:id/followups", addFollowup);
// POST /api/leads/:id/communications
router.post("/:id/communications", addCommunication);
// POST /api/leads/:id/assign
router.post("/:id/assign", assignLead);
router.post("/:id/qualify", qualifyLead);
router.post("/:id/nurture", leadNurture);
router.post("/:id/campus-visit", campusVisit);

router.get("/counselors", getCounselorList);
router.get("/:id/eligible-counsellors", getEligibleCounsellors);
router.post("/:id/convert", convertLead);

router.post("/bulk-upload", bulkLeadUpload);


export default router;
