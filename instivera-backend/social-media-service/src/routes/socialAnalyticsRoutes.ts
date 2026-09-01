import { Router } from "express";
import { getAnalytics, syncAnalytics } from "../controllers/socialAnalyticsController";

const router = Router();

router.get("/", getAnalytics);
router.post("/sync", syncAnalytics);

export default router;
