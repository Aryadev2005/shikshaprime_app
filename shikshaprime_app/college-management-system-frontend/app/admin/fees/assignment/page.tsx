"use client";

import React, { useEffect, useState } from "react";
import "./fee-assignment.css";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import ConfirmModal from "@/src/components/global/ConfirmModal";
import { useApi } from "@/src/hooks/useApi";
import { useTenant } from "@/src/hooks/useTenant";
import { useAppSelector } from "@/src/store/hooks";

// ---- Services ----
import {
  getSemesters,
  getFeeParticulars,
  getStudentsByClass,
  assignFeesBulk,
} from "@/src/services/feeAssignmentService";
import { fetchAcademicYears, fetchLevelTwoDepartments } from "@/src/services/CommonService";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface DepartmentOption {
  id: number;
  code: string;
  name?: string;
}

interface AcademicYearOption {
  id: number;
  name?: string;
}

export default function FeeAssignmentPage() {

  // -----------------------------
  // REDUX MASTER DATA
  // -----------------------------
  //const { academicYears } = useAppSelector((state) => state.academic);
  const { programs } = useAppSelector((state) => state.programs);
  //const { departments } = useAppSelector((state) => state.departments);
  const { classes } = useAppSelector((state) => state.classes);

  const fetchDepartmentApi = useApi(fetchLevelTwoDepartments);
  const fetchAcademicYearApi = useApi(fetchAcademicYears);

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);

  // -----------------------------
  // FILTER STATES
  // -----------------------------
  const [academicYearId, setAcademicYearId] = useState<number | "">("");
  const [programId, setProgramId] = useState<number | "">("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [classId, setClassId] = useState<number | "">("");
  const [semesterId, setSemesterId] = useState<number | "">("");

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
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
    }
  };

  // -----------------------------
  // SEMESTERS
  // -----------------------------
  const [semesters, setSemesters] = useState<any[]>([]);
  const { call: fetchSemesters, loading: loadingSemesters } = useApi(getSemesters);

  // -----------------------------
  // STUDENTS + FEE HEADS
  // -----------------------------
  const [students, setStudents] = useState<any[]>([]);
  const [feeParticulars, setFeeParticulars] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  const { call: fetchFeeParticulars, loading: loadingParticulars } =
    useApi(getFeeParticulars);

  const { call: fetchStudents, loading: loadingStudents } =
    useApi(getStudentsByClass);

  const { call: assignFeesApi } = useApi(assignFeesBulk);

  const loading = loadingParticulars || loadingStudents || loadingSemesters;

  // -----------------------------
  // LOAD SEMESTERS WHEN PROGRAM + CLASS SELECTED
  // -----------------------------
  useEffect(() => {
    if (!programId || !classId) {
      setSemesters([]);
      setSemesterId("");
      return;
    }

    fetchSemesters({
      programId: Number(programId),
      classId: Number(classId),
    }).then((res) => {
      setSemesters(res?.data || []);
      setSemesterId("");
    });
  }, [programId, classId]);

  // -----------------------------
  // LOAD FEE PARTICULARS WHEN PROGRAM + YEAR + SEMESTER SELECTED
  // -----------------------------
  useEffect(() => {
    if (!programId || !academicYearId || !semesterId) return;

    fetchFeeParticulars({
      program_id: Number(programId),
      academic_year_id: Number(academicYearId),
      semester_id: Number(semesterId),
    }).then((res) => setFeeParticulars(res?.data || []));
  }, [programId, academicYearId, semesterId]);

  // -----------------------------
  // LOAD STUDENTS
  // -----------------------------
  const loadStudents = () => {
    if (!programId || !departmentId || !academicYearId || !classId) {
      toast.error("Please select all filters.");
      return;
    }

    fetchStudents({
      programId: Number(programId),
      departmentId: Number(departmentId),
      academicYearId: Number(academicYearId),
      classId: Number(classId),
    }).then((res) => {
      setStudents(res?.data || []);
      setSelectedStudentIds([]);
    });
  };

  // -----------------------------
  // STUDENT SELECTION
  // -----------------------------
  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  // -----------------------------
  // ASSIGN FEES
  // -----------------------------
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedFeeHeadIds, setSelectedFeeHeadIds] = useState<number[]>([]);

  const toggleFeeHead = (feeHeadId: number) => {
    setSelectedFeeHeadIds((prev) =>
      prev.includes(feeHeadId)
        ? prev.filter((id) => id !== feeHeadId)
        : [...prev, feeHeadId]
    );
  };

  const handleAssign = () => {
    if (!selectedStudentIds.length) {
      toast.error("Select at least one student.");
      return;
    }
    if (!semesterId) {
      toast.error("Please select a semester.");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmAssign = async () => {
    setIsAssigning(true);

    try {
      const payload = {
        academic_year_id: Number(academicYearId),
        program_id: Number(programId),
        department_id: Number(departmentId),
        class_id: Number(classId),
        semester_id: Number(semesterId),
        student_ids: selectedStudentIds,
        fee_items: feeParticulars
          .filter((p) => selectedFeeHeadIds.includes(p.fee_head_id))
          .map((p) => ({
            fee_head_id: p.fee_head_id,
            amount: p.amount
          })),
      };

      const res = await assignFeesApi(payload);
      toast.success(res?.message || "Fees assigned successfully.");
      setConfirmOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Fee assignment failed.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      {loading && <Loader />}

      <div className="fee-assignment-wrapper">
        {/* HEADER */}
        <div className="fee-header">
          <div className="flex items-center mb-3">
            <Link href={'/admin/fees'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link><h3 className="text-dark text-lg font-semibold">Fee Assignment</h3>
          </div>
          <Button className="assign-btn" onClick={handleAssign}>
            Assign Fees
          </Button>
        </div>

        {/* FILTERS */}
        <div className="fee-form-card">
          <div className="fee-grid">
            {/* Academic Year */}
            <div className="fee-form-group">
              <label className="fee-label">Academic Year</label>
              <select
                className="fee-input"
                value={academicYearId}
                onChange={(e) => setAcademicYearId(Number(e.target.value))}
              >
                <option value="">Select Year</option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Program */}
            <div className="fee-form-group">
              <label className="fee-label">Program</label>
              <select
                className="fee-input"
                value={programId}
                onChange={(e) => setProgramId(Number(e.target.value))}
              >
                <option value="">Select Program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="fee-form-group">
              <label className="fee-label">Department</label>
              <select
                className="fee-input"
                value={departmentId}
                onChange={(e) => setDepartmentId(Number(e.target.value))}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div className="fee-form-group">
              <label className="fee-label">Class / Year</label>
              <select
                className="fee-input"
                value={classId}
                onChange={(e) => setClassId(Number(e.target.value))}
              >
                <option value="">Select Year</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester (Conditional) */}
            {semesters.length > 0 && (
              <div className="fee-form-group">
                <label className="fee-label">Semester</label>
                <select
                  className="fee-input"
                  value={semesterId}
                  onChange={(e) => setSemesterId(Number(e.target.value))}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || `Semester ${s.semester_number}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button className="assign-btn mt-4" onClick={loadStudents}>
              Load Students & Fee Heads
            </Button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* STUDENTS TABLE */}
          <div className="md:col-span-2 fee-table-card">
            <h4 className="fee-table-title">Students</h4>

            <div style={{ overflowX: "auto" }}>
              <table className="custom-student-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="fee-checkbox"
                        checked={
                          students.length > 0 &&
                          selectedStudentIds.length === students.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>#</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Class/Year</th>
                  </tr>
                </thead>

                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="fee-empty-cell">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    students.map((s, idx) => (
                      <tr key={s.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="fee-checkbox"
                            checked={selectedStudentIds.includes(s.id)}
                            onChange={() => toggleStudent(s.id)}
                          />
                        </td>
                        <td>{idx + 1}</td>
                        <td>{s.student_id}</td>
                        <td style={{ fontWeight: 600 }}>{s.student_name}</td>
                        <td>{s.roll_number}</td>
                        <td>{classes.find((c) => c.id === s.class_id)?.name || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FEE HEADS TABLE */}
          <div className="fee-table-card">
            <h4 className="fee-table-title">Fee Heads</h4>

            <div style={{ overflowX: "auto" }}>
              <table className="custom-student-table">
                <thead>
                  <tr>
                    <th>Fee Head</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {feeParticulars.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="fee-empty-cell">
                        No fee particulars found.
                      </td>
                    </tr>
                  ) : (
                    feeParticulars.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="fee-checkbox"
                            checked={selectedFeeHeadIds.includes(p.fee_head_id)}
                            onChange={() => toggleFeeHead(p.fee_head_id)}
                          />
                        </td>
                        <td>{p.fee_head?.name}</td>
                        <td>₹{p.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAssign}
        isLoading={isAssigning}
        message={`Assign fees to ${selectedStudentIds.length} student(s)?`}
      />
    </>
  );
}