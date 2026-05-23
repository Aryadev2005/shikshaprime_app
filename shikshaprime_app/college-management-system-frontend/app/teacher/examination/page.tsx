"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useApi } from "@/src/hooks/useApi";
import { Loader } from "@/components/ui/loader";

import "./teacher-exams.css";
import { getTeacherExams } from "@/src/services/examinationService";

export default function TeacherExamsPage() {
  const { call: loadExams, data, loading } = useApi(getTeacherExams);

  useEffect(() => {
    loadExams();
  }, []);

  return (
    <div className="teacher-exams-page">
      <div className="teacher-exams-container">
        <h3 className="page-title">My Exams</h3>

        {loading ? (
          <div className="page-loader">
            <Loader />
          </div>
        ) : (
          <div className="exam-list">
            {data?.data?.map((exam) => (
              <Link
                key={exam.exam_id}
                href={`/teacher/examination/${exam.exam_id}/students`}
                className="exam-card"
              >
                <p className="exam-name">{exam.exam_name}</p>
                <p className="exam-subject">{exam.subject_name}</p>
                <p className="exam-progress">
                  {exam.students_marked}/{exam.total_students} marked
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}