import { Router } from "express";
import { verifyWebhook, receiveWebhook } from "../controllers/socialWebhookController";

const router = Router();

// Endpoint for Meta to verify the webhook (hub.challenge)
router.get("/", verifyWebhook);

// Endpoint for Meta to send event payloads
router.post("/", receiveWebhook);

export default router;
