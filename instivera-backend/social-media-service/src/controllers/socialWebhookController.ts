import { Request, Response } from "express";
import { getTenantModels } from "../models";

// Meta requires a GET endpoint for webhook verification
export const verifyWebhook = (req: Request, res: Response) => {
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "shikshaprime_social_secret";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
};

// Meta sends POST requests when an event occurs
export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (body.object === "page" || body.object === "instagram") {
      // In a multi-tenant system without tenant identification in the webhook URL,
      // you typically identify the tenant by looking up the Page ID in your DB.
      // For simplicity here, we assume webhooks hit a specific tenant or we iterate.
      // E.g. we can extract the page_id from the payload:
      // const pageId = body.entry[0].id;

      // For this implementation, we assume a single tenant 'main' or we'd need a multi-tenant router.
      // To keep it simple, we use a generic tenant or log it to main. 
      // In a real multi-tenant app, the webhook URL would include the tenant ID: /api/socialmedia/webhooks/:tenant
      const tenant = req.params.tenant || 'main'; // Fallback to main if not in URL

      try {
        const { SocialWebhook } = getTenantModels(tenant as string);

        // Iterate over entries (there may be multiple)
        for (const entry of body.entry) {
          // Iterate over messaging/changes
          const changes = entry.changes || entry.messaging || [entry];

          for (const change of changes) {
            await SocialWebhook.create({
              platform: body.object === "instagram" ? "instagram" : "facebook",
              event_type: change.field || "unknown",
              payload: change,
            });
          }
        }
      } catch (dbErr) {
        console.error("Webhook DB error", dbErr);
      }

      // Always return 200 OK to Meta immediately
      return res.status(200).send("EVENT_RECEIVED");
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    console.error("Error receiving webhook:", error);
    return res.status(500).send("Internal Server Error");
  }
};
