const { sequelize } = require('./services/chat-service/dist/models');

async function debugTeacherToTeacherIssue() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('\n=== DEBUGGING TEACHER-TO-TEACHER CHAT ===');

    // 1. Check recent teacher-to-teacher messages  
    console.log('\n1. Looking for teacher-to-teacher conversations...');
    const teacherMessages = await sequelize.query(`
      SELECT m.id, m.conversation_id, m.sender_user_id, m.sender_user_type, 
             m.message_text, m.created_at,
             c.type, c.created_by_user_type
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.sender_user_type = 'teacher' 
        AND c.type = 'direct'
      ORDER BY m.created_at DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Recent teacher messages:', teacherMessages);

    if (teacherMessages.length > 0) {
      const convId = teacherMessages[0].conversation_id;
      console.log(`\n2. Checking participants in conversation ${convId}...`);
      
      const participants = await sequelize.query(`
        SELECT user_id, user_type, is_active 
        FROM conversation_participants 
        WHERE conversation_id = :convId
      `, { 
        replacements: { convId },
        type: sequelize.QueryTypes.SELECT 
      });
      
      console.log('Participants:', participants);

      // 3. Test the problematic query for teacher-to-teacher  
      if (participants.length >= 2) {
        const teacher1 = participants[0];
        const teacher2 = participants[1];
        
        console.log(`\n3. Testing getConversations query for teacher ${teacher1.user_id}...`);
        
        // This mimics the same query from getConversations method
        const testQuery = await sequelize.query(`
          SELECT 
            c.id,
            c.type,
            -- This is the problematic part for teacher-to-teacher
            other_participant.user_id as other_participant_id,
            other_participant.user_type as other_participant_type,
            -- Name resolution
            CASE 
              WHEN c.type = 'direct' THEN 
                CASE 
                  WHEN other_participant.user_type = 'student' THEN 
                    (SELECT student_name FROM students WHERE user_id = other_participant.user_id LIMIT 1)
                  WHEN other_participant.user_type = 'teacher' THEN 
                    (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE user_id = other_participant.user_id LIMIT 1)
                  ELSE 
                    (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE user_id = other_participant.user_id LIMIT 1)
                END
            END as conversation_name
          FROM conversations c
          INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
          -- The problem is this JOIN condition for teacher-to-teacher
          LEFT JOIN conversation_participants other_participant ON c.id = other_participant.conversation_id 
            AND other_participant.user_id != CAST(:userId AS UNSIGNED)
            AND other_participant.user_type != :userType  -- This excludes other teachers!
            AND other_participant.is_active = 1
            AND c.type = 'direct'
          WHERE cp.user_id = CAST(:userId AS UNSIGNED)
            AND cp.user_type = :userType
            AND cp.is_active = 1
            AND c.is_active = 1
            AND c.id = :convId
        `, {
          replacements: { 
            userId: teacher1.user_id,
            userType: teacher1.user_type,
            convId: convId
          },
          type: sequelize.QueryTypes.SELECT
        });
        
        console.log('Query result for teacher 1:', testQuery);
        console.log('❌ Problem: other_participant_id =', testQuery[0]?.other_participant_id);
        console.log('❌ Problem: other_participant_type =', testQuery[0]?.other_participant_type);
        console.log('❌ Problem: conversation_name =', testQuery[0]?.conversation_name);

        // 4. Check if teachers table has the data
        console.log('\n4. Checking teachers table for names...');
        const teacherData = await sequelize.query(`
          SELECT user_id, first_name, last_name 
          FROM teachers 
          WHERE user_id IN (${teacher1.user_id}, ${teacher2.user_id})
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Teacher data in teachers table:', teacherData);

        // 5. Check alternative table college_users
        console.log('\n5. Checking college_users table for names...');
        const collegeUserData = await sequelize.query(`
          SELECT user_id, first_name, last_name 
          FROM college_users 
          WHERE user_id IN (${teacher1.user_id}, ${teacher2.user_id})
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Teacher data in college_users table:', collegeUserData);
      }
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugTeacherToTeacherIssue();