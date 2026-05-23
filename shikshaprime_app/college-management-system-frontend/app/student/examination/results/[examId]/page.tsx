"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/src/hooks/useApi";
import "./student-result.css";
import { Loader } from "@/components/ui/loader";
import { getStudentResultDetails } from "@/src/services/examinationService";

export default function StudentResultDetails() {
  const { examId } = useParams();

  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { call: loadDetails } = useApi(getStudentResultDetails);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await loadDetails({ examId });
        setResult(res?.data || null);
      } catch {
        setFormError("Failed to load result details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [examId]);

  if (loading) return <Loader />;

  const exam = result.exam;
  const summary = result.result;
  const components = result.components;

  return (
    <div className="student-result-page">
      <div className="result-card">
        <h2 className="result-title">{exam.exam_name} — Result</h2>

        {/* Summary */}
        <div className="summary-box">
          <div className="summary-grid">
            <div className="summary-item">
              <p className="label">Total Marks</p>
              <p className="value">{summary.total_marks}</p>
            </div>

            <div className="summary-item">
              <p className="label">Percentage</p>
              <p className="value">{summary.percentage}%</p>
            </div>

            <div className="summary-item">
              <p className="label">Grade</p>
              <p className="value">{summary.grade}</p>
            </div>

            <div className="summary-item">
              <p className="label">Status</p>
              <p className="value">
                {summary.pass_fail === "PASS" ? "✅ PASS" : "❌ FAIL"}
              </p>
            </div>
          </div>
        </div>

        {/* Component-wise Marks */}
        <h3 className="section-title">Component-wise Marks</h3>

        <div className="table-wrapper">
          <table className="marks-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Max Marks</th>
                <th>Marks Obtained</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c: any, idx: number) => (
                <tr key={idx}>
                  <td>{c.component_name}</td>
                  <td>{c.max_marks}</td>
                  <td>{c.marks_obtained}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Published Info */}
        <p className="published-text">
          Published on: {new Date(exam.published_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}