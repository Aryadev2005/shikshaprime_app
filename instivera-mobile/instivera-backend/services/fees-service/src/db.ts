import { Sequelize } from 'sequelize';
import config from './config';

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
    });
  }
  return instances[tenant];
};
