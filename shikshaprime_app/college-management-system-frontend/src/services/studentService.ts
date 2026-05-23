 
// Student Service - Using apiClient through NGINX gateway
import apiClient from "./apiClient";
import { StudentEditFormData } from "@/app/teacher/students/[id]/page";
// Interface for student data - matches the complete student_info table
export interface Student {
    id: number;
    university_registration_number: string;
    student_id: string;
    roll_number?: string;
    student_name: string;
    dob: string;
    sex: string;
    religion?: string;
    nationality?: string;
    caste?: string;
    // Parent details
    father_name: string;
    guardian_email?: string;
    mother_name?: string;
    guardian_name?: string;
    guardian_mobile?: string;
 
    // Contact
    mobile?: string;
    email?: string;
    // Present Address
    address_line?: string;
    city?: string;
    state?: string;
    pin_code?: string;
 
    // Academic
    admission_date?: string;
    department_id?: number;
    dept_name?: string;
    program_id?: number;
    class_id?: number;
    section?: string;
    // Marksheet percentages
    ten_percentage?: string;
    twelve_percentage?: string;
    graduation_percentage?: string;
    ten_marksheet_doc?: string;
    twelve_marksheet_doc?: string;
    graduation_doc?: string;
    aadhar_doc?: string;
    birth_certificate_doc: string;
    caste_certificate_doc: string;
    physically_challenged_certificate: string
 
    // Status
    status: number;
 
    // Image
    profile_img?: string;
 
    // Attendance
    attendance_percentage?: number;
    present_count?: number;
    absent_count?: number;
 
    degree: string;
    id_proof_type: string;
    id_proof_number: string;
    year_of_passing_graduation: string;
    board_university_10th: string;
    board_university_12th: string;
    board_university_graduation: string;
    graduation_marksheet_doc: string;
}
 
 
export interface StudentCoreProfile {
    id: number | string;
    name: string;
    dob: string | null;
    gender: string | null;
    nationality: string | null;
    religion: string | null;
    caste: string | null;
    profileImage: string | null;
    admissionDate: string | null;
}
 
export interface StudentContactInfo {
    email: string | null;
    phone: string | null;
    address: string;
    parent: {
        fatherName: string | null;
        fatherEmail: string | null;
        parentPhone: string | null;
    };
}
 
export interface StudentAcademicInfo {
    degree: string | null;
    stream: string | null;
    program: string | null;
    department: string | null;
    subjects: string[];
}
 
// Interface for search filters
export interface StudentSearchFilters {
    query?: string;
    student_id?: string;
    student_name?: string;
    email?: string;
    department_id?: number;
    class_id?: number;
    academic_year_id?: number;
    status?: string;
}
 
// Get all students with pagination
export async function getStudents(page: number = 1, limit: number = 50) {
    const { data } = await apiClient.get("/student/", {
        params: { page, limit }
    });
    return { status: data.status, data: data.data, message: data.message };
}
 
// Search students with filters
export async function searchStudents(filters: StudentSearchFilters) {
    const { data } = await apiClient.get("/student/search", {
        params: filters
    });
    return { status: data.status, data: data.data, count: data.count, message: data.message };
}
 
// Get single student by ID
export async function getStudentById(id: number | string) {
    const { data } = await apiClient.get(`/student/${id}`);
    return { status: data.status, data: data.data, message: data.message };
}
 
export async function getStudentCoreProfile(id: number | string) {
    const { data } = await apiClient.get(`/student/${id}/profile`);
    return { status: data.status, data: data.data as StudentCoreProfile, message: data.message };
}
 
export async function getMyStudentCoreProfile() {
    const { data } = await apiClient.get(`/student/me`);
    return { status: data.status, data: data.data as StudentCoreProfile, message: data.message };
}
 
export async function getStudentContactInfo(id: number | string) {
    const { data } = await apiClient.get(`/student/${id}/contact`);
    return { status: data.status, data: data.data as StudentContactInfo, message: data.message };
}
 
export async function getMyStudentContactInfo() {
    const { data } = await apiClient.get(`/student/me/contact`);
    return { status: data.status, data: data.data as StudentContactInfo, message: data.message };
}
 
export async function getStudentAcademicInfo(id: number | string) {
    const { data } = await apiClient.get(`/student/${id}/academics`);
    return { status: data.status, data: data.data as StudentAcademicInfo, message: data.message };
}
 
export async function getMyStudentAcademicInfo() {
    const { data } = await apiClient.get(`/student/me/academics`);
    return { status: data.status, data: data.data as StudentAcademicInfo, message: data.message };
}
 
// Get student by student_id (SKH ID)
export async function getStudentByStudentId(studentId: string) {
    const { data } = await apiClient.get(`/student/by-student-id/${studentId}`);
    return { status: data.status, data: data.data, message: data.message };
}
 
// Get students by class
export async function getStudentsByClass(programId: string, departmentId: string, academicYearId: string, classId: string) {
    const { data } = await apiClient.get("/student/by-class", { params: { programId, departmentId, academicYearId, classId } });
    return { status: data.status, data: data.data, message: data.message };
}
 
// Get students by department
export async function getStudentsByDepartment(departmentId: number) {
    const { data } = await apiClient.get(`/student/by-department/${departmentId}`);
    return { status: data.status, data: data.data, message: data.message };
}
 
// Get students by academic year
export async function getStudentsByAcademicYear(academicYearId: number) {
    const { data } = await apiClient.get(`/student/by-academic-year/${academicYearId}`);
    return { status: data.status, data: data.data, message: data.message };
}
 
// Update student data
export async function updateStudent(id: number | string, StudentEditFormData: StudentEditFormData) {
    const { data } = await apiClient.patch(`/student/${id}`, StudentEditFormData);
    return { status: data.status, data: data.data, message: data.message };
}
 
// Student Profile data - Complete student data from /me endpoint
export async function studentProfile() {
    const { data } = await apiClient.get(`/student/me`);
    return { status: data.status, data: data.data as Student, message: data.message };
}
 
// Get complete student profile with all data
export async function getCompleteStudentProfile() {
    const { data } = await apiClient.get(`/student/me`);
    return { status: data.status, data: data.data as Student, message: data.message };
}
 