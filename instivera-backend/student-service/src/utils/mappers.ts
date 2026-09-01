// Mapper for student data transformation
export function mapStudentToDb(dto: any) {
  return {
    // Auto-generated fields (handled by service)
    student_id: dto.student_id,
    roll_number: dto.roll_number,

    // Basic information
    mode: dto.mode || 'ONLINE',
    first_name: dto.first_name,
    last_name: dto.last_name,
    gender: dto.gender || 'UNSPECIFIED',
    date_of_birth: dto.date_of_birth,

    // Academic information
    class_id: dto.class_id,
    department_id: dto.department_id,
    academic_year_id: dto.academic_year_id,

    // Family information
    father_name: dto.father_name,
    mother_name: dto.mother_name,

    // Contact information
    mobile: dto.mobile,
    email: dto.email,

    // Address information
    address_line: dto.address_line,
    city: dto.city,
    state: dto.state,
    pin_code: dto.pin_code,

    // Educational background
    previous_school_name: dto.previous_school_name,
    last_class_passed: dto.last_class_passed,
    board_university: dto.board_university,

    // Administrative
    status: dto.status || 'ACTIVE',
    remarks: dto.remarks,
    entered_by_user_id: dto.entered_by_user_id,
    entered_by_name: dto.entered_by_name
  };
}

// Mapper for student response transformation - maps from student_info table
export function mapStudentFromDb(dbRecord: any) {
  let full_name = '';
  if (dbRecord.middle_name)
    full_name = dbRecord.first_name + ' ' + dbRecord.middle_name + ' ' + dbRecord.last_name;
  else
    full_name = dbRecord.first_name + ' ' + dbRecord.last_name;
   
  return {
    id: dbRecord.id,
    student_id: dbRecord.student_id,
    roll_number: dbRecord.roll_number,
    university_registration_number: dbRecord.university_registration_number,
    student_name: full_name,
    sex: dbRecord.gender,
    dob: dbRecord.dob,
    religion: dbRecord.details.religion,
    is_physically_challenged: dbRecord.details.is_physically_challenged === 1 ? true : false,
    nationality: dbRecord.nationality,
    caste: dbRecord.social_category,
    id_proof_type: dbRecord.details.identity_proof_type,
    id_proof_number: dbRecord.details.identity_proof_number,
    // Parent information
    father_name: dbRecord.father_name,
    mother_name: dbRecord.mother_name,
    guardian_name: dbRecord.guardian_name,
    guardian_mobile: dbRecord.guardian_mobile,
    guardian_email: dbRecord.guardian_email,

    // Contact
    mobile: dbRecord.mobile,
    email: dbRecord.email,
    // Present Address
    address_line: dbRecord.address_line,
    city: dbRecord.city,
    state: dbRecord.state,
    pin_code: dbRecord.pin_code,

    // Academic
    class_id: dbRecord.details.class_id,
    admission_date: dbRecord.admission_date,
    department_id: dbRecord.details.program.department_id,
    program_id: dbRecord.details.program_id,
    section: dbRecord.section,

    // Academic details - all levels
    board_university_10th: dbRecord.board_university_10th,
    year_of_passing_10th: dbRecord.year_of_passing_10th,
    board_university_12th: dbRecord.board_university_12th,
    year_of_passing_12th: dbRecord.year_of_passing_12th,
    board_university_graduation: dbRecord.board_university_graduation,
    year_of_passing_graduation: dbRecord.year_of_passing_graduation,
    // Marksheet percentages
    ten_percentage: dbRecord.ten_percentage,
    twelve_percentage: dbRecord.twelve_percentage,
    graduation_percentage: dbRecord.graduation_percentage,

    // Status
    status: dbRecord.status,

    // Document images
    profile_img: dbRecord.profile_img,
    ten_marksheet_doc: dbRecord.ten_marksheet_doc,
    twelve_marksheet_doc: dbRecord.twelve_marksheet_doc,
    graduation_marksheet_doc: dbRecord.graduation_doc,
    aadhar_doc: dbRecord.aadhar_doc,
    caste_certificate_doc: dbRecord.caste_certificate_doc,
    physically_challenged_certificate: dbRecord.physically_challenged_certificate,

    // Attendance
    attendance_percentage: dbRecord.attendance_percentage || 0,
    present_count: dbRecord.present_count || 0,
    absent_count: dbRecord.absent_count || 0,

    // Subjects (if joined)
    subjects: dbRecord.subjects ? dbRecord.subjects.map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      is_core: s.StudentSubject ? s.StudentSubject.is_core : undefined
    })) : [],

    // Timestamps
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt
  };
}

// Validation for student creation
export function validateStudentCreation(data: any) {
  const errors: string[] = [];

  if (!data.registration_id) {
    errors.push('Registration ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validation for student update
export function validateStudentUpdate(data: any) {
  const errors: string[] = [];
  const allowedFields = [
    'mode', 'first_name', 'last_name', 'gender', 'date_of_birth',
    'class_id', 'department_id', 'academic_year_id',
    'father_name', 'father_mobile', 'father_email',
    'mother_name', 'mother_mobile', 'mother_email',
    'guardian_name', 'guardian_mobile', 'guardian_email',
    'mobile', 'email',
    'address_line', 'city', 'state', 'pin_code',
    'present_village', 'present_district', 'present_state', 'present_pin_code',
    'permanent_village', 'permanent_district', 'permanent_state', 'permanent_pin_code',
    'previous_school_name', 'last_class_passed', 'board_university',
    'status', 'remarks', 'university_registration_number'
  ];

  // Check if only allowed fields are being updated
  const invalidFields = Object.keys(data).filter(key => !allowedFields.includes(key));
  if (invalidFields.length > 0) {
    errors.push(`Invalid fields: ${invalidFields.join(', ')}`);
  }

  // Validate email format if provided
  const emailFields = ['email', 'father_email', 'mother_email', 'guardian_email'];
  emailFields.forEach(field => {
    if (data[field] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[field])) {
      errors.push(`Invalid ${field} format`);
    }
  });

  // Validate mobile format if provided
  const mobileFields = ['mobile', 'father_mobile', 'mother_mobile', 'guardian_mobile'];
  mobileFields.forEach(field => {
    if (data[field] && !/^[0-9]{10}$/.test(data[field])) {
      errors.push(`${field.replace('_', ' ')} must be 10 digits`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
