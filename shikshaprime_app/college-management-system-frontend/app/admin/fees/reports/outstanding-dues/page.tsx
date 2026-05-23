"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/src/hooks/useApi";
import { useAppSelector } from "@/src/store/hooks";

import { getOutstandingDues } from "@/src/services/feeReportService";
import { fetchAcademicYears, fetchLevelTwoDepartments } from "@/src/services/CommonService";
import ReportContainer from "@/components/ui/reports/ReportContainer";
import ReportFilters from "@/components/ui/reports/ReportFilters";
import SelectFilter from "@/components/ui/reports/SelectFilter";
import ReportTable from "@/components/ui/reports/ReportTable";

export default function OutstandingDuesReport() {
  // -----------------------------
  // REDUX MASTER DATA
  // -----------------------------
  const { programs } = useAppSelector((state) => state.programs);
  const { classes } = useAppSelector((state) => state.classes);

  const programOptions = programs.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  // -----------------------------
  // API HOOKS
  // -----------------------------
  const fetchDepartmentApi = useApi(fetchLevelTwoDepartments);
  const fetchAcademicYearApi = useApi(fetchAcademicYears);

  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // -----------------------------
  // FILTER STATES
  // -----------------------------
  const [programId, setProgramId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");

  // -----------------------------
  // LOAD DEPARTMENTS + ACADEMIC YEARS
  // -----------------------------
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const deptRes = await fetchDepartmentApi.call();
      if (deptRes.status === 1) {
        setDepartments(
          (deptRes.data || []).map((d) => ({
            value: d.id,
            label: d.name || d.code,
          }))
        );
      }

      const acyRes = await fetchAcademicYearApi.call();
      if (acyRes.status === 1) {
        setAcademicYears(
          (acyRes.data || []).map((a) => ({
            value: a.id,
            label: a.name,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading filters", err);
    }
  };

  // -----------------------------
  // LOAD REPORT
  // -----------------------------
  const {
    data,
    loading,
    call: loadReport,
  } = useApi(getOutstandingDues);

  useEffect(() => {
    if (!programId || !departmentId || !academicYearId || !classId) return;

    loadReport({
      program_id: programId,
      department_id: departmentId,
      academic_year_id: academicYearId,
      class_id: classId,
    });
  }, [programId, departmentId, academicYearId, classId]);

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columns = [
    "student_name",
    "student_id",
    "class_name",
    "total_payable",
    "total_paid",
    "balance",
  ];

  return (
    <ReportContainer
      title="Outstanding Dues Report"
      filters={
        <ReportFilters className="outstanding-dues-filters">

          <SelectFilter
            label="Program"
            value={programId}
            onChange={setProgramId}
            options={programOptions}
          />

          <SelectFilter
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={departments}
          />

          <SelectFilter
            label="Academic Year"
            value={academicYearId}
            onChange={setAcademicYearId}
            options={academicYears}
          />

          <SelectFilter
            label="Year / Class"
            value={classId}
            onChange={setClassId}
            options={classOptions}
          />

        </ReportFilters>
      }
    >
      <ReportTable columns={columns} data={data?.data || []} />

      {loading && <p style={{ marginTop: 20 }}>Loading...</p>}
    </ReportContainer>
  );
}
