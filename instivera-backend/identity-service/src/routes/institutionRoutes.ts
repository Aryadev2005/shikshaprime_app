import { Router } from "express";
import { getActiveInstitutions } from "../controllers/institutionController";

const router = Router();

// Endpoint used by mobile app to fetch the list of colleges/institutions
router.get("/", getActiveInstitutions);

export default router;
