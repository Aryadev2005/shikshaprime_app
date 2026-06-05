import { Sequelize } from 'sequelize';
import config from './config';

export const globalSequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.pass,
  {
    host: config.db.host,
    port: Number(config.db.port),
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  }
);

const sequelizeInstances: Record<string, Sequelize> = {};

export const getTenantSequelize = (tenant: string): Sequelize => {
  if (!sequelizeInstances[tenant]) {
    sequelizeInstances[tenant] = new Sequelize(
      config.db.name,
      config.db.user,
      config.db.pass,
      {
        host: config.db.host,
        port: Number(config.db.port),
        dialect: 'mysql',
        logging: false,
      }
    );
  }
  return sequelizeInstances[tenant];
};

export default getTenantSequelize;
