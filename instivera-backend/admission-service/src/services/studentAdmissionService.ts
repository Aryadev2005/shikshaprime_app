import * as XLSX from "xlsx";
import { pool } from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export interface UploadResult {
  total_rows: number;
  inserted: number;
  columns: string[];
  table: string;
  message: string;
}

/**
 * Sanitize a column name to be SQL-safe:
 * - Replace spaces/special chars with underscore
 * - Lowercase
 * - Trim
 */
function sanitizeColumn(name: string): string {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Infer MySQL column type from array of sample values
 */
function inferType(values: any[]): string {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonEmpty.length === 0) return "TEXT";

  const allNumbers = nonEmpty.every((v) => !isNaN(Number(v)));
  if (allNumbers) {
    const allIntegers = nonEmpty.every((v) => Number.isInteger(Number(v)));
    if (allIntegers) {
      const max = Math.max(...nonEmpty.map((v) => Number(v)));
      return max > 2147483647 ? "BIGINT" : "INT";
    }
    return "DECIMAL(15,4)";
  }

  const maxLen = Math.max(...nonEmpty.map((v) => String(v).length));
  if (maxLen <= 255) return `VARCHAR(${Math.max(maxLen + 20, 100)})`;
  return "TEXT";
}

export class StudentAdmissionService {
 
  
}
