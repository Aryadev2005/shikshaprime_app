import { getTenantModels } from "../models";
import { Op } from "sequelize";
import { getTenantSequelize } from "../server";

export class LeadService {

    async createLead(tenant: string, payload: any) {
        const { LeadMaster } = getTenantModels(tenant);

        // Basic validation
        if (!payload.name || !payload.lead_source) {
            throw new Error("Name and lead_source are required");
        }

        const lead = await LeadMaster.create({
            // Student
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            date_of_birth: payload.date_of_birth,
            gender: payload.gender,
            address: payload.address,

            // Academic
            current_school: payload.current_school,
            current_class: payload.current_class,
            marks_cgpa: payload.marks_cgpa,
            preferred_course: payload.preferred_course,
            preferred_stream: payload.preferred_stream,
            academic_qualification: payload.academic_qualification,
            passing_year: payload.passing_year,

            // Parent
            parent_name: payload.parent_name,
            parent_mobile: payload.parent_mobile,
            parent_occupation: payload.parent_occupation,
            parent_income_range: payload.parent_income_range,

            // Mode + communication
            preferred_mode: payload.preferred_mode,
            communication_preference: payload.communication_preference,

            // Notes
            notes: payload.notes,

            // Source & campaign
            lead_source: payload.lead_source,
            campaign_id: payload.campaign_id,
            utm_source: payload.utm_source,
            utm_medium: payload.utm_medium,
            utm_campaign: payload.utm_campaign,

            // Lifecycle
            lead_stage: "NEW",
            lead_status: "ACTIVE",

            // Assignment
            assigned_to: payload.assigned_to || null,
            territory: payload.territory || null,
            course_category: payload.course_category || null,

            // AI fields default to null
            ai_lead_score: 0,
            ai_admission_probability: null,
            ai_next_best_action: null,
            ai_sentiment: null,
            ai_dropout_risk: null,
            ai_scholarship_recommendation: null,

            created_by: payload.created_by || null,
        });

        await this.recordLeadNotification(
            tenant,
            lead.name,
            lead.phone || payload.phone || "",
            lead.email || payload.email || "",
            lead.preferred_course || payload.preferred_course || "",
            lead.lead_source || payload.lead_source || "MANUAL",
            lead.id
        );

        return lead;
    }

    async updateLead(tenant: string, id: number, payload: any) {
        const { LeadMaster } = getTenantModels(tenant);

        const lead = await LeadMaster.findByPk(id);
        if (!lead) {
            throw new Error("Lead not found");
        }

        await lead.update({
            // Student
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            date_of_birth: payload.date_of_birth,
            gender: payload.gender,
            address: payload.address,

            // Academic
            current_school: payload.current_school,
            current_class: payload.current_class,
            marks_cgpa: payload.marks_cgpa,
            preferred_course: payload.preferred_course,
            preferred_stream: payload.preferred_stream,
            academic_qualification: payload.academic_qualification,
            passing_year: payload.passing_year,

            // Parent
            parent_name: payload.parent_name,
            parent_mobile: payload.parent_mobile,
            parent_occupation: payload.parent_occupation,
            parent_income_range: payload.parent_income_range,

            // Mode + communication
            preferred_mode: payload.preferred_mode,
            communication_preference: payload.communication_preference,

            // Notes
            notes: payload.notes,

            // Source & campaign
            lead_source: payload.lead_source,
            campaign_id: payload.campaign_id,
            utm_source: payload.utm_source,
            utm_medium: payload.utm_medium,
            utm_campaign: payload.utm_campaign,

            // Assignment
            assigned_to: payload.assigned_to || null,
            territory: payload.territory || null,
            course_category: payload.course_category || null,
        });

        return lead;
    }


