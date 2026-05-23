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

async function checkAndFixTables() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Check actual table structure
    console.log('🔍 Checking conversation_participants table structure...');
    const [columns] = await sequelize.query("DESCRIBE conversation_participants");
    console.log('📋 Current columns:', columns.map(col => col.Field));
    
    // Check if user_type column exists
    const hasUserType = columns.some(col => col.Field === 'user_type');
    
    if (!hasUserType) {
      console.log('⚠️ user_type column is missing! Adding it...');
      await sequelize.query(`
        ALTER TABLE conversation_participants 
        ADD COLUMN user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL AFTER user_id
      `);
      console.log('✅ Added user_type column');
    } else {
      console.log('✅ user_type column exists');
    }
    
    // Check conversations table
    console.log('🔍 Checking conversations table structure...');
    const [convColumns] = await sequelize.query("DESCRIBE conversations");
    console.log('📋 Conversations columns:', convColumns.map(col => col.Field));
    
    // Check if class_id column exists
    const hasClassId = convColumns.some(col => col.Field === 'class_id');
    
    if (!hasClassId) {
      console.log('⚠️ class_id column is missing! Adding it...');
      await sequelize.query(`
        ALTER TABLE conversations 
        ADD COLUMN class_id BIGINT UNSIGNED NULL COMMENT 'Class ID for class broadcasts' AFTER subject
      `);
      console.log('✅ Added class_id column');
    } else {
      console.log('✅ class_id column exists');
    }
    
    // Check messages table
    console.log('🔍 Checking messages table structure...');
    const [msgColumns] = await sequelize.query("DESCRIBE messages");
    const msgColumnNames = msgColumns.map(col => col.Field);
    console.log('📋 Messages columns:', msgColumnNames);
    
    // Add missing columns if needed
    const messageCols = [
      'message_type',
      'parent_message_id', 
      'file_url',
      'file_name',
      'file_size',
      'is_deleted'
    ];
    
    for (const col of messageCols) {
      if (!msgColumnNames.includes(col)) {
        let alterQuery = '';
        switch(col) {
          case 'message_type':
            alterQuery = `ALTER TABLE messages ADD COLUMN message_type ENUM('text', 'announcement', 'important', 'file') DEFAULT 'text' AFTER message_text`;
            break;
          case 'parent_message_id':
            alterQuery = `ALTER TABLE messages ADD COLUMN parent_message_id BIGINT UNSIGNED NULL COMMENT 'For threaded replies' AFTER message_type`;
            break;
          case 'file_url':
            alterQuery = `ALTER TABLE messages ADD COLUMN file_url VARCHAR(500) NULL COMMENT 'File attachment URL if any' AFTER parent_message_id`;
            break;
          case 'file_name':
            alterQuery = `ALTER TABLE messages ADD COLUMN file_name VARCHAR(255) NULL COMMENT 'Original filename' AFTER file_url`;
            break;
          case 'file_size':
            alterQuery = `ALTER TABLE messages ADD COLUMN file_size BIGINT NULL COMMENT 'File size in bytes' AFTER file_name`;
            break;
          case 'is_deleted':
            alterQuery = `ALTER TABLE messages ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 COMMENT 'Soft delete flag' AFTER file_size`;
            break;
        }
        if (alterQuery) {
          await sequelize.query(alterQuery);
          console.log(`✅ Added ${col} column to messages table`);
        }
      }
    }
    
    console.log('✅ Database schema check and fix completed');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkAndFixTables();