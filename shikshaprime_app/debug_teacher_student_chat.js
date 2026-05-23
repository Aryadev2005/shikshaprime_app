const { sequelize } = require('./services/chat-service/dist/models');

(async () => {
  try {
    // Check if database is accessible first
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    console.log('=== RECENT MESSAGES ANALYSIS ===');
    const messages = await sequelize.query(`
      SELECT m.id, m.conversation_id, m.sender_user_id, m.sender_user_type, 
             m.message_text, m.created_at
      FROM messages m 
      ORDER BY m.created_at DESC 
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('Recent messages:');
    messages.forEach(msg => {
      console.log(`  ${msg.id}: ${msg.sender_user_type} ${msg.sender_user_id} -> Conv ${msg.conversation_id}: "${msg.message_text}"`);
    });
    
    if (messages.length > 0) {
      const latestConvId = messages[0].conversation_id;
      console.log(`\n=== PARTICIPANTS IN CONVERSATION ${latestConvId} ===`);
      
      const participants = await sequelize.query(`
        SELECT cp.conversation_id, cp.user_id, cp.user_type, cp.is_active,
               c.type as conversation_type, c.created_by_user_id, c.created_by_user_type
        FROM conversation_participants cp
        LEFT JOIN conversations c ON cp.conversation_id = c.id
        WHERE cp.conversation_id = :convId
        ORDER BY cp.user_id
      `, { 
        replacements: { convId: latestConvId },
        type: sequelize.QueryTypes.SELECT 
      });
      
      participants.forEach(p => {
        console.log(`  Participant: ${p.user_type} ${p.user_id} (active: ${p.is_active})`);
      });
      console.log(`  Conversation type: ${participants[0]?.conversation_type}`);
      console.log(`  Created by: ${participants[0]?.created_by_user_type} ${participants[0]?.created_by_user_id}`);
      
      console.log(`\n=== TEST STUDENT CONVERSATION QUERY ===`);
      // Test what happens when student 47 or 120 queries for conversations
      const studentIds = [47, 120];
      
      for (const studentId of studentIds) {
        console.log(`\nTesting conversations for student ${studentId}:`);
        const studentConvs = await sequelize.query(`
          SELECT c.id, c.type, c.created_at
          FROM conversations c
          INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
          WHERE cp.user_id = :studentId
            AND cp.user_type = 'student'  
            AND cp.is_active = 1
            AND c.is_active = 1
          ORDER BY c.created_at DESC
        `, {
          replacements: { studentId },
          type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`  Found ${studentConvs.length} conversations for student ${studentId}`);
        studentConvs.forEach(conv => {
          console.log(`    Conv ${conv.id}: ${conv.type} (${conv.created_at})`);
        });
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();