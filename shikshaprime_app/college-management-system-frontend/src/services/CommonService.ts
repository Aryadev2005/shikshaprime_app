import apiClient from "./apiClient";
import { AccessAuthorizePayload } from "../types/commonTypes";

// Fetching Accademic Years
export async function fetchAcademicYears() {
  const { data } = await apiClient.get("/identity/sr/academic-years");
  return { status: data.status, data: data.data, message: data.message };
}

// Fetching Classes
export async function fetchClasses() {
  const { data } = await apiClient.get("/identity/sr/classes");
  return { status: data.status, data: data.data, message: data.message };
}

// Fetching Departments
export async function fetchDepartments() {
  const { data } = await apiClient.get("/identity/sr/departments");
  return { status: data.status, data: data.data, message: data.message };
}

// Fetching level 2 Departments
export async function fetchLevelTwoDepartments() {
  const { data } = await apiClient.get("/identity/sr/departments/level-2");
  return { status: data.status, data: data.data, message: data.message };
}

// Fetching Departments
export async function fetchPrograms() {
  const { data } = await apiClient.get("/identity/sr/programs");
  return { status: data.status, data: data.data, message: data.message };
}

// Student details
export async function fetchStudentDetails(email: any) {
   const { data } = await apiClient.get("/student/details", { params: { email: email?.email } });
  return { status: data.status, data: data.data, message: data.message };
}

// Teacher details
export async function fetchTeacherDetails(userCode: any) {
  console.log("Teacher user code 02", userCode);
   const { data } = await apiClient.get(`/teacher/faculty/user/${userCode?.userCode}`);
  return { status: data.status, data: data.data, message: data.message };
}