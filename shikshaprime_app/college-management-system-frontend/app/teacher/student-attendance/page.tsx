"use client";
import { useState, useRef, useEffect, useContext } from "react";
import "./student-attendance.css";
import { Input } from "@/components/ui/input";
import { AuthContext } from "@/src/context/authContext";
import { useNotify } from "@/src/context/notificationContext";
import {
  uploadAttendanceImage,
  getStudentAttendanceReport,
  getStudentAttendanceSummary,
  submitBulkStudentAttendance,
  getTeacherClasses,
  getTeacherPrograms,
  getTeacherAcademicYears,
  TeacherAcademicYear,
  TeacherClass,
  StudentAttendanceRecord,
  TeacherProgram,
} from "@/src/services/studentAttendanceService";
import { Button } from "@/components/ui/button";
import { ArrowUpFromLine, Filter, TrendingUp } from 'lucide-react';
import { Label } from "@/components/ui/label";

export default function StudentAttendance() {
  const notify = useNotify();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [filterType, setFilterType] = useState<"date" | "month">("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<StudentAttendanceRecord[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      setShowCamera(true);
      setCapturedPreview(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      notify.error("Camera Error", "Camera access denied or not available");
    }
  };
  const handleCaptureImage = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const previewUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedPreview(previewUrl);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const capturedFile = new File(
              [blob],
              `attendance_camera_${Date.now()}.jpg`,
              { type: "image/jpeg" }
            );
            setFile(capturedFile);
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPreview(null);
    setFile(null);
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedPreview(null);
  };

  const handleConfirmCapture = () => {
    handleCloseCamera();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleOpenPdfModal = () => {
    setShowPdfModal(true);
    setReportData([]);
  };
  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setReportData([]);
  };
  const handleFetchReport = async () => {
    try {
      setReportLoading(true);

      if (filterType === "date") {
        if (!selectedDate) {
          notify.warning("Missing Date", "Please select a date");
          return;
        }
      } else {
        if (!selectedMonth || !selectedYear) {
          notify.warning("Missing Selection", "Please select month and year");
          return;
        }
      }

      const params = filterType === "date"
        ? { date: selectedDate }
        : { month: selectedMonth, year: selectedYear };

      const result = await getStudentAttendanceReport(params);

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
      setReportLoading(false);
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
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #941B74; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: linear-gradient(to right, #941B74, #2D2050); color: white; padding: 10px; }
            td { padding: 8px; border: 1px solid #ddd; text-align: center; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .present { color: green; font-weight: bold; }
            .absent { color: red; font-weight: bold; }
            .meta { text-align: center; color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>📋 Attendance Report</h1>
          <p class="meta">
            ${filterType === "date"
        ? `Date: ${selectedDate}`
        : `Month: ${selectedMonth}/${selectedYear}`
      } | Total Records: ${reportData.length}
          </p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${r.student_name || 'N/A'}</td>
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
  const handleSubmit = async () => {
    if (!file) {
      notify.warning("No Image", "Please select an image first");
      return;
    }
    try {
      setLoading(true);
      const result = await uploadAttendanceImage(file, "teacher_01");

      if (result.status === 1) {
        notify.success("Upload Successful", "File uploaded successfully");
        setFile(null);
        const inputEl = document.getElementById("upload") as HTMLInputElement;
        if (inputEl) inputEl.value = "";
      } else {
        notify.error("Upload Failed", result.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      notify.error("Upload Failed", "Failed to upload the file");
    } finally {
      setLoading(false);
    }
  };


  const [viewMode, setViewMode] = useState<"upload" | "stats" | "manual_entry">("stats");
  const [statData, setStatData] = useState<StudentAttendanceRecord[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);

  const [statsStartDate, setStatsStartDate] = useState("");
  const [statsEndDate, setStatsEndDate] = useState("");
  const [statsFilterType, setStatsFilterType] = useState<"range" | "single">("range");
  const [statsSingleDate, setStatsSingleDate] = useState("");

  // Class selection for teachers
  const { token } = useContext(AuthContext)!;
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classesLoading, setClassesLoading] = useState(false);
  const [teacherPrograms, setTeacherPrograms] = useState<TeacherProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [programLoading, setProgramLoading] = useState(false);
  const [teacherAcademicYears, setTeacherAcademicYears] = useState<TeacherAcademicYear[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  const [academicYearLoading, setAcademicYearLoading] = useState(false);

  // Fetch teacher's assigned classes on mount
  useEffect(() => {
    const fetchTeacherClassesData = async () => {
      try {
        setClassesLoading(true);
        console.log("=== Fetching teacher classes ===");
        console.log("Token:", token ? "present" : "missing");

        const result = await getTeacherClasses();
        console.log("Teacher classes response:", result);

        if (result.status === 1 && result.data?.length > 0) {
          setTeacherClasses(result.data);
          setSelectedClassId(result.data[0].class_id); // Auto-select first class
        } else {
          console.log("No classes found or error:", result);
        }
      } catch (err) {
        console.error("Failed to fetch teacher classes:", err);
      } finally {
        setClassesLoading(false);
      }
    };
    if (token) {
      fetchTeacherClassesData();
    } else {
      console.log("Token not available yet, skipping class fetch");
    }
  }, [token]);

  useEffect(() => {
    const fetchTeacherProgramData = async () => {
      try {
        setProgramLoading(true);
        console.log("=== Fetching teacher classes ===");
        console.log("Token:", token ? "present" : "missing");

        const result = await getTeacherPrograms();
        console.log("Teacher programs response:", result);

        if (result.status === 1 && result.data?.length > 0) {
          setTeacherPrograms(result.data);
          setSelectedProgramId(result.data[0].program_id); // Auto-select first program
        } else {
          console.log("No classes found or error:", result);
        }
      } catch (err) {
        console.error("Failed to fetch teacher classes:", err);
      } finally {
        setProgramLoading(false);
      }
    };
    if (token) {
      fetchTeacherProgramData();
    } else {
      console.log("Token not available yet, skipping class fetch");
    }
  }, [token]);

  useEffect(() => {
    const fetchTeacherAcademicYearData = async () => {
      try {
        setAcademicYearLoading(true);
        console.log("=== Fetching teacher academic years ===");
        console.log("Token:", token ? "present" : "missing");

        const result = await getTeacherAcademicYears();
        console.log("Teacher academic years response:", result);

        if (result.status === 1 && result.data?.length > 0) {
          setTeacherAcademicYears(result.data);
          setSelectedAcademicYearId(result.data[0].academic_year_id); // Auto-select first program
        } else {
          console.log("No classes found or error:", result);
        }
      } catch (err) {
        console.error("Failed to fetch teacher classes:", err);
      } finally {
        setAcademicYearLoading(false);
      }
    };
    if (token) {
      fetchTeacherAcademicYearData();
    } else {
      console.log("Token not available yet, skipping class fetch");
    }
  }, [token]);

  useEffect(() => {
    if (viewMode === "stats" && selectedClassId) {
      fetchStats();
    }
  }, [selectedClassId, viewMode]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);

      let params: {
        startDate?: string;
        endDate?: string;
        month?: number;
        year?: number;
        classId?: number;
        programId?: number;
        academicYearId?: number;
      } = {};

      if (viewMode === "manual_entry" && bulkDate) {
        params.startDate = bulkDate;
        params.endDate = bulkDate;
      } else if (statsFilterType === "single" && statsSingleDate) {
        params.startDate = statsSingleDate;
        params.endDate = statsSingleDate;
      } else if (statsFilterType === "range" && statsStartDate && statsEndDate) {
        params.startDate = statsStartDate;
        params.endDate = statsEndDate;
      } else {
        params.month = new Date().getMonth() + 1;
        params.year = new Date().getFullYear();
      }

      if (selectedClassId) {
        params.classId = selectedClassId;
      }
      if (selectedProgramId) {
        params.programId = selectedProgramId;
      }
      if (selectedAcademicYearId) {
        params.academicYearId = selectedAcademicYearId;
      }

      const result = await getStudentAttendanceSummary(params);
      console.log(result);

      if (result.status === 1) {
        const mapped = result.data.map((s: any) => ({
          ...s,
          manual_status: s.daily_status // Pre-fill manual_status from daily_status if available
        }));
        setStatData(mapped);
      } else {
        notify.error("Error", result.message || "Failed to fetch stats");
      }
    } catch (err) {
      console.error("Stats error:", err);
      notify.error("Error", "Failed to fetch attendance stats");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "stats" || viewMode === "manual_entry") {
      fetchStats();
    }
  }, [selectedClassId, viewMode, bulkDate]);

  const handleManualStatusChange = (studentId: string, status: "PRESENT" | "ABSENT") => {
    setStatData(prev => prev.map(s =>
      s.student_id === studentId ? { ...s, manual_status: status } : s
    ));
  };

  const submitManualAttendance = async () => {
    try {
      setLoading(true);

      const markedStudents = statData.filter(s => s.manual_status);

      if (markedStudents.length === 0) {
        notify.warning("No Attendance Marked", "Please mark attendance for at least one student before saving.");
        setLoading(false);
        return;
      }

      const payload = {
        date: bulkDate,
        students: markedStudents.map(s => ({
          student_id: s.student_id,
          student_code: s.student_code,
          student_name: s.student_name,
          status: s.manual_status!
        })),
        marked_by: "TEACHER_APP"
      };

      const result = await submitBulkStudentAttendance(payload);

      if (result.status === 1) {
        notify.success("Success", "Attendance marked successfully!");
        setViewMode("stats");
        fetchStats();
      } else {
        notify.error("Error", result.message || "Failed to mark attendance");
      }
    } catch (err) {
      console.error(err);
      notify.error("Error", "Attendance submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleView = (mode: "upload" | "stats") => {
    setViewMode(mode);
    if (mode === "stats") {
      fetchStats();
    }
  };

  return (
    <>
      <div className="student-attendance-wrapper">
        <div className="content-header pd-12">
          <h3 className="section-title">Student Attendance</h3>
          <div className="registration-mode multi-button mt-0">
            <Button variant="primary"
              onClick={() => handleToggleView("upload")}
              className={`mr-2 ${viewMode === "upload" ? "" : ""}`}
            >
              Upload Mode
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
            </Button>
            <Button variant="primary"
              onClick={() => handleToggleView("stats")}
              className={`lsy mr-0 excp ${viewMode !== "upload" ? "vmn" : "vmx"}`}

            >
              Stats & Manual
              <TrendingUp className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </div>



        {viewMode === "upload" ? (
          <>
            <div className="mid-sec">
              <div className="form-wrap">
                <div className="form-group">
                  <h4 className="input-label fssmal">Upload Image</h4>

                  <Input
                    type="file"
                    id="upload"
                    className="upl"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  <label htmlFor="upload" className="input-label upllbl"></label>
                </div>

                <div className="multi-button">
                  <Button
                    className="mr-3"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>

                  <Button variant="primary"
                    className="btn-save-final vmx "
                    onClick={handleOpenCamera}
                  >
                    Upload Image from Camera
                  </Button>

                  <Button
                    className=""
                    onClick={handleOpenPdfModal}
                  >
                    View PDF
                  </Button>
                </div>
              </div>
            </div>

          </>
        ) : (
          <div className="differ-table" style={{ marginTop: '20px' }}>
            <div className="stats-header flex items-end justify-between mb-3">
              {/* <div className="flex items-end justify-between"> */}
              <h3>{viewMode === "manual_entry" ? "Manual Entry Mode" : "Attendance Statistics"}</h3>
              <div className="selectors-row">
                {/* Class Selection Dropdown */}
                {teacherClasses.length > 0 && (
                  <div className="class-selector">
                    <label>Select Class:</label>
                    <select
                      value={selectedClassId || ''}
                      onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    >
                      {teacherClasses.map((cls) => (
                        <option key={cls.class_id} value={cls.class_id}>
                          {cls.class_name}
                        </option>
                      ))}
                    </select>
                    {classesLoading && <span style={{ color: '#666', fontSize: '12px' }}>Loading classes...</span>}
                  </div>
                )}

                {/* Program Selection Dropdown */}
                {teacherPrograms.length > 0 && (
                  <div className="class-selector">
                    <label>Select Program:</label>
                    <select
                      value={selectedProgramId || ''}
                      onChange={(e) => setSelectedProgramId(Number(e.target.value))}
                    >
                      {teacherPrograms.map((program) => (
                        <option key={program.program_id} value={program.program_id}>
                          {program.program_name}
                        </option>
                      ))}
                    </select>
                    {programLoading && <span style={{ color: '#666', fontSize: '12px' }}>Loading programs...</span>}
                  </div>
                )}

                {/* Program Selection Dropdown */}
                {teacherAcademicYears.length > 0 && (
                  <div className="class-selector">
                    <label>Select Academic Year:</label>
                    <select value={selectedAcademicYearId || ''} onChange={(e) => setSelectedAcademicYearId(Number(e.target.value))}>
                      {teacherAcademicYears.map((academicYear) => (
                        <option key={academicYear.academic_year_id} value={academicYear.academic_year_id}>
                          {academicYear.academic_year_name}
                        </option>
                      ))}
                    </select>
                    {academicYearLoading && <span style={{ color: '#666', fontSize: '12px' }}>Loading academic Years...</span>}
                  </div>
                )}
                <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}
                  className="sva-filter-toggle"
                // className="bg-primary w-[40px] h-[34px] flex items-center justify-center me-3 border hover:bg-white hover:text-primary"
                >
                  <Filter size={16} /> Filters
                </Button>
                {viewMode === "manual_entry" && (
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="filter-input"
                    style={{ maxWidth: '150px' }}
                  />
                )}
                {viewMode === "stats" ? (
                  <Button variant="primary"
                    className="btn-save-final vmn"
                    onClick={() => setViewMode("manual_entry")}
                  >
                    Mark Attendance
                  </Button>
                ) : (
                  <div className="multi-button map-0">
                    <Button variant="primary" className="mr-3" onClick={submitManualAttendance} disabled={loading}>
                      {loading ? "Saving..." : "Save Attendance"}
                    </Button>
                    <Button variant="ghost" className="" onClick={() => setViewMode("stats")}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>



              {/* </div> */}
              {isOpen && (
                <div className="filter-show-open">
                  {viewMode === "stats" && (
                    <div className="">
                      <div className="sa-filter-toggle">
                        <button onClick={() => setStatsFilterType("single")} className={statsFilterType === "single" ? "active" : ""}>Single Date</button>
                        <button onClick={() => setStatsFilterType("range")} className={statsFilterType === "range" ? "active" : ""}>Range Date</button>
                      </div>

                      {statsFilterType === "range" ? (
                        <div className="sa-date-range">
                          <Input
                            type="date"
                            className="filter-input"
                            value={statsStartDate}
                            onChange={(e) => setStatsStartDate(e.target.value)}
                            title="Start Date"
                          />
                          <span style={{ color: '#666' }}>To</span>
                          <Input
                            type="date"
                            className="filter-input"
                            value={statsEndDate}
                            onChange={(e) => setStatsEndDate(e.target.value)}
                            title="End Date"
                          />
                        </div>
                      ) : (
                        <Input
                          type="date"
                          className="filter-input"
                          value={statsSingleDate}
                          onChange={(e) => setStatsSingleDate(e.target.value)}
                          title="Select Date"
                        />
                      )}

                      <Button
                        className="w-[100%] mt-5"
                        variant="primary"
                        onClick={fetchStats}
                      >
                        Apply
                      </Button>
                    </div>
                  )}

                </div>
              )
              }

            </div>
            {statsLoading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>Loading stats...</div>
            ) : (
              <div className="scroll-table">
                <table className="custom-student-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Roll Number</th>
                      <th>Dept</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>%</th>
                      {viewMode === "manual_entry" && <th>Today's Status</th>}
                    </tr>
                  </thead>
                  <tbody className="tbl-bdy">
                    {statData.map((student, index) => (
                      <tr key={index}>
                        <td>{student.student_code}</td>
                        <td>{student.student_name}</td>
                        <td>{student.roll_number}</td>
                        <td>{student.dept_name}</td>
                        <td><span style={{ color: 'green', fontWeight: 'bold' }}>{student.present_days}</span></td>
                        <td><span style={{ color: 'red', fontWeight: 'bold' }}>{student.absent_days}</span></td>
                        <td>{student.attendance_percentage}%</td>

                        {viewMode === "manual_entry" && (
                          <td>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                              <Label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name={`status-${student.student_id}`}
                                  checked={student.manual_status === "PRESENT"}
                                  onChange={() => handleManualStatusChange(student.student_id, "PRESENT")}
                                />
                                <span style={{ color: 'green' }}>P</span>
                              </Label>

                              <Label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name={`status-${student.student_id}`}
                                  checked={student.manual_status === "ABSENT"}
                                  onChange={() => handleManualStatusChange(student.student_id, "ABSENT")}
                                />
                                <span style={{ color: 'red' }}>A</span>
                              </Label>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {statData.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center' }}>No students found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {showCamera && (
          <div className="camera-modal-overlay">
            <div className="camera-modal">
              <div className="camera-header">
                <h3>Capture Attendance Sheet</h3>
                <button className="close-btn" onClick={handleCloseCamera}>
                  ✕
                </button>
              </div>

              <div className="camera-body">
                {!capturedPreview ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="camera-video"
                  />
                ) : (
                  <img
                    src={capturedPreview}
                    alt="Captured"
                    className="captured-preview"
                  />
                )}
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>

              <div className="camera-actions">
                {!capturedPreview ? (
                  <button className="btn-capture" onClick={handleCaptureImage}>
                    📸 Capture
                  </button>
                ) : (
                  <>
                    <button className="btn-retake" onClick={handleRetakePhoto}>
                      🔄 Retake
                    </button>
                    <button className="btn-confirm" onClick={handleConfirmCapture}>
                      ✓ Use This Photo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}


        {file && !showCamera && (
          <div className="selected-file-info">
            📷 Selected: <strong>{file.name}</strong>
          </div>
        )}

        {showPdfModal && (
          <div className="camera-modal-overlay">
            <div className="camera-modal pdf-modal">
              <div className="camera-header">
                <h3>📊 Attendance Report</h3>
                <button className="close-btn" onClick={handleClosePdfModal}>
                  ✕
                </button>
              </div>

              <div className="pdf-modal-body">
                <div className="filter-section">
                  <div className="filter-type-toggle">
                    <label>
                      <input
                        type="radio"
                        name="filterType"
                        value="date"
                        checked={filterType === "date"}
                        onChange={() => setFilterType("date")}
                      />
                      Specific Date
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="filterType"
                        value="month"
                        checked={filterType === "month"}
                        onChange={() => setFilterType("month")}
                      />
                      Full Month
                    </label>
                  </div>

                  {filterType === "date" ? (
                    <input
                      type="date"
                      className="filter-input"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  ) : (
                    <div className="month-year-select">
                      <select
                        className="filter-input"
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
                        className="filter-input"
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
                    className="btn-fetch-report"
                    onClick={handleFetchReport}
                    disabled={reportLoading}
                  >
                    {reportLoading ? "Loading..." : "🔍 Fetch Report"}
                  </button>
                </div>


                {reportData.length > 0 && (
                  <div className="report-table-container">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((record, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{record.student_name || 'N/A'}</td>
                            <td>{record.attendance_date}</td>
                            <td className={`status-${record.attendance_status?.toLowerCase()}`}>
                              {record.attendance_status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="report-summary">
                      Total Records: <strong>{reportData.length}</strong>
                    </div>
                  </div>
                )}
              </div>

              {reportData.length > 0 && (
                <div className="camera-actions">
                  <button className="btn-confirm" onClick={handleDownloadPdf}>
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