import { Sequelize } from "sequelize";
import { appConfig } from "../config/appConfig";
import { defineKohaSettings, KohaSettings } from "./KohaSettings";
import { defineLibraryPatrons, LibraryPatrons } from "./LibraryPatrons";
import { defineLibraryClearanceLogs, LibraryClearanceLogs } from "./LibraryClearanceLogs";
import { logger } from "../logs/logger";

// Default sequelize instance for backwards compatibility and test Connection
export const sequelize = new Sequelize(appConfig.db.name, appConfig.db.user, appConfig.db.pass, {
  host: appConfig.db.host,
  port: appConfig.db.port,
  dialect: "mysql",
  logging: false,
});

defineKohaSettings(sequelize);
defineLibraryPatrons(sequelize);
defineLibraryClearanceLogs(sequelize);

const tenantConnections: Record<string, Sequelize> = {};
const tenantModels: Record<string, {
  KohaSettings: typeof KohaSettings;
  LibraryPatrons: typeof LibraryPatrons;
  LibraryClearanceLogs: typeof LibraryClearanceLogs;
}> = {};

export function getTenantSequelize(tenant: string): Sequelize {
  if (!tenantConnections[tenant]) {
    const seq = new Sequelize(
      `shikshaprime_${tenant}`,
      `shikshaprime_${tenant}`,
      appConfig.db.pass,
      {
        host: appConfig.db.host,
        port: appConfig.db.port,
        dialect: "mysql",
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
      }
    );
    tenantConnections[tenant] = seq;

    tenantModels[tenant] = {
      KohaSettings: defineKohaSettings(seq),
      LibraryPatrons: defineLibraryPatrons(seq),
      LibraryClearanceLogs: defineLibraryClearanceLogs(seq),
    };
  }
  return tenantConnections[tenant];
}

export function getTenantModels(tenant: string) {
  const seq = getTenantSequelize(tenant);
  return {
    sequelize: seq,
    ...tenantModels[tenant],
  };
}

export async function testConnection() {
  await sequelize.authenticate();
}

