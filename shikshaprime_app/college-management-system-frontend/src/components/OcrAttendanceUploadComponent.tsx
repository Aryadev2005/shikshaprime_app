/**
 * Example Component: OCR Attendance Upload
 * 
 * This component demonstrates how to integrate the OCR service into the UI
 * Shows best practices for file upload, error handling, and progress indication
 */

"use client";

import React, { useState, useRef } from "react";
import { useOcrAttendance } from "../hooks/useOcrAttendance";
import { submitBulkStudentAttendance } from "../services/studentAttendanceService";

interface OcrUploadComponentProps {
  userId: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function OcrAttendanceUploadComponent({
  userId,
  onSuccess,
  onError,
}: OcrUploadComponentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);

  const {
    isLoading,
    error,
    progress,
    ocrResponse,
    extractedRecords,
    uploadAndProcess,
    extractRecords,
    clearState,
  } = useOcrAttendance();

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      onError?.("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError?.("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    clearState();
  };

  /**
   * Handle upload and OCR processing
   */
  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    try {
      const response = await uploadAndProcess(selectedFile, userId);
      console.log("Upload and process response:", response);
    } catch (error: any) {
      onError?.(error.message);
    }
  };

  /**
   * Handle extraction of records from OCR response
   */
  const handleExtractRecords = () => {
    try {
      extractRecords(userId);
    } catch (error: any) {
      onError?.(error.message);
    }
  };

  /**
   * Handle final submission to backend
   */
  const handleSubmitAttendance = async () => {
    if (!extractedRecords || extractedRecords.length === 0) {
      onError?.("No attendance records to submit");
      return;
    }

    try {
      setSubmissionInProgress(true);

      // Group records by date for submission
      const recordsByDate = extractedRecords.reduce(
        (acc: Record<string, any[]>, record: any) => {
          const date = record.attendance_date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(record);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Submit each date's attendance
      const results = [];
      for (const [date, students] of Object.entries(recordsByDate)) {
        const payload = {
          date,
          students: (students as any[]).map((s) => ({
            student_id: s.student_id,
            student_code: s.student_code || "",
            student_name: s.student_name,
            status: s.attendance_status,
          })),
          marked_by: userId,
        };

        const result = await submitBulkStudentAttendance(payload);
        results.push(result);
      }

      onSuccess?.(results);
      setSelectedFile(null);
      clearState();
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setSubmissionInProgress(false);
    }
  };

  return (
    <div className="ocr-upload-container p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upload Attendance Image</h2>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Attendance Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isLoading || submissionInProgress}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedFile.name}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {(isLoading || submissionInProgress) && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm font-medium">Error</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* OCR Response Preview */}
      {ocrResponse && ocrResponse.status === 1 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 font-medium">✓ OCR Processing Complete</p>
          <p className="text-green-700 text-sm">
            Extracted data for {ocrResponse.data?.length || 0} students
          </p>
        </div>
      )}

      {/* Extracted Records Preview */}
      {extractedRecords && extractedRecords.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Extracted Records ({extractedRecords.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Student Name</th>
                  <th className="border p-2 text-left">Date</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {extractedRecords.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border p-2">{record.student_name}</td>
                    <td className="border p-2">{record.attendance_date}</td>
                    <td className="border p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          record.attendance_status === "PRESENT"
                            ? "bg-green-100 text-green-800"
                            : record.attendance_status === "HOLIDAY"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.attendance_status}
                      </span>
                    </td>
                    <td className="border p-2 text-gray-600">
                      {record.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        {selectedFile && !ocrResponse && (
          <button
            onClick={handleUploadAndProcess}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Processing..." : "Upload & Extract"}
          </button>
        )}

        {ocrResponse && ocrResponse.status === 1 && !extractedRecords && (
          <button
            onClick={handleExtractRecords}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Extract Records
          </button>
        )}

        {extractedRecords && extractedRecords.length > 0 && (
          <button
            onClick={handleSubmitAttendance}
            disabled={submissionInProgress}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submissionInProgress ? "Submitting..." : "Submit Attendance"}
          </button>
        )}

        <button
          onClick={() => {
            setSelectedFile(null);
            clearState();
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
        >
          Clear
        </button>
      </div>

      {/* Debug Info */}
      <details className="mt-6 text-xs text-gray-600">
        <summary className="cursor-pointer font-medium">Debug Info</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
          {JSON.stringify(
            {
              selectedFile: selectedFile?.name,
              ocrResponse: ocrResponse ? "Received" : "Pending",
              extractedRecords: extractedRecords?.length || 0,
              isLoading,
              error,
              progress,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
}

export default OcrAttendanceUploadComponent;
