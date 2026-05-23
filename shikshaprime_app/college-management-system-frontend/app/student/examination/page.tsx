"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/src/hooks/useApi";

import "./student-results.css";
import { Loader } from "@/components/ui/loader";
import { getStudentResults } from "@/src/services/examinationService";

export default function StudentResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const { call: loadResults } = useApi(getStudentResults);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await loadResults({});
        setResults(res?.data || []);
      } catch {
        setFormError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="student-results-page">
      <div className="results-card">
        <h2 className="results-title">My Results</h2>

        {loading ? (
          <Loader />
        ) : results.length === 0 ? (
          <p className="no-results-text">No published results available.</p>
        ) : (
          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.exam_id}>
                    <td>{r.exam_name}</td>
                    <td>{r.total_marks}</td>
                    <td>{r.percentage}%</td>
                    <td className="grade">{r.grade}</td>
                    <td>
                      {r.result_status === "PASS" ? "✅ PASS" : "❌ FAIL"}
                    </td>
                    <td>
                      <a
                        href={`/student/examination/results/${r.exam_id}`}
                        className="view-link"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}