import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { getTenantModels } from "../models";

const ensureUploadDirectory = () => {
  const uploadDir = path.join(process.cwd(), "uploads/pdf/attendance");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const fetchAttendanceData = async (attendance_id: string, tenant: string) => {
  const { Attendance } = getTenantModels(tenant);
  const record = await Attendance.findOne({
    where: { attendance_id }
  });
  return record ? record.toJSON() : null;
};

export const generateAttendancePDF = async (attendance_id: string, tenant: string) => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const data = await fetchAttendanceData(attendance_id, tenant);
    if (!data) throw new Error("Attendance record not found");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Student Attendance Report", pageWidth / 2, 20, { align: "center" });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.line(15, 35, pageWidth - 15, 35);
    let y = 45;
    pdf.setFont("helvetica", "bold");
    pdf.text("Student Details", 15, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Student ID: ${data.student_id}`, 15, y);
    pdf.text(`Student Code: ${data.student_code || "N/A"}`, 120, y);
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Attendance Details", 15, y);

    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Date: ${data.attendance_date}`, 15, y);
    pdf.text(`Status: ${data.attendance_status}`, 120, y);

    y += 6;
    pdf.text(`Check-in Time: ${data.check_in_time || "N/A"}`, 15, y);
    pdf.text(`Check-out Time: ${data.check_out_time || "N/A"}`, 120, y);

    y += 6;
    pdf.text(`Late Minutes: ${data.late_minutes || 0}`, 15, y);
    pdf.text(`Attendance Type: ${data.attendance_type || "N/A"}`, 120, y);
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Approval / Leave Info", 15, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Marked By: ${data.marked_by || "SYSTEM"}`, 15, y);
    pdf.text(`Marked By Type: ${data.marked_by_type || "N/A"}`, 120, y);
    y += 6;
    pdf.text(`Absence Reason: ${data.absence_reason || "N/A"}`, 15, y);

    if (data.remarks) {
      y += 16;
      pdf.text(`Remarks: ${data.remarks}`, 15, y);
    }
    y = pageHeight - 30;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "italic");
    pdf.text(
      "This is a system-generated attendance report.",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 5;
    pdf.text(
      `Generated on: ${new Date().toLocaleString("en-IN")}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    const uploadDir = ensureUploadDirectory();
    const fileName = `Attendance_${attendance_id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(pdf.output("arraybuffer"));
    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      fileName,
      filePath,
      relativePath: `uploads/pdf/attendance/${fileName}`,
      data,
    };
  } catch (err) {
    console.error("Attendance PDF error:", err);
    throw err;
  }
};

export const getAttendanceReport = async (req, res: Response) => {
  try {
    const { date, month, year } = req.query;

    console.log("[Report] Query params:", { date, month, year });

    let whereClause: any = {};

    if (date) {
      whereClause.attendance_date = date;
    } else if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
      const endDate = new Date(y, m, 0).toISOString().split('T')[0];

      whereClause.attendance_date = {
        [Op.between]: [startDate, endDate]
      };
    } else {
      return res.status(400).json({
        status: 0,
        data: null,
        message: "Please provide either 'date' or 'month' and 'year' query parameters"
      });
    }
    const { Attendance } = getTenantModels(req.tenant);
    const records = await Attendance.findAll({
      where: whereClause,
      order: [['student_name', 'ASC'], ['attendance_date', 'ASC']],
      attributes: [
        'student_id',
        'student_name',
        'attendance_date',
        'attendance_status',
        'remarks'
      ]
    });

    console.log(`[Report] Found ${records.length} records`);

    return res.status(200).json({
      status: 1,
      message: "Report fetched successfully",
      data: records
    });

  } catch (error: any) {
    console.error("[Report] Error:", error.message);
    return res.status(500).json({
      status: 0,
      data: null,
      message: "Failed to fetch report"
    });
  }
};