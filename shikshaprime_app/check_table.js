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
    logging: false,
  }
);

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check for message-related tables
    const [results] = await sequelize.query("SHOW TABLES LIKE '%message%'");
    console.log('Message tables found:', results);

    // Try to describe message_read_status table specifically
    try {
      const [desc] = await sequelize.query("DESCRIBE message_read_status");
      console.log('✅ message_read_status table exists with structure:', desc);
    } catch (error) {
      console.log('❌ message_read_status table does not exist:', error.message);

      // Let's manually create it without foreign key constraints first
      console.log('🔄 Attempting to create message_read_status table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS message_read_status (
          id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          message_id BIGINT UNSIGNED NOT NULL,
          user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reader user ID',
          user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL,
          read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          UNIQUE KEY unique_reader (message_id, user_id, user_type),
          INDEX idx_message (message_id),
          INDEX idx_user (user_id, user_type),
          INDEX idx_read_at (read_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Tracks read status of messages for each user';
      `;

      await sequelize.query(createTableSQL);
      console.log('✅ message_read_status table created successfully');

      // Now try to add the foreign key constraint if messages table exists
      try {
        await sequelize.query("ALTER TABLE message_read_status ADD CONSTRAINT fk_message_read_status_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE");
        console.log('✅ Foreign key constraint added successfully');
      } catch (fkError) {
        console.log('⚠️ Could not add foreign key constraint:', fkError.message);
        console.log('Table created without foreign key constraint - this should still work for basic functionality');
      }
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();