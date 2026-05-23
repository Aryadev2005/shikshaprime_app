import { KnownRole } from "@/src/context/authContext";
import {
  LayoutDashboard,
  FileText,
  User,
  Users,
  BarChart,
  Settings,
  UserPlus
} from "lucide-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// SVG Icons
const Icons = { 
  Dashboard: `${basePath}/images/icons/dashboard-icon.svg`, 
  Admission: `${basePath}/images/icons/admission-icon.svg`, 
  Academy: `${basePath}/images/icons/academy-icon.svg`, 
  Payroll: `${basePath}/images/icons/payroll-icon.svg`, 
  Leave: `${basePath}/images/icons/leave-icon.svg`, 
  Exam: `${basePath}/images/icons/exam-routin-icon.svg`, 
  Student: `${basePath}/images/icons/student-icon.svg`, 
  Attendance: `${basePath}/images/icons/attendance-icon.svg`, 
  Faculty: `${basePath}/images/icons/faculty-icon.svg`, 
  Payment: `${basePath}/images/icons/payment-icon.svg`, 
  Communication: `${basePath}/images/icons/communication-icon.svg`, 
  Media: `${basePath}/images/icons/media-icon.svg`, 
  StudentAdmission: `${basePath}/images/icons/student-admission-icon.svg`, 
  StudentSelection: `${basePath}/images/icons/student-selection-icon.svg`, 
  StudentAssignment: `${basePath}/images/icons/assignment-icon.svg`, 
  StudentAttendence: `${basePath}/images/icons/student-attendence-icon.svg`, 
  CheckAssignment: `${basePath}/images/icons/check-assignment-icon.svg`, 
  notice: `${basePath}/images/icons/notice-icon.svg`, 
  assignmetListIcon: `${basePath}/images/icons/assignment-list.svg`, 
  FeesManagement: `${basePath}/images/icons/fees-management-icon.svg`,
  Finance: `${basePath}/images/icons/finance-icon.svg`,
};
const adminMenu = [
  { label: "Dashboard", path: "/dashboard/admin", icon: Icons.Dashboard },
  { label: "Teachers", path: "/admin/teachers", icon: Icons.Faculty },
  { label: "Students", path: "/admin/students", icon: Icons.Student },
  { label: "Payment", path: "/admin/payment", icon: Icons.Payment },
  { label: "Student Selection", path: "/admin/student-selection", icon: Icons.StudentSelection },
  { label: "Student Admission", path: "/admin/student-admission", icon: Icons.StudentAdmission },
  { label: "Staff Attendance", path: "/admin/staff-attendance", icon: Icons.Attendance },
  { label: "Examination Management", path: "/admin/examination", icon: Icons.Exam },
  { label: "Fees Management", path: "/admin/fees", icon: Icons.FeesManagement },
  { label: "Finance", path: "/admin/finance/dashboard", icon: Icons.Finance },
  { label: "Notices", path: "/admin/notices", icon: Icons.notice },
  // { label: "Administration", path: "/dashboard/administration", icon: Icons.Admission },
  // { label: "Academics", path: "/dashboard/academics", icon: Icons.Academy },
  // { label: "Payroll", path: "/dashboard/payroll", icon: Icons.Payroll },
  // { label: "Leave", path: "/dashboard/leave", icon: Icons.Leave },
  // { label: "Exam and Routine", path: "/dashboard/exam-routine", icon: Icons.Exam },
  // { label: "Communication", path: "/dashboard/communication", icon: Icons.Communication },
  // { label: "Media Showcase", path: "/dashboard/media-showcase", icon: Icons.Media },
  // { label: "Create Teacher", path: "/admin/create-teacher", icon: Icons.Faculty },
];

const teacherMenu = [
  { label: "Dashboard", path: "/dashboard/teacher", icon: Icons.Dashboard },
  { label: "Students", path: "/teacher/students", icon: Icons.Student },
  { label: "Student Attendance", path: "/teacher/student-attendance", icon: Icons.StudentAttendence },
  { label: "Assignment & Homework", path: "/teacher/assignment-homework", icon: Icons.assignmetListIcon },
  { label: "Assignment Check", path: "/teacher/assignment-check", icon: Icons.CheckAssignment },
   { label: "Examination Management", path: "/teacher/examination", icon: Icons.Exam },
];

const studentMenu = [
  { label: "Dashboard", path: "/dashboard/student", icon: Icons.Dashboard },
  { label: "Students Assignment", path: "/student/student-assignment", icon: Icons.StudentAssignment },
  { label: "View Attendance", path: "/student/view-attendance", icon: Icons.Attendance },
  { label: "My Payments", path: "/student/payment-dashboard", icon: Icons.Payment },
  { label: "Examination Management", path: "/student/examination", icon: Icons.Exam },
]

export const menuConfig: Partial<Record<KnownRole, { label: string; path: string; icon: any }[]>> = {
  admin: adminMenu,
  teacher: teacherMenu,
  student: studentMenu,
  offline: [
    ...adminMenu,
    // { label: "Student Registration", path: "/admin/student-registration-offline", icon: Icons.Admission },
  ],
};