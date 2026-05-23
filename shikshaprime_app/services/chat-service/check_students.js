// Import the compiled models
const { sequelize } = require('./dist/models/index');
const { QueryTypes } = require('sequelize'); 

async function checkStudents() {
  try {
    console.log('🔍 Checking Student 48 (who received the message)...');
    const student48 = await sequelize.query(
      'SELECT id, student_name, email FROM students WHERE id = 48 LIMIT 1',
      { type: QueryTypes.SELECT }
    );
    console.log('👤 Student 48:', student48[0] || 'Not found');
    
    console.log('\n🔍 Checking Student 121 (current user)...');
    const student121 = await sequelize.query(
      'SELECT id, student_name, email FROM students WHERE id = 121 LIMIT 1', 
      { type: QueryTypes.SELECT }
    );
    console.log('👤 Student 121:', student121[0] || 'Not found');
    
    console.log('\n💬 Checking conversation 48 participants...');
    const participants = await sequelize.query(`
      SELECT 
        cp.user_id,
        cp.user_type,
        cp.is_active,
        CASE 
          WHEN cp.user_type = 'student' THEN s.student_name
          WHEN cp.user_type = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
        END as name
      FROM conversation_participants cp
      LEFT JOIN students s ON cp.user_id = s.id AND cp.user_type = 'student'
      LEFT JOIN teachers t ON cp.user_id = t.user_id AND cp.user_type = 'teacher'
      WHERE cp.conversation_id = 48
    `, { type: QueryTypes.SELECT });
    
    console.log('👥 Conversation 48 participants:', participants);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkStudents();