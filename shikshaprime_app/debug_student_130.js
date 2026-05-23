// Debug student 130 class membership
const mysql = require('mysql2/promise');

async function debugStudent130() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '69.62.84.110',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'shiksha_college_user',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'shiksha_college',
  });

  console.log('\n📊 Debugging Student 130 Class Membership vs Broadcast Parameters\n');

  // Check student 130's data
  console.log('🔍 Student 130 Class Data:');
  const [student130] = await connection.execute(`
    SELECT user_id, student_name, program_id, department_id, academic_year_id, class_id, status
    FROM students 
    WHERE user_id = 130
  `);
  console.table(student130);

  // Check what broadcast parameters were used (from latest broadcast conversation 72)
  console.log('\n📡 Recent Broadcast Parameters:');
  const [broadcasts] = await connection.execute(`
    SELECT 
      c.id,
      c.subject,
      c.created_at,
      COUNT(cp.id) as participant_count,
      GROUP_CONCAT(CONCAT(cp.user_type, ' ', cp.user_id)) as participants
    FROM conversations c
    LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.is_active = 1
    WHERE c.created_by_user_id = 11 AND c.created_by_user_type = 'teacher' 
      AND c.created_at > '2026-03-30 19:00:00'
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 3
  `);
  console.table(broadcasts);

  // Check if student 130 would match common class queries
  console.log('\n🎯 Testing Class Queries:');
  
  // Check all students in program 2, department 10, class 1 (typical English Class 1)
  const [classStudents] = await connection.execute(`
    SELECT user_id, student_name, program_id, department_id, academic_year_id, class_id 
    FROM students 
    WHERE program_id = 2 AND department_id = 10 AND class_id = 1 AND status != 'inactive'
    LIMIT 20
  `);
  console.log('\n📚 Students in Program 2, Department 10, Class 1:');
  console.table(classStudents);
  
  // Check if student 130 is in this result
  const student130InClass = classStudents.find(s => s.user_id === 130);
  console.log('\n🎯 Is Student 130 in Program 2, Department 10, Class 1?', student130InClass ? '✅ YES' : '❌ NO');

  if (!student130InClass && student130.length > 0) {
    console.log(`\n❌ MISMATCH: Student 130 has different class parameters:`);
    console.log(`   Student 130: program=${student130[0].program_id}, dept=${student130[0].department_id}, class=${student130[0].class_id}`);
    console.log(`   Broadcast to: program=2, dept=10, class=1`);
  }

  await connection.end();
}

debugStudent130().catch(console.error);