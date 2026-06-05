import { ClassStudent, AttendanceStatus } from '../types/attendance';

export type AuthStackParamList = {
  Login: { tenant?: string; institutionName?: string; institutionType?: 'school' | 'college' } | undefined;
  OTP: { email: string };
  SignUp: { tenant: string; institutionName: string; institutionType: 'school' | 'college' };
  RegistrationSuccess: { regId: string; institutionName: string };
  RegistrationStatus: { regId?: string };
};

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
  StudentHub: { studentId: string; studentName: string; roll: string };
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

export type ChatStackParamList = {
  Conversations: undefined;
  ChatRoom: { conversationId: number; name: string };
};

export type CalendarStackParamList = {
  Calendar: undefined;
};

/** @deprecated use AttendanceStackParamList */
export type AppStackParamList = AttendanceStackParamList;
