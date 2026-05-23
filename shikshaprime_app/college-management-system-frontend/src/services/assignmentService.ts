// Assignment Service - Using apiClient through NGINX gateway
import apiClient from "./apiClient";
import { AssignmentFormValues } from "@/app/teacher/assignment-homework/CreateAssignment";
import { StudentAssignmentFormValues } from "@/app/student/student-assignment/[id]/page";

// Create new assignment
export async function createAssignment(assignmentData: AssignmentFormValues | FormData) {
  // Check if it's FormData (for file uploads) or regular object
  const isFormData = assignmentData instanceof FormData;

  const config = isFormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};

  const { data } = await apiClient.post("/teacher/assignments", assignmentData, config);
  return { status: data.status, data: data.data, message: data.message };
}

// Get assignments for authenticated faculty
export async function getFacultyAssignments(filters?: any) {
  const { data } = await apiClient.get("/teacher/assignments", { params: filters });
  return { status: data.status, data: data.data, message: data.message };
}

// Get specific assignment by ID
export async function getAssignment(assignmentId: number) {
  const { data } = await apiClient.get(`/teacher/assignments/${assignmentId}`);
  return { status: data.status, data: data.data, message: data.message };
}

// Update assignment
export async function updateAssignment(assignmentId: number, updateData: any) {
  const { data } = await apiClient.put(`/teacher/assignments/${assignmentId}`, updateData);
  return { status: data.status, data: data.data, message: data.message };
}

// Delete assignment
export async function deleteAssignment(assignmentId: number) {
  const { data } = await apiClient.delete(`/teacher/assignments/${assignmentId}`);
  return { status: data.status, data: data.data, message: data.message };
}

// Get assignment submissions
export async function getAssignmentSubmissions(assignmentId: number, filters?: any) {
  const { data } = await apiClient.get(`/teacher/assignments/${assignmentId}/submissions`, { params: filters });
  return { status: data.status, data: data.data, message: data.message };
}

// Grade submission
export async function gradeSubmission(submissionId: number, gradingData: any) {
  const { data } = await apiClient.put(`/teacher/submissions/${submissionId}/grade`, gradingData);
  return { status: data.status, data: data.data, message: data.message };
}

// Get assignment statistics for faculty
export async function getAssignmentStats(facultyId: number) {
  const { data } = await apiClient.get(`/teacher/faculty/${facultyId}/assignment-stats`);
  return { status: data.status, data: data.data, message: data.message };
}

// File attachment management functions
export async function uploadAssignmentFiles(assignmentId: number, files: FormData) {
  const { data } = await apiClient.post(`/teacher/assignments/${assignmentId}/files`, files, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return { status: data.status, data: data.data, message: data.message };
}

export async function getAssignmentAttachments(assignmentId: number) {
  const { data } = await apiClient.get(`/teacher/assignments/${assignmentId}/attachments`);
  return { status: data.status, data: data.data, message: data.message };
}

export async function deleteAssignmentAttachment(assignmentId: number, attachmentId: number) {
  const { data } = await apiClient.delete(`/teacher/assignments/${assignmentId}/attachments/${attachmentId}`);
  return { status: data.status, data: data.data, message: data.message };
}

export async function getAssignmentFileUrl(assignmentId: number, filename: string) {
  return `/api/teacher/assignments/${assignmentId}/files/${filename}`;
}

// Get upcoming assignments for faculty
export async function getUpcomingAssignments(facultyId: number, days?: number) {
  const { data } = await apiClient.get(`/teacher/faculty/${facultyId}/upcoming-assignments`, { params: days ? { days } : {} });
  return { status: data.status, data: data.data, message: data.message };
}

// Metadata routes
export async function getSemesters() {
  const { data } = await apiClient.get("/teacher/metadata/semesters");
  return { status: data.status, data: data.data, message: data.message };
}

export async function getPrograms() {
  const { data } = await apiClient.get("/teacher/metadata/programs");
  return { status: data.status, data: data.data, message: data.message };
}

export async function getSubjects() {
  const { data } = await apiClient.get("/teacher/metadata/subjects");
  return { status: data.status, data: data.data, message: data.message };
}

export async function getSections() {
  const { data } = await apiClient.get("/teacher/metadata/sections");
  return { status: data.status, data: data.data, message: data.message };
}

export async function getClasses() {
  const { data } = await apiClient.get("/teacher/metadata/classes");
  return { status: data.status, data: data.data, message: data.message };
}


// Get assignments for authenticated student
export async function getStudentAssignment() {
  const { data } = await apiClient.get("/student/assignments/stats");
  return { status: data.status, data: data.data, message: data.message };
}

// Filter assignment services
export async function getStudentAssignmentFilter(filters: any) {
  const { data } = await apiClient.get("/student/assignments/filter", { params: filters });
  return { status: data.status, data: data.data, message: data.message };
}

// Submit Assignment id
export async function getTeacherAssignmentData(id: any) {
  const { data } = await apiClient.get(`/student/assignments/${id}`);
  return { status: data.status, data: data.data, message: data.message };
}

// Student Assignment Submit
export async function studentAssignmentSubmit(assignmentSubmitFormData: StudentAssignmentFormValues) {
  // Create FormData for multipart file upload
  const formData = new FormData();
  formData.append('teacherAssignmentId', assignmentSubmitFormData.teacherAssignmentId);
  formData.append('submissionText', assignmentSubmitFormData.submissionText);

  // Append the file with the correct field name expected by the backend
  if (assignmentSubmitFormData.document) {
    formData.append('assignmentFile', assignmentSubmitFormData.document);
  }

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  const { data } = await apiClient.post("/student/assignments/submit", formData, config);
  return { status: data.status, data: data.data, message: data.message };
}


// View Student Assignment
export async function studentAssignmentView(id: any) {
  const { data } = await apiClient.get(`/student/assignments/submitted/${id}`);
  return { status: data.status, data: data.data, message: data.message };
}

export async function getAcademicYears() {
  const { data } = await apiClient.get("/teacher/metadata/academic-years");
  return { status: data.status, data: data.data, message: data.message };
}



// Legacy export for backward compatibility
export const AssignmentAPI = {
  createAssignment,
  getFacultyAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getAssignmentStats,
  getUpcomingAssignments,
  getSemesters,
  getPrograms,
  getSubjects,
  getSections,
  getClasses,
  getStudentAssignment,
  getStudentAssignmentFilter,
  getAcademicYears
};
