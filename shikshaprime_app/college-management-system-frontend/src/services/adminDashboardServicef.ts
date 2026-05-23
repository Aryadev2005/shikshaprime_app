import apiClient from "./apiClient";

export interface AdminDashboardResponse {
  summary: {
    studentsCount: number;
    teachersCount: number;
    submittedAssignmentsCount: number;
    totalRevenue: number;
  };
  studentDistribution: {
    streamId: number | null;
    streamName: string | null;
    boysCount: number;
    girlsCount: number;
    totalCount: number;
    streamOptions: Array<{
      id: number;
      name: string;
      studentCount: number;
    }>;
  };
  teacherList: Array<{
    id: number;
    employee_id: string;
    name: string;
    department_name: string | null;
    phone: string | null;
  }>;
  notices: Array<{
    id: number;
    title: string;
    description: string | null;
    from_date: string;
    to_date: string;
  }>;
  attendance: {
    year: number;
    monthly: Array<{
      month: number;
      present: number;
      absent: number;
    }>;
  };
  earnings: {
    year: number;
    monthly: Array<{
      month: number;
      amount: number;
    }>;
  };
}

export async function getAdminDashboard(params?: {
  streamId?: number;
  attendanceYear?: number;
  earningsYear?: number;
}) {
  const { data } = await apiClient.get("/identity/dashboard/admin", { params });
  return {
    status: data.status,
    data: data.data as AdminDashboardResponse,
    message: data.message,
  };
}
