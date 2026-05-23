import { Request, Response } from "express";
import axios from "axios";
import { Op, QueryTypes, Sequelize } from "sequelize";
import { config } from "../config";
import { mapAttendanceToDb } from "../utils/mapAttendanceToDb";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { AttendanceCreationAttributes } from "../models/attendance";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const STUDENT_UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export async function markAttendance(req, res: Response) {
  try {
    console.log("Attendance POST hit");
    console.log("Request body:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ status: 0, data: null, message: "Empty request body" });
    }

    const mapped = mapAttendanceToDb(req.body);
    console.log("Mapped body:", mapped);

    const params = {
      ...mapped,
      attendance_id: req.body.attendance_id || uuidv4()
    };
    const { Attendance } = getTenantModels(req.tenant);
    const record = await Attendance.create(params);

    return res.status(201).json({
      status: 1,
      message: "Attendance marked successfully",
      data: record
    });
  } catch (err: any) {
    console.error("Attendance error:", err);
    return res.status(500).json({
      status: 0,
      data: null,
      message: err.message
    });
  }
}

export const uploadAttendanceFile = async (req, res: Response) => {
  try {
    const file = req.file;
    const { uploaded_by, session_id, class_id, section_id } = req.body;

    if (!file) {
      console.error("[Upload] No file provided in request");
      return res.status(400).json({
        status: 0,
        data: null,
        message: "No file uploaded",
      });
    }

    console.log(`[Upload] File received: ${file.originalname} (${file.size} bytes, mimetype: ${file.mimetype})`);

    const fileName = file.filename;
    const sequelize = getTenantSequelize(req.tenant);
    
    try {
      await sequelize.query(
        `INSERT INTO attendance_ocr_files (file_path, uploaded_by)
         VALUES (:filePath, :uploaded_by)`,
        {
          // ✅ FIXED: was { fileName, uploaded_by } which gave key "fileName" not "filePath"
          replacements: { filePath: fileName, uploaded_by },
          type: QueryTypes.INSERT
        }
      );
    } catch (dbErr: any) {
      console.error("[Upload] Failed to insert file record into database:", dbErr.message);
      // Log error but continue with OCR processing
    }

    // Build URL using actual hostname, not localhost
    // For remote AI-ML services, we need a publicly accessible URL
    let fileUrl: string;
    
    // PRIORITY 1: Use config.studentServiceUrl (loaded from environment)
    if (config.studentServiceUrl && config.studentServiceUrl !== 'http://localhost:9051') {
      console.log(`[Upload] Using config.studentServiceUrl: ${config.studentServiceUrl}`);
      fileUrl = `${config.studentServiceUrl}/uploads/attendance/${file.filename}`;
    }
    // PRIORITY 2: Check for X-Forwarded-Host header (proxy/load balancer)
    else if (req.headers['x-forwarded-host']) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'];
      console.log(`[Upload] Using X-Forwarded-Host header: ${host}`);
      fileUrl = `${protocol}://${host}/uploads/attendance/${file.filename}`;
    }
    // PRIORITY 3: Fall back to request host
    else {
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:9051';
      console.log(`[Upload] Using request host: ${host}`);
      fileUrl = `${protocol}://${host}/uploads/attendance/${file.filename}`;
    }
    
    // --- Robust Image Transfer: Using multipart/form-data ---
    // This avoids "URL too long" errors by sending the file as a stream.
    const formData = new FormData();
    try {
      if (!file.path) {
        throw new Error("File path is missing from metadata");
      }
      
      formData.append('file', fs.createReadStream(file.path), {
        filename: file.filename,
        contentType: file.mimetype,
      });
      
      console.log(`[Upload] Prepared FormData with file: ${file.filename}`);
    } catch (fsErr: any) {
      console.error("[Upload] Failed to prepare form data:", fsErr.message);
      return res.status(500).json({
        status: 0,
        data: null,
        message: `Form data preparation failed: ${fsErr.message}`
      });
    }

    console.log(`[Upload] Sending request to AI-ML Service at: ${config.aimlServiceUrl}/api/v1/extract-attendance`);

    try {
      console.log(`[Upload] Attempting axios POST with multipart/form-data payload...`);
      
      const response = await axios.post(`${config.aimlServiceUrl}/api/v1/extract-attendance`, formData, {
        headers: {
          'X-Tenant': req.tenant || 'collegea',
          ...formData.getHeaders()
        },
        timeout: 300000, // 5 minutes
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log(`[Upload] Axios completed with status: ${response.status}`);

      const responseData: any = response.data;

      console.log("[Upload] AI-ML Response received:", JSON.stringify(responseData, null, 2));

      if (responseData.status === 1 && responseData.data) {
        const records = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
        const bulkData: any[] = [];
        const failedRecords: any[] = [];

        console.log(`[Upload] Processing data for ${records.length} students...`);

        for (const student of records) {
          const attendanceRecords = Array.isArray(student.Attendance) ? student.Attendance : [];

          for (const att of attendanceRecords) {
            try {
              const dateStr = String(att.Date || "").trim();
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              console.log(`[DEBUG-v3] Checking date: '${dateStr}' for student: ${student.Name}`);

              if (!dateRegex.test(dateStr) || dateStr.toLowerCase().includes("invalid")) {
                console.warn(`[Upload] Skipping record for student ${student.Name} due to invalid date format: '${att.Date}'`);
                continue;
              }

              let status = "ABSENT";
              if (att.is_present) status = "PRESENT";
              else if (att.is_holiday) status = "HOLIDAY";
              else if (att.is_absent) status = "ABSENT";

              const studentName = student.Name || "UNKNOWN";
              const studentRows: any[] = await sequelize.query(
                `SELECT id, student_id
                FROM students 
                WHERE student_name LIKE :studentName`,
                {
                  replacements: { studentName: `%${studentName}%` },
                  type: QueryTypes.SELECT
                }
              );

              const flatRecord = {
                student_id: studentRows.length > 0 ? studentRows[0].id : null,
                student_code: studentRows.length > 0 ? studentRows[0].student_id : null,
                student_name: studentName,
                attendance_date: dateStr,
                attendance_status: status,
                remarks: att.holiday_name || "Auto-generated via AI-OCR",
                academic_year_id: session_id ? Number(session_id) : null,
                class_id: class_id ? Number(class_id) : null,
                section_id: section_id ? Number(section_id) : null
              };

              if (Number.isNaN((flatRecord as any).academic_year_id)) (flatRecord as any).academic_year_id = null;
              if (Number.isNaN((flatRecord as any).class_id)) (flatRecord as any).class_id = null;
              if (Number.isNaN((flatRecord as any).section_id)) (flatRecord as any).section_id = null;

              const mapped = mapAttendanceToDb(flatRecord);
              if (mapped.student_id !== null && mapped.student_code !== null) {
                bulkData.push({
                  ...mapped,
                  attendance_id: uuidv4(),
                  attendance_type: "MOBILE_APP",
                  marked_by: uploaded_by || "SYSTEM",
                });
              }
            } catch (mapErr: any) {
              console.error("[Upload] Failed to map record:", student.Name, att.Date, mapErr.message);
              failedRecords.push({ student: student.Name, date: att.Date, message: mapErr.message });
            }
          }
        }

        let savedRecords: any[] = [];

        const cleanBulkData = bulkData.filter(record => {
          const date = String(record.attendance_date || "").trim();
          const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);
          if (!valid) {
            console.warn(`[FINAL FILTER] Removing record with bad date: '${date}'`);
          }
          return valid;
        });
        console.log(`[Upload] After final filter: ${cleanBulkData.length} valid records (removed ${bulkData.length - cleanBulkData.length})`);

        if (cleanBulkData.length > 0) {
          console.log("[PRE-INSERT] Dates being sent to DB:");
          cleanBulkData.forEach((record, idx) => {
            console.log(`  [${idx}] attendance_date = '${record.attendance_date}' (type: ${typeof record.attendance_date})`);
          });

          try {
            const { Attendance } = getTenantModels(req.tenant);
            
            // ✅ VALIDATE & SANITIZE all records before bulk insert
            const validatedData: AttendanceCreationAttributes[] = cleanBulkData.map((record: any, idx: number) => {
              // Ensure all required fields are present and correct type
              const statusStr = String(record.attendance_status || "ABSENT").trim().toUpperCase();
              const validStatuses = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "HOLIDAY", "LEAVE"];
              const attendance_status = validStatuses.includes(statusStr) ? statusStr : "ABSENT";

              const typeStr = String(record.attendance_type || "MOBILE_APP").trim().toUpperCase();
              const validTypes = ["MANUAL", "BIOMETRIC", "RFID", "MOBILE_APP"];
              const attendance_type = validTypes.includes(typeStr) ? typeStr : "MOBILE_APP";

              return {
                attendance_id: String(record.attendance_id || uuidv4()),
                student_id: record.student_id,
                student_code: record.student_code ? String(record.student_code).trim() : null,
                student_name: String(record.student_name || "Unknown").trim(),
                attendance_date: new Date(String(record.attendance_date).trim()), // Convert to Date
                attendance_status: attendance_status as any,
                attendance_type: attendance_type as any,
                marked_by: String(record.marked_by || "SYSTEM").trim(),
                remarks: record.remarks ? String(record.remarks).trim() : null,
                status: 1,
                academic_year_id: record.academic_year_id || null,
                class_id: record.class_id || null,
                section_id: record.section_id || null
              };
            });

            console.log("[PRE-INSERT] Sample validated record:", JSON.stringify(validatedData[0], null, 2));

            savedRecords = await Attendance.bulkCreate(validatedData, {
              ignoreDuplicates: false,
              updateOnDuplicate: [
                "attendance_status",
                "remarks",
                "marked_by",
                "attendance_type"
              ]
            });
            console.log(`[Upload] Successfully bulk inserted/updated ${savedRecords.length} records.`);

            // Update student attendance stats — kept as raw SQL due to complex aggregation UPDATE JOIN
            try {
              console.log("[Upload] Refreshing stats in students...");
              const sequelize = getTenantSequelize(req.tenant);
              await sequelize.query(`
                UPDATE students s
                JOIN (
                    SELECT 
                        student_id,
                        COUNT(CASE WHEN attendance_status = 'PRESENT' THEN 1 END) as p_count,
                        COUNT(CASE WHEN attendance_status = 'ABSENT' THEN 1 END) as a_count
                    FROM student_daily_attendance
                    GROUP BY student_id
                ) as stats ON s.student_id = stats.student_id
                SET 
                    s.present_count = stats.p_count,
                    s.absent_count = stats.a_count,
                    s.attendance_percentage = CASE 
                        WHEN (stats.p_count + stats.a_count) > 0 
                        THEN (stats.p_count / (stats.p_count + stats.a_count)) * 100 
                        ELSE 0 
                    END;
              `);
              console.log("[Upload] Stats refreshed successfully.");
            } catch (statsErr: any) {
              console.error("[Upload] Failed to refresh stats:", statsErr.message);
            }

          } catch (bulkErr: any) {
            console.error("[Upload] Bulk create failed:", bulkErr.message);
            console.error("[Upload] SQL Error Details:", bulkErr.sql);
            return res.status(500).json({
              status: 0,
              data: null,
              message: "Bulk insertion failed: " + bulkErr.message
            });
          }
        }

        return res.status(201).json({
          status: 1,
          message: "File uploaded and attendance processed successfully",
          data: {
            file: file.filename,
            total_records: records.length,
            saved_count: savedRecords.length,
            failed_count: failedRecords.length,
            saved_records: savedRecords,
            failed_details: failedRecords
          }
        });
      } else {
        const errorMsg = responseData.message || responseData.detail || "AI-ML Service returned failure status";
        console.error("[Upload] AI-ML Service error detail:", JSON.stringify(responseData));
        return res.status(200).json({
          status: 0,
          data: null,
          message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
        });
      }
    } catch (aiError: any) {
      console.error("[Upload] AI-ML Service Error:", {
        message: aiError.message,
        name: aiError.name,
        code: aiError.code,
        cause: aiError.cause?.message,
        serviceUrl: config.aimlServiceUrl
      });
      
      // Provide better error message based on error type
      let userMessage = `AI-ML processing failed: ${aiError.message}`;
      if (aiError.code === 'ECONNREFUSED') {
        userMessage = `Cannot connect to OCR service at ${config.aimlServiceUrl}. Service may be offline.`;
      } else if (aiError.code === 'ENOTFOUND') {
        userMessage = `OCR service hostname not found: ${config.aimlServiceUrl}. Check service URL configuration.`;
      } else if (aiError.name === 'AbortError') {
        userMessage = 'OCR processing timed out after 5 minutes.';
      }
      
      return res.status(502).json({
        status: 0,
        data: null,
        message: userMessage
      });
    }
  } catch (error: any) {
    console.error("[Upload] Unexpected error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({
      status: 0,
      data: null,
      message: `Upload failed: ${error.message || 'Unknown error'}`,
    });
  }
};

