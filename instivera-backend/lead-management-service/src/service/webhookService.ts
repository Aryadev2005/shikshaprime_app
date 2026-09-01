import { getTenantModels } from "../models";

export class WebhookService {
    async ingestFacebookLead(tenant: string, payload: any) {
        const { LeadMaster } = getTenantModels(tenant);

        const name  = payload.full_name || payload.name;
        const phone = payload.phone_number || payload.phone;
        const email = payload.email;
        const course = payload.course || null;

        if (!name || !phone) throw new Error("Name and phone are required");

        const existing = await LeadMaster.findOne({ where: { phone } });
        if (existing) return existing;

        const lead = await LeadMaster.create({
            name,
            phone,
            email,
            preferred_course: course,
            lead_source: "FACEBOOK",
            lead_stage: "NEW",
        });
        return lead;
    }
    async ingestGoogleLead(tenant: string, payload: any) {
        const { LeadMaster } = getTenantModels(tenant);

        const name  = payload.full_name || payload.name;
        const phone = payload.phone_number || payload.phone;
        const email = payload.email;
        const course = payload.course || null;

        if (!name || !phone) throw new Error("Name and phone are required");

        const existing = await LeadMaster.findOne({ where: { phone } });
        if (existing) return existing;

        const lead = await LeadMaster.create({
            name,
            phone,
            email,
            preferred_course: course,
            lead_source: "GOOGLE",
            lead_stage: "NEW",
        });
        return lead;
    }

    async ingestWhatsAppLead(tenant: string, message: any) {
        const { LeadMaster } = getTenantModels(tenant);

        const phone = message.from;
        const text = message.text?.body || "";
        const name = message.profile?.name || "WhatsApp User";

        const existing = await LeadMaster.findOne({ where: { phone } });
        if (existing) return existing;

        const lead = await LeadMaster.create({
            name,
            phone,
            email: null,
            preferred_course: null,
            lead_source: "WHATSAPP",
            lead_stage: "NEW",
            last_message: text
        });
        return lead;
    }
}