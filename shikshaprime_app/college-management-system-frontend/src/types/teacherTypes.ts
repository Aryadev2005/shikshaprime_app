// Teacher/Faculty Types

export interface SubjectAssignment {
  subject: string;
  class: string;
  academicYear: string;
  assignedDate: string;
}

export interface ClassTeacherAssignment {
  class: string;
  subject?: string;
  assignedDate: string;
}

export interface TeacherFormData {
  // Personal Information
  employeeId: string;
  dateOfJoining: string;
  firstName: string;
  lastName: string;
  designation: string;
  departmentId: string;
  qualification: string;
  experienceYears: string;
  email: string;
  phone: string;
  emergencyContact: string;
  dateOfBirth: string;
  address: string;

  // Subject Assignments
  subjectAssignments: SubjectAssignment[];

  // Class Teacher Assignments
  classTeacherAssignments: ClassTeacherAssignment[];
}

export interface Teacher {
  id: number;
  tenant_id?: number;
  user_id: number | null;
  branch_code?: string | null;
  employee_role?: string | null;
  employee_id: string;
  department_id: number | null;
  first_name: string;
  last_name: string;
  employee_name?: string; // Computed field for backward compatibility
  dob: string | null;
  sex: string | null;
  religion: string | null;
  nationality: string | null;
  physically_handicapped?: string | null;
  caste: string | null;
  blood_group?: string | null;
  category?: string | null;
  marital_status?: string | null;
  designation: string | null;
  specialization?: string | null;
  qualification: string | null;
  experience_years: number;
  is_hod?: boolean;
  is_active: boolean;
  is_deleted?: boolean;
  joining_date: string | null;
  date_of_joining?: string | null;
  retire_date?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  phone: string | null; // Backend uses 'phone', not 'mobile'
  mobile?: string | null; // For backward compatibility
  email: string | null;
  emergency_contact?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  aadhar_card_no?: string | null;
  pan_card_no?: string | null;
  present_village?: string | null;
  present_district?: string | null;
  present_state?: string | null;
  present_pin_code?: string | null;
  permanent_village?: string | null;
  permanent_district?: string | null;
  permanent_state?: string | null;
  permanent_pin_code?: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_no: number | null;
  ifsc_code: string | null;
  image: string | null;
  status: number;
  is_trash: number;
  createdAt: string;
  updatedAt: string;
}

export interface FacultyAssignment {
  id: number;
  tenant_id: number;
  faculty_id: number;
  program_id: number;
  semester_id: number;
  section_id: number | null;
  academic_year_id: number;
  is_class_incharge: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreateTeacherPayload {
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  emergency_contact
  designation?: string;
  department_id?: number;
  qualification?: string;
  experience_years?: number;
  date_of_birth?: string;
  date_of_joining?: string;
  address?: string; // Used for address
  password?: string;
  subjects: SubjectAssignment[];
}

export interface CreateAssignmentPayload {
  program_id: number;
  semester_id: number;
  academic_year_id: number;
  section_id?: number;
  is_class_incharge?: boolean;
}
