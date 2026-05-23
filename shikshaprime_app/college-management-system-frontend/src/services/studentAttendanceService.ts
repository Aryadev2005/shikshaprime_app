import apiClient from "./apiClient";
import {
  extractAttendanceFromImage,
  transformOcrDataToAttendanceRecords,
  checkOcrServiceHealth,
  OcrResponse,
  StudentOcrData,
} from "./ocrService";

// Re-export OCR types for convenience
export type { OcrResponse, StudentOcrData } from "./ocrService";

export interface StudentAttendanceRecord {
  check_in_time: string;
  check_out_time: string;
  student_id: string;
  student_code: string;
  student_name: string;
  attendance_date?: string;
  attendance_status?: string;
  status?: string;
  remarks?: string;
  roll_number?: string;
  present_days?: number;
  absent_days?: number;
  total_days?: number;
  attendance_percentage?: number;
  dept_name?: string;
  daily_status?: "PRESENT" | "ABSENT";
  manual_status?: "PRESENT" | "ABSENT";
}

export interface TeacherClass {
  id: number;
  class_id: number;
  class_code: string;
  class_name: string;
}

export interface TeacherProgram {
  id: number;
  program_id: number;
  program_code: string;
  program_name: string;
}

export interface TeacherAcademicYear {
  id: number;
  academic_year_id: number;
  academic_year_name: string;
}

export interface BulkAttendancePayload {
  date: string;
  students: {
    student_id: string;
    student_code: string;
    student_name: string;
    status: "PRESENT" | "ABSENT";
  }[];
  marked_by: string;
}

// Upload attendance image
export async function uploadAttendanceImage(file: File, uploadedBy: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploaded_by", uploadedBy);

  const { data } = await apiClient.post("/student/attendance/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return { status: data.status, data: data.data, message: data.message };
}

// Get attendance report by date or month
export async function getStudentAttendanceReport(params: {
  date?: string;
  month?: string;
  year?: string;
}) {
  const { data } = await apiClient.get("/student/attendance/report", { params });
  return { status: data.status, data: data.data as StudentAttendanceRecord[], message: data.message };
}

// Get attendance summary/stats
export async function getStudentAttendanceSummary(params: {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  classId?: number;
  programId?: number;
  academicYearId?: number;
}) {
  const { data } = await apiClient.get("/student/attendance/summary", { params });
  return { status: data.status, data: data.data as StudentAttendanceRecord[], message: data.message };
}

// Submit bulk attendance
export async function submitBulkStudentAttendance(payload: BulkAttendancePayload) {
  const { data } = await apiClient.post("/student/attendance/bulk", payload);
  return { status: data.status, data: data.data, message: data.message };
}

// Get teacher's assigned classes
export async function getTeacherClasses() {
  const { data } = await apiClient.get("/identity/teacher/classes");
  return { status: data.status, data: data.data as TeacherClass[], message: data.message };
}

// Get teacher's assigned programs
export async function getTeacherPrograms() {
  const { data } = await apiClient.get("/identity/teacher/programs");
  return { status: data.status, data: data.data as TeacherProgram[], message: data.message };
}

// Get teacher's assigned academic years
export async function getTeacherAcademicYears() {
  const { data } = await apiClient.get("/identity/teacher/academic-years");
  return { status: data.status, data: data.data as TeacherAcademicYear[], message: data.message };
}

/**
 * ============================================================
 * OCR INTEGRATION FUNCTIONS - Direct AI-ML Service Integration
 * ============================================================
 */

/**
 * Process attendance image through OCR without storing on local server
 * Directly sends image URL to OCR service for processing
 *
 * @param imageUrl - Full URL of the attendance image
 * @returns OCR response with extracted attendance data
 */
export async function processAttendanceImageViaOcr(imageUrl: string) {
  console.log("[studentAttendanceService] Processing image via OCR:", imageUrl);
  return await extractAttendanceFromImage(imageUrl);
}

/**
 * Upload attendance image to server first, then process via OCR
 * Uses existing backend upload endpoint which handles OCR integration
 *
 * @param file - Image file to upload
 * @param uploadedBy - User ID who uploaded the file
 * @returns Response with OCR extracted data
 */
export async function uploadAndProcessAttendanceViaOcr(
  file: File,
  uploadedBy: string
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploaded_by", uploadedBy);

  const { data } = await apiClient.post("/student/attendance/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return { status: data.status, data: data.data, message: data.message };
}

/**
 * Extract attendance from OCR response and transform to bulk attendance format
 *
 * @param ocrResponse - Response from OCR service
 * @param uploadedBy - User ID who uploaded the attendance
 * @returns Array of attendance records ready for bulk submission
 */
export function extractAttendanceRecordsFromOcr(
  ocrResponse: OcrResponse,
  uploadedBy: string
): any[] {
  if (!ocrResponse.data || ocrResponse.data.length === 0) {
    console.warn("[studentAttendanceService] No data in OCR response");
    return [];
  }

  return transformOcrDataToAttendanceRecords(ocrResponse.data, uploadedBy);
}

/**
 * Complete flow: Upload image -> Get OCR response -> Transform -> Submit to backend
 * This is the recommended approach for attendance processing
 *
 * @param file - Image file to process
 * @param uploadedBy - User ID who uploaded the file
 * @returns Response with submitted attendance records
 */
export async function uploadProcessAndSubmitAttendance(
  file: File,
  uploadedBy: string
) {
  try {
    console.log("[studentAttendanceService] Starting upload and process flow");

    // Step 1: Upload image and trigger OCR processing
    const uploadResponse = await uploadAndProcessAttendanceViaOcr(
      file,
      uploadedBy
    );

    if (uploadResponse.status === 1) {
      console.log(
        "[studentAttendanceService] OCR processing completed successfully"
      );
      return {
        status: 1,
        message: "Attendance extracted and submitted successfully",
        data: uploadResponse.data,
      };
    } else {
      throw new Error(
        uploadResponse.message || "Failed to process attendance"
      );
    }
  } catch (error) {
    console.error(
      "[studentAttendanceService] Upload and process flow error:",
      error
    );
    throw error;
  }
}

/**
 * Check if OCR service is reachable and healthy
 *
 * @returns true if service is healthy, false otherwise
 */
export async function isOcrServiceHealthy(): Promise<boolean> {
  return await checkOcrServiceHealth();
}
