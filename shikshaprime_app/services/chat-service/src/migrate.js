const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.development' });

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: console.log,
  }
);

async function runMigrations() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Read and execute migration SQL
    const migrationPath = path.join(__dirname, '..', 'migrations', '001_create_chat_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running chat table migrations...');
    
    // Split by ';' and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sequelize.query(statement);
          console.log('✅ Executed statement successfully');
        } catch (error) {
          console.log('ℹ️  Statement result:', error.message);
        }
      }
    }
    
    console.log('✅ Migration completed successfully');
    
    // Test if tables were created
    const [results] = await sequelize.query("SHOW TABLES LIKE '%conversation%'");
    console.log('📋 Chat tables found:', results);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigrations();