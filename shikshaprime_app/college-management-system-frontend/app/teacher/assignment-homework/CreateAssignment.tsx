import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UploadCloud, X, FileText, FileImage, File, ChevronLeft } from 'lucide-react';
import { AssignmentAPI } from '@/src/services/assignmentService';
import './assignment-homework.css';
import { useAppSelector } from "@/src/store/hooks";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from '@/src/hooks/useApi';
import { toast } from "sonner";
import Link from "next/link";
import { CapitalizedInput } from '@/src/components/ui/CapitalizedInput';

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_FILE_TYPES: Record<string, string> = {
  "image/jpeg": "JPG/JPEG",
  "image/jpg": "JPG/JPEG",
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

const resourceFilesSchema = z
  .custom<FileList | File[]>(
    (val) => val === undefined || val === null || (typeof val === 'object'),
    "Invalid files"
  )
  .superRefine((files, ctx) => {
    if (!files || (files as FileList).length === 0) return;
    const fileArr = Array.from(files as FileList);
    let totalSize = 0;
    for (const file of fileArr) {
      if (!(file.type in ALLOWED_FILE_TYPES)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${file.name}" is not allowed. Only JPG, JPEG, DOC, DOCX and PDF files are accepted.`,
        });
        return;
      }
      totalSize += file.size;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total file size must not exceed 50 MB. Current size: ${(totalSize / 1024 / 1024).toFixed(2)} MB.`,
      });
    }
  });

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  subject: z.string().min(1, "Subject is required"),
  class: z.string().min(1, "Class is required"),
  program: z.string().min(1, "Program is required"),
  semester: z.string().min(1, "Semester is required"),
  section: z.string().optional(),
  academicYear: z.string().min(1, "Academic Year is required"),
  description: z.string().min(1, "Description is required"),
  detailedInstructions: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().min(1, "Due time is required"),
  maximumMarks: z.string().optional(),
  sendNotification: z.boolean(),
  allowLateSubmissions: z.boolean(),
  resourceFiles: resourceFilesSchema.optional(),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface CreateAssignmentProps {
  onBack?: () => void;
  onSuccess?: () => void;
}
// ─── File icon helper ────────────────────────────────────────────────────────
function getFileIcon(file: File) {
  if (file.type === 'application/pdf') return <FileText className="fup-file-icon pdf" />;
  if (file.type.startsWith('image/')) return <FileImage className="fup-file-icon img" />;
  return <File className="fup-file-icon doc" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const CreateAssignment: React.FC<CreateAssignmentProps> = ({ onBack, onSuccess }) => {
  const { register, handleSubmit: hookSubmit, reset, control, setValue, trigger, formState: { errors } } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      type: 'Assignment',
      sendNotification: false,
      allowLateSubmissions: false,
      title: '',
      subject: '',
      program: '',
      class: '',
      semester: '',
      section: '',
      academicYear: '',
      description: '',
      detailedInstructions: '',
      dueDate: '',
      dueTime: '',
      maximumMarks: '',
      resourceFiles: undefined,
    }
  });

  // ── Local file state ──────────────────────────────────────────────────────
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const usedPercent = Math.min((totalSize / MAX_TOTAL_SIZE) * 100, 100);

  // Sync selectedFiles → react-hook-form field
  const syncFiles = useCallback(
    (files: File[]) => {
      setSelectedFiles(files);
      // Build a DataTransfer to create a FileList
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      setValue('resourceFiles', dt.files, { shouldValidate: true });
    },
    [setValue]
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      const merged = [...selectedFiles];
      for (const file of incoming) {
        if (!(file.type in ALLOWED_FILE_TYPES)) {
          toast.error(`"${file.name}" is not allowed. Only JPG, JPEG, DOC, DOCX, PDF accepted.`);
          continue;
        }
        if (!merged.find((f) => f.name === file.name && f.size === file.size)) {
          merged.push(file);
        }
      }
      const newTotal = merged.reduce((a, f) => a + f.size, 0);
      if (newTotal > MAX_TOTAL_SIZE) {
        toast.error(`Total file size would exceed 50 MB limit (${formatBytes(newTotal)}).`);
        return;
      }
      syncFiles(merged);
    },
    [selectedFiles, syncFiles]
  );

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    syncFiles(updated);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [metadata, setMetadata] = useState<{
    semesters: any[];
    programs: any[];
    subjects: any[];
    sections: any[];
    classes: any[];
    academicYears: any[];
  }>({
    semesters: [],
    programs: [],
    subjects: [],
    sections: [],
    classes: [],
    academicYears: []
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [semRes, progRes, subRes, secRes, clsRes, acyRes] = await Promise.all([
          AssignmentAPI.getSemesters(),
          AssignmentAPI.getPrograms(),
          AssignmentAPI.getSubjects(),
          AssignmentAPI.getSections(),
          AssignmentAPI.getClasses(),
          AssignmentAPI.getAcademicYears()
        ]);

        setMetadata({
          semesters: semRes.status === 'success' ? semRes.data : [],
          programs: progRes.status === 'success' ? progRes.data : [],
          subjects: subRes.status === 'success' ? subRes.data : [],
          sections: secRes.status === 'success' ? secRes.data : [],
          classes: clsRes.status === 'success' ? clsRes.data : [],
          academicYears: acyRes.status === 'success' ? acyRes.data : [],
        });
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    fetchMetadata();
  }, []);
  const { call: submitAssignmentForm, loading: submittingAssignment } = useApi(AssignmentAPI.createAssignment);

  const onSubmit = async (data: AssignmentFormValues) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const formData = new FormData();

      // ── Text / number fields ────────────────────────────────────────────────
      formData.append('title', data.title.trim());
      formData.append('description', (data.description || '').trim());
      formData.append('detailed_instructions', (data.detailedInstructions || '').trim());
      formData.append('type', data.type);

      // ── ID fields — send the raw selected value; no silent "|| 1" fallback ─
      formData.append('subject_id', data.subject);
      formData.append('program_id', data.program);
      formData.append('semester_id', data.semester);
      formData.append('class_id', data.class);
      formData.append('academic_year_id', data.academicYear);

      // section is optional — only append when a value was chosen
      if (data.section && data.section.trim() !== '') {
        formData.append('section_id', data.section);
      }

      // ── Date / time ─────────────────────────────────────────────────────────
      formData.append('due_date', data.dueDate);
      formData.append('due_time', data.dueTime);

      // ── Marks — send blank when not provided; do NOT default to 100 ─────────
      formData.append('maximum_marks', data.maximumMarks ? data.maximumMarks.trim() : '');

      // ── Boolean flags — send as "1" / "0" ───────────────────────────────────
      formData.append('allow_late_submissions', data.allowLateSubmissions ? '1' : '0');
      formData.append('send_notification', data.sendNotification ? '1' : '0');

      // ── Files ────────────────────────────────────────────────────────────────
      selectedFiles.forEach((file) => formData.append('resources[]', file));

      // Debug: FormData is not inspectable via console.log, use this instead
      console.log('Assignment FormData payload:', Object.fromEntries(formData.entries()));

      const response = await submitAssignmentForm(formData);
      if (response.status === 'success') {
        setSubmitMessage('Assignment created successfully!');
        toast.success(response.message);
        reset();
        syncFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onSuccess) setTimeout(() => onSuccess(), 0);
      } else {
        toast.error(response.message || 'Failed to create assignment. Please try again.');
        setSubmitMessage('Failed to create assignment. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      if (error.message?.includes('Authentication required')) {
        toast.error('Authentication required. Please login again.');
        setSubmitMessage('Authentication required. Please login again.');
      } else {
        toast.error('Failed to create assignment. Please check your connection and try again.');
        setSubmitMessage('Failed to create assignment. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="create-assignment-wrapper">
      <div className="create-assignment-container">
        {/* Header with back button */}
        <div className="assignment-header">
          <div className="header-left">
            {/* {onBack && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="back-btn"
              ><ArrowLeft className="back-icon" /></Button>
            )} */}
            <Link href={'/teacher/assignment-homework'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link>
            <h3 className="text-dark text-md font-semibold">Create New Assignment</h3>
          </div>
        </div>

        <form onSubmit={hookSubmit(onSubmit)} className="assignment-form">
          {/* Title and Type Row */}
          <div className="form-card">
            <div className='grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-4 gap-y-0 mb-1'>
              <div className="form-group">
                <Label htmlFor="title" className="">
                  Title <span className="required-asterisk">*</span>
                </Label>
                <CapitalizedInput
                  id="title"
                  {...register("title")}
                  type="text"
                  placeholder="Enter assignment/homework title"
                  className={`form-input ${errors.title ? "border-red-500" : ""}`}
                />
                {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
              </div>

              <div className="form-group">
                <Label htmlFor="type" className="">
                  Type <span className="required-asterisk">*</span>
                </Label>
                <select
                  id="type"
                  {...register("type")}
                  className={`form-select ${errors.type ? "border-red-500" : ""}`}
                >
                  <option value="" disabled>Select Type</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Homework">Homework</option>
                </select>
                {errors.type && <span className="text-red-500 text-xs">{errors.type.message}</span>}
              </div>
              {/* subject */}
              <div className="form-group">
                <Label htmlFor="subject" className="">
                  Subject <span className="required-asterisk">*</span>
                </Label>
                <select
                  id="subject"
                  {...register("subject")}
                  className={`form-select ${errors.subject ? "border-red-500" : ""}`}
                >
                  <option value="" disabled>Select Subject</option>
                  {metadata.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subject && <span className="text-red-500 text-xs">{errors.subject.message}</span>}
              </div>
              {/* Program */}
              <div className="form-group">
                <Label htmlFor="program" className="">
                  Program <span className="required-asterisk">*</span>
                </Label>
                <select
                  id="program"
                  {...register("program")}
                  className={`form-select ${errors.program ? "border-red-500" : ""}`}
                >
                  <option value="" disabled>Select Program</option>
                  {metadata.programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {errors.program && <span className="text-red-500 text-xs">{errors.program.message}</span>}
              </div>
              {/* Semester */}
              <div className="form-group">
                <Label htmlFor="semester" className="">
                  Semester <span className="required-asterisk">*</span>
                </Label>
                <select
                  id="semester"
                  {...register("semester")}
                  className={`form-select ${errors.semester ? "border-red-500" : ""}`}
                >
                  <option value="" disabled>Select Semester</option>
                  {metadata.semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
                {errors.semester && <span className="text-red-500 text-xs">{errors.semester.message}</span>}
              </div>
              {/* Section */}
              <div className="form-group">
                <Label htmlFor="section" className="">
                  Section
                </Label>
                <select
                  id="section"
                  {...register("section")}
                  className="form-select"
                >
                  <option value="" disabled>Select Section</option>
                  {metadata.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Section */}
              <div className="form-group">
                <Label htmlFor="class" className="">
                  Class <span className="required-asterisk">*</span>
                </Label>
                <select
                  id="class"
                  {...register("class")}
                  className="form-select"
                >
                  <option value="" disabled>Select Class</option>
                  {metadata.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <Label htmlFor="academicYear" className="">
                  Academic Year <span className="required-asterisk">*</span>
                </Label>
                <select
                  id="academicYear"
                  {...register("academicYear")}
                  className={`form-select ${errors.academicYear ? "border-red-500" : ""}`}
                >
                  <option value="" disabled>Select Academic Year</option>
                  {metadata.academicYears && metadata.academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
                {errors.academicYear && <span className="text-red-500 text-xs">{errors.academicYear.message}</span>}
              </div>
            </div>
            {/* Academic Year Row */}
            <div className='grid md:grid-cols-2 grid-cols-1 gap-3 mb-0 gap-y-0'>
              {/* Description */}
              <div className="form-group">
                <Label htmlFor="description" className="">
                  Description <span className="required-asterisk">*</span>
                </Label>
                <textarea
                  id="description"
                  {...register("description")}
                  placeholder="Brief description of the assignment/homework"
                  className={`form-textarea ${errors.description ? "border-red-500" : ""}`}
                  rows={3}
                />
                {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
              </div>
              {/* Detailed Instructions */}
              <div className="form-group">
                <Label htmlFor="detailedInstructions" className="">
                  Detailed Instructions
                </Label>
                <textarea
                  id="detailedInstructions"
                  {...register("detailedInstructions")}
                  placeholder="Detailed instructions for students..."
                  className="form-textarea"
                  rows={3}
                />
              </div>

            </div>
            {/* ── Resource File Upload ─────────────────────────────────── */}
            <div className="form-group fup-group">
              <Label htmlFor="resourceFilesInput" className="fup-label">
                Upload Resource Files
                <span className="fup-size-info">
                  {formatBytes(totalSize)} / 50 MB used
                </span>
              </Label>

              {/* Drag-and-drop zone */}
              <div
                className={`fup-dropzone${isDragging ? ' fup-dropzone--active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <UploadCloud className="fup-upload-icon" />
                <p className="fup-dropzone-text">
                  <strong>Click to browse</strong> or drag &amp; drop files here
                </p>
                <p className="fup-dropzone-hint">
                  Accepted: JPG, JPEG, DOC, DOCX, PDF &nbsp;•&nbsp; Max total: <strong>50 MB</strong>
                </p>
                {/* Hidden native input – controlled via ref */}
                <input
                  ref={fileInputRef}
                  id="resourceFilesInput"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) addFiles(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Size progress bar */}
              {selectedFiles.length > 0 && (
                <div className="fup-progress-bar-wrap">
                  <div
                    className={`fup-progress-bar${usedPercent >= 90 ? ' fup-progress-bar--warn' : ''}`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              )}

              {/* Validation error from Zod */}
              {errors.resourceFiles && (
                <span className="text-red-500 text-xs fup-error">
                  {(errors.resourceFiles as any).message}
                </span>
              )}

              {/* File list */}
              {selectedFiles.length > 0 && (
                <ul className="fup-file-list">
                  {selectedFiles.map((file, idx) => (
                    <li key={`${file.name}-${idx}`} className="fup-file-item">
                      {getFileIcon(file)}
                      <div className="fup-file-meta">
                        <span className="fup-file-name" title={file.name}>{file.name}</span>
                        <span className="fup-file-size">{formatBytes(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        className="fup-remove-btn"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="fup-remove-icon" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Due Date, Due Time, and Maximum Marks Row */}
            <div className='grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3 mb-4 mt-4'>
              <div className="form-group">
                <Label htmlFor="dueDate" className="">
                  Due Date <span className="required-asterisk">*</span>
                </Label>
                <Input
                  id="dueDate"
                  {...register("dueDate")}
                  type="date"
                  className={`form-input ${errors.dueDate ? "border-red-500" : ""}`}
                />
                {errors.dueDate && <span className="text-red-500 text-xs">{errors.dueDate.message}</span>}
              </div>

              <div className="form-group">
                <Label htmlFor="dueTime" className="">
                  Due Time
                </Label>
                <Input
                  id="dueTime"
                  {...register("dueTime")}
                  type="time"
                  className={`form-input ${errors.dueTime ? "border-red-500" : ""}`}
                />
                {errors.dueTime && <span className="text-red-500 text-xs">{errors.dueTime.message}</span>}
              </div>

              <div className="form-group">
                <Label htmlFor="maximumMarks" className="">
                  Maximum Marks
                </Label>
                <Input
                  id="maximumMarks"
                  {...register("maximumMarks")}
                  type="number"
                  placeholder="100"
                  className="form-input"
                  min="0"
                />
              </div>
            </div>
            {/* Checkboxes Row */}
            <div className='grid lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-3 mb-4 checkbox-row'>
              <div className="checkbox-group">
                <input
                  id="sendNotification"
                  {...register("sendNotification")}
                  type="checkbox"
                  className="form-checkbox"
                />
                <Label htmlFor="sendNotification" className="checkbox-label">
                  Send notification to parents/guardians
                </Label>
              </div>
              <div className="checkbox-group">
                <input
                  id="allowLateSubmissions"
                  {...register("allowLateSubmissions")}
                  type="checkbox"
                  className="form-checkbox"
                />
                <Label htmlFor="allowLateSubmissions" className="checkbox-label">
                  Allow late submissions
                </Label>
              </div>
            </div>
            {/* Submit Buttons */}
            <div className="form-actions">
              {/* {submitMessage && (
                <div className={`alert ${submitMessage.includes('success') ? 'alert-success' : 'alert-error'}`}>
                  {submitMessage}
                </div>
              )} */}
              <Button
                type="submit"
                variant="primary"
                className="submit-btn2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateAssignment;