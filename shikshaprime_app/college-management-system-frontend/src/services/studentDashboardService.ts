import apiClient from "./apiClient";

export interface StudentDashboardResponse {
  summary: {
    studentsCount: number;
    teachersCount: number;
    submittedAssignmentsCount: number;
    totalRevenue: number;
    upcomingFees: number;
    paidThisTerm: number;
    pendingPaymentCount: number;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
  };
  recentPaidFee: {
    payment_id: number;
    payment_type_name: string;
    amount: number;
    paid_amount: number;
    paid_date: string | null;
    updated_at: string | null;
  } | null;
  pendingAssignments: Array<{
    id: number;
    title: string;
    subject_name: string | null;
    type: string | null;
    due_date: string | null;
    allow_late_submissions: boolean | number;
    status: "Pending" | "Overdue" | "Submitted";
  }>;
  subjects: Array<{
    id: number;
    code: string | null;
    name: string;
    description: string | null;
  }>;
  notices: Array<{
    id: number;
    title: string;
    description: string | null;
    from_date: string;
    to_date: string;
  }>;
  gradedAssignments: Array<{
    submission_id: number;
    assignment_id: number;
    assignment_title: string;
    subject_name: string | null;
    grade: string | null;
    marks_obtained: number | null;
    feedback: string | null;
    graded_at: string | null;
  }>;
}

export async function getStudentDashboard() {
  const { data } = await apiClient.get("/student/me/dashboard");
  return {
    status: data.status,
    data: data.data as StudentDashboardResponse,
    message: data.message,
  };
}
