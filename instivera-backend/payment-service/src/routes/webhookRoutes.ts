import { Router } from "express";
import { handlePhonePeWebhook } from "../controllers/webhookController";

const router = Router();

// Webhook endpoint - No authentication required for webhooks
// PhonePe will call this endpoint directly
router.post("/phonepe", handlePhonePeWebhook);

export default router;
