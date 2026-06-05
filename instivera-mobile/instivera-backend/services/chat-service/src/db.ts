import { Sequelize } from 'sequelize';
import config from './config';

export const globalSequelize = new Sequelize({
  database: config.db.database,
  dialect: 'mysql',
  username: config.db.username,
  password: config.db.password,
  host: config.db.host,
  port: 3306,
  logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

const instances: Record<string, Sequelize> = {};

export const getTenantSequelize = (tenant: string): Sequelize => {
  if (!instances[tenant]) {
    instances[tenant] = new Sequelize({
      database: config.db.database,
      dialect: 'mysql',
      username: config.db.username,
      password: config.db.password,
      host: config.db.host,
      port: 3306,
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    });
  }
  return instances[tenant];
};
