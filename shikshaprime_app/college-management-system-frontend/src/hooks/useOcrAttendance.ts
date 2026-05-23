import { useState, useCallback } from "react";
import {
  processAttendanceImageViaOcr,
  uploadAndProcessAttendanceViaOcr,
  extractAttendanceRecordsFromOcr,
  uploadProcessAndSubmitAttendance,
  isOcrServiceHealthy,
  OcrResponse,
  StudentOcrData,
} from "../services/studentAttendanceService";

/**
 * State for OCR processing
 */
export interface UseOcrState {
  isLoading: boolean;
  isHealthy: boolean;
  error: string | null;
  ocrResponse: OcrResponse | null;
  extractedRecords: any[] | null;
  progress: number; // 0-100 for UI progress indication
}

/**
 * Custom hook for OCR attendance processing
 * Handles all OCR-related operations with loading and error states
 *
 * @example
 * const { processImage, uploadAndProcess, isLoading, error } = useOcrAttendance();
 *
 * const handleFileUpload = async (file: File) => {
 *   try {
 *     const result = await uploadAndProcess(file, userId);
 *     console.log("Processed:", result);
 *   } catch (err) {
 *     console.error("Error:", err.message);
 *   }
 * };
 */
export function useOcrAttendance() {
  const [state, setState] = useState<UseOcrState>({
    isLoading: false,
    isHealthy: false,
    error: null,
    ocrResponse: null,
    extractedRecords: null,
    progress: 0,
  });

  /**
   * Check OCR service health
   */
  const checkHealth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const healthy = await isOcrServiceHealthy();
      setState((prev) => ({ ...prev, isHealthy: healthy }));
      return healthy;
    } catch (error: any) {
      const errorMsg = error.message || "Failed to check OCR service health";
      setState((prev) => ({ ...prev, error: errorMsg, isHealthy: false }));
      return false;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Process attendance image directly via OCR service
   */
  const processImage = useCallback(async (imageUrl: string) => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        progress: 25,
      }));

      console.log("[useOcrAttendance] Processing image:", imageUrl);

      setState((prev) => ({ ...prev, progress: 50 }));

      const ocrResponse = await processAttendanceImageViaOcr(imageUrl);

      setState((prev) => ({ ...prev, progress: 75, ocrResponse }));
      setState((prev) => ({ ...prev, progress: 100 }));

      return ocrResponse;
    } catch (error: any) {
      const errorMsg = error.message || "Failed to process image";
      console.error("[useOcrAttendance] Error:", errorMsg);
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        ocrResponse: null,
        progress: 0,
      }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Upload and process attendance image
   */
  const uploadAndProcess = useCallback(
    async (file: File, uploadedBy: string) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          progress: 0,
        }));

        console.log("[useOcrAttendance] Uploading and processing file:", file.name);

        setState((prev) => ({ ...prev, progress: 25 }));

        const response = await uploadAndProcessAttendanceViaOcr(file, uploadedBy);

        setState((prev) => ({ ...prev, progress: 50 }));

        if (response.status === 1) {
          const ocrResponse: OcrResponse = {
            status: 1,
            message: response.message,
            data: response.data,
          };

          setState((prev) => ({ ...prev, ocrResponse }));
          setState((prev) => ({ ...prev, progress: 100 }));

          return response;
        } else {
          throw new Error(response.message || "Failed to process file");
        }
      } catch (error: any) {
        const errorMsg = error.message || "Failed to upload and process file";
        console.error("[useOcrAttendance] Error:", errorMsg);
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          ocrResponse: null,
          progress: 0,
        }));
        throw error;
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  /**
   * Extract attendance records from OCR response
   */
  const extractRecords = useCallback(
    (uploadedBy: string) => {
      try {
        if (!state.ocrResponse || state.ocrResponse.status !== 1) {
          throw new Error("No valid OCR response available");
        }

        const records = extractAttendanceRecordsFromOcr(
          state.ocrResponse,
          uploadedBy
        );

        setState((prev) => ({ ...prev, extractedRecords: records }));
        return records;
      } catch (error: any) {
        const errorMsg = error.message || "Failed to extract records";
        setState((prev) => ({ ...prev, error: errorMsg }));
        throw error;
      }
    },
    [state.ocrResponse]
  );

  /**
   * Full workflow: upload, process, and submit
   */
  const uploadProcessAndSubmit = useCallback(
    async (file: File, uploadedBy: string) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          progress: 0,
        }));

        console.log(
          "[useOcrAttendance] Starting full workflow for:",
          file.name
        );

        setState((prev) => ({ ...prev, progress: 25 }));

        const response = await uploadProcessAndSubmitAttendance(file, uploadedBy);

        setState((prev) => ({ ...prev, progress: 100 }));

        return response;
      } catch (error: any) {
        const errorMsg = error.message || "Workflow failed";
        console.error("[useOcrAttendance] Workflow error:", errorMsg);
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          progress: 0,
        }));
        throw error;
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  /**
   * Clear state and errors
   */
  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      isHealthy: false,
      error: null,
      ocrResponse: null,
      extractedRecords: null,
      progress: 0,
    });
  }, []);

  return {
    // State
    ...state,

    // Methods
    checkHealth,
    processImage,
    uploadAndProcess,
    extractRecords,
    uploadProcessAndSubmit,
    clearState,
  };
}

/**
 * Simpler hook for just basic OCR file upload
 */
export function useOcrUpload() {
  const {
    isLoading,
    error,
    progress,
    uploadAndProcess,
    clearState,
  } = useOcrAttendance();

  const uploadFile = useCallback(
    async (file: File, uploadedBy: string) => {
      return uploadAndProcess(file, uploadedBy);
    },
    [uploadAndProcess]
  );

  return {
    isLoading,
    error,
    progress,
    uploadFile,
    clearState,
  };
}
