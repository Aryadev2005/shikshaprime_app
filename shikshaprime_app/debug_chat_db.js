const { sequelize } = require('./services/chat-service/dist/models');

(async () => {
  try {
    console.log('=== RECENT MESSAGES ===');
    const recentMessages = await sequelize.query(`
      SELECT m.id, m.conversation_id, m.sender_user_id, m.sender_user_type, 
             m.message_text, m.created_at,
             c.type as conversation_type
      FROM messages m 
      LEFT JOIN conversations c ON m.conversation_id = c.id
      ORDER BY m.created_at DESC 
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });
    
    recentMessages.forEach(msg => {
      console.log(`Message ID ${msg.id}: ${msg.sender_user_type} ${msg.sender_user_id} -> Conv ${msg.conversation_id} (${msg.conversation_type}): "${msg.message_text}"`);
    });
    
    console.log('\n=== CONVERSATION PARTICIPANTS ===');
    const participants = await sequelize.query(`
      SELECT cp.conversation_id, cp.user_id, cp.user_type, cp.is_active, c.type as conversation_type
      FROM conversation_participants cp
      LEFT JOIN conversations c ON cp.conversation_id = c.id
      WHERE cp.conversation_id IN (
        SELECT DISTINCT conversation_id FROM messages 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      )
      ORDER BY cp.conversation_id, cp.user_id
    `, { type: sequelize.QueryTypes.SELECT });
    
    participants.forEach(p => {
      console.log(`Conv ${p.conversation_id} (${p.conversation_type}): ${p.user_type} ${p.user_id} (active: ${p.is_active})`);
    });

    console.log('\n=== TEACHER-STUDENT CONVERSATION ANALYSIS ===');
    // Check specifically for conversations involving teacher 116 and students 47, 120
    const teacherStudentConvs = await sequelize.query(`
      SELECT DISTINCT 
        c.id as conversation_id,
        c.type,
        cp1.user_id as user1_id,
        cp1.user_type as user1_type,
        cp2.user_id as user2_id,
        cp2.user_type as user2_type
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE c.type = 'direct'
        AND cp1.user_id != cp2.user_id
        AND (
          (cp1.user_id = 116 AND cp1.user_type = 'teacher' AND cp2.user_type = 'student') OR
          (cp2.user_id = 116 AND cp2.user_type = 'teacher' AND cp1.user_type = 'student')
        )
      ORDER BY c.id DESC
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('Direct conversations between teacher 116 and students:');
    teacherStudentConvs.forEach(conv => {
      console.log(`Conv ${conv.conversation_id}: ${conv.user1_type} ${conv.user1_id} <-> ${conv.user2_type} ${conv.user2_id}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();