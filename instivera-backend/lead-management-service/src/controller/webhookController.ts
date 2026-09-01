// src/controllers/webhook.controller.ts
import { Request, Response } from "express";
import { detectTenant } from "../utils/tenant";
import { WebhookService } from "../service/webhookService";

const webhookService = new WebhookService();

export async function facebookWebhook(req: Request, res: Response) {
  try {
    const tenant = detectTenant(req);    
    const lead = await webhookService.ingestFacebookLead(tenant, req.body);

    return res.status(200).json({ status: "success", data: lead });
  } catch (err: any) {
    return res.status(400).json({ status: "error", message: err.message });
  }
}
export function facebookVerify(req: Request, res: Response) {
  try {
    const tenant = detectTenant(req); // auto-detect tenant from subdomain
    console.log("Facebook verification for tenant:", tenant);

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  } catch (err) {
    return res.sendStatus(500);
  }
}
export async function googleWebhook(req: Request, res: Response) {
  try {
    const tenant = detectTenant(req);
    const secret = req.body.google_key || req.headers["x-google-key"];

    if (secret !== process.env.GOOGLE_LEAD_FORM_SECRET) {
      return res.status(403).json({ status: "error", message: "Invalid Google secret" });
    }

    // If Google is verifying, they send a test lead
    if (req.body.test_lead === true) {
      return res.status(200).json({ status: "verified" });
    }

    // Real lead ingestion
    const lead = await webhookService.ingestGoogleLead(tenant, req.body);

    return res.status(200).json({ status: "success", data: lead });
  } catch (err: any) {
    return res.status(400).json({ status: "error", message: err.message });
  }
}
export function whatsappVerify(req: Request, res: Response) {
  const tenant = detectTenant(req);
  console.log("WhatsApp verification for tenant:", tenant);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}
export async function whatsappWebhook(req: Request, res: Response) {
  try {
    const tenant = detectTenant(req);
    
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const lead = await webhookService.ingestWhatsAppLead(tenant, message);

    return res.status(200).json({ status: "success", data: lead });
  } catch (err) {
    return res.sendStatus(500);
  }
}

