import { Sequelize } from 'sequelize';
import config from './config';
import { logger } from './utils/logger';

// Global Sequelize instance for global tables (institutions, etc.)
export const globalSequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.node_env === 'development' ? logger.debug.bind(logger) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Map to store tenant-specific Sequelize instances
const tenantSequelizeInstances: Map<string, Sequelize> = new Map();

/**
 * Get or create a Sequelize instance for a specific tenant
 * @param tenant Tenant ID/key
 * @returns Sequelize instance for the tenant
 */
export function getTenantSequelize(tenant: string): Sequelize {
  // For Phase 1, we'll use the same database connection for all tenants
  // In production, you might use different databases per tenant
  // For now, tenant is just a logical separation
  if (!tenantSequelizeInstances.has(tenant)) {
    const tenantSeq = new Sequelize(
      config.db.name,
      config.db.user,
      config.db.password,
      {
        host: config.db.host,
        port: config.db.port,
        dialect: 'postgres',
        logging: config.node_env === 'development' ? logger.debug.bind(logger) : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );
    tenantSequelizeInstances.set(tenant, tenantSeq);
  }
  return tenantSequelizeInstances.get(tenant)!;
}

/**
 * Test global database connection
 */
export async function testGlobalConnection(): Promise<boolean> {
  try {
    await globalSequelize.authenticate();
    logger.info('✅ Global database connection established');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to global database:', error);
    return false;
  }
}

/**
 * Initialize database and sync models
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test global connection
    const connected = await testGlobalConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Sync global models
    await globalSequelize.sync({ alter: true });
    logger.info('✅ Global database models synced');

    // Sync tenant models (default tenant for Phase 1)
    const defaultTenant = 'default';
    const tenantSeq = getTenantSequelize(defaultTenant);
    await tenantSeq.sync({ alter: true });
    logger.info(`✅ Tenant '${defaultTenant}' database models synced`);
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Close all database connections
 */
export async function closeDatabase(): Promise<void> {
  await globalSequelize.close();
  for (const [, sequelize] of tenantSequelizeInstances) {
    await sequelize.close();
  }
  logger.info('✅ Database connections closed');
}
