import axios, { AxiosError } from "axios";
import { buildFrontendUrl, getCurrentTenant } from "../utils/tenantUrlBuilder";

/**
 * OCR Service - Direct integration with AI-ML OCR Backend
 * Endpoint: https://collegea.mainapp.shikshaprime.com:8081/api/v1/extract-attendance
 * Documentation: https://collegea.mainapp.shikshaprime.com:8081/ai-docs/docs
 */

// OCR API Client - Direct to OCR service (bypasses auth layer)
const ocrClient = axios.create({
  timeout: 300000, // 5 minutes for image processing
  headers: {
    "Content-Type": "application/json",
  },
});

// Set dynamic baseURL based on tenant
ocrClient.interceptors.request.use((config) => {
  const tenant = getCurrentTenant();
  // Build the OCR service URL (port 8081)
  config.baseURL = buildFrontendUrl(tenant, 8081);
  return config;
});

// Response interceptor for error handling
ocrClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let message = "OCR processing failed. Please try again.";
    if (error.response) {
      const data: any = error.response.data;
      if (data?.message) {
        message = data.message;
      } else if (data?.detail) {
        message = Array.isArray(data.detail)
          ? data.detail.map((d: any) => d.msg).join(", ")
          : data.detail;
      } else if (error.response.status === 422) {
        message = "Validation error: Check your image URL format";
      } else if (error.response.status === 500) {
        message = "OCR service error. Please try again later.";
      }
    } else if (error.request) {
      message = "Could not reach OCR service. Check your connection.";
    }
    return Promise.reject(new Error(message));
  }
);

/**
 * Interface for OCR Request
 */
export interface OcrRequest {
  url: string; // Full URL of the attendance image to process
}

/**
 * Interface for individual attendance record from OCR
 */
export interface AttendanceRecord {
  Date: string;
  is_present?: boolean;
  is_absent?: boolean;
  is_holiday?: boolean;
  holiday_name?: string;
}

/**
 * Interface for student data from OCR
 */
export interface StudentOcrData {
  Name: string;
  StudentId?: string;
  Attendance: AttendanceRecord[];
}

/**
 * Interface for OCR Response
 */
export interface OcrResponse {
  status: number; // 1 for success, 0 for error
  message: string;
  request_id?: string;
  data?: StudentOcrData[];
  paths?: {
    preprocessed?: string;
    ocr_output?: string;
    json_output?: string;
  };
  detail?: any; // For validation errors
}

/**
 * Extract attendance from image using OCR
 * Makes a POST request to the OCR API with the image URL
 *
 * @param imageUrl - Full URL of the attendance image (can be from local server or external)
 * @returns OCR response containing extracted attendance data
 *
 * @example
 * const result = await extractAttendanceFromImage(
 *   "https://yourserver.com/uploads/attendance/image.jpg"
 * );
 */
export async function extractAttendanceFromImage(
  imageUrl: string
): Promise<OcrResponse> {
  if (!imageUrl) {
    throw new Error("Image URL is required");
  }

  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    throw new Error("Image URL must start with http:// or https://");
  }

  const payload: OcrRequest = { url: imageUrl };

  const tenant = getCurrentTenant();
  const ocrBaseUrl = buildFrontendUrl(tenant, 8081);
  const endpoint = `${ocrBaseUrl}/api/v1/extract-attendance`;

  console.log("[OCR Service] Sending request to:", endpoint);
  console.log("[OCR Service] Payload:", payload);

  try {
    const response = await ocrClient.post<OcrResponse>(
      "/api/v1/extract-attendance",
      payload
    );

    console.log("[OCR Service] Response received:", response.data);

    if (response.data.status === 1) {
      return response.data;
    } else {
      throw new Error(
        response.data.message || "OCR extraction failed"
      );
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[OCR Service] Axios error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error("[OCR Service] Error:", error);
    }
    throw error;
  }
}

/**
 * Health check for OCR service
 * Verify that the OCR service is reachable and healthy
 *
 * @returns true if service is healthy, false otherwise
 */
export async function checkOcrServiceHealth(): Promise<boolean> {
  try {
    const response = await ocrClient.get("/");
    console.log("[OCR Service] Health check passed");
    return true;
  } catch (error) {
    console.error("[OCR Service] Health check failed:", error);
    return false;
  }
}

/**
 * Transform OCR data to attendance records suitable for bulk submission
 * Converts the student-centric OCR output to attendance records
 *
 * @param ocrData - Array of student OCR data
 * @param uploadedBy - User ID who uploaded the attendance
 * @returns Array of attendance records ready for bulk submission
 */
export function transformOcrDataToAttendanceRecords(
  ocrData: StudentOcrData[],
  uploadedBy: string
): any[] {
  const records: any[] = [];

  for (const student of ocrData) {
    const attendanceRecords = Array.isArray(student.Attendance)
      ? student.Attendance
      : [];

    for (const att of attendanceRecords) {
      try {
        const dateStr = String(att.Date || "").trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        // Validate date format
        if (!dateRegex.test(dateStr) || dateStr.toLowerCase().includes("invalid")) {
          console.warn(
            `[OCR Transform] Skipping invalid date for ${student.Name}: ${att.Date}`
          );
          continue;
        }

        // Determine attendance status
        let status = "ABSENT";
        if (att.is_present) status = "PRESENT";
        else if (att.is_holiday) status = "HOLIDAY";
        else if (att.is_absent) status = "ABSENT";

        records.push({
          student_id: student.StudentId || null,
          student_name: student.Name,
          attendance_date: dateStr,
          attendance_status: status,
          remarks: att.holiday_name || "Auto-generated via AI-OCR",
          marked_by: uploadedBy,
        });
      } catch (error) {
        console.error(
          `[OCR Transform] Error processing record for ${student.Name}:`,
          error
        );
      }
    }
  }

  return records;
}

export default ocrClient;
