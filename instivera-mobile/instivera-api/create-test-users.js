// Temporary one-off script to create a real student + teacher login for local
// Phase 1 verification against the shared dev DB. Not part of the app; delete after use.
const bcrypt = require('bcryptjs');
const { getGlobalModels, getTenantModels } = require('./dist/models');
const { closeAllConnections } = require('./dist/db');

const PASSWORD = 'TestVerify123!';

async function main() {
  const { Institution } = getGlobalModels();
  const institution = await Institution.findOne({ where: { is_active: 1 } });
  if (!institution) throw new Error('No active institution found');
  const tenant = institution.slug;
  console.log('Using tenant:', tenant, '(' + institution.name + ')');

  const { User, Student, Teacher } = getTenantModels(tenant);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const stamp = Date.now();

  // ── Student ──
  const studentCode = `VERIFYSTU${stamp}`;
  const studentEmail = `verify.student.${stamp}@example.com`;
  await User.create({
    username: studentCode,
    email: studentEmail,
    password_hash: passwordHash,
    role: 'student',
    user_type: 'student',
    user_code: studentCode,
    is_active: 1,
  });
  await Student.create({
    student_id: studentCode,
    student_name: 'Verify Student',
    first_name: 'Verify',
    last_name: 'Student',
    email: studentEmail,
    roll_number: 'V-001',
    is_active: 1,
    status: 1,
  });

  // ── Teacher ──
  const teacherCode = `VERIFYTCH${stamp}`;
  const teacherEmail = `verify.teacher.${stamp}@example.com`;
  await User.create({
    username: teacherCode,
    email: teacherEmail,
    password_hash: passwordHash,
    role: 'teacher',
    user_type: 'teacher',
    user_code: teacherCode,
    is_active: 1,
  });
  await Teacher.create({
    employee_id: teacherCode,
    first_name: 'Verify',
    last_name: 'Teacher',
    email: teacherEmail,
    is_active: 1,
  });

  console.log(JSON.stringify({
    tenant,
    password: PASSWORD,
    student: { username: studentCode, email: studentEmail },
    teacher: { username: teacherCode, email: teacherEmail },
  }, null, 2));

  await closeAllConnections();
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
