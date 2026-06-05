import { Sequelize } from 'sequelize-typescript';
import { config } from './config';

const sequelizeInstances: { [key: string]: Sequelize } = {};

export const getTenantSequelize = (tenant: string): Sequelize => {
    if (!sequelizeInstances[tenant]) {
        sequelizeInstances[tenant] = new Sequelize({
            database: config.DB_NAME,
            dialect: 'postgres',
            username: config.DB_USER,
            password: config.DB_PASSWORD,
            host: config.DB_HOST,
            port: config.DB_PORT,
            models: [__dirname + '/models'], // Path to your models
            logging: config.DB_LOGGING,
        });
    }
    return sequelizeInstances[tenant];
};