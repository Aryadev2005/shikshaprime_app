const { Sequelize } = require('sequelize');

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

async function alignColumnNames() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    console.log('🔄 Aligning column names to match the code...');
    
    // Fix conversation_participants table
    try {
      // Add missing columns that the code expects but don't exist yet
      const [columns] = await sequelize.query("DESCRIBE conversation_participants");
      const columnNames = columns.map(col => col.Field);
      
      if (!columnNames.includes('is_active')) {
        await sequelize.query(`ALTER TABLE conversation_participants ADD COLUMN is_active TINYINT(1) DEFAULT 1`);
        console.log('✅ Added is_active column to conversation_participants');
      }
      
      console.log('📋 conversation_participants columns now:', columnNames);
    } catch (error) {
      console.log('ℹ️ conversation_participants adjustment:', error.message);
    }

    // Fix conversations table  
    try {
      const [convCols] = await sequelize.query("DESCRIBE conversations");
      const convColumnNames = convCols.map(col => col.Field);
      
      if (!convColumnNames.includes('created_by_user_id')) {
        // Rename created_by to created_by_user_id
        await sequelize.query(`ALTER TABLE conversations CHANGE COLUMN created_by created_by_user_id BIGINT UNSIGNED NOT NULL`);
        console.log('✅ Renamed created_by to created_by_user_id');
      }
      
      if (!convColumnNames.includes('created_by_user_type')) {
        // Rename created_by_role to created_by_user_type  
        await sequelize.query(`ALTER TABLE conversations CHANGE COLUMN created_by_role created_by_user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL`);
        console.log('✅ Renamed created_by_role to created_by_user_type');
      }
      
    } catch (error) {
      console.log('ℹ️ conversations adjustment:', error.message);
    }

    // Fix messages table
    try {
      const [msgCols] = await sequelize.query("DESCRIBE messages");  
      const msgColumnNames = msgCols.map(col => col.Field);
      
      if (!msgColumnNames.includes('sender_user_id')) {
        // Rename sender_id to sender_user_id
        await sequelize.query(`ALTER TABLE messages CHANGE COLUMN sender_id sender_user_id BIGINT UNSIGNED NOT NULL`);
        console.log('✅ Renamed sender_id to sender_user_id');
      }
      
      if (!msgColumnNames.includes('sender_user_type')) {
        // Rename sender_role to sender_user_type
        await sequelize.query(`ALTER TABLE messages CHANGE COLUMN sender_role sender_user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL`);
        console.log('✅ Renamed sender_role to sender_user_type');
      }
      
    } catch (error) {
      console.log('ℹ️ messages adjustment:', error.message);
    }

    console.log('✅ Column alignment completed!');
    
    // Test a simple query that was failing before
    console.log('🧪 Testing the query that was failing...');
    try {
      const testResult = await sequelize.query(`
        SELECT cp.* FROM conversation_participants cp 
        WHERE cp.user_id = 1 AND cp.user_type = 'teacher' 
        LIMIT 1
      `);
      console.log('✅ Test query works! Found', testResult[0].length, 'rows');
    } catch (error) {
      console.log('❌ Test query failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Column alignment failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

alignColumnNames();