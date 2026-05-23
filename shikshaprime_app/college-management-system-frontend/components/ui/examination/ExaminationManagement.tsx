'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useApi } from '@/src/hooks/useApi';
import { assignExaminer, calculateResults, createExamination, createQuestion, deleteQuestion, 
  finaliseResults, getAdminExamSummary, getAllExams, getAssignedExaminers, getEligibleExaminers, 
  getExamResults, 
  getQuestionsByExam, getResultsForExam, publishResults } from '@/src/services/examinationService';
import { checkRoomAvailability, createExamSchedule, getAllScheduledExams } from '@/src/services/examScheduleService';
import ExamComponentEditor from './ExamComponentEditor';
import { fetchAcademicYears, fetchClasses, fetchLevelTwoDepartments, fetchPrograms } from '@/src/services/CommonService';
import { fetchSubjects } from '@/src/services/departmentService';
import { getSemesters } from '@/src/services/feeAssignmentService';
import { getTeachers } from '@/src/services/teacherService';
import { StringDecoder } from 'node:string_decoder';
import { Loader } from '../loader';


// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

type ExamType = 'INTERNAL' | 'MIDTERM' | 'FINAL';
type QuestionType = 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER';
type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
type ResultStatus = 'PENDING' | 'EVALUATED' | 'PUBLISHED';

interface Exam {
  id: string;
  exam_name: string;
  subject_id: string;
  semester: string;
  exam_type: ExamType;
  total_marks: number;
  duration_minutes: number;
  is_active: boolean;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  difficulty_level: DifficultyLevel;
  sequence: number;
  created_by: string;
  created_at?: string;
}

interface ExamSchedule {
  id: string;
  exam_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  venue?: string;
  invigilator_id?: string;
  invigilator_name: string;
  total_seats?: number;
  is_cancelled: boolean;
  created_at?: string;
}

interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  status: ResultStatus;
  evaluator_id?: string;
  created_at?: string;
  updated_at?: string;
}



function calculateGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-green-600 font-bold' };
  if (percentage >= 80) return { grade: 'A', color: 'text-teal-600' };
  if (percentage >= 60) return { grade: 'B+', color: 'text-blue-600' };
  if (percentage >= 40) return { grade: 'C', color: 'text-yellow-600' };
  return { grade: 'F', color: 'text-red-600 font-bold' };
}

function truncateText(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  } catch {
    return time;
  }
}

