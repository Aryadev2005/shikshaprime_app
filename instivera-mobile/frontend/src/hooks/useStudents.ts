// TODO: wire to student-service API

export interface StudentProfile {
  gpa: string;
  attendance: number;
  streak: number;
  subjects: Array<{
    name: string;
    grade: string;
    pct: number;
    delta: string;
    down?: boolean;
  }>;
}

const STUB_PROFILE: StudentProfile = {
  gpa: 'A+',
  attendance: 91,
  streak: 12,
  subjects: [
    { name: 'Mathematics', grade: 'A', pct: 92, delta: '+3' },
    { name: 'Physics', grade: 'A−', pct: 88, delta: '+5' },
    { name: 'English Lit.', grade: 'B+', pct: 84, delta: '−1', down: true },
    { name: 'History', grade: 'A−', pct: 89, delta: '+2' },
  ],
};

export const useStudentProfile = (_studentId: string) => ({
  data: STUB_PROFILE,
  isLoading: false,
  isError: false,
});
