"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/src/hooks/useApi";
import { Loader } from "@/components/ui/loader";

import "./teacher-components.css";
import { getTeacherExamComponents, getTeacherExamMarks, saveTeacherMarks } from "@/src/services/examinationService";
import { getStudentByStudentId } from "@/src/services/studentService";

export default function TeacherMarksEntryPage() {
  const { examId, studentId } = useParams();
  const router = useRouter();

  const { call: loadStudent } = useApi(getStudentByStudentId)
  const { call: loadComponents, data: components, loading } = useApi(getTeacherExamComponents);
  const { call: loadSavedMarks } = useApi(getTeacherExamMarks);
  const { call: saveMarks, loading: saving } = useApi(saveTeacherMarks);

  const [marks, setMarks] = useState({});
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    async function loadAll() {
      // Load student info
      const studentRes = await loadStudent(studentId);
      setStudentInfo({
        id: studentRes.data.id,
        name: studentRes.data.student_name,
        roll: studentRes.data.roll_number,
      });

      // Load components
      const compRes = await loadComponents({ examId });
      const initial = {};
      compRes?.data?.forEach((c) => (initial[c.mapping_id] = ""));
      setMarks(initial);

      // Load saved marks
      const savedRes = await loadSavedMarks({ examId });

      const savedForStudent = savedRes.data.find(
        (s) => s.student_id == studentRes.data.student_id
      );

      if (savedForStudent) {
        const filled = {};
        savedForStudent.components.forEach((m) => {
          filled[m.mapping_id] = m.marks_obtained ?? "";
        });
        // Merge saved marks into initial marks
        setMarks((prev) => ({ ...prev, ...filled }));
        console.log(marks);
      }
    }
    loadAll();
  }, [examId, studentId]);


  const handleSave = async () => {
    await saveMarks({
      exam_id: examId,
      student_id: studentInfo.id,
      marks: Object.entries(marks).map(([mapping_id, val]) => ({
        component_mapping_id: Number(mapping_id),
        marks_obtained: Number(val),
      })),
    });
  };

  const filledCount = Object.values(marks).filter((v) => v !== "").length;
  const totalCount = Object.keys(marks).length;

  return (
    <div className="teacher-components-page">
      <div className="components-container">

        {/* Back */}
        <button onClick={() => router.back()} className="back-btn">← Back</button>

        {/* Exam Info */}
        <div className="exam-info-bar">
          <p><strong>Exam ID:</strong> {examId}</p>
          <p><strong>Student ID:</strong> {studentId}</p>
        </div>

        {/* Student Card */}
        <div className="student-card">
          <p className="student-name">{studentInfo?.name}</p>
          <p className="student-roll">Roll: {studentInfo?.roll}</p>
        </div>

        {/* Title */}
        <h3 className="page-title">Enter Marks</h3>

        {/* Progress Bar */}
        <div className="progress-wrapper">
          <div className="progress-bar" style={{ width: `${(filledCount / totalCount) * 100}%` }}></div>
        </div>
        <p className="progress-text">{filledCount}/{totalCount} components filled</p>

        {/* Components */}
        {loading ? (
          <div className="page-loader"><Loader /></div>
        ) : (
          <div className="components-list">
            {components?.data?.map((c) => (
              <div key={c.mapping_id} className="component-card">
                <div className="component-header">
                  <p className="component-title">{c.component_name}</p>
                  <span className="component-type">{c.component_type}</span>
                </div>

                <div className="component-meta">
                  <p><strong>Max:</strong> {c.max_marks}</p>
                  <p><strong>Sequence:</strong> {c.sequence}</p>
                </div>

                <label className="component-label">Enter Marks</label>
                <input
                  type="number"
                  className="component-input"
                  value={marks[c.mapping_id]}
                  onChange={(e) =>
                    setMarks({ ...marks, [c.mapping_id]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="button-row">
          <button className="save-btn" onClick={handleSave}>
            {saving ? <Loader /> : "Save Draft"}
          </button>

          <button
            className="review-btn"
            onClick={() => router.push(`/teacher/examination/${examId}/review`)}
          >
            Review & Submit
          </button>
        </div>
      </div>
    </div>
  );
}