export interface Attendance {
    id: string;
    studentId: string;
    classId: string;
    date: Date;
    status: 'present' | 'absent' | 'late';
    remarks?: string;
}

export interface AttendanceRecord {
    id: string;
    attendance: Attendance[];
    createdAt: Date;
    updatedAt: Date;
}