import { Sequelize } from 'sequelize';
import { config } from './config';
import { logger } from './utils/logger';

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

const instances = new Map<string, Sequelize>();

export function getTenantSequelize(tenant: string): Sequelize {
  if (!instances.has(tenant)) {
    instances.set(tenant, new Sequelize(
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
    ));
  }
  return instances.get(tenant)!;
}

export async function testGlobalConnection(): Promise<boolean> {
  try {
    await globalSequelize.authenticate();
    logger.info('✅ Connected to ShikshaPrime MySQL at 69.62.84.110');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to database:', error);
    return false;
  }
}

export async function initializeDatabase(): Promise<void> {
  const connected = await testGlobalConnection();
  if (!connected) {
    throw new Error('Failed to connect to ShikshaPrime MySQL database');
  }
  logger.info('✅ Database initialized successfully');
}

export async function closeDatabase(): Promise<void> {
  await globalSequelize.close();
  for (const [, seq] of instances) {
    await seq.close();
  }
  logger.info('✅ Database connections closed');
}