export const getStudentAttendanceSummary = async (req, res: Response) => {
  try {
    const { startDate, endDate, classId, programId, academicYearId } = req.query;

    console.log(req.query);

    const studentWhereClause: any = {};
    if (classId) studentWhereClause.class_id = classId;
    if (programId) studentWhereClause.program_id = programId;
    if (academicYearId) studentWhereClause.academic_year_id = academicYearId;

    const { Student, Department, Attendance } = getTenantModels(req.tenant);

    const students = await Student.findAll({
      where: studentWhereClause,
      attributes: ['id', 'student_id', 'student_name', 'roll_number',
        [Sequelize.col('department.name'), 'department_name']],
      include: [{
        model: Department,
        as: 'department',
        attributes: []
      }],
      raw: true
    });

    if (!students || students.length === 0) {
      return res.status(200).json({ status: 1, data: [], message: "No students found" });
    }

    let queryStart: any, queryEnd: any;

    if (startDate && endDate) {
      queryStart = startDate;
      queryEnd = endDate;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      queryStart = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      queryEnd = `${year}-${month}-${lastDay}`;
    }

    // Calculate number of days
    const start = new Date(queryStart);
    const end = new Date(queryEnd);

    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const whereClause: any = {
      attendance_date: {
        [Op.between]: [queryStart, queryEnd]
      }
    };

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      raw: true
    });

    console.log(`[Stats] Range: ${queryStart} to ${queryEnd}`);
    console.log(`[Stats] Students: ${students.length}, Records: ${attendanceRecords.length}`);

    const summary = students.map((stu: any) => {
      const activeStudentId = String(stu.id);

      let presentCount = 0;
      let absentCount = 0;
      let dailyStatus: "PRESENT" | "ABSENT" | undefined = undefined;

      attendanceRecords.forEach((att: any) => {
        if (String(att.student_id).trim() === activeStudentId.trim()) {
          const status = att.attendance_status;
          if (status === 'PRESENT') presentCount++;
          else if (status === 'ABSENT') absentCount++;

          if (att.attendance_date === queryStart) {
            dailyStatus = status as "PRESENT" | "ABSENT";
          }
        }
      });      

      const daysMarked = diffDays + 1;
      const percentage = daysMarked > 0 ? Math.round((presentCount / daysMarked) * 100) : 0;

      if ((presentCount + absentCount) < daysMarked) {
        absentCount = daysMarked - presentCount;
      }

      return {
        student_id: activeStudentId,
        student_code: stu.student_id,
        student_name: stu.student_name,
        roll_number: stu.roll_number || "N/A",
        dept_name: stu.department_name || "N/A",
        present_days: presentCount,
        absent_days: absentCount,
        total_days: daysMarked,
        attendance_percentage: percentage,
        daily_status: dailyStatus
      };
    });

    return res.status(200).json({
      status: 1,
      data: summary,
      message: "Attendance summary fetched successfully"
    });

  } catch (err: any) {
    console.error("Summary error:", err);
    return res.status(500).json({ status: 0, data: null, message: err.message });
  }
};

