"use client";
import { useState, useEffect } from "react";
import "./staff-attendance.css";
import { useNotify } from "@/src/context/notificationContext";
import { useApi } from "@/src/hooks/useApi";
import { PersonStanding, Hand, ClockAlert, X, AlarmClock, CircleOff, Check, Filter } from 'lucide-react';
import {
  getStaffAttendanceStats,
  getStaffAttendanceSummary,
  submitBulkStaffAttendance,
  getStaffAttendanceReportByDate,
  getStaffAttendanceReportByMonth,
  StaffAttendancePayload,
} from "@/src/services/staffAttendanceService";
import { set } from "zod";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface StaffMember {
  employee_id: string;
  employee_name: string;
  department_id?: number;
  designation?: string;
  present_days?: number;
  absent_days?: number;
  total_days?: number;
  attendance_percentage?: number;
  daily_status?: string;
  manual_status?: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | null;
}

interface AttendanceStats {
  date: string;
  total_staff: number;
  present: number;
  absent: number;
  late: number;
  on_leave: number;
  not_marked: number;
}

export default function StaffAttendance() {
  const notify = useNotify();
  const [isLoader, setLoader] = useState(false);

  // useApi hooks for API calls
  const statsApi = useApi(getStaffAttendanceStats);
  const summaryApi = useApi(getStaffAttendanceSummary);
  const bulkAttendanceApi = useApi(submitBulkStaffAttendance);
  const reportByDateApi = useApi(getStaffAttendanceReportByDate);
  const reportByMonthApi = useApi(getStaffAttendanceReportByMonth);

  const [viewMode, setViewMode] = useState<"stats" | "manual_entry">("stats");
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  // Date filters
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [statsFilterType, setStatsFilterType] = useState<"range" | "single">("single");
  const [statsStartDate, setStatsStartDate] = useState("");
  const [statsEndDate, setStatsEndDate] = useState("");
  const [statsSingleDate, setStatsSingleDate] = useState(new Date().toISOString().split('T')[0]);

  // PDF Report Modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [reportFilterType, setReportFilterType] = useState<"date" | "month">("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch attendance stats on load
  useEffect(() => {
    fetchStats();
    fetchAttendanceStats();
  }, []);

  useEffect(() => {
    if (viewMode === "manual_entry") {
      fetchStats();
    }
  }, [bulkDate, viewMode]);

  const fetchAttendanceStats = async () => {
    try {
      const result = await statsApi.call(statsSingleDate);
      if (result.status === 1) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setIsOpen(false);
      setStatsSingleDate('');
      setStatsStartDate('');
      setStatsEndDate('');
    }
  };

  const fetchStats = async () => {
    try {
      let startDate = "";
      let endDate = "";

      if (viewMode === "manual_entry" && bulkDate) {
        startDate = bulkDate;
        endDate = bulkDate;
      } else if (statsFilterType === "single" && statsSingleDate) {
        startDate = statsSingleDate;
        endDate = statsSingleDate;
      } else if (statsFilterType === "range" && statsStartDate && statsEndDate) {
        startDate = statsStartDate;
        endDate = statsEndDate;
      }

      const result = await summaryApi.call(startDate, endDate);

      if (result.status === 1) {
        const mapped = result.data.map((s: any) => ({
          ...s,
          manual_status: s.daily_status || null,
        }));
        setStaffData(mapped);
      } else {
        notify.error("Error", result.message || "Failed to fetch staff data");
      }
    } catch (err) {
      console.error("Stats error:", err);
      notify.error("Error", "Failed to fetch staff attendance");
    }
  };

  const handleManualStatusChange = (employeeId: string, status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE") => {
    setStaffData(prev =>
      prev.map(s =>
        s.employee_id === employeeId ? { ...s, manual_status: status } : s
      )
    );
  };

  const submitManualAttendance = async () => {
    setLoader(true);
    const markedStaff = staffData.filter(s => s.manual_status);

    if (markedStaff.length === 0) {
      notify.warning("No Attendance Marked", "Please mark attendance for at least one staff member.");
      return;
    }

    const payload: StaffAttendancePayload = {
      date: bulkDate,
      staff: markedStaff.map(s => ({
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        department_id: s.department_id,
        designation: s.designation,
        status: s.manual_status!,
      })),
      marked_by: "ADMIN",
    };

    try {
      const result = await bulkAttendanceApi.call(payload);

      if (result.status === 1) {
        notify.success("Success", `Attendance saved! ${result.data.created} created, ${result.data.updated} updated`);
        setViewMode("stats");
        fetchStats();
        fetchAttendanceStats();
      } else {
        notify.error("Error", result.message || "Failed to save attendance");
      }
    } catch (err) {
      console.error(err);
      notify.error("Error", "Attendance submission failed");
    } finally {
      setLoader(false);
    }
  };

  const markAllAs = (status: "PRESENT" | "ABSENT") => {
    setStaffData(prev => prev.map(s => ({ ...s, manual_status: status })));
  };

  const handleFetchReport = async () => {
    setLoader(true);
    try {
      let result;
      if (reportFilterType === "date") {
        if (!selectedDate) {
          notify.warning("Missing Date", "Please select a date");
          return;
        }
        result = await reportByDateApi.call(selectedDate);
      } else {
        if (!selectedMonth || !selectedYear) {
          notify.warning("Missing Selection", "Please select month and year");
          return;
        }
        result = await reportByMonthApi.call(selectedMonth, selectedYear);
      }

      if (result.status === 1) {
        setReportData(result.data || []);
        if (result.data?.length === 0) {
          notify.info("No Records", "No attendance records found for the selected period");
        }
      } else {
        notify.error("Error", result.message || "Failed to fetch report");
      }
    } catch (err) {
      console.error("Report fetch error:", err);
      notify.error("Error", "Failed to fetch report");
    } finally {
      setShowPdfModal(false)
      setLoader(false);
    }
  };

  const handleDownloadPdf = () => {
    if (reportData.length === 0) {
      notify.warning("No Data", "No data available to download");
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Staff Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #941B74; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: linear-gradient(to right, #941B74, #2D2050); color: white; padding: 12px; }
            td { padding: 10px; border: 1px solid #ddd; text-align: center; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .present { color: #10b981; font-weight: bold; }
            .absent { color: #ef4444; font-weight: bold; }
            .late { color: #f59e0b; font-weight: bold; }
            .leave { color: #8b5cf6; font-weight: bold; }
            .meta { text-align: center; color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>👥 Staff Attendance Report</h1>
          <p class="meta">
            ${reportFilterType === "date"
        ? `Date: ${selectedDate}`
        : `Month: ${selectedMonth}/${selectedYear}`
      } | Total Records: ${reportData.length}
          </p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${r.employee_name || 'N/A'}</td>
                  <td>${r.employee_id}</td>
                  <td>${r.attendance_date}</td>
                  <td class="${r.attendance_status?.toLowerCase()}">${r.attendance_status}</td>
                  <td>${r.remarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            Generated on: ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <>
      {isLoader && (<Loader />)}
      <div className="staff-attendance-wrapper">
        {/* Header */}
        <div className="sa-header">
          <div className="sa-header-left">
            <h1 className="text-dark text-lg font-semibold">Staff Attendance</h1>
            <p className="sa-subtitle">Manage daily attendance for teachers and staff</p>
          </div>
          <div className="sa-header-actions">
            <div className="tabs bg-transparent p-0 rounded-lg">
              <button className={`sa-tab-btn ${viewMode === "stats" ? "active" : ""}`} onClick={() => setViewMode("stats")}>Overview</button>
              <button className={`sa-tab-btn ${viewMode === "manual_entry" ? "active" : ""}`} onClick={() => setViewMode("manual_entry")}>Mark Attendance</button>
            </div>

          </div>
        </div>
        <div className="tab-container">
          {/* Stats Cards */}
          {stats && viewMode === "stats" && (
            <div className="sa-stats-grid">
              <div className="sa-stat-card total">
                <div className="stat-icon-wrapper stat-icon-blue mr-3">
                  <PersonStanding className="stat-icon" />
                </div>
                <div className="sa-stat-content">
                  <span className="sa-stat-value">{stats.total_staff}</span>
                  <span className="sa-stat-label">Total Staff</span>
                </div>
              </div>
              <div className="sa-stat-card present">
                <div className="stat-icon-wrapper stat-icon-yellow mr-3">
                  <Hand className="stat-icon" />
                </div>
                <div className="sa-stat-content">
                  <span className="sa-stat-value">{stats.present}</span>
                  <span className="sa-stat-label">Present</span>
                </div>
              </div>
              <div className="sa-stat-card absent">
                <div className="stat-icon-wrapper stat-icon-green mr-3">
                  <X className="stat-icon" />
                </div>
                <div className="sa-stat-content">
                  <span className="sa-stat-value">{stats.absent}</span>
                  <span className="sa-stat-label">Absent</span>
                </div>
              </div>
              <div className="sa-stat-card late">
                <div className="stat-icon-wrapper stat-icon-cyan mr-3">
                  <ClockAlert className="stat-icon" />
                </div>
                <div className="sa-stat-content">
                  <span className="sa-stat-value">{stats.late}</span>
                  <span className="sa-stat-label">Late</span>
                </div>
              </div>
              <div className="sa-stat-card leave">
                <div className="stat-icon-wrapper stat-icon-blue mr-3">
                  <AlarmClock className="stat-icon" />
                </div>
                <div className="sa-stat-content">
                  <span className="sa-stat-value">{stats.on_leave}</span>
                  <span className="sa-stat-label">On Leave</span>
                </div>
              </div>
              <div className="sa-stat-card unmarked">
                <div className="stat-icon-wrapper stat-icon-yellow mr-3">
                  <CircleOff className="stat-icon" />
                </div>
                <div className="sa-stat-content">
                  <span className="sa-stat-value">{stats.not_marked}</span>
                  <span className="sa-stat-label">Not Marked</span>
                </div>
              </div>
            </div>
          )}
          {/* Filters Section */}
          <div className="sa-filters-section">
            {viewMode === "stats" ? (
              <div className="sa-filter-row flex justify-between">
                <h3>Attendence List</h3>
                <div className="flex justify-end items-center">
                  <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}
                    className="sva-filter-toggle me-3"
                  // className="bg-primary w-[40px] h-[34px] flex items-center justify-center me-3 border hover:bg-primary hover:text-primary"
                  >
                    <Filter size={16} /> Filters
                  </Button>
                  {
                    isOpen && (
                      <div className="filter-show-open">
                        <div className="sa-filter-toggle">
                          <button
                            className={statsFilterType === "single" ? "active" : ""}
                            onClick={() => setStatsFilterType("single")}
                          >
                            Single Date
                          </button>
                          <button
                            className={statsFilterType === "range" ? "active" : ""}
                            onClick={() => setStatsFilterType("range")}
                          >
                            Range Date
                          </button>
                        </div>
                        {statsFilterType === "single" ? (
                          <Input
                            type="date"
                            className="sa-date-input"
                            value={statsSingleDate}
                            onChange={(e) => setStatsSingleDate(e.target.value)}
                          />
                        ) : (
                          <div className="sa-date-range">
                            <Input
                              type="date"
                              className="sa-date-input"
                              value={statsStartDate}
                              onChange={(e) => setStatsStartDate(e.target.value)}
                              placeholder="Start Date"
                            />
                            <span className="sa-date-separator">to</span>
                            <Input
                              type="date"
                              className="sa-date-input"
                              value={statsEndDate}
                              onChange={(e) => setStatsEndDate(e.target.value)}
                              placeholder="End Date"
                            />
                          </div>
                        )}
                        <Button onClick={() => { fetchStats(); fetchAttendanceStats(); }} variant="primary" className="apply-filter w-[100%] mt-3">Apply Filter</Button>
                      </div>
                    )
                  }
                  <Button variant="primary" onClick={() => setShowPdfModal(true)}>Reports</Button>
                </div>
              </div>
            ) : (
              <div className="sa-filter-row">
                <div className="sa-manual-header">
                  <label className="sa-date-label">Attendance Date:</label>
                  <input
                    type="date"
                    className="sa-date-input"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                  />
                </div>
                <div className="sa-quick-actions">
                  <button className="sa-btn-mark-all present" onClick={() => markAllAs("PRESENT")}>
                    <Check /> Mark All Present
                  </button>
                  <button className="sa-btn-mark-all absent" onClick={() => markAllAs("ABSENT")}>
                    <X className="" /> Mark All Absent
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Staff Table */}
          <div className="sa-table-container">
            {summaryApi.loading ? (
              <div className="sa-loading">
                <div className="sa-spinner"></div>
                <p>Loading staff data...</p>
              </div>
            ) : (
              <table className="custom-student-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Employee ID</th>
                    <th>Designation</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th style={{ textAlign: 'center' }}>%</th>
                    {viewMode === "manual_entry" && <th>Mark Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((staff, idx) => (
                    <tr key={staff.employee_id}>
                      <td>{idx + 1}</td>
                      <td className="sa-name-cell">{staff.employee_name || 'N/A'}</td>
                      <td><code>{staff.employee_id}</code></td>
                      <td>{staff.designation || '-'}</td>
                      <td><span className="sa-badge present">{staff.present_days || 0}</span></td>
                      <td><span className="sa-badge absent">{staff.absent_days || 0}</span></td>
                      <td align="center" style={{ textAlign: "center" }}>
                        <div className="sa-progress-bar">
                          <div
                            className="sa-progress-fill"
                            style={{ width: `${staff.attendance_percentage || 0}%` }}
                          ></div>
                          <span className="sa-progress-text">{staff.attendance_percentage || 0}%</span>
                        </div>
                      </td>
                      {viewMode === "manual_entry" && (
                        <td>
                          <div className="sa-status-buttons">
                            <button
                              className={`sa-status-btn present ${staff.manual_status === "PRESENT" ? "selected" : ""}`}
                              onClick={() => handleManualStatusChange(staff.employee_id, "PRESENT")}
                              title="Present"
                            >
                              P
                            </button>
                            <button
                              className={`sa-status-btn absent ${staff.manual_status === "ABSENT" ? "selected" : ""}`}
                              onClick={() => handleManualStatusChange(staff.employee_id, "ABSENT")}
                              title="Absent"
                            >
                              A
                            </button>
                            <button
                              className={`sa-status-btn late ${staff.manual_status === "LATE" ? "selected" : ""}`}
                              onClick={() => handleManualStatusChange(staff.employee_id, "LATE")}
                              title="Late"
                            >
                              L
                            </button>
                            <button
                              className={`sa-status-btn leave ${staff.manual_status === "LEAVE" ? "selected" : ""}`}
                              onClick={() => handleManualStatusChange(staff.employee_id, "LEAVE")}
                              title="Leave"
                            >
                              H
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {staffData.length === 0 && (
                    <tr>
                      <td colSpan={viewMode === "manual_entry" ? 8 : 7} className="sa-no-data">
                        No staff members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>



        {/* Submit Button for Manual Entry */}
        {viewMode === "manual_entry" && (
          <div className="sa-submit-section">
            <button className="sa-btn-cancel" onClick={() => setViewMode("stats")}>
              Cancel
            </button>
            <button
              className="sa-btn-submit"
              onClick={submitManualAttendance}
              disabled={bulkAttendanceApi.loading}
            >
              {bulkAttendanceApi.loading ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        )}

        {/* PDF Report Modal */}
        {showPdfModal && (
          <div className="sa-modal-overlay">
            <div className="sa-modal">
              <div className="sa-modal-header">
                <h3>Staff Attendance Report</h3>
                <button className="sa-modal-close" onClick={() => setShowPdfModal(false)}>✕</button>
              </div>

              <div className="sa-modal-body">
                <div className="sa-report-filters">
                  <div className="sa-filter-type-toggle">
                    <label>
                      <input
                        type="radio"
                        name="reportFilterType"
                        checked={reportFilterType === "date"}
                        onChange={() => setReportFilterType("date")}
                      />
                      Specific Date
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="reportFilterType"
                        checked={reportFilterType === "month"}
                        onChange={() => setReportFilterType("month")}
                      />
                      Full Month
                    </label>
                  </div>

                  {reportFilterType === "date" ? (
                    <input
                      type="date"
                      className="sa-date-input"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  ) : (
                    <div className="sa-month-year-select">
                      <select
                        className="sa-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        <option value="">Month</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                      <select
                        className="sa-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        {[2024, 2025, 2026, 2027].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    className="sa-btn-fetch"
                    onClick={handleFetchReport}
                    disabled={reportByDateApi.loading || reportByMonthApi.loading}
                  >
                    {(reportByDateApi.loading || reportByMonthApi.loading) ? "Loading..." : "Fetch Report"}
                  </button>
                </div>

                {reportData.length > 0 && (
                  <div className="sa-report-table-container">
                    <table className="sa-report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Employee Name</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((record, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{record.employee_name || 'N/A'}</td>
                            <td>{record.attendance_date}</td>
                            <td className={`sa-status-${record.attendance_status?.toLowerCase()}`}>
                              {record.attendance_status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="sa-report-summary">
                      Total Records: <strong>{reportData.length}</strong>
                    </div>
                  </div>
                )}
              </div>

              {reportData.length > 0 && (
                <div className="sa-modal-footer">
                  <button className="sa-btn-download" onClick={handleDownloadPdf}>
                    📥 Download / Print PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
