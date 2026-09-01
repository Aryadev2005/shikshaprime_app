import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import { defineLeadSource } from "./main/leadSourcesMaster";
import { defineLeadStage } from "./main/leadStagesMaster";
import { defineLeadType } from "./main/leadTypesMaster";
import { defineLeadChannel } from "./main/leadChannelsMaster";
import { defineTenantLeadSettings } from "./main/tenantLeadSettings";
import { defineTenantLeadAssignmentRule } from "./main/tenantLeadassignmentRules";
import { defineTenantLeadIntegration } from "./main/tenantLeadIntegrations";
import { defineLeadWebhookRoute } from "./main/leadWebhookRoutes";
import { defineLeadMaster } from "./tenant/leadMaster";
import { defineLeadFollowup } from "./tenant/leadFollowUp";
import { defineLeadCommunication } from "./tenant/leadCommunication";
import { defineLeadConversion } from "./tenant/leadConversion";
import { defineLeadCampaign } from "./tenant/leadCampaign";
import { defineLeadScoringRule } from "./tenant/leadScoringRules";
import { defineLeadAssignmentRule } from "./tenant/leadAssignmentRules";
import { defineAiLeadPrediction } from "./tenant/aiLeadPredictions";
import { applyTenantAssociations } from "./tenant/tenantAssociations";
import { defineUser } from "./tenant/users";
import { defineLeadAssignmentHistory } from "./tenant/leadAssignmentHistory";
import { defineCampusVisit } from "./tenant/leadCampusVisits";
/* -----------------------------
   MAIN DB CONNECTION
------------------------------ */
export const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.pass,
  {
    host: config.db.host,
    port: Number(config.db.port),
    dialect: "mysql",
  }
);

/* -----------------------------
   TEST MAIN DB CONNECTION
------------------------------ */
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Main DB connection established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the main database:", error);
    return false;
  }
}

/* -----------------------------
   LOAD MAIN DB MODELS
------------------------------ */
export function getMainModels() {
  const LeadSource = defineLeadSource(sequelize);
  const LeadStage = defineLeadStage(sequelize);
  const LeadType = defineLeadType(sequelize);
  const LeadChannel = defineLeadChannel(sequelize);
  const TenantLeadSettings = defineTenantLeadSettings(sequelize);
  const TenantLeadAssignmentRule = defineTenantLeadAssignmentRule(sequelize);
  const TenantLeadIntegration = defineTenantLeadIntegration(sequelize);
  const LeadWebhookRoute = defineLeadWebhookRoute(sequelize);

  return {
    LeadSource,
    LeadStage,
    LeadType,
    LeadChannel,
    TenantLeadSettings,
    TenantLeadAssignmentRule,
    TenantLeadIntegration,
    LeadWebhookRoute,
  };
}

/* ============================================================
   TENANT SEQUELIZE CACHE (PRODUCTION-GRADE)
============================================================ */

const tenantSequelizeCache: Record<string, Sequelize> = {};
const tenantModelsCache: Record<string, any> = {};

/**
 * Returns a cached Sequelize instance for the tenant.
 * If not cached, creates one and stores it.
 */
function getCachedTenantSequelize(tenant: string): Sequelize {
  if (!tenantSequelizeCache[tenant]) {
    tenantSequelizeCache[tenant] = getTenantSequelize(tenant);
  }
  return tenantSequelizeCache[tenant];
}

/* -----------------------------
   LOAD TENANT DB MODELS (CACHED)
------------------------------ */
export function getTenantModels(tenant: string) {
  // Return cached models if already initialized
  if (tenantModelsCache[tenant]) {
    return tenantModelsCache[tenant];
  }

  const sequelize = getCachedTenantSequelize(tenant);

  const LeadMaster = defineLeadMaster(sequelize);
  const LeadFollowup = defineLeadFollowup(sequelize);
  const LeadCommunication = defineLeadCommunication(sequelize);
  const LeadCampusVisit = defineCampusVisit(sequelize);
  const LeadConversion = defineLeadConversion(sequelize);
  const LeadCampaign = defineLeadCampaign(sequelize);
  const LeadScoringRule = defineLeadScoringRule(sequelize);
  const LeadAssignmentRule = defineLeadAssignmentRule(sequelize);
  const LeadAssignmentHistory = defineLeadAssignmentHistory(sequelize);
  const AiLeadPrediction = defineAiLeadPrediction(sequelize);
  const User = defineUser(sequelize);

  const models = {
    sequelize,
    LeadMaster,
    LeadFollowup,
    LeadCommunication,
    LeadCampusVisit,
    LeadConversion,
    LeadCampaign,
    LeadScoringRule,
    LeadAssignmentRule,
    LeadAssignmentHistory,
    AiLeadPrediction,
    User
  };

   applyTenantAssociations(models);

  // Cache the models for future use
  tenantModelsCache[tenant] = models;

  return models;
}
