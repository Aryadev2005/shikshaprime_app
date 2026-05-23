// src/models/index.ts
import { config } from "../config";
import { Sequelize } from "sequelize";

// Global (shared) Sequelize instance – for system tables, tenant registry, etc.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: Number(config.db.port),
  dialect: "mysql",
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
import { defineUser } from "./tenant/Users";
import { getTenantSequelize } from "../server";
import { defineNotice } from "./tenant/Notice";


// Tenant‑aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  return {
    User: defineUser(sequelize),
    Notice: defineNotice(sequelize)
  };
}
