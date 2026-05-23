"use client";

import { useState } from "react";
import { useApi } from "@/src/hooks/useApi";
import ReportContainer from "@/components/ui/reports/ReportContainer";
import ReportFilters from "@/components/ui/reports/ReportFilters";
import ReportTable from "@/components/ui/reports/ReportTable";
import { searchStudents } from "@/src/services/studentService";
import { getStudentLedger } from "@/src/services/feeReportService";

export default function StudentLedgerReport() {
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const {
    data: ledgerData,
    loading: loadingLedger,
    call: loadLedger,
  } = useApi(getStudentLedger);

  const { call: searchStudentApi } = useApi(searchStudents);

  // -----------------------------
  // SEARCH STUDENTS
  // -----------------------------
  const handleSearch = async (value: string) => {
    setStudentQuery(value);

    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    const res = await searchStudentApi({ query: value });
    setSearchResults(res?.data || []);
  };

  // -----------------------------
  // SELECT STUDENT
  // -----------------------------
  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentQuery(student.student_name);
    setSearchResults([]);

    loadLedger({ student_id: student.id });
  };

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const assignedColumns = ["fee_head", "amount"];
  const paymentColumns = ["receipt_no", "date", "amount", "mode"];
  const discountColumns = ["fee_head", "amount"];
  const fineColumns = ["fee_head", "amount"];

  const assignedFees = ledgerData?.data?.assigned_fees || [];
  const payments = ledgerData?.data?.payments || [];
  const discounts = ledgerData?.data?.discounts || [];
  const fines = ledgerData?.data?.fines || [];
  const summary = ledgerData?.data?.summary || {};

  return (
    <ReportContainer
      title="Student Ledger Report"
      filters={
        <ReportFilters className="student-ledger-filters">
          <div className="filter-field" style={{ width: "300px", position: "relative" }}>
            <label className="filter-label">Search Student</label>
            <input
              type="text"
              className="filter-input"
              value={studentQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Enter name or admission no"
            />

            {searchResults.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "70px",
                  left: 0,
                  width: "100%",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {searchResults.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    style={{
                      padding: "10px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {s.student_name} — {s.class_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ReportFilters>
      }
    >
      {/* -----------------------------
          STUDENT SUMMARY
      ------------------------------ */}
      {selectedStudent && (
        <div
          style={{
            background: "#fafafa",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #eee",
          }}
        >
          <h3 style={{ marginBottom: "10px", fontSize: "18px" }}>Student Details</h3>
          <p><strong>Name:</strong> {selectedStudent.student_name}</p>
          <p><strong>Class:</strong> {selectedStudent.class_name}</p>
          <p><strong>Admission No:</strong> {selectedStudent.student_id}</p>
        </div>
      )}

      {/* -----------------------------
          ASSIGNED FEES
      ------------------------------ */}
      <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>Assigned Fees</h3>
      <ReportTable columns={assignedColumns} data={assignedFees} />

      {/* -----------------------------
          PAYMENTS
      ------------------------------ */}
      <h3 style={{ marginTop: "30px", marginBottom: "10px" }}>Payments</h3>
      <ReportTable columns={paymentColumns} data={payments} />

      {/* -----------------------------
          SUMMARY
      ------------------------------ */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #eee",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>Summary</h3>
        <p><strong>Total Payable:</strong> ₹{summary.total_payable || 0}</p>
        <p><strong>Total Paid:</strong> ₹{summary.total_paid || 0}</p>
        <p><strong>Total Discount:</strong> ₹{summary.total_discount || 0}</p>
        <p><strong>Total Fine:</strong> ₹{summary.total_fine || 0}</p>
        <p><strong>Balance:</strong> ₹{summary.balance || 0}</p>
      </div>

      {loadingLedger && <p style={{ marginTop: 20 }}>Loading...</p>}
    </ReportContainer>
  );
}