import { ClassStudent, AttendanceStatus } from '../types/attendance';

export type AttendanceStackParamList = {
  StudentAttendance: undefined;
  TeacherHome: undefined;
  AttendanceTaker: { classId: string; date: string; className?: string };
  AttendanceReview: {
    students: ClassStudent[];
    markings: Record<string, AttendanceStatus>;
    date: string;
    classId: string;
  };
};

export type AssignmentsStackParamList = {
  AssignmentsList: undefined;
  AssignmentDetail: { id: string };
  CreateAssignment: undefined;
};

export type FeesStackParamList = {
  Fees: undefined;
  PaymentWebView: { redirectUrl: string; paymentId: string; amount: number };
};

/** @deprecated use AttendanceStackParamList */
export type AppStackParamList = AttendanceStackParamList;
