
import apiClient from "./apiClient";
import { CreateTeacherPayload, CreateAssignmentPayload, Teacher, FacultyAssignment } from "../types/teacherTypes";

export interface TeacherProfilePageResponse {
  teacher: Teacher & {
    department_name?: string | null;
    teacher_classes?: Array<{
      id: number;
      assigned_date?: string | null;
      academic_year?: { id: number; name: string };
      class?: { id: number; name: string };
      subject?: { id: number; name: string; department?: { id: number; name: string } };
      program?: { id: number; name: string };
    }>;
  };
  monthlyAttendance: Array<{
    month: string;
    percentage: number;
  }>;
  completedAssignments: Array<{
    id: number;
    title: string;
    dueDate: string | null;
    subjectName: string | null;
  }>;
  classAssignments: Array<{
    id: number;
    subjectName: string;
    className: string;
    programName: string;
    academicYear: string;
    assignedDate: string | null;
  }>;
}

// Interface for teacher search filters
export interface TeacherSearchFilters {
  employee_id?: string;
  employee_name?: string;
  email?: string;
  department_id?: number;
  designation?: string;
  is_hod?: boolean;
}

export async function createTeacher(payload: CreateTeacherPayload) {
  const { data } = await apiClient.post("/teacher/faculty", payload);
  return { status: data.status, data: data.data, message: data.message };
}

export async function getTeachers(page: number = 1, limit: number = 50, filters?: { department_id?: number; designation?: string; is_hod?: boolean }) {
  const { data } = await apiClient.get("/teacher/faculty", { params: { page, limit, ...filters } });
  return { status: data.status, data: data.data, count: data.count || data.data?.length || 0, message: data.message };
}
export async function getTeacherById(id: number) {
  const { data } = await apiClient.get(`/teacher/faculty/${id}`);
  return { status: data.status, data: data.data as Teacher, message: data.message };
}
export async function getTeacherByEmployeeId(employeeId: string) {
  const { data } = await apiClient.get(`/teacher/faculty/by-employee-id/${employeeId}`);
  return { status: data.status, data: data.data as Teacher, message: data.message };
}
export async function getMyTeacherProfilePage(year?: number) {
  const { data } = await apiClient.get("/teacher/faculty/me/profile", { params: { year } });
  return { status: data.status, data: data.data as TeacherProfilePageResponse, message: data.message };
}
export async function updateTeacher(id: number, payload: Partial<CreateTeacherPayload>) {
  const { data } = await apiClient.put(`/teacher/faculty/${id}`, payload);
  return { status: data.status, data: data.data, message: data.message };
}
export async function deleteTeacher(id: number) {
  const { data } = await apiClient.delete(`/teacher/faculty/${id}`);
  return { status: data.status, data: data.data, message: data.message };
}
export async function searchTeachers(query: string) {
  const { data } = await apiClient.get("/teacher/faculty/search", { params: { q: query } });
  return { status: data.status, data: data.data, count: data.count || data.data?.length || 0, message: data.message };
}

// Interface for teacher search filters
export interface TeacherSearchFilters {
  employee_id?: string;
  employee_name?: string;
  email?: string;
  department_id?: number;
  designation?: string;
  is_hod?: boolean;
}

// Search teachers with filters
export async function searchTeachersWithFilters(filters: TeacherSearchFilters) {
  const { data } = await apiClient.get("/teacher/faculty/search", { params: filters });
  return { status: data.status, data: data.data, count: data.count || data.data?.length || 0, message: data.message };
}

export async function getTeachersByDepartment(departmentId: number) {
  const { data } = await apiClient.get(`/teacher/faculty/by-department/${departmentId}`);
  return { status: data.status, data: data.data, message: data.message };
}
export async function getHODs() {
  const { data } = await apiClient.get("/teacher/faculty/hods");
  return { status: data.status, data: data.data, message: data.message };
}
export async function getTeacherStats() {
  const { data } = await apiClient.get("/teacher/faculty/stats");
  return { status: data.status, data: data.data, message: data.message };
}
export async function createTeacherAssignment(facultyId: number, payload: CreateAssignmentPayload) {
  const { data } = await apiClient.post(`/teacher/faculty/${facultyId}/assignments`, payload);
  return { status: data.status, data: data.data, message: data.message };
}
export async function getTeacherAssignments(facultyId: number) {
  const { data } = await apiClient.get(`/teacher/faculty/${facultyId}/assignments`);
  return { status: data.status, data: data.data as { count: number; rows: FacultyAssignment[] }, message: data.message };
}
export async function deleteTeacherAssignment(assignmentId: number) {
  const { data } = await apiClient.delete(`/teacher/faculty-assignments/${assignmentId}`);
  return { status: data.status, data: data.data, message: data.message };
}

// Teacher Assignment
// Get Student Assignment Data
export async function teacherGetStudentAssignment(filters: any) {
  const { data } = await apiClient.get(`/teacher/assignments/submitted`, { params: filters });
  return { status: data.status, data: data.data, message: data.message };
}
// Submit Assignment Data
export async function teacherStudentAssignmentSubmit(submissionId: number, gradingData: any) {
  const { data } = await apiClient.put(`/teacher/submissions/${submissionId}/grade`, gradingData);
  return { status: data.status, data: data.data, message: data.message };
}
// View Assignment data
export async function teacherViewStudentAssignment(assignmentId: number) {
  const { data } = await apiClient.get(`/teacher/submissions/${assignmentId}`);
  return { status: data.status, data: data.data, message: data.message };
}

