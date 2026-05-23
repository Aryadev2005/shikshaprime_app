// Debug script to check conversations in database
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './services/chat-service/.env.development' });

async function debugConversations() {
  console.log('🔍 Debugging conversation issues...');
  
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'college_management',
      port: process.env.DB_PORT || 3306,
    });

    console.log('✅ Connected to database');

    // Check messages table
    const [messages] = await connection.execute('SELECT COUNT(*) as count FROM messages');
    console.log(`📨 Messages in database: ${messages[0].count}`);

    // Check conversations table  
    const [conversations] = await connection.execute('SELECT COUNT(*) as count FROM conversations');
    console.log(`💬 Conversations in database: ${conversations[0].count}`);

    // Check conversation_participants table
    const [participants] = await connection.execute('SELECT COUNT(*) as count FROM conversation_participants');
    console.log(`👥 Conversation participants: ${participants[0].count}`);

    // Check if conversations table exists and has data
    const [conversList] = await connection.execute('SELECT * FROM conversations LIMIT 5');
    console.log('📋 Sample conversations:', conversList);

    // Check if conversation_participants exists and has data
    const [partsList] = await connection.execute('SELECT * FROM conversation_participants LIMIT 5');
    console.log('👥 Sample participants:', partsList);

    // Check recent messages with details
    const [recentMessages] = await connection.execute(`
      SELECT m.id, m.conversation_id, m.sender_user_id, m.sender_user_type, 
             m.message_text, m.created_at
      FROM messages m 
      ORDER BY m.created_at DESC 
      LIMIT 5
    `);
    console.log('📨 Recent messages:', recentMessages);

    // Test the conversation query for a specific user
    const [testQuery] = await connection.execute(`
      SELECT 
        c.id,
        c.type,
        cp.user_id,
        cp.user_type
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.is_active = 1
        AND c.is_active = 1
      LIMIT 10
    `);
    console.log('🔍 Conversation participants query result:', testQuery);

    await connection.end();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

debugConversations();