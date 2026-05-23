"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/src/hooks/useApi";
import { Loader } from "@/components/ui/loader";

import "./teacher-students.css";
import { getTeacherExamStudents } from "@/src/services/examinationService";

export default function TeacherStudentsPage() {
  const { examId } = useParams();
  const { call: loadStudents, data, loading } = useApi(getTeacherExamStudents);

  useEffect(() => {
    loadStudents({ examId });
  }, [examId]);

  return (
    <div className="teacher-students-page">

      {/* Back */}
      <Link href="/teacher/examination" className="back-btn">← Back</Link>

      {/* Title */}
      <h3 className="page-title">Students</h3>

      {loading ? (
        <div className="page-loader"><Loader /></div>
      ) : (
        <div className="student-list">
          {data?.data?.map((s) => {
            const status = s.marks_entered
              ? "completed"
              : s.has_draft
              ? "draft"
              : "pending";

            return (
              <Link
                key={s.student_id}
                href={`/teacher/examination/${examId}/students/${s.student_id}/components`}
                className="student-row"
              >
                <div className="student-info">
                  <p className="student-name">{s.student_name}</p>
                  <p className="student-roll">Roll: {s.roll_number}</p>
                </div>

                <div className="student-progress">
                  <div className="progress-bar-wrapper">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${(s.filled_components / s.total_components) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    {s.filled_components}/{s.total_components} components
                  </p>
                </div>

                <div className={`status-badge ${status}`}>
                  {status === "completed" && "✔ Completed"}
                  {status === "draft" && "📝 Draft Saved"}
                  {status === "pending" && "⏳ Pending"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}