"use client";

import { useEffect, useState, useMemo, useContext } from "react";
import useRoleGuard from "@/src/hooks/useRoleGuard";
import { AuthContext } from "@/src/context/authContext";
import { useNotify } from "@/src/context/notificationContext";
import { useApi } from "@/src/hooks/useApi";
import { getMyAttendanceRecords, MyAttendanceResponse } from "@/src/services/studentMyAttendanceService";
import { Loader } from "@/components/ui/loader";
import { Calendar, CheckCircle, XCircle, TrendingUp, Filter, Eye } from "lucide-react";
import { useAppSelector } from "@/src/store/hooks";
import { StudentAttendanceRecord } from "@/src/services/studentAttendanceService";
import { Button } from "@/components/ui/button";
import "./view-attendance.css";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

export default function StudentViewAttendance() {
  const user = useRoleGuard("student");
  const authCtx = useContext(AuthContext);
  const notify = useNotify();
  const studentDetails = useAppSelector((state) => state.stuDetails.StudentDetails);

  const attendanceApi = useApi(getMyAttendanceRecords);

  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [summary, setSummary] = useState<MyAttendanceResponse["summary"] | null>(null);

  const [filterType, setFilterType] = useState<"month" | "range">("month");

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear())
  );

  const [startDate, setStartDate] = useState<string>(() => {
    const defaultStart = new Date();
    defaultStart.setDate(1);
    return defaultStart.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [showFilters, setShowFilters] = useState(false);

  const studentIdStr = studentDetails?.id
    ? String(studentDetails.id)
    : (authCtx?.user?.user_id ? String(authCtx.user.user_id) : undefined);

  useEffect(() => {
    if (studentIdStr) {
      fetchAttendance();
    }
  }, [studentIdStr]);

  const fetchAttendance = async () => {
    if (!studentIdStr) return;

    try {
      const params: any = { studentId: studentIdStr };

      if (filterType === "month") {
        params.month = parseInt(selectedMonth);
        params.year = parseInt(selectedYear);
      } else {
        if (!startDate || !endDate) {
          notify.error("Validation Error", "Please specify both start and end dates.");
          return;
        }
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const result = await attendanceApi.call(params);
      if (result.status === 1 && result.data) {
        setRecords(result.data.records);
        setSummary(result.data.summary);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "PRESENT":
        return <span className="sva-badge sva-badge-present">Present</span>;
      case "ABSENT":
        return <span className="sva-badge sva-badge-absent">Absent</span>;
      case "LATE":
        return <span className="sva-badge sva-badge-late">Late</span>;
      case "HALF_DAY":
        return <span className="sva-badge sva-badge-late">Half Day</span>;
      case "HOLIDAY":
      case "LEAVE":
        return <span className="sva-badge sva-badge-holiday">{status}</span>;
      default:
        return <span className="sva-badge sva-badge-default">{status || "Unknown"}</span>;
    }
  };

  const formatDateWithDay = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  if (!user) return null;

  return (
    <div className="sva-wrapper">
      {attendanceApi.loading && <Loader />}

      <div className="sva-header mb-5">
        <div>
          <h1 className="sva-page-title text-dark text-lg font-semibold">My Attendance</h1>
          <p className="sva-page-subtitle text-gray-color">Track your daily attendance history and statistics.</p>
        </div>
      </div>

      <div className="sva-stats-grid mb-5">
        <div className="stats-card card-total">
          <div className="stat-icon-wrapper">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary?.total_days || 0}</span>
            <span className="stat-label">Total Days Marked</span>
          </div>
        </div>

        <div className="stats-card card-pending">
          <div className="stat-icon-wrapper">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary?.present_days || 0}</span>
            <span className="stat-label">Present Days</span>
          </div>
        </div>

        <div className="stats-card card-graded">
          <div className="stat-icon-wrapper">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary?.absent_days || 0}</span>
            <span className="stat-label">Absent Days</span>
          </div>
        </div>

        <div className="stats-card card-submitted">
          <div className="stat-icon-wrapper">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">

            <div className="sva-progress-wrap">
              <span className="stat-value">{summary?.attendance_percentage || 0}%</span>
              <div className="sva-progress-bar">
                <div
                  className={`sva-progress-fill ${(summary?.attendance_percentage || 0) >= 75 ? 'good' :
                      (summary?.attendance_percentage || 0) >= 60 ? 'average' : 'poor'
                    }`}
                  style={{ width: `${Math.min(100, summary?.attendance_percentage || 0)}%` }}
                ></div>
              </div>
            </div>
            <span className="stat-label">Attendance %</span>
          </div>
        </div>
      </div>

      <div className="sva-content-section">
        <div className="sva-section-header mb-5">
          <h3 className="sva-section-title">Daily Records</h3>
          <div className="sva-filters-container">
            <Button
              variant="outline"
              className="sva-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} /> Filters
            </Button>

            {showFilters && (
              <div className="filter-show-open">
                <div className="sa-filter-toggle">
                  <button
                    className={`sva-filter-tab ${filterType === 'month' ? 'active' : ''}`}
                    onClick={() => setFilterType("month")}
                  >
                    By Month
                  </button>
                  <button
                    className={`sva-filter-tab ${filterType === 'range' ? 'active' : ''}`}
                    onClick={() => setFilterType("range")}
                  >
                    Custom Range
                  </button>
                </div>

                {filterType === "month" ? (
                  <div className="sa-date-range">
                    <Label>Month</Label>
                    <select
                      className="sva-select"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <Label>Year</Label>
                    <select
                      className="sva-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="sa-date-range">
                    <div className="sva-input-group">
                      {/* <Label>From</Label> */}
                      <Input
                        type="date"
                        className="sva-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <Label>To</Label>
                    <div className="sva-input-group">
                      <Input
                        type="date"
                        className="sva-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="sva-filter-actions">
                  <Button className="w-[100%] mt-5" variant="primary" onClick={() => {
                    fetchAttendance();
                    setShowFilters(false);
                  }}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sva-table-wrapper">
          {attendanceApi.loading && records.length === 0 ? (
            <div className="sva-skeleton-body">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="sva-skeleton-row" />
              ))}
            </div>
          ) : (
            <table className="sva-table custom-student-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Date & Day</th>
                  <th>Status</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((rec, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="sva-date-cell">{formatDateWithDay(rec.attendance_date)}</td>
                      <td>{getStatusBadge(rec.attendance_status)}</td>
                      <td>{rec.check_in_time || "—"}</td>
                      <td>{rec.check_out_time || "—"}</td>
                      <td className="sva-remarks">{rec.remarks || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="sva-empty-state">
                      <div className="sva-empty-content">
                        <Eye size={40} className="sva-empty-icon" />
                        <p>No attendance records found for this period.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
