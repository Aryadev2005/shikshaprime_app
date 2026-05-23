import apiClient from "./apiClient";

export interface TeacherDashboardResponse {
  summary: {
    totalStudents: number;
    myClasses: number;
    submittedAssignments: number;
    classAverageGrade: number;
  };
  attendanceOverview: {
    presentToday: number;
    excusedToday: number;
    absentToday: number;
    averageAttendance: number;
  };
  assignmentProgress: Array<{
    label: string;
    checked: number;
    pendingReview: number;
    late: number;
  }>;
  attendanceTrend: Array<{
    label: string;
    attendance: number;
  }>;
  rosters: Array<{
    id: number;
    section: string;
    subject: string;
    rosterCount: number;
    programName: string;
  }>;
  recentClasses: Array<{
    id: number;
    title: string;
    description: string;
    subjectName: string;
    className: string;
  }>;
  submissionHeatmap: Array<{
    classLabel: string;
    days: {
      Su: number;
      M: number;
      Tu: number;
      We: number;
      Th: number;
      Fr: number;
      Sa: number;
    };
  }>;
}

export async function getTeacherDashboard() {
  const { data } = await apiClient.get("/teacher/dashboard/teacher");
  return {
    status: data.status,
    data: data.data as TeacherDashboardResponse,
    message: data.message,
  };
}
