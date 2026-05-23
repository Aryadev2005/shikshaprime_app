"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/src/hooks/useRoleGuard";
import { useNotify } from "@/src/context/notificationContext";
import { useApi } from "@/src/hooks/useApi";
import {
  getStudentPayments,
  getDashboardStats,
  getDefaulters,
} from "@/src/services/paymentService";
import { fetchAcademicYears, fetchClasses, fetchLevelTwoDepartments, fetchPrograms } from "@/src/services/CommonService";
import { StudentPayment, DashboardStats, Defaulter } from "@/src/types/paymentTypes";
import {
  ArrowLeft,
  Filter,
  Download,
  IndianRupee,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import "./payment-dashboard.css";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ClassOption {
  id: number;
  code: string;
  name?: string;
  class_name?: string;
}

interface ProgramOption {
  id: number;
  code: string;  
  name?: string;
}

interface DepartmentOption {
  id: number;
  code: string;  
  name?: string;
}

interface AcademicYearOption {
  id: number;
  name?: string;
}

export default function PaymentDashboardPage() {
  const user = useRoleGuard("admin");
  const router = useRouter();
  const notify = useNotify();

  // API hooks
  const fetchClassesApi = useApi(fetchClasses);
  const fetchProgramsApi = useApi(fetchPrograms);
  const fetchDepartmentApi = useApi(fetchLevelTwoDepartments);
  const fetchAcademicYearApi = useApi(fetchAcademicYears);
  const getPaymentsApi = useApi(getStudentPayments);
  const getDashboardStatsApi = useApi(getDashboardStats);
  const getDefaultersApi = useApi(getDefaulters);

  // Data State
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);

  // Filter State
  const [filterBy, setFilterBy] = useState<"class" | "student">("class");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [isFiltered, setIsFiltered] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const classesResult = await fetchClassesApi.call();
      if (classesResult.status === 1) {
        // Map the response to ensure we have the right structure
        const classesData = (classesResult.data || []).map((cls: any) => ({
          id: cls.id,
          code: cls.code,
          name: cls.name,
        }));
        setClasses(classesData);
      }
      const programsResult = await fetchProgramsApi.call();
      if (programsResult.status === 1) {
        // Map the response to ensure we have the right structure
        const programsData = (programsResult.data || []).map((program: any) => ({
          id: program.id,
          code: program.code,
          name: program.name,
        }));
        setPrograms(programsData);
      }
      const departmentResult = await fetchDepartmentApi.call();
      if (departmentResult.status === 1) {
        // Map the response to ensure we have the right structure
        const departmentsData = (departmentResult.data || []).map((dept: any) => ({
          id: dept.id,
          code: dept.code,
          name: dept.name,
        }));
        setDepartments(departmentsData);
      }
      const academicYearResult = await fetchAcademicYearApi.call();
      if (academicYearResult.status === 1) {
        // Map the response to ensure we have the right structure
        const academinYearData = (academicYearResult.data || []).map((acy: any) => ({
          id: acy.id,
          name: acy.name,
        }));
        setAcademicYears(academinYearData);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      notify.error("Error", "Failed to load classes");
    }    
  };

  const handleApplyFilter = async () => {
    try {
      const filters: any = {};
      
      if (selectedClass) {        
          filters.classId = selectedClass;
      }
      if (selectedProgram) {        
          filters.programId = selectedProgram;
      }
      if (selectedDepartment) {        
          filters.departmentId = selectedDepartment;
      }
      if (selectedAcademicYear) {        
          filters.academicYearId = selectedAcademicYear;
      }      

      if (selectedStudent) {
          filters.studentIdOrName = selectedStudent;
      }

      // Fetch payments
      const paymentsResult = await getPaymentsApi.call(filters);
      if (paymentsResult.status === 1) {
        setPayments(paymentsResult.data);
      }

      // Fetch stats
      const statsResult = await getDashboardStatsApi.call(filters);
      if (statsResult.status === 1) {
        setStats(statsResult.data);
      }

      // Fetch defaulters
      const defaultersResult = await getDefaultersApi.call(filters);
      if (defaultersResult.status === 1) {
        setDefaulters(defaultersResult.data);
      }

      setIsFiltered(true);
    } catch (err) {
      console.error("Error applying filter:", err);
      notify.error("Error", "Failed to fetch payment data");
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "status-paid";
      case "pending":
        return "status-pending";
      case "partial":
        return "status-partial";
      case "overdue":
        return "status-overdue";
      default:
        return "";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleExport = () => {
    if (payments.length === 0) {
      notify.warning("No Data", "No data available to export");
      return;
    }

    // Create CSV content
    const headers = ["Student ID", "Payment Type", "Amount", "Paid Amount", "Due Date", "Status"];
    const rows = payments.map((p) => [
      p.student_id,
      p.payment_type_name,
      p.amount,
      p.paid_amount,
      formatDate(p.due_date),
      p.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    notify.success("Success", "Report exported successfully");
  };

  if (!user) return null;

  return (
    <div className="payment-dashboard-container">
      <div className="page-header-row">
        {/* <button className="back-button" onClick={() => router.push("/admin/payment")}>
          <ArrowLeft size={18} />
        </button> */}
        <div className="flex items-center mb-3">
          <Link href={'/admin/payment'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link>
        </div>
        <div className="page-header-text">
          <h1 className="text-md text-dark font-bold">Payment Dashboard</h1>
          <p className="page-subtitle">View and analyze payment data</p>
        </div>
      </div>     

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-header">
          <Filter size={18} />
          <span>Filter Options</span>
        </div>

        <div className="filter-grid">
          <div className="filter-group">
            <label className="filter-label">Filter By</label>
            <select
              className="filter-select"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as "class" | "student")}
            >
              <option value="class">By Class</option>
              <option value="student">By Student</option>
            </select>
          </div>

          {filterBy === "class" ? (
            <>
              <div className="filter-group">
                <label className="filter-label">Program</label>
                <select
                  className="filter-select"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                >
                  <option value="all">All Programs</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Department</label>
                <select
                  className="filter-select"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Academic Year</label>
                <select
                  className="filter-select"
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                >
                  <option value="all">All Years</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Year</label>
                <select
                  className="filter-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="all">All Years</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="filter-group">
              <label className="filter-label">Student</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Enter student name or ID"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              />
            </div>
          )}

          <div className="filter-actions">
            <Button
              className="w-[100%] py-5"
              onClick={handleApplyFilter}
              disabled={getPaymentsApi.loading}
              variant="primary"
            >
              {getPaymentsApi.loading ? <Loader/> : "Apply Filter"}
            </Button>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      {isFiltered && stats && (
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon-wrapper">
              <IndianRupee size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">{formatCurrency(stats.overview.total_amount)}</span>
            </div>
          </div>

          <div className="stat-card collected">
            <div className="stat-icon-wrapper">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Collected</span>
              <span className="stat-value">{formatCurrency(stats.overview.total_collected)}</span>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon-wrapper">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{formatCurrency(stats.overview.total_pending)}</span>
            </div>
          </div>

          <div className="stat-card overdue">
            <div className="stat-icon-wrapper">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Overdue</span>
              <span className="stat-value">{stats.overview.overdue_count || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="data-section">
        {!isFiltered ? (
          <div className="empty-state">
            No data to display. Please select filter options and click "Apply Filter".
          </div>
        ) : getPaymentsApi.loading ? (
          <div className="empty-state"><Loader/></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">No payment records found for the selected filters.</div>
        ) : (
          <div className="table-container">
            <div className="table-header">
              <h3>Payment Records ({payments.length})</h3>
              <button className="btn-export" onClick={handleExport}>
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Payment Type</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.payment_id}>
                      <td className="student-id-cell">{payment.student_id}</td>
                      <td>{payment.payment_type_name || "-"}</td>
                      <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                      <td className="amount-cell success">{formatCurrency(payment.paid_amount)}</td>
                      <td className="amount-cell warning">
                        {formatCurrency(payment.amount - payment.paid_amount)}
                      </td>
                      <td>{formatDate(payment.due_date)}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Defaulters Section */}
      {isFiltered && defaulters.length > 0 && (
        <div className="defaulters-section">
          <div className="section-header">
            <AlertTriangle size={20} className="warning-icon" />
            <h3>Defaulters ({defaulters.length})</h3>
          </div>

          <div className="defaulters-grid">
            {defaulters.slice(0, 6).map((defaulter) => (
              <div key={defaulter.id} className="defaulter-card">
                <div className="defaulter-info">
                  <span className="defaulter-name">Student #{defaulter.student_id}</span>
                  <span className="defaulter-type">{defaulter.payment_type}</span>
                </div>
                <div className="defaulter-amount">
                  <span className="amount-label">Pending</span>
                  <span className="amount-value">{formatCurrency(defaulter.pending_amount)}</span>
                </div>
                <div className="defaulter-date">
                  <span>Due: {formatDate(defaulter.due_date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}      
    </div>
  );
}