    async getLeadList(
        tenant: string,
        query: any
        ) {
        const {
            LeadMaster,
            LeadFollowup,
            LeadCommunication,
            LeadConversion,
            AiLeadPrediction,
        } = getTenantModels(tenant);

        // -----------------------------
        // Extract Query Params
        // -----------------------------
        const page = query.page ? Number(query.page) : 1;
        const limit = query.limit ? Number(query.limit) : 20;
        const offset = (page - 1) * limit;

        const search = query.search || "";
        const lead_source = query.lead_source || "";
        const lead_stage = query.lead_stage || "";
        const assigned_to = query.assigned_to || "";
        const campaign_id = query.campaign_id || "";
        const start_date = query.start_date || "";
        const end_date = query.end_date || "";
        const sort_by = query.sort_by || "created_at";
        const sort_order = query.sort_order === "asc" ? "ASC" : "DESC";

        // -----------------------------
        // WHERE Conditions
        // -----------------------------
        const where: any = {};

        if (search) {
            where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            ];
        }

        if (lead_source) where.lead_source = lead_source;
        if (lead_stage) where.lead_stage = lead_stage;
        if (assigned_to) where.assigned_to = assigned_to;
        if (campaign_id) where.campaign_id = campaign_id;

        if (start_date && end_date) {
            where.created_at = {
            [Op.between]: [new Date(start_date), new Date(end_date)],
            };
        }

        // -----------------------------
        // Query with Joins
        // -----------------------------
        const { rows, count } = await LeadMaster.findAndCountAll({
            where,
            include: [
            {
                model: AiLeadPrediction,
                as: "ai_prediction",
                attributes: ["lead_score", "admission_probability"],
            },
            {
                model: LeadConversion,
                as: "conversion",
                attributes: ["converted_at"],
            },
            ],
            order: [[sort_by, sort_order]],
            limit,
            offset,
        });

        // -----------------------------
        // Response Format (Optimized for tables)
        // -----------------------------
        const data = rows.map((lead: any) => ({
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            lead_source: lead.lead_source,
            lead_stage: lead.lead_stage,
            assigned_to: lead.assigned_to,
            created_at: lead.created_at,
            ai_lead_score: lead.ai_prediction?.lead_score || 0,
            admission_probability: lead.ai_prediction?.admission_probability || null,
            converted_at: lead.conversion?.converted_at || null,
        }));

        return {
            page,
            limit,
            total: count,
            total_pages: Math.ceil(count / limit),
            data,
        };
    }

    async getLeadDetails(tenant: string, leadId: number) {
        const {
            LeadMaster,
            LeadFollowup,
            LeadCommunication,
            LeadConversion,
            AiLeadPrediction,
            LeadCampusVisit,
            User, // <-- Add User model
        } = getTenantModels(tenant);

        const lead = await LeadMaster.findOne({
            where: { id: leadId },
            include: [
            {
                model: User,
                as: "assigned_user", // <-- You must define association LeadMaster.belongsTo(User, { as: "assigned_user", foreignKey: "assigned_to" })
                attributes: ["user_id", "first_name", "last_name"],
            },
            {
                model: LeadFollowup,
                as: "followups",
                attributes: [
                "id",
                "followup_type",
                "notes",
                "followup_date",
                "next_followup_date",
                "status",
                "ai_call_summary",
                "ai_sentiment",
                "created_at",
                ],
                order: [["followup_date", "DESC"]],
            },
            {
                model: LeadCommunication,
                as: "communications",
                attributes: [
                "id",
                "channel",
                "message_body",
                "sent_at",
                "delivery_status",
                ],
                order: [["sent_at", "DESC"]],
            },
            {
                model: LeadConversion,
                as: "conversion",
                attributes: ["application_id", "converted_at"],
            },
            {
                model: AiLeadPrediction,
                as: "ai_prediction",
                attributes: [
                "lead_score",
                "admission_probability",
                "dropout_risk",
                "sentiment",
                "next_best_action",
                "scholarship_recommendation",
                ],
            },
            {
                model: LeadCampusVisit,
                as: "visits",
                attributes: [
                "id",
                "visit_date",
                "visit_time",
                "parent_attending",
                "course_interest",
                "counselor_notes",
                "created_at",
                ],
            },
            ],
        });

        if (!lead) {
            throw new Error("Lead not found");
        }

        return {
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            date_of_birth: lead.date_of_birth,
            gender: lead.gender,
            address: lead.address,

            // Academic
            current_school: lead.current_school,
            current_class: lead.current_class,
            marks_cgpa: lead.marks_cgpa,
            preferred_course: lead.preferred_course,
            preferred_stream: lead.preferred_stream,

            // Parent
            parent_name: lead.parent_name,
            parent_mobile: lead.parent_mobile,
            parent_occupation: lead.parent_occupation,
            parent_income_range: lead.parent_income_range,

            // Source
            lead_source: lead.lead_source,
            campaign_id: lead.campaign_id,
            utm_source: lead.utm_source,
            utm_medium: lead.utm_medium,
            utm_campaign: lead.utm_campaign,

            // Lifecycle
            lead_stage: lead.lead_stage,
            lead_status: lead.lead_status,
            assigned_to: lead.assigned_to,

            // ⭐ Assigned counsellor name
            assigned_to_name: lead.assigned_user
            ? `${lead.assigned_user.first_name} ${lead.assigned_user.last_name}`
            : null,

            created_at: lead.created_at,

            // AI Insights
            ai: lead.ai_prediction || {},

            // Conversion
            conversion: lead.conversion || null,

            // Followups
            followups: lead.followups || [],

            // Communications
            communications: lead.communications || [],

            // Campus Visits
            campus_visits: lead.visits || [],
        };
    }


    async addFollowup(
        tenant: string,
        leadId: number,
        payload: any
        ) {
        const {
            LeadMaster,
            LeadFollowup,
        } = getTenantModels(tenant);

        // -----------------------------
        // Basic validation
        // -----------------------------
        if (!payload.followup_type) {
            throw new Error("followup_type is required");
        }
        if (!payload.followup_date) {
            throw new Error("followup_date is required");
        }

        const lead = await LeadMaster.findByPk(leadId);
        // -----------------------------
        // Create follow-up entry
        // -----------------------------
        const followup = await LeadFollowup.create({
            lead_id: leadId,
            followup_type: payload.followup_type,
            notes: payload.notes || "",
            followup_date: payload.followup_date,
            next_followup_date: payload.next_followup_date || null,
            status: payload.status || "PENDING",
            counsellor_id: lead.assigned_to,

            // AI fields (optional)
            ai_call_summary: payload.ai_call_summary || null,
            ai_sentiment: payload.ai_sentiment || null,

            created_by: payload.created_by || null,
        });

        // -----------------------------
        // Auto-update lead stage
        // -----------------------------
        await LeadMaster.update(
            {
            lead_stage: "FOLLOWUP",
            last_followup_date: payload.followup_date,
            },
            { where: { id: leadId } }
        );

        // -----------------------------
        // Return updated follow-up list
        // -----------------------------
        const updatedFollowups = await LeadFollowup.findAll({
            where: { lead_id: leadId },
            order: [["followup_date", "DESC"]],
        });

        return updatedFollowups;        
    }

    async addCommunication(
        tenant: string,
        leadId: number,
        payload: any
        ) {
        const {
            LeadMaster,
            LeadCommunication,
        } = getTenantModels(tenant);

        // -----------------------------
        // Validation
        // -----------------------------
        if (!payload.channel) {
            throw new Error("channel is required");
        }
        if (!payload.message_body) {
            throw new Error("message_body is required");
        }

        // -----------------------------
        // Create communication entry
        // -----------------------------
        const communication = await LeadCommunication.create({
            lead_id: leadId,
            channel: payload.channel, // SMS / EMAIL / WHATSAPP
            message_body: payload.message_body,
            sent_at: new Date(),
            delivery_status: payload.delivery_status || "SENT",
            created_by: payload.created_by || null,
        });

        // -----------------------------
        // Optional: Auto-update lead stage
        // -----------------------------
        await LeadMaster.update(
            {
            lead_stage: "CONTACTED",
            last_communication_date: new Date(),
            },
            { where: { id: leadId } }
        );

        // -----------------------------
        // Return updated communication list
        // -----------------------------
        const updatedCommunications = await LeadCommunication.findAll({
            where: { lead_id: leadId },
            order: [["sent_at", "DESC"]],
        });

        return updatedCommunications;
    }
    async assignLead(
        tenant: string,
        leadId: number,
        payload: any
        ) {
        const { LeadMaster, LeadAssignmentHistory, LeadFollowup,  User } = getTenantModels(tenant);

        const { assigned_to, assigned_by } = payload;

        if (!assigned_to) throw new Error("assigned_to is required");

        // Start transaction
        const t = await getTenantSequelize(tenant).transaction();

        try {
            // 1. Fetch lead
                const lead = await LeadMaster.findByPk(leadId, { transaction: t });
                if (!lead) throw new Error("Lead not found");

                await lead.update(
                    {
                        assigned_to,
                        assigned_by,
                        assigned_at: new Date(),
                        lead_stage: "ASSIGNED",
                    },
                    { transaction: t }
                );

                await LeadAssignmentHistory.create(
                    {
                        lead_id: leadId,
                        assigned_to,
                        assigned_by,
                        assigned_at: new Date(),
                    },
                    { transaction: t }
                );
                await LeadFollowup.create({
                    lead_id: leadId,
                    followup_date: new Date(),
                    followup_type: "CALL",
                    status: "PENDING",
                    counsellor_id: assigned_to,
                    notes: "Auto-created follow-up after lead assignment",
                }, { transaction: t });

                const counselor = await User.findByPk(assigned_to, { transaction: t });
                if (counselor?.phone) {
                    // sendWhatsAppMessage(counselor.phone, `A new lead has been assigned to you: ${lead.name}`);
                }
                await t.commit();                
                return await LeadMaster.findByPk(leadId);
            }
            catch (err) {
                // Rollback on error
                await t.rollback();
                throw err;
            }        
    }

    async getCounselorList(tenant: string) {
        const { User } = getTenantModels(tenant);

        const counselors = await User.findAll({
            where: { role: "COUNSELOR" },
            attributes: ["user_id", "first_name", "last_name"],
            order: [["first_name", "ASC"]],
        });
        return counselors;
    }

    async getEligibleCounsellors(tenant, leadId) {
        const { LeadMaster, LeadAssignmentRule, User } = getTenantModels(tenant);

        const lead = await LeadMaster.findByPk(leadId);
        if (!lead) throw new Error("Lead not found");

        const { lead_source, territory, preferred_course } = lead;

        // 1. Find matching rule
        const rule = await LeadAssignmentRule.findOne({
            where: {
            is_active: 1,
            source_code: lead_source || null,
            territory: territory || null,
            course_category: preferred_course || null,
            },
        });

        // 2. If no rule matches, fallback to default rule
        let counsellorIds = [];

        if (rule) {
            counsellorIds = JSON.parse(rule.counsellor_ids);
        } else {
            const defaultRule = await LeadAssignmentRule.findOne({
            where: {
                is_active: 1,
                source_code: null,
                territory: null,
                course_category: null,
            },
            });

            counsellorIds = JSON.parse(defaultRule.counsellor_ids);
        }

        // 3. Fetch counselors
        const counsellors = await User.findAll({
            where: { user_id: counsellorIds },
            attributes: ["user_id", "first_name", "last_name"],
        });

        return counsellors;
    }


    async convertLead(
        tenant: string,
        leadId: number,
        payload: any
        ) {
        const models = getTenantModels(tenant);

        const t = await getTenantSequelize(tenant).transaction();
        try {
            
            const lead = await models.LeadMaster.findByPk(leadId, { transaction: t });
            if (!lead) throw new Error("Lead not found");

            await models.LeadConversion.create({
                lead_id: leadId,
                converted_at: new Date(),
                remarks: payload.remarks || null,
            }), { transaction: t };

            await lead.update(
            {
                lead_stage: "CONVERTED"                
            },
            { transaction: t }
            );
            await t.commit();
            return await models.LeadMaster.findByPk(leadId);
        } catch (err) {
            await t.rollback();
            throw err;
        }        
    }

    async createLeadFromWebsite(tenant: string, payload: any) {
            const { LeadMaster } = getTenantModels(tenant);

            const {
                name,
                phone,
                email,
                parent_name,
                parent_phone,
                academic_qualification,
                passing_year,
                preferred_course,
                preferred_mode,
                communication_preference,
                notes,
                lead_source,
            } = payload;

            if (!name || !phone) {
                throw new Error("Name and phone are required");
            }

            // normalize lead_source to master values
            const source = (lead_source || "WEBSITE").toUpperCase();

            // basic duplicate check (rule-based)
            const existing = await LeadMaster.findOne({
                where: { phone },
            });

            if (existing) {
                if (preferred_course || notes) {
                    await existing.update({
                        ...(preferred_course ? { preferred_course } : {}),
                        ...(notes ? { notes } : {}),
                    });
                }
                await this.recordLeadNotification(
                    tenant,
                    existing.name || name,
                    existing.phone || phone,
                    existing.email || email || "",
                    preferred_course || existing.preferred_course || "",
                    source,
                    existing.id
                );
                return existing;
            }

            const lead = await LeadMaster.create({
                name,
                phone,
                email,

                // Parent details
                parent_name,
                parent_mobile: parent_phone,

                // Academic details
                academic_qualification,
                passing_year,

                // Course interest
                preferred_course,
                preferred_mode,

                // Communication preference
                communication_preference,

                // Additional notes
                notes,

                // System fields
                lead_source: source,
                lead_stage: "NEW",
                lead_status: "ACTIVE",
            });

            await this.recordLeadNotification(
                tenant,
                name,
                phone,
                email || "",
                preferred_course || "",
                source,
                lead.id
            );

            return lead;
    }

    private async recordLeadNotification(tenant: string, name: string, phone: string, email: string, course: string, source: string, leadId?: number) {
        try {
            const sequelize = getTenantSequelize(tenant);
            const leadName = name || 'Applicant';
            const leadContact = phone || email || 'No contact';
            const courseInfo = course ? `, Course: ${course}` : '';
            const sourceInfo = source || 'Direct';
            const tag = leadId ? ` [Lead #${leadId}]` : '';
            const msg = `New lead received from ${leadName} (${leadContact}${courseInfo}). Source: ${sourceInfo}${tag}.`;

            await sequelize.query(`
                INSERT INTO notifications (
                    user_id, channel, template_key, title, message, payload, type, link, is_read, status, created_at, updated_at
                ) VALUES (
                    NULL, 'IN_APP', 'LEAD_NOTIF', 'New Lead Received',
                    :msg, '{}', 'info', '/lead-management', 0, 'SENT', NOW(), NOW()
                )
            `, {
                replacements: { msg }
            });
        } catch (notifErr) {
            console.error("[LEAD NOTIF ERROR] Failed to record lead notification:", notifErr);
        }
    }

    async processLeadBulkUpload(tenant: string, payload: any) {
        const { LeadMaster } = getTenantModels(tenant);
        console.log(payload.rows)

        const summary = {
            total: payload.rows.length,
            success: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < payload.rows.length; i++) {
            const row = payload.rows[i];

            try {
            // Required fields
            if (!row.name || !row.phone) {
                throw new Error("Name and phone are required");
            }

            // Duplicate detection
            const existing = await LeadMaster.findOne({
                where: {
                phone: row.phone,
                },
            });

            if (existing) {
                throw new Error("Duplicate lead");
            }

            console.log("Creating new lead");

            // Create lead
            await LeadMaster.create({
                name: row.name,
                phone: row.phone,
                email: row.email || null,
                preferred_course: row.preferred_course || null,
                preferred_stream: row.preferred_stream || null,
                lead_source: row.lead_source || "BULK_UPLOAD",
                lead_stage: "NEW",
            });

            summary.success++;
            console.log("New lead created");
            } catch (err: any) {
            summary.failed++;
            summary.errors.push({
                row: i + 1,
                error: err.message,
            });
            }
        }

        return summary;
    }

    async qualifyLead(tenant, leadId, payload) {
        const {
            sequelize,
            LeadMaster,
            LeadFollowup,
        } = getTenantModels(tenant);

        const { outcome, notes, followup_date, followup_type } = payload;

        if (!outcome) throw new Error("Qualification outcome is required");

        // Stage mapping
        const stageMap: any = {
            "Qualified": "QUALIFIED",
            "Warm": "WARM",
            "Hot": "HOT",
            "Not Interested": "LOST",
            "Follow-Up Required": "FOLLOW_UP",
        };

        const newStage = stageMap[outcome];
        if (!newStage) throw new Error("Invalid qualification outcome");

        // Start transaction
        const t = await sequelize.transaction();

        try {
            // 1. Fetch lead
            const lead = await LeadMaster.findByPk(leadId, { transaction: t });
            if (!lead) throw new Error("Lead not found");

            // 2. Update lead with qualification
            await lead.update(
            {
                lead_stage: newStage,
                qualification_notes: notes || null,
                qualified_at: new Date(),
            },
            { transaction: t }
            );            

            // 4. Create follow-up (if provided)
            if (followup_date && followup_type) {
                await LeadFollowup.create(
                    {
                    lead_id: leadId,
                    followup_date,
                    followup_type,
                    status: "PENDING",
                    counsellor_id: lead.assigned_to,
                    notes: "Auto-created after qualification",
                    },
                    { transaction: t }
                );
            }

            // 5. Commit transaction
            await t.commit();

            // 6. Return updated lead
            return await LeadMaster.findByPk(leadId);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async leadNurture(tenant, leadId, payload) {
        const {
            sequelize,
            LeadMaster,
            LeadCommunication
        } = getTenantModels(tenant);

        const { template, channel, notes } = payload;

        if (!template) throw new Error("Nurturing template is required");
        if (!channel) throw new Error("Channel is required");

        // Map template → actual message content
        const templateMap: any = {
            "COURSE_BROCHURE": "Here is the course brochure you requested.",
            "FEE_STRUCTURE": "Here is the fee structure for your preferred course.",
            "SCHOLARSHIP_DETAILS": "Here are the scholarship details available.",
            "CAMPUS_PHOTOS": "Here are some photos of our campus.",
            "APPLICATION_LINK": "Here is the application form link.",
        };

        const messageBody = templateMap[template];
        if (!messageBody) throw new Error("Invalid nurturing template");

        // Start transaction
        const t = await sequelize.transaction();

        try {
            // 1. Fetch lead
            const lead = await LeadMaster.findByPk(leadId, { transaction: t });
            if (!lead) throw new Error("Lead not found");

            // 2. Log communication
            const comm = await LeadCommunication.create(
            {
                lead_id: leadId,
                channel,
                message_body: messageBody,
                delivery_status: "SENT",
                sent_at: new Date(),
                notes: notes || null,
            },
            { transaction: t }
            );

            // 4. Commit
            await t.commit();

            // 5. Return updated lead with new communication
            return await LeadMaster.findByPk(leadId, {
            include: [{ model: LeadCommunication, as: "communications", }],
            });
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
    

    async campusVisit(tenant, leadId, payload) {
        const {
            sequelize,
            LeadMaster,
            LeadCampusVisit,
        } = getTenantModels(tenant);

        const {
            visit_date,
            visit_time,
            parent_attending,
            course_interest,
            counselor_notes,
        } = payload;

        if (!visit_date) throw new Error("Visit date is required");
        if (!visit_time) throw new Error("Visit time is required");

        // Start transaction
        const t = await sequelize.transaction();

        try {
            // 1. Fetch lead
            const lead = await LeadMaster.findByPk(leadId, { transaction: t });
            if (!lead) throw new Error("Lead not found");

            // 2. Create campus visit entry
            const visit = await LeadCampusVisit.create(
            {
                lead_id: leadId,
                visit_date,
                visit_time,
                parent_attending: parent_attending || null,
                course_interest: course_interest || null,
                counselor_notes: counselor_notes || null,
                created_by: lead.assigned_to,
            },
            { transaction: t }
            );

            // 3. Update lead stage → WALK_IN_SCHEDULED
            await lead.update(
            {
                lead_stage: "WALK_IN_SCHEDULED",
            },
            { transaction: t }
            );            

            // 5. Commit
            await t.commit();

            // 6. Return updated lead with visit info
            return await LeadMaster.findByPk(leadId, {
            include: [{ model: LeadCampusVisit, as: "visits" }],
            });
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}