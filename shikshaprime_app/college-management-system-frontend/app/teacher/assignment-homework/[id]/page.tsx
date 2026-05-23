"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAssignment } from "@/src/services/assignmentService";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText } from "lucide-react";
import { useApi } from "@/src/hooks/useApi";
import "./assignment-details.css";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";

interface AssignmentDetail {
  id: number;
  title: string;
  description: string;
  type: string;
  subject_name: string;
  class_name: string;
  program_name: string;
  section_name: string;
  academic_year: string;
  due_date: string;
  due_time: string;
  maximum_marks: string;
  attachments: { id: number; fileName: string; fileUrl: string }[];
}

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { call: fetchTeacherAssignment, loading: loadingAssigmnet } = useApi(getAssignment);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const response = await fetchTeacherAssignment(id);
        if (response.status === "success") {
          setAssignment(response.data);
        } else {
          setError("Failed to fetch assignment details");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching assignment");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [id]);

  const getFileUrl = (path: string) => {
    if (!path) return "";
    return path.replace("http:", "https:").replace(
      "https://localhost/api", "http://localhost:8080/api"
    );
  };
  
  if (loading) return <Loader />
  if (error) return <p className="error-message">{error}</p>;
  if (!assignment) return <p>No assignment found</p>;

  return (
    <div className="assignment-detail-wrapper">
      <div>
        <div className="flex items-center">
          <Link href={'/teacher/assignment-homework'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link><h2>Title: {assignment.title}</h2>
        </div>
        <p className="pl-12">Description: {assignment.description}</p>
      </div>

      <div className="detail-grid">
        <p><strong>Type:</strong> {assignment.type}</p>
        <p><strong>Subject:</strong> {assignment.subject_name}</p>
        <p><strong>Class:</strong> {assignment.class_name}</p>
        <p><strong>Program:</strong> {assignment.program_name}</p>
        <p><strong>Academic Year:</strong> {assignment.academic_year}</p>
        <p><strong>Section:</strong> {assignment.section_name}</p>
        <p><strong>Due Date & Time:</strong> {assignment.due_date} - {assignment.due_time}</p>
        <p><strong>Maximum marks:</strong> {assignment.maximum_marks}</p>
      </div>


      {assignment.attachments?.length ? (
        <ul className="attachments-list">
          <h3 className="text-dark text-md font-semibold mb-3">Attachments</h3>
          {assignment?.attachments?.map((file) => (
            <li key={file.id} className="teacher-attachment-item flex items-center justify-between p-3 border rounded-lg bg-white border-slate-200 hover:shadow-sm transition-all duration-200 shadow-sm">
              <a href={getFileUrl(file.fileUrl)} target="_blank" rel="noopener noreferrer">
                <FileText className="inline-icon" /> {file.fileName}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No attachments available</p>
      )}

      {/* <Button variant="secondary" onClick={() => history.back()}>
        Back
      </Button> */}
    </div>
  );
}