export const bulkMarkAttendance = async (req, res: Response) => {
  try {
    const { students, date, marked_by } = req.body;

    if (!students || !Array.isArray(students) || !date) {
      return res.status(400).json({ status: 0, data: null, message: "Invalid payload" });
    }
    const { Attendance } = getTenantModels(req.tenant);
    const studentIds = students.map((s: any) => String(s.student_id));
    await Attendance.destroy({
      where: {
        attendance_date: date,
        student_id: studentIds
      }
    });

    const recordsToUpsert: AttendanceCreationAttributes[] = students.map((s: any) => ({
      attendance_id: uuidv4(),
      student_id: String(s.student_id),
      student_code: s.student_code,
      student_name: s.student_name || "Unknown",
      attendance_date: date,
      attendance_status: s.status,
      attendance_type: "MANUAL",
      marked_by: marked_by || "TEACHER",
      status: 1
    }));

    if (recordsToUpsert.length > 0) {
      console.log("[BulkMark] Sample Record:", JSON.stringify(recordsToUpsert[0], null, 2));
    }

    await Attendance.bulkCreate(recordsToUpsert);

    // Update student attendance stats — kept as raw SQL due to complex aggregation UPDATE JOIN
    try {
      const sequelize = getTenantSequelize(req.tenant);
      await sequelize.query(`
        UPDATE students s
        JOIN (
            SELECT 
                student_id,
                COUNT(CASE WHEN attendance_status = 'PRESENT' THEN 1 END) as p_count,
                COUNT(CASE WHEN attendance_status = 'ABSENT' THEN 1 END) as a_count
            FROM student_daily_attendance
            GROUP BY student_id
        ) as stats ON s.student_id = stats.student_id
        SET 
            s.present_count = stats.p_count,
            s.absent_count = stats.a_count,
            s.attendance_percentage = CASE 
                WHEN (stats.p_count + stats.a_count) > 0 
                THEN (stats.p_count / (stats.p_count + stats.a_count)) * 100 
                ELSE 0 
                END;
        `);
    } catch (statsErr: any) {
      console.error("Failed to refresh stats:", statsErr.message);
    }

    return res.status(200).json({
      status: 1,
      data: null,
      message: "Attendance marked successfully"
    });

  } catch (err: any) {
    console.error("Bulk mark error:", err);
    return res.status(500).json({ status: 0, data: null, message: err.message });
  }
};

