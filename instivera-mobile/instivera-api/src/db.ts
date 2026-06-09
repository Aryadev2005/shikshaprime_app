import { Sequelize } from 'sequelize';
import config from './config';

// Global connection — for non-tenant tables (institutions, etc.)
export const globalSequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.pass,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

// Tenant-scoped connections (cached per tenant string)
const tenantInstances: Record<string, Sequelize> = {};

export const getTenantSequelize = (tenant: string): Sequelize => {
  if (!tenantInstances[tenant]) {
    tenantInstances[tenant] = new Sequelize(
      config.db.name,
      config.db.user,
      config.db.pass,
      {
        host: config.db.host,
        port: config.db.port,
        dialect: 'mysql',
        logging: false,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      }
    );
  }
  return tenantInstances[tenant];
};

export async function testConnection(): Promise<void> {
  await globalSequelize.authenticate();
}

export async function closeAllConnections(): Promise<void> {
  await globalSequelize.close();
  for (const instance of Object.values(tenantInstances)) {
    await instance.close();
  }
}
