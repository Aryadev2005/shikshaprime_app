import { Router } from "express";
import { facebookVerify, facebookWebhook, googleWebhook, whatsappVerify, whatsappWebhook } from "../controller/webhookController";

const webhookrouter = Router();

webhookrouter.get("/facebook", facebookVerify);

webhookrouter.post("/facebook", facebookWebhook);
webhookrouter.post("/google", googleWebhook);

webhookrouter.get("/whatsapp", whatsappVerify);
webhookrouter.post("/whatsapp", whatsappWebhook);

export default webhookrouter;