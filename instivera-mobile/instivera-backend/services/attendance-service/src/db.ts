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
});

export const getTenantSequelize = (tenant: string) => {
  return new Sequelize({
    database: `${config.DB_NAME}_${tenant}`,
    dialect: 'postgres',
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    host: config.DB_HOST,
    port: config.DB_PORT,
    models: [__dirname + '/models'], // Path to the models
    logging: config.DB_LOGGING,
  });
};

export default sequelize;