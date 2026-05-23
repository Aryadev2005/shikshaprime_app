"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/src/hooks/useApi";
import { Loader } from "@/components/ui/loader";

import "./teacher-review.css";
import {
  getTeacherExamSummary,
  submitTeacherMarks,
} from "@/src/services/examinationService";

export default function TeacherReviewPage() {
  const { examId } = useParams();
  const router = useRouter();

  const {
    call: loadSummary,
    data: summaryResponse,
    loading,
  } = useApi(getTeacherExamSummary);

  const {
    call: submitMarks,
    loading: submitting,
  } = useApi(submitTeacherMarks);

  useEffect(() => {
    if (examId) {
      loadSummary({ examId });
    }
  }, [examId]);

  const handleSubmit = async () => {
    const res = await submitMarks({ exam_id: examId });
    if (res?.status === 1) {
      loadSummary({ examId }); // reload to reflect SUBMITTED state
    }
  };

  // Safely unwrap response
  const payload = summaryResponse?.data || {};
  const stats = payload.stats || {};
  const students = payload.students || [];
  const exam = payload.exam || {};

  const isSubmitted = exam.status === "SUBMITTED" || exam.status === "LOCKED";

  const allCompleted =
    students.length > 0 &&
    students.every((s) =>
      s.components.every(
        (c: any) => c.marks_obtained !== null && c.marks_obtained !== ""
      )
    );

  const disableSubmit = !allCompleted || isSubmitted || submitting;

  return (
    <div className="review-page">
      <Link
        href={`/teacher/examination/${examId}/students`}
        className="back-btn"
      >
        ← Back
      </Link>

      <h3 className="page-title">Review & Submit</h3>

      {/* Submitted Banner */}
      {isSubmitted && (
        <div className="submitted-banner">
          ✔ Marks have been submitted and are now locked.
        </div>
      )}

      {loading ? (
        <div className="page-loader">
          <Loader />
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="summary-card">
            <div className="summary-item">
              <p className="summary-label">Total Students</p>
              <p className="summary-value">{stats.total_students ?? 0}</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Completed</p>
              <p className="summary-value green">
                {stats.students_completed ?? 0}
              </p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Pending</p>
              <p className="summary-value red">
                {(stats.total_students || 0) - (stats.students_completed || 0)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="progress-wrapper">
            <div
              className="progress-bar"
              style={{
                width: `${stats.completion_percentage ?? 0}%`,
              }}
            ></div>
          </div>
          <p className="progress-text">
            {stats.completion_percentage ?? 0}% Completed
          </p>

          {/* Student Review List */}
          <div className="review-list">
            {students.map((s: any) => {
              const isCompleted = s.components.every(
                (c: any) =>
                  c.marks_obtained !== null && c.marks_obtained !== ""
              );

              return (
                <div
                  key={s.student_id}
                  className={`review-card ${isSubmitted ? "locked" : ""}`}
                >
                  {/* Student Info */}
                  <div className="student-info">
                    <p className="student-name">{s.student_name}</p>
                    <p className="student-roll">Roll: {s.roll_number}</p>
                  </div>

                  {/* Component Pills */}
                  <div className="component-list">
                    {s.components.map((c: any) => (
                      <div key={c.mapping_id} className="component-pill">
                        <span className="pill-title">
                          {c.component_name}
                        </span>
                        <span
                          className={`pill-value ${
                            c.marks_obtained === null ||
                            c.marks_obtained === ""
                              ? "missing"
                              : ""
                          }`}
                        >
                          {c.marks_obtained === null ||
                          c.marks_obtained === ""
                            ? "—"
                            : c.marks_obtained}
                          /{c.max_marks}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Status */}
                  <div
                    className={`status-badge ${
                      isCompleted ? "completed" : "pending"
                    }`}
                  >
                    {isCompleted ? "✔ Completed" : "⏳ Pending"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="submit-row">
            <button
              className={`submit-btn ${disableSubmit ? "disabled" : ""}`}
              disabled={disableSubmit}
              onClick={handleSubmit}
            >
              {isSubmitted
                ? "Submitted"
                : submitting
                ? <Loader />
                : "Submit Final Marks"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}