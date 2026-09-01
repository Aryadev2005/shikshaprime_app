import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";

// Global (shared) Sequelize instance – for system tables, tenant registry, etc.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: Number(config.db.port),
  dialect: "mysql",
  dialectOptions: {
    connectTimeout: 60000
  }
});

// Test the global connection
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

// Tenant-aware model loader
import SocialAccount from "./socialAccount";
import SocialPost from "./socialPost";
import SocialPostAccount from "./socialPostAccount";
import AuditLog from "./auditLog";
import SocialPostAnalytics from "./socialPostAnalytics";
import MediaLibrary from "./mediaLibrary";
import SocialPostTag from "./socialPostTag";
import SocialPublishJob from "./socialPublishJob";
import SocialWebhook from "./socialWebhook";

export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);  
  
  const models = {
    SocialAccount: SocialAccount.initModel(sequelize),
    SocialPost: SocialPost.initModel(sequelize),
    SocialPostAccount: SocialPostAccount.initModel(sequelize),
    AuditLog: AuditLog.initModel(sequelize),
    SocialPostAnalytics: SocialPostAnalytics.initModel(sequelize),
    MediaLibrary: MediaLibrary.initModel(sequelize),
    SocialPostTag: SocialPostTag.initModel(sequelize),
    SocialPublishJob: SocialPublishJob.initModel(sequelize),
    SocialWebhook: SocialWebhook.initModel(sequelize),
  };

  Object.values(models).forEach((model: any) => {
    if (model.associate) {
      model.associate(models);
    }
  });

  return models;
}