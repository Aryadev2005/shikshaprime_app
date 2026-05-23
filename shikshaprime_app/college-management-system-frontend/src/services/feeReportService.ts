import apiClient from "./apiClient";

export async function getDailyCollection(params: any) {
  const { data } = await apiClient.get("/fees-management/reports/daily-collection", {
    params,
  });

  return {
    status: data.status,
    data: data.data,
    message: data.message,
  };
}
export async function getHeadwiseCollection(params) {
  const { data } = await apiClient.get("/fees-management/reports/headwise-collection", {
    params,
  });

  return {
    status: data.status,
    data: data.data,
    message: data.message,
  };
}
/* ============================================================
   GET STUDENT LEDGER
   ============================================================ */
export async function getStudentLedger(params: { student_id: number }) {
  const { data } = await apiClient.get("/fees-management/reports/student-ledger", {
    params,
  });

  return {
    status: data.status,
    data: data.data,
    message: data.message,
  };
}
/* ============================================================
   OUTSTANDING DUES REPORT
   ============================================================ */
export async function getOutstandingDues(params: {
  program_id: number | string;
  department_id: number | string;
  academic_year_id: number | string;
  class_id: number | string;
}) {
  const { data } = await apiClient.get("/fees-management/reports/outstanding-dues", {
    params,
  });

  return {
    status: data.status,
    data: data.data,
    message: data.message,
  };
}