function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADERS
// ─────────────────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 bg-gray-200 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-green-300' : 'border-red-300';

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} ${textColor} ${borderColor} border px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-fadeInDown`}
    >
      {type === 'success' ? (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-lg font-bold hover:opacity-70"
      >
        ×
      </button>
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg flex items-start justify-between">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm">{message}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-600 hover:text-red-800 shrink-0"
      >
        ×
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: EXAM COMPONENT BUILDER (QUESTION BANK UI)
// ─────────────────────────────────────────────────────────────────────────────

interface QuestionBankProps {
  exams: Exam[];
  loadingExams: boolean;
}

function QuestionBank({ exams, loadingExams }: QuestionBankProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'MCQ' as QuestionType,
    marks: 1,
    difficulty_level: 'MEDIUM' as DifficultyLevel,
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
  });

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { call: getQuestions } = useApi(getQuestionsByExam);
  const { call: createQuestionForExam } = useApi(createQuestion);
  const { call: deleteQuestionById } = useApi(deleteQuestion);

  const nextSequence = useMemo(() => {
    return questions.length > 0
      ? Math.max(...questions.map((q) => q.sequence)) + 1
      : 1;
  }, [questions]);

  useEffect(() => {
    if (selectedExamId) {
      setLoadingQuestions(true);
      setQuestionError(null);
      getQuestions(selectedExamId).then((res) => {
          setQuestions(res.data || []);
        })
        .catch((err) => {
          setQuestionError(err.message);
        })
        .finally(() => {
          setLoadingQuestions(false);
        });
    } else {
      setQuestions([]);
    }
  }, [selectedExamId]);

  const handleInputChange = useCallback(
    (
      field: keyof typeof formData,
      value: any
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );  

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!selectedExamId) {
        setFormError('Please select an exam');
        return;
      }

      if (!formData.question_text.trim()) {
        setFormError('Question text is required');
        return;
      }

      if (formData.marks < 1) {
        setFormError('Marks must be at least 1');
        return;
      }

      if (
        formData.question_type === 'MCQ' &&
        (!formData.option_a ||
          !formData.option_b ||
          !formData.option_c ||
          !formData.option_d)
      ) {
        setFormError('All MCQ options are required');
        return;
      }

      setLoadingSubmit(true);

      try {
        const payload: any = {
          exam_id: selectedExamId,
          question_text: formData.question_text,
          question_type: formData.question_type,
          marks: formData.marks,
          difficulty_level: formData.difficulty_level,
          sequence: nextSequence,
        };

        if (formData.question_type === 'MCQ') {
          payload.option_a = formData.option_a;
          payload.option_b = formData.option_b;
          payload.option_c = formData.option_c;
          payload.option_d = formData.option_d;
          payload.correct_answer = formData.correct_answer;
        }

        await createQuestionForExam(payload);
        setSuccessMessage('Question created successfully');
        setFormData({
          question_text: '',
          question_type: 'MCQ',
          marks: 1,
          difficulty_level: 'MEDIUM',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'A',
        });

        const res = await getQuestions(selectedExamId);        
        setQuestions(res.data || []);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to create question');
      } finally {
        setLoadingSubmit(false);
      }
    },
    [selectedExamId, formData, nextSequence]
  );

  const handleDeleteQuestion = useCallback(
    async (questionId: string) => {
      setLoadingSubmit(true);
      try {
        await deleteQuestionById(questionId);
        setSuccessMessage('Question deleted successfully');
        setDeleteConfirm(null);

        const res = await getQuestions(selectedExamId);
        setQuestions(res.data || []);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to delete question');
      } finally {
        setLoadingSubmit(false);
      }
    },
    [selectedExamId]
  );

  const getDifficultyColor = (level: DifficultyLevel): string => {
    switch (level) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Question Bank
        </h2>

        {formError && (
          <ErrorBanner
            message={formError}
            onDismiss={() => setFormError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam *
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingExams}
            >
              <option value="">Choose an exam...</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_name} ({exam.exam_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) =>
                handleInputChange('question_text', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter the question..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={formData.question_type}
                onChange={(e) =>
                  handleInputChange('question_type', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MCQ">MCQ</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="LONG_ANSWER">Long Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marks *
              </label>
              <input
                type="number"
                min="1"
                value={formData.marks}
                onChange={(e) =>
                  handleInputChange('marks', parseInt(e.target.value) || 1)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level *
              </label>
              <select
                value={formData.difficulty_level}
                onChange={(e) =>
                  handleInputChange('difficulty_level', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {formData.question_type === 'MCQ' && (
            <>
              <fieldset className="border-l-4 border-blue-300 pl-4 py-4">
                <legend className="text-sm font-medium text-gray-700 mb-3">
                  MCQ Options
                </legend>
                <div className="space-y-3">
                  {['option_a', 'option_b', 'option_c', 'option_d'].map(
                    (opt) => (
                      <div key={opt} className="flex gap-2">
                        <span className="text-sm font-medium text-gray-600 w-12 pt-2">
                          {opt.split('_')[1].toUpperCase()}:
                        </span>
                        <input
                          type="text"
                          value={
                            formData[opt as keyof typeof formData] as string
                          }
                          onChange={(e) =>
                            handleInputChange(opt as keyof typeof formData, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Enter option ${opt.split('_')[1].toUpperCase()}`}
                        />
                      </div>
                    )
                  )}
                </div>
              </fieldset>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer *
                </label>
                <select
                  value={formData.correct_answer}
                  onChange={(e) =>
                    handleInputChange('correct_answer', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loadingSubmit || !selectedExamId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loadingSubmit && (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {loadingSubmit ? 'Creating...' : 'Add Question'}
          </button>
        </form>
      </div>

      {selectedExamId && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Questions ({questions.length})
          </h3>

          {questionError && (
            <ErrorBanner
              message={questionError}
              onDismiss={() => setQuestionError(null)}
            />
          )}

          {loadingQuestions ? (
            <TableSkeleton />
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <span className="text-4xl mb-3">✏️</span>
              <p>No questions added yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Marks
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Difficulty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {questions.map((q, idx) => (
                    <tr
                      key={q.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {truncateText(q.question_text, 60)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {q.question_type === 'SHORT_ANSWER'
                          ? 'Short'
                          : q.question_type === 'LONG_ANSWER'
                            ? 'Long'
                            : 'MCQ'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        {q.marks}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(q.difficulty_level)}`}
                        >
                          {q.difficulty_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {deleteConfirm === q.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              disabled={loadingSubmit}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              disabled={loadingSubmit}
                              className="px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs rounded disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(q.id)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: EXAM CREATION UI
// ─────────────────────────────────────────────────────────────────────────────

interface ExamCreationProps {
  exams: Exam[];
  loadingExams: boolean;
  onExamCreated: () => void;
}

function ExamCreation({ exams, loadingExams, onExamCreated }: ExamCreationProps) {
  const [formData, setFormData] = useState({
    exam_name: '',
    department_id: '',
    program_id: '',
    academic_year_id: '',
    class_id: '',
    subject_id: '',
    semester_id: '',
    exam_type: 'INTERNAL' as ExamType,
    total_marks: 100,
    duration_minutes: 120,
    is_active: true,
  });

  const [filterType, setFilterType] = useState<ExamType | ''>('');
  const [filterSemester, setFilterSemester] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const { call: createExam } = useApi(createExamination);

  // Load form data (departments, classes, academic years)
      useEffect(() => {
          const loadFormData = async () => {
              //setIsLoading(true);
              setFormError("");
              try {
                  const [deptRes, progRes, classRes, yearRes] = await Promise.all([
                      fetchLevelTwoDepartments(),
                      fetchPrograms(),
                      fetchClasses(),
                      fetchAcademicYears(),
                  ]);
  
                  if (deptRes.status === 1 || deptRes.data) {
                      setDepartments(deptRes.data || []);
                  }
                  if (progRes.status === 1 || progRes.data) {
                      setPrograms(progRes.data || []);
                  }
                  if (classRes.status === "success" || classRes.data) {
                      setClasses(classRes.data || []);
                  }
                  if (yearRes.status === "success" || yearRes.data) {
                      setAcademicYears(yearRes.data || []);
                  }
              } catch (error: any) {
                  console.error("Failed to load form data:", error);
                  setFormError("Failed to load form data");
              } finally {
                  //setIsLoading(false);
              }
          };  
          loadFormData();
      }, []);

  // Load Subjects when Child changes
      useEffect(() => {
          if (formData.department_id) {
              fetchSubjects(Number(formData.department_id)).then((data) => {
                  if (data.status === 1) {
                      setSubjects(data.data || []);
                  }
              }).catch(console.error);
          }
      }, [formData.department_id]);
      useEffect(() => {
          if (formData.program_id && formData.class_id) {
              getSemesters({ programId: Number(formData.program_id), 
                classId: Number(formData.class_id)}).then((data) => {
                  if (data.status === 1) {
                      setSemesters(data.data || []);
                  }
              }).catch(console.error);
          }
      }, [formData.program_id, formData.class_id]);



  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (filterType && exam.exam_type !== filterType) return false;
      if (
        filterSemester &&
        !exam.semester.toLowerCase().includes(filterSemester.toLowerCase())
      )
        return false;
      return true;
    });
  }, [exams, filterType, filterSemester]);

  const handleInputChange = useCallback(
    (field: keyof typeof formData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!formData.exam_name.trim()) {
        setFormError('Exam name is required');
        return;
      }

      if (!formData.subject_id.trim()) {
        setFormError('Subject ID is required');
        return;
      }

      if (!formData.semester_id.trim()) {
        setFormError('Semester is required');
        return;
      }

      if (formData.total_marks < 1) {
        setFormError('Total marks must be at least 1');
        return;
      }

      if (formData.duration_minutes < 1) {
        setFormError('Duration must be at least 1 minute');
        return;
      }

      setLoadingSubmit(true);

      try {
        await createExam(formData);
        setSuccessMessage('Exam created successfully');
        setFormData({
          exam_name: '',
          department_id: '',
          program_id:'',
          academic_year_id: '',
          class_id:'',
          subject_id: '',
          semester_id: '',
          exam_type: 'INTERNAL',
          total_marks: 100,
          duration_minutes: 120,
          is_active: true,
        });

        onExamCreated();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to create exam');
      } finally {
        setLoadingSubmit(false);
      }
    },
    [formData, onExamCreated]
  );

  const examTypes = ['INTERNAL', 'MIDTERM', 'FINAL'] as const;
  const uniqueSemesters = Array.from(
    new Set(exams.map((e) => e.semester))
  ).sort();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Create Exam
        </h2>

        {formError && (
          <ErrorBanner
            message={formError}
            onDismiss={() => setFormError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name *
              </label>
              <input
                type="text"
                value={formData.exam_name}
                onChange={(e) =>
                  handleInputChange('exam_name', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Final Exam - Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>                                        
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData.department_id} onChange={(e) =>
                  handleInputChange('department_id', e.target.value)
              }>
                  <option value="">Select Department</option>
                  {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                          {dept.name}
                      </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program
              </label>                                        
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData.program_id} onChange={(e) =>
                  handleInputChange('program_id', e.target.value)
              }>
                  <option value="">Select Program</option>
                  {programs.map((pg: any) => (
                      <option key={pg.id} value={pg.id}>
                          {pg.name}
                      </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>                                        
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData.academic_year_id} onChange={(e) =>
                  handleInputChange('academic_year_id', e.target.value)
              }>
                  <option value="">Select Academic Year</option>
                  {academicYears.map((ac: any) => (
                      <option key={ac.id} value={ac.id}>
                          {ac.name}
                      </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year (Class)
              </label>                                        
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData.class_id} onChange={(e) =>
                  handleInputChange('class_id', e.target.value)
              }>
                  <option value="">Select Year (Class)</option>
                  {classes.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>
                          {cls.name}
                      </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>                                        
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData.subject_id} onChange={(e) =>
                  handleInputChange('subject_id', e.target.value)
              }>
                  <option value="">Select Subject</option>
                  {subjects.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                          {sub.name}
                      </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>                                        
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData.semester_id} onChange={(e) =>
                  handleInputChange('semester_id', e.target.value)
              }>
                  <option value="">Select Semester</option>
                  {semesters.map((sem: any) => (
                      <option key={sem.id} value={sem.id}>
                          {sem.name}
                      </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type *
              </label>
              <select
                value={formData.exam_type}
                onChange={(e) =>
                  handleInputChange('exam_type', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {examTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Marks *
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_marks}
                onChange={(e) =>
                  handleInputChange('total_marks', parseInt(e.target.value) || 100)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) =>
                  handleInputChange('duration_minutes', parseInt(e.target.value) || 120)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                handleInputChange('is_active', e.target.checked)
              }
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700"
            >
              Is Active
            </label>
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loadingSubmit && (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {loadingSubmit ? 'Creating...' : 'Create Exam'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">All Exams</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ExamType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Semester
            </label>
            <input
              type="text"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search semester..."
            />
          </div>
        </div>

        {loadingExams ? (
          <CardSkeleton />
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-4xl mb-3">📋</span>
            <p>No exams created yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg text-gray-800">
                    {exam.exam_name}
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${exam.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {exam.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Type</p>
                    <p className="font-medium text-gray-800">{exam.exam_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Marks</p>
                    <p className="font-medium text-gray-800">
                      {exam.total_marks}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-medium text-gray-800">
                      {exam.duration_minutes} min
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Semester</p>
                    <p className="font-medium text-gray-800">
                      {exam.semester}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: SCHEDULE EXAM UI
// ─────────────────────────────────────────────────────────────────────────────

interface ScheduleExamProps {
  exams: Exam[];
  loadingExams: boolean;
}

function ScheduleExam({ exams, loadingExams }: ScheduleExamProps) {
  const [formData, setFormData] = useState({
    exam_id: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    invigilator_id: '',
    total_seats: ''
  });

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [filterExamId, setFilterExamId] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [invigilators, setInvigilators] = useState<any[]>([]);
  const [roomAvailability, setRoomAvailability] = useState(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  const { call: getExamSchedules } = useApi(getAllScheduledExams);
  const { call: createScheduleForExam } = useApi(createExamSchedule);
  const { call: checkExamRoomAvailability } = useApi(checkRoomAvailability);
  const { call: getAllTeachers } = useApi(getTeachers);
  const activeExams = useMemo(
    () => exams.filter((e) => e.is_active),
    [exams]
  );
  const fetchTeachers = async (page: number = 1) => {
        try {
            const response = await getAllTeachers();
            if (response?.data?.rows) {
                setInvigilators(response.data.rows);
            } else {
                setInvigilators([]);                
            }
        } catch (err) {
            console.error("Error fetching teachers:", err);
            setInvigilators([]);
        } finally {
        }
    };

  useEffect(() => {
    setLoadingSchedules(true);
    setListError(null);
    fetchTeachers(1);
    getExamSchedules()
      .then((res) => {
        const data = res.data || [];
        const sorted = data.sort(
          (a, b) =>
            new Date(a.scheduled_date).getTime() -
            new Date(b.scheduled_date).getTime()
        );
        setSchedules(sorted);
      })
      .catch((err) => {
        setListError(err.message);
      })
      .finally(() => {
        setLoadingSchedules(false);
      });
  }, []);

  const filteredSchedules = useMemo(() => {
    if (!filterExamId) return schedules;
    return schedules.filter((s) => s.exam_id.toString() === filterExamId);
  }, [schedules, filterExamId]);

  const getExamName = (examId: string): string => {
    return exams.find((e) => e.id === examId)?.exam_name || examId;
  };

  const handleInputChange = useCallback(
    (field: keyof typeof formData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!formData.exam_id) {
        setFormError('Please select an exam');
        return;
      }

      if (!formData.scheduled_date) {
        setFormError('Please select a date');
        return;
      }

      if (!formData.start_time) {
        setFormError('Please select a start time');
        return;
      }

      if (!formData.end_time) {
        setFormError('Please select an end time');
        return;
      }

      if (formData.end_time <= formData.start_time) {
        setFormError('End time must be after start time');
        return;
      }

      setLoadingSubmit(true);

      try {
        await createScheduleForExam(formData);
        setSuccessMessage('Schedule created successfully');
        setFormData({
          exam_id: '',
          scheduled_date: '',
          start_time: '',
          end_time: '',
          venue: '',
          invigilator_id: '',
          total_seats: ''
        });

        const res = await getAllScheduledExams();
        const data = res.data || [];
        const sorted = data.sort(
          (a, b) =>
            new Date(a.scheduled_date).getTime() -
            new Date(b.scheduled_date).getTime()
        );
        setSchedules(sorted);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : 'Failed to create schedule'
        );
      } finally {
        setLoadingSubmit(false);
      }
    },
    [formData]
  );
  async function checkAvailableRoom() {
    const { scheduled_date, start_time, end_time, venue } = formData;

    // Only check when all fields are filled
    if (!scheduled_date || !start_time || !end_time || !venue) {
      setRoomAvailability(null);
      return;
    }
    try {
      setCheckingRoom(true);
      const response = await checkExamRoomAvailability(formData);
      setRoomAvailability(response.data);
    } catch (error) {
      setRoomAvailability({
        available: false,
        error: "Unable to check room availability",
      });
    } finally {
      setCheckingRoom(false);
    }
  }
  useEffect(() => {
    checkAvailableRoom();
  }, [formData.scheduled_date, formData.start_time, formData.end_time, formData.venue]);



  return (
    <div className="space-y-6">
      {/* Schedule Exam Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Schedule Exam</h2>

        {formError && (
          <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Exam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam *
            </label>
            <select
              value={formData.exam_id}
              onChange={(e) => handleInputChange("exam_id", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingExams}
            >
              <option value="">Choose an exam...</option>
              {activeExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_name} ({exam.exam_type})
                </option>
              ))}
            </select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  handleInputChange("scheduled_date", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Start + End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange("start_time", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange("end_time", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => handleInputChange("venue", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Hall A"
            />
          </div>
          {/* Room Availability Indicator (placeholder for API integration) */}
          {roomAvailability && (
            <div className="mt-2 flex items-center gap-2">
              {checkingRoom ? (
                <span className="text-gray-600 text-sm">Checking room availability…</span>
              ) : roomAvailability.available ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-300">
                  ✓ Room Available
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-300">
                  ✕ Room Not Available
                </span>
              )}
            </div>
          )}

          {/* Total Seats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Seats *
            </label>
            <input
              type="number"
              value={formData.total_seats}
              onChange={(e) => handleInputChange("total_seats", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 60"
            />
          </div>

          {/* Invigilator */}          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invigilator
            </label>
            <select
              value={formData.invigilator_id}
              onChange={(e) => handleInputChange("invigilator_id", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingExams}
            >
              <option value="">Choose an Invigilator...</option>
              {invigilators.map((invigilator) => (
                <option key={invigilator.id} value={invigilator.id}>
                  {invigilator.first_name} {invigilator.last_name}
                </option>
              ))}
            </select>            
          </div>          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loadingSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loadingSubmit && (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {loadingSubmit ? "Scheduling..." : "Schedule Exam"}
          </button>
        </form>
      </div>

      {/* Exam Schedules List */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Exam Schedules</h3>

        {listError && (
          <ErrorBanner message={listError} onDismiss={() => setListError(null)} />
        )}

        {/* Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Exam
          </label>
          <select
            value={filterExamId}
            onChange={(e) => setFilterExamId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Exams</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.exam_name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loadingSchedules ? (
          <TableSkeleton />
        ) : filteredSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-4xl mb-3">📅</span>
            <p>No schedules yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Exam Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Venue
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Invigilator
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSchedules.map((schedule) => (
                  <tr
                    key={schedule.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {getExamName(schedule.exam_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(schedule.scheduled_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTime(schedule.start_time)} –{" "}
                      {formatTime(schedule.end_time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {schedule.venue || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {schedule.invigilator_name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: ASSIGN EXAMINER UI
// ─────────────────────────────────────────────────────────────────────────────

interface AdminAssignExaminerProps {
  exams: Exam[];
  loadingExams: boolean;
}

function AdminAssignExaminer({
  exams,
  loadingExams,
}: AdminAssignExaminerProps) {
  const [formData, setFormData] = useState({
    exam_id: "",
    role: "PRIMARY",
    teacher_id: "",
    external_name: "",
    external_email: "",
    external_mobile: "",
    external_institution: "",
  });

  const [eligibleTeachers, setEligibleTeachers] = useState<any[]>([]);
  const [assignedExaminers, setAssignedExaminers] = useState<any[]>([]);

  const [loadingEligible, setLoadingEligible] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { call: fetchEligible } = useApi(getEligibleExaminers);
  const { call: assign } = useApi(assignExaminer);
  const { call: fetchAssigned } = useApi(getAssignedExaminers);

  const handleInputChange = useCallback(
    (field: keyof typeof formData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleExamChange = useCallback(
    async (examId: string) => {
      handleInputChange("exam_id", examId);

      if (!examId) return;

      // Fetch eligible internal examiners
      setLoadingEligible(true);
      try {
        const response = await fetchEligible(examId);
        setEligibleTeachers(response.data);
      } catch (err) {
        setFormError("Failed to load eligible examiners");
      } finally {
        setLoadingEligible(false);
      }

      // Fetch already assigned examiners
      setLoadingAssigned(true);
      try {
        const response = await fetchAssigned(examId);
        setAssignedExaminers(response.data);
      } catch (err) {
        setFormError("Failed to load assigned examiners");
      } finally {
        setLoadingAssigned(false);
      }
    },
    [fetchEligible, fetchAssigned, handleInputChange]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!formData.exam_id) {
        setFormError("Please select an exam");
        return;
      }

      if (formData.role !== "EXTERNAL" && !formData.teacher_id) {
        setFormError("Please select an internal examiner");
        return;
      }

      if (formData.role === "EXTERNAL" && !formData.external_name.trim()) {
        setFormError("External examiner name is required");
        return;
      }
      setLoadingSubmit(true);
      try {
        await assign(formData.exam_id, formData);
        setSuccessMessage("Examiner assigned successfully");
        // Refresh assigned list
        const response = await fetchAssigned(formData.exam_id);
        setAssignedExaminers(response.data);

        // Reset form
        setFormData({
          exam_id: formData.exam_id,
          role: "PRIMARY",
          teacher_id: "",
          external_name: "",
          external_email: "",
          external_mobile: "",
          external_institution: "",
        });
      } catch (err: any) {
        setFormError(err.message || "Failed to assign examiner");
      } finally {
        setLoadingSubmit(false);
      }
    },
    [formData, assign, fetchAssigned]
  );

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Assign Examiner
        </h2>

        {formError && (
          <ErrorBanner
            message={formError}
            onDismiss={() => setFormError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exam Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam *
            </label>
            <select
              value={formData.exam_id}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loadingExams}
            >
              <option value="">Choose an exam...</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Examiner Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="PRIMARY">Primary Examiner</option>
              <option value="SECONDARY">Secondary Examiner</option>
              <option value="EXTERNAL">External Examiner</option>
            </select>
          </div>

          {/* Internal Examiner Dropdown */}
          {formData.role !== "EXTERNAL" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Internal Examiner *
              </label>
              <select
                value={formData.teacher_id}
                onChange={(e) =>
                  handleInputChange("teacher_id", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loadingEligible}
              >
                <option value="">Choose a teacher...</option>
                {eligibleTeachers.map((t) => (
                  <option key={t.teacher_id} value={t.teacher_id}>
                    {t.teacher_name} ({t.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* External Examiner Fields */}
          {formData.role === "EXTERNAL" && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">
                External Examiner Details
              </h4>

              <input
                type="text"
                placeholder="Full Name *"
                value={formData.external_name}
                onChange={(e) =>
                  handleInputChange("external_name", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />

              <input
                type="email"
                placeholder="Email"
                value={formData.external_email}
                onChange={(e) =>
                  handleInputChange("external_email", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />

              <input
                type="text"
                placeholder="Mobile"
                value={formData.external_mobile}
                onChange={(e) =>
                  handleInputChange("external_mobile", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />

              <input
                type="text"
                placeholder="Institution"
                value={formData.external_institution}
                onChange={(e) =>
                  handleInputChange("external_institution", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loadingSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            {loadingSubmit && (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {loadingSubmit ? "Assigning..." : "Assign Examiner"}
          </button>
        </form>
      </div>

      {/* Assigned Examiners List */}
      {assignedExaminers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Assigned Examiners
          </h3>

          <ul className="space-y-3">
            {assignedExaminers.map((ex) => (
              <li
                key={ex.id}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <p className="font-medium text-gray-800">
                  {ex.role} Examiner
                </p>

                {ex.teacher_name ? (
                  <p className="text-gray-700">
                    {ex.teacher_name} ({ex.email})
                  </p>
                ) : (
                  <p className="text-gray-700">
                    {ex.external_name} — {ex.external_institution}
                  </p>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Assigned by: {ex.assigned_by_name}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: PUBLISH RESULTS UI
// ─────────────────────────────────────────────────────────────────────────────

interface AdminResultProps {
  exams: Exam[];
  loadingExams: boolean;
}

export function AdminResultPage({ exams, loadingExams }: AdminResultProps) {
  const [formData, setFormData] = useState({
    exam_id: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [examSummary, setExamSummary] = useState<any>(null);

  const { call: loadSummary } = useApi(getAdminExamSummary);
  const { call: calc, loading: calcLoading } = useApi(calculateResults);
  const { call: finalise, loading: finalising } = useApi(finaliseResults);
  const { call: publish, loading: publishing } = useApi(publishResults);

  // Load summary when exam changes
  const handleExamChange = useCallback(
    async (examId: string) => {
      setFormData({ exam_id: examId });
      setExamSummary(null);

      if (!examId) return;

      setLoadingSummary(true);
      const res = await loadSummary({ examId });
      setExamSummary(res?.data || null);
      setLoadingSummary(false);
    },
    [loadSummary]
  );

  const exam = examSummary?.exam || {};

  const isCalculated = exam.status === "RESULT_CALCULATED";
  const isFinalised = exam.status === "FINALIZED";
  const isPublished = exam.status === "RESULT_PUBLISHED";

  const handleCalculate = useCallback(async () => {
    setFormError(null);
    if (!formData.exam_id) {
      setFormError("Please select an exam");
      return;
    }

    const res = await calc({ exam_id: formData.exam_id });
    if (res?.status === 1) {
      handleExamChange(formData.exam_id);
      setSuccessMessage("Results calculated successfully");
    }
  }, [formData, calc, handleExamChange]);

  const handleFinalise = useCallback(async () => {
    setFormError(null);
    if (!formData.exam_id) {
      setFormError("Please select an exam");
      return;
    }

    const res = await finalise({ exam_id: formData.exam_id });
    if (res?.status === 1) {
      handleExamChange(formData.exam_id);
      setSuccessMessage("Results finalised successfully");
    }
  }, [formData, finalise, handleExamChange]);

  const handlePublish = useCallback(async () => {
    setFormError(null);
    if (!formData.exam_id) {
      setFormError("Please select an exam");
      return;
    }

    const res = await publish({ exam_id: formData.exam_id });
    if (res?.status === 1) {
      handleExamChange(formData.exam_id);
      setSuccessMessage("Results published successfully");
    }
  }, [formData, publish, handleExamChange]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Result Processing
        </h2>

        {formError && (
          <ErrorBanner
            message={formError}
            onDismiss={() => setFormError(null)}
          />
        )}

        {/* Exam Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam *
            </label>
            <select
              value={formData.exam_id}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingExams}
            >
              <option value="">Choose an exam...</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_name}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Preview */}
          {loadingSummary && <Loader />}

          {examSummary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Exam Status
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Exam Name</p>
                  <p className="text-lg font-bold text-gray-800">
                    {exam.exam_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="text-lg font-bold text-gray-800">
                    {exam.status}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600">Eligible for Publish</p>
                  <p className="text-lg font-bold text-gray-800">
                    {isFinalised ? "✅ Yes" : "❌ No"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {formData.exam_id && (
            <div className="space-y-4 pt-4">

              {/* Calculate */}
              <button
                onClick={handleCalculate}
                disabled={isCalculated || isFinalised || isPublished || calcLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                {calcLoading ? <Loader /> : isCalculated ? "Calculated" : "Calculate Results"}
              </button>

              {/* Finalise */}
              <button
                onClick={handleFinalise}
                disabled={!isCalculated || isFinalised || isPublished || finalising}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                {finalising ? <Loader /> : isFinalised ? "Finalised" : "Finalise Results"}
              </button>

              {/* Publish */}
              <button
                onClick={handlePublish}
                disabled={!isFinalised || isPublished || publishing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                {publishing ? <Loader /> : isPublished ? "Published" : "Publish Results"}
              </button>
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: VIEW RESULTS UI
// ─────────────────────────────────────────────────────────────────────────────
interface ViewResultProps {
  exams: Exam[];
  loadingExams: boolean;
}

export function ViewResult({ exams, loadingExams }: ViewResultProps) {
  const [formData, setFormData] = useState({
    exam_id: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  const [examSummary, setExamSummary] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  const { call: loadSummary } = useApi(getAdminExamSummary);
  const { call: loadResults } = useApi(getExamResults);

  // When exam changes → load summary + results
  const handleExamChange = useCallback(
    async (examId: string) => {
      setFormData({ exam_id: examId });
      setExamSummary(null);
      setResults([]);

      if (!examId) return;

      // Load summary
      setLoadingSummary(true);
      const summary = await loadSummary({ examId });
      setExamSummary(summary?.data || null);
      setLoadingSummary(false);

      // Load results
      setLoadingResults(true);
      const res = await loadResults({ examId });
      setResults(res?.data || []);
      setLoadingResults(false);
    },
    [loadSummary, loadResults]
  );

  const exam = examSummary?.exam || {};

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          View Results
        </h2>

        {formError && (
          <ErrorBanner
            message={formError}
            onDismiss={() => setFormError(null)}
          />
        )}

        {/* Exam Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam *
            </label>
            <select
              value={formData.exam_id}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingExams}
            >
              <option value="">Choose an exam...</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_name}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Preview */}
          {loadingSummary && <Loader />}

          {examSummary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Exam Summary
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Exam Name</p>
                  <p className="text-lg font-bold text-gray-800">
                    {exam.exam_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="text-lg font-bold text-gray-800">
                    {exam.status}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600">Published</p>
                  <p className="text-lg font-bold text-gray-800">
                    {exam.is_published ? "✅ Yes" : "❌ No"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          {formData.exam_id && (
            <div className="pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Student Results
              </h3>

              {loadingResults ? (
                <Loader />
              ) : results.length === 0 ? (
                <p className="text-gray-500">No results found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border">Student ID</th>
                        <th className="px-4 py-2 border">Name</th>
                        <th className="px-4 py-2 border">Marks</th>
                        <th className="px-4 py-2 border">Percentage</th>
                        <th className="px-4 py-2 border">Grade</th>
                        <th className="px-4 py-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.student_id} className="text-center">
                          <td className="px-4 py-2 border">{r.student_id}</td>
                          <td className="px-4 py-2 border">{r.student_name}</td>
                          <td className="px-4 py-2 border">{r.total_marks}</td>
                          <td className="px-4 py-2 border">{r.percentage}%</td>
                          <td className="px-4 py-2 border font-bold">{r.grade}</td>
                          <td className="px-4 py-2 border">
                            {r.result_status === "PASS" ? "✅ PASS" : "❌ FAIL"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ExaminationManagement() {
  const [activeTab, setActiveTab] = useState<
    'components' | 'create' | 'schedule' | 'examiner' |'publish' | 'view'
  >('components');

  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);
  const { call: getExaminations } = useApi(getAllExams);

  useEffect(() => {
    setLoadingExams(true);
    setExamsError(null);
    getExaminations()
      .then((res) => {
        setExams(res.data || []);
      })
      .catch((err) => {
        setExamsError(err.message);
      })
      .finally(() => {
        setLoadingExams(false);
      });
  }, []);

  const handleExamCreated = useCallback(() => {
    setLoadingExams(true);
    getExaminations()
      .then((res) => {
        setExams(res.data || []);
      })
      .catch((err) => {
        setExamsError(err.message);
      })
      .finally(() => {
        setLoadingExams(false);
      });
  }, []);

 const tabs = [
  { id: 'components' as const, label: 'Exam Components', icon: '📚' },
  { id: 'create' as const, label: 'Create Exam', icon: '📝' },
  { id: 'schedule' as const, label: 'Schedule Exam', icon: '📅' },

  { id: 'examiner' as const, label: 'Assign Examiner', icon: '🧑‍🏫' },

  { id: 'publish' as const, label: 'Publish Results', icon: '✅' },
  { id: 'view' as const, label: 'View Results', icon: '📊' },
];


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Examination Management
          </h1>
          <p className="text-gray-600">
            Manage exams, questions, schedules, and results
          </p>
        </div>

        {examsError && (
          <ErrorBanner
            message={examsError}
            onDismiss={() => setExamsError(null)}
          />
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'components' && (
              <ExamComponentEditor exams={exams} loadingExams={loadingExams} />
            )}
            {activeTab === 'create' && (
              <ExamCreation
                exams={exams}
                loadingExams={loadingExams}
                onExamCreated={handleExamCreated}
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleExam exams={exams} loadingExams={loadingExams} />
            )}
             {activeTab === 'examiner' && (
              <AdminAssignExaminer exams={exams} loadingExams={loadingExams} />
            )}
            {activeTab === 'publish' && (
              <AdminResultPage exams={exams} loadingExams={loadingExams} />
            )}
            {activeTab === 'view' && (
              <ViewResult exams={exams} loadingExams={loadingExams} />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}