import { Sequelize } from 'sequelize-typescript';
import { config } from './config';

const sequelize = new Sequelize({
  database: config.DB_NAME,
  dialect: 'postgres',
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  host: config.DB_HOST,
  port: config.DB_PORT,
  models: [__dirname + '/models'], // Path to the models
  logging: config.DB_LOGGING,
  pool: {
    max: config.DB_POOL_MAX,
    min: config.DB_POOL_MIN,
    acquire: config.DB_POOL_ACQUIRE,
    idle: config.DB_POOL_IDLE,
  },
});

export const getTenantSequelize = (tenant: string) => {
  // Logic to return a Sequelize instance for the specified tenant
  return sequelize;
};

export default sequelize;