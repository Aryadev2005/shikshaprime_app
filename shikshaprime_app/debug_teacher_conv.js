const { sequelize, Conversation, ConversationParticipant, Message } = require('./services/chat-service/dist/models');

async function testTeacherInitiatedConversation() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Test data
    const teacherId = 116;
    const studentId = 47;  // The student who doesn't see teacher messages

    console.log(`\n=== TESTING TEACHER ${teacherId} -> STUDENT ${studentId} ===`);
    
    // 1. Check if both users exist in their respective tables
    console.log('\n1. Checking if users exist...');
    
    const teacherExists = await sequelize.query(`
      SELECT user_id, first_name, last_name FROM teachers WHERE user_id = :teacherId
    `, {
      replacements: { teacherId },
      type: sequelize.QueryTypes.SELECT
    });
    console.log('Teacher exists:', teacherExists);
    
    const studentExists = await sequelize.query(`
      SELECT id, student_name, first_name, last_name FROM students WHERE id = :studentId
    `, {
      replacements: { studentId },
      type: sequelize.QueryTypes.SELECT
    });
    console.log('Student exists:', studentExists);
    
    // 2. Look for any existing conversation between them
    console.log('\n2. Looking for existing conversations...');
    
    const existingConversations = await sequelize.query(`
      SELECT c.id as conversation_id, c.type, c.created_by_user_id, c.created_by_user_type, c.created_at,
             cp1.user_id as user1_id, cp1.user_type as user1_type,
             cp2.user_id as user2_id, cp2.user_type as user2_type
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id  
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE c.type = 'direct'
        AND cp1.user_id != cp2.user_id
        AND (
          (cp1.user_id = :teacherId AND cp1.user_type = 'teacher' AND cp2.user_id = :studentId AND cp2.user_type = 'student') OR
          (cp1.user_id = :studentId AND cp1.user_type = 'student' AND cp2.user_id = :teacherId AND cp2.user_type = 'teacher')
        )
      ORDER BY c.created_at DESC
    `, {
      replacements: { teacherId, studentId },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`Found ${existingConversations.length} conversations between teacher ${teacherId} and student ${studentId}:`);
    existingConversations.forEach((conv, i) => {
      console.log(`  ${i+1}. Conv ${conv.conversation_id}: Created by ${conv.created_by_user_type} ${conv.created_by_user_id} (${conv.created_at})`);
      console.log(`       Participants: ${conv.user1_type} ${conv.user1_id} <-> ${conv.user2_type} ${conv.user2_id}`);
    });
    
    // 3. For each conversation, check messages and who can see them
    if (existingConversations.length > 0) {
      console.log('\n3. Checking messages in conversations...');
      
      for (const conv of existingConversations) {
        console.log(`\n--- Conversation ${conv.conversation_id} ---`);
        
        // Get messages  
        const messages = await sequelize.query(`
          SELECT m.id, m.sender_user_id, m.sender_user_type, m.message_text, m.created_at
          FROM messages m  
          WHERE m.conversation_id = :convId
          ORDER BY m.created_at DESC
          LIMIT 5
        `, {
          replacements: { convId: conv.conversation_id },
          type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`Messages (${messages.length}):`);
        messages.forEach(msg => {
          console.log(`  ${msg.id}: ${msg.sender_user_type} ${msg.sender_user_id} -> "${msg.message_text}" (${msg.created_at})`);
        });
        
        // Test conversation retrieval for teacher
        console.log('\nTeacher can see conversation?');
        const teacherConvs = await sequelize.query(`
          SELECT c.id FROM conversations c
          INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
          WHERE cp.user_id = :teacherId AND cp.user_type = 'teacher' AND cp.is_active = 1
            AND c.id = :convId AND c.is_active = 1
        `, {
          replacements: { teacherId, convId: conv.conversation_id },
          type: sequelize.QueryTypes.SELECT
        });
        console.log(`  Teacher sees: ${teacherConvs.length > 0 ? 'YES' : 'NO'}`);
        
        // Test conversation retrieval for student  
        console.log('Student can see conversation?');
        const studentConvs = await sequelize.query(`
          SELECT c.id FROM conversations c
          INNER JOIN conversation_participants cp ON c.id = cp.conversation_id  
          WHERE cp.user_id = :studentId AND cp.user_type = 'student' AND cp.is_active = 1
            AND c.id = :convId AND c.is_active = 1
        `, {
          replacements: { studentId, convId: conv.conversation_id },
          type: sequelize.QueryTypes.SELECT
        });
        console.log(`  Student sees: ${studentConvs.length > 0 ? 'YES' : 'NO'}`);
      }
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTeacherInitiatedConversation();