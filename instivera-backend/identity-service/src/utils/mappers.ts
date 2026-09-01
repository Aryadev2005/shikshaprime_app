export function mapRegisterStudentToDb(dto: any, files?: any) {
  console.log('[DEBUG] mapRegisterStudentToDb called with:');
  console.log('[DEBUG] dto:', JSON.stringify(dto, null, 2));
  console.log('[DEBUG] files:', files);
  
  const getDocumentPath = (fieldName: string) => {
    console.log(`[DEBUG] Getting document path for field: ${fieldName}`);
    if (files && files[fieldName] && files[fieldName][0]) {
      console.log(`[DEBUG] Found file for ${fieldName}:`, files[fieldName][0]);
      return `/api/identity/files/documents/${files[fieldName][0].filename}`;
    }
    console.log(`[DEBUG] No file found for ${fieldName}`);
    return null;
  };

  // Parse academics safely 
  let academics = []; 
  if (dto.academics) {
     try { 
      academics = JSON.parse(dto.academics); 
    } catch (err) {
       console.error("Failed to parse academics:", err); 
       academics = []; 
  } }

  // Find the academic entries 
  const tenAcademic = academics?.find(a => a.qualification === "10th"); 
  const twelveAcademic = academics?.find(a => a.qualification === "12th");
  const graduationAcademic = academics?.find(a => a.qualification === "Graduation");
  
  // Only populate graduation academic details if degree is "post-graduation"
  const isPostGraduation = dto.degreeApplyingFor === "PG";
  
  return {
    registration_id: generateRegistrationId(),
    first_name: dto.firstName,
    last_name: dto.lastName,
    gender: dto.gender || "UNSPECIFIED",
    date_of_birth: dto.dob,
    class_id: dto.classApplyingFor,
    department_id: dto.dept,
    program_id: dto.program,
    academic_year_id: dto.academicYear || null,
    father_name: dto.fatherName,
    mother_name: dto.motherName || null,
    mobile: dto.mobileNumber,
    email: dto.emailId,
    religion: dto.religion,
    is_physically_challenged: dto.physicallyChallenged,
    guardian_name: dto.guardianName,
    guardian_mobile: dto.guardianMobileNumber || null,
    guardian_email: dto.guardianEmailId || null,
    address_line: dto.addressLine || null,
    city: dto.city || null,
    state: dto.state || null,
    pin_code: dto.pinCode || null,
    previous_school_name: dto.previousSchoolName || null,
    last_class_passed: dto.lastClassPassed || null,
    board_university_10th: tenAcademic?.boardUniversity || null,
    ten_percentage: tenAcademic?.percentage ? Number(tenAcademic.percentage) : null,
    year_of_passing_10th: tenAcademic?.yearOfPassing || null,
    board_university_12th: twelveAcademic?.boardUniversity || null,
    twelve_percentage: twelveAcademic?.percentage ? Number(twelveAcademic.percentage) : null,
    year_of_passing_12th: twelveAcademic?.yearOfPassing || null,
    board_university_graduation: isPostGraduation ? (graduationAcademic?.boardUniversity || null) : null,
    graduation_percentage: isPostGraduation ? (graduationAcademic?.percentage ? Number(graduationAcademic.percentage) : null) : null,
    year_of_passing_graduation: isPostGraduation ? (graduationAcademic?.yearOfPassing || null) : null,
    caste: dto.caste || null,
    degree: dto.degreeApplyingFor || null,
    id_proof_type: dto.idProofType || null,
    id_proof_number: dto.idProofNumber || null,
    nationality: dto.nationality || 'Indian',
    aadhar_doc: getDocumentPath('aadhar'),
    birth_certificate_doc: getDocumentPath('birth_certificate'),
    ten_marksheet_doc: getDocumentPath('10_mark_sheet'),
    twelve_marksheet_doc: getDocumentPath('12_mark_sheet'),
    graduation_doc: isPostGraduation ? getDocumentPath('graduation') : null,
    caste_certificate_doc: getDocumentPath('caste_certificate'),
    physically_challenged_certificate: dto.physicallyChallenged ? getDocumentPath('physically_challenged_certificate') : null,
    profile_img: getDocumentPath('profileImg'),
  };
}

export function mapListRegistrationsToDb(dto: any) {
  return {
    search_text: dto.searchText,
    class_id: dto.classId,
    academic_year_id: dto.academicYearId,
    status: dto.status,
    page: dto.page,
    limit: dto.limit
  };
}

function generateRegistrationId(): string {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REG-${ts}-${rand}`;
}