export const getMyAttendanceRecords = async (req, res: Response) => {
  try {
    const { studentId, startDate, endDate, month, year } = req.query;

    if (!studentId) {
      return res.status(400).json({ status: 0, data: null, message: "Student ID is required" });
    }

    let queryStart: any, queryEnd: any;

    if (startDate && endDate) {
      queryStart = startDate;
      queryEnd = endDate;
    } else if (month && year) {
      const y = parseInt(year as string);
      const m = parseInt(month as string);
      queryStart = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      queryEnd = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      queryStart = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      queryEnd = `${y}-${m}-${lastDay}`;
    }
    const { Attendance } = getTenantModels(req.tenant);
    const records = await Attendance.findAll({
      where: {
        student_id: String(studentId),
        attendance_date: {
          [Op.between]: [queryStart, queryEnd]
        }
      },
      order: [['attendance_date', 'DESC']],
      raw: true
    });

    let presentCount = 0;
    let absentCount = 0;
    
    records.forEach((att: any) => {
      const status = att.attendance_status;
      if (status === 'PRESENT') presentCount++;
      else if (status === 'ABSENT') absentCount++;
    });

    const daysMarked = presentCount + absentCount;
    const percentage = daysMarked > 0 ? Math.round((presentCount / daysMarked) * 100) : 0;

    return res.status(200).json({
      status: 1,
      data: {
        records,
        summary: {
          present_days: presentCount,
          absent_days: absentCount,
          total_days: daysMarked,
          attendance_percentage: percentage
        }
      },
      message: "Attendance records fetched successfully"
    });

  } catch (err: any) {
    console.error("My Attendance error:", err);
    return res.status(500).json({ status: 0, data: null, message: err.message });
  }
};