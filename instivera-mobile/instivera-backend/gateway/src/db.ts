import { Sequelize } from 'sequelize';
import config from './config';

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

const instances = new Map<string, Sequelize>();

export function getTenantSequelize(tenant: string): Sequelize {
  if (!instances.has(tenant)) {
    instances.set(tenant, new Sequelize(
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
    ));
  }
  return instances.get(tenant)!;
}
