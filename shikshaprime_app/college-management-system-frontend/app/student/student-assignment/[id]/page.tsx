"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Calendar, X, CloudUpload, FileText, Eye, FileIcon, Image as LucideImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import "../student-assignment.css";
import "./details.css";
import { Loader } from "@/components/ui/loader";
import { getTeacherAssignmentData, studentAssignmentSubmit } from "@/src/services/assignmentService";
import { useAppSelector } from "@/src/store/hooks";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useApi } from "@/src/hooks/useApi";
import { format, isValid, parseISO } from "date-fns";

/**
 * Safely format a date string (e.g. "2025-03-15" or ISO).
 * Returns "—" when the value is missing or invalid.
 */
function safeFormatDate(dateStr: string | null | undefined, fmt: string): string {
    if (!dateStr) return "—";
    try {
        const d = parseISO(dateStr);
        if (!isValid(d)) return "—";
        return format(d, fmt);
    } catch {
        return "—";
    }
}

/**
 * Safely format a bare time string like "14:30:00" or "14:30".
 * date-fns cannot parse raw time strings, so we attach today's date first.
 * Returns "—" when the value is missing or invalid.
 */
function safeFormatTime(timeStr: string | null | undefined, fmt: string): string {
    if (!timeStr) return "—";
    try {
        // Combine with a fixed date so parseISO gets a full ISO datetime
        const d = parseISO(`1970-01-01T${timeStr}`);
        if (!isValid(d)) return "—";
        return format(d, fmt);
    } catch {
        return "—";
    }
}
const ALLOWED_MIME_TYPES = [
    "application/pdf",

    // images
    "image/jpeg",
    "image/jpg",
    "image/png",

    // word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // ppt
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

const assignmentSchema = z.object({
    teacherAssignmentId: z.string(),
    studentName: z.string().min(1, "Name is required"),
    className: z.string().min(1, "Class is required"),
    rollNo: z.string().min(1, "Roll No is required"),
    // topic: z.string().min(1, "Topic is required"),
    program: z.string().min(1, "Program is required"),
    section: z.string().min(1, "Section is required"),
    document: z.any().refine(file => file instanceof File, "File is required").refine(file => ALLOWED_MIME_TYPES.includes(file?.type), "Allowed: PDF, JPG, PNG, DOC, DOCX, PPT").refine(file => file?.size <= 50 * 1024 * 1024, "File must be under 50MB"),
    submissionText: z.string().min(1, "Description is required"),
    assignmentDescription: z.string().optional(),
});

export type StudentAssignmentFormValues = z.infer<typeof assignmentSchema>;
const getFileUrl = (path: string) => {
    if (!path) return "";
    return path.replace("http:", "https:").replace(
      "https://localhost/api", "http://localhost:8080/api"
    );
  };
const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf':
            return <FileText size={24} className="text-red-500" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
            return <LucideImage size={24} className="text-blue-500" />;
        case 'doc':
        case 'docx':
            return <FileText size={24} className="text-blue-700" />;
        case 'ppt':
        case 'pptx':
            return <FileText size={24} className="text-orange-500" />;
        default:
            return <FileIcon size={24} className="text-gray-500" />;
    }
};


export default function StudentAssignmentDetailsPage({ params }: { params: { id: string; title: string } }) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const param = useParams();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filePreview, setFilePreview] = useState<{ file: File; id: string; previewUrl?: string } | null>(null);

    const studentDetails = useAppSelector((state) => state.stuDetails.StudentDetails);
    // const searchParam = useSearchParams();
    const router = useRouter();
    const { data: teacherData, loading: teacherDataLoading, call: teacherDataCall } = useApi(getTeacherAssignmentData);
    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<StudentAssignmentFormValues>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            teacherAssignmentId: "",
            studentName: "",
            className: "",
            rollNo: "",
            // topic: "Select topic",
            program: "Select program",
            section: "Select section",
            document: undefined,
            submissionText: '',
            assignmentDescription: '',
        },
    });
    // Parse assignmentInfo from query param
    useEffect(() => {
        if (studentDetails) {
            setValue("studentName", `${studentDetails.student_name}`);
            setValue("className", `${studentDetails.class_name}`);
            setValue("rollNo", `${studentDetails.roll_number}`);
            setValue("program", `${studentDetails.program_name}`);
            setValue("section", `${studentDetails.section_name}`);
        }
    }, [studentDetails]);

    // useEffect(() => {
    //     const dataParam = searchParam.get('data');
    //     if (dataParam) {
    //         try {
    //             const assignmentInfo = JSON.parse(dataParam);
    //             console.log("search param data", assignmentInfo);
    //             if (assignmentInfo && assignmentInfo.title) {
    //                 setValue("topic", assignmentInfo.title);
    //             }
    //             if (assignmentInfo && assignmentInfo.id) {
    //                 console.log("assignmentInfo.id", assignmentInfo.id);
    //                 setValue("teacherAssignmentId", assignmentInfo.id.toString());
    //             }
    //         } catch (err) {
    //             console.error("Failed to parse assignmentInfo from query param", err);
    //         }
    //     }
    // }, [searchParam, setValue]);

    useEffect(() => {
        if (param?.id) {
            teacherDataCall(param?.id);
            setValue("teacherAssignmentId", param?.id.toString())
        }
    }, [param]);
    useEffect(() => {
        if (teacherData?.data?.assignment_description) {
            setValue('assignmentDescription', teacherData?.data?.assignment_description)
        }
    }, [teacherData]);


    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_MIME_TYPES = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // TYPE VALIDATION
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            toast.error("Allowed: PDF, JPG, PNG, DOC, DOCX, PPT");
            e.target.value = "";
            return;
        }

        // SIZE VALIDATION
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size must be under 50MB");
            e.target.value = "";
            return;
        }

        // PREVIEW (image only)
        let previewUrl: string | undefined = undefined;
        if (file.type.startsWith("image/")) {
            previewUrl = URL.createObjectURL(file);
        }

        const newPreview = {
            file,
            id: Math.random().toString(36).substring(7),
            previewUrl
        };

        setFilePreview(newPreview);
        setValue("document", file, { shouldValidate: true });
    };

    const removeFile = () => {
        setFilePreview(null);
        setValue("document", undefined);
    };

    const onSubmit = async (formData: StudentAssignmentFormValues) => {
        setIsLoading(true);
        // Send assignmentInfo object along with form data
        // console.log("Form Submitted:", formData);
        // console.log("Document:", filePreview?.file);

        if (!filePreview) {
            toast.error("Please upload a document");
            setIsLoading(false);
            return;
        }
        const payload = { teacherAssignmentId: formData.teacherAssignmentId, submissionText: formData.submissionText, document: filePreview.file };
        console.log("Form Submitted:", payload);
        try {
            // Pass assignmentInfo to your submit function if needed
            const response = await studentAssignmentSubmit(payload as any);
            if (response) {
                console.log("Student assignment submit response", response);
                toast.success("Assignment submitted successfully!");
                router.push("/student/student-assignment");
            }
        } catch (error: any) {
            toast.error("Failed to submit assignment");
        } finally {
            setIsLoading(false);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            {isLoading && <Loader />}
            <div className="student-assignment-wrapper">
                <div className="details-header">
                    <div className="flex items-center">
                        <Link href="/student/student-assignment" className="mr-3">
                            <button className="back-btn">
                                <ChevronLeft size={24} />
                            </button>
                        </Link>
                        <div>
                            {/* <h1 className="details-title">Assignment Form</h1> */}
                            <span className="block border-[#439ce9] rounded-sm text-lg text-left font-bold px-0 text-blue capitalize ">{teacherData?.data?.assignment_title}</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-dark text-sm">Due Date: <span className="text-dark font-semibold block">{safeFormatDate(teacherData?.data?.due_date, "dd-MMM-yyyy").toUpperCase()} &nbsp;|&nbsp; Time: {safeFormatTime(teacherData?.data?.due_time, "hh:mm a")}</span></span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit, (errors) => console.log("Validation Errors:", errors))}>
                    <div className="form-card">
                        <div className="form-grid grid-cols-5 gap-3">
                            <div className="form-group">
                                <Label className="input-label">Name <span className="required">*</span></Label>
                                <Input
                                    {...register("studentName")}
                                    placeholder="Name"
                                    className={`form-input ${errors.studentName ? "border-red-500" : ""}`}
                                    readOnly
                                />
                                {errors.studentName && <span className="text-red-500 text-xs">{errors.studentName.message}</span>}
                            </div>
                            <div className="form-group">
                                <Label className="input-label">Class <span className="required">*</span></Label>
                                <Input
                                    {...register("className")}
                                    placeholder="Class"
                                    className={`form-input ${errors.className ? "border-red-500" : ""}`}
                                    readOnly
                                />
                                {errors.className && <span className="text-red-500 text-xs">{errors.className.message}</span>}
                            </div>
                            <div className="form-group">
                                <Label className="input-label">Roll No <span className="required">*</span></Label>
                                <Input
                                    {...register("rollNo")}
                                    placeholder="Roll no"
                                    className={`form-input ${errors.rollNo ? "border-red-500" : ""}`}
                                    readOnly
                                />
                                {errors.rollNo && <span className="text-red-500 text-xs">{errors.rollNo.message}</span>}
                            </div>

                            {/* <div className="form-group">
                                <Label className="input-label">Topic <span className="required">*</span></Label>
                                <Input
                                    {...register("topic")} readOnly
                                    className={`form-select ${errors.topic ? "border-red-500" : ""}`}
                                />
                                {errors.topic && <span className="text-red-500 text-xs">{errors.topic.message}</span>}
                            </div> */}
                            <div className="form-group">
                                <Label className="input-label">Program <span className="required">*</span></Label>
                                <Input readOnly
                                    {...register("program")}
                                    className={`form-select ${errors.program ? "border-red-500" : ""}`}
                                />
                                {errors.program && <span className="text-red-500 text-xs">{errors.program.message}</span>}
                            </div>
                            <div className="form-group">
                                <Label className="input-label">Section <span className="required">*</span></Label>
                                <Input readOnly
                                    {...register("section")}
                                    className={`form-select ${errors.section ? "border-red-500" : ""}`}
                                />
                                {errors.section && <span className="text-red-500 text-xs">{errors.section.message}</span>}
                            </div>
                            <div className="form-group col-span-5">
                                <Label className="input-label">Assignment Description <span className="required">*</span></Label>
                                <textarea readOnly
                                    {...register("assignmentDescription")}
                                    className={`form-textarea${errors.assignmentDescription ? "border-red-500" : ""}`}
                                ></textarea>
                                {errors.assignmentDescription && <span className="text-red-500 text-xs">{errors.assignmentDescription.message}</span>}
                            </div>
                        </div>
                    </div>
                    {/* assignment View Document */}
                    {teacherData?.data?.attachments && teacherData.data.attachments.length > 0 && (
                        <div className="form-card">
                            <h2 className="card-title">Assignment Attachments</h2>
                            <div className="attachments-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teacherData.data.attachments.map((attachment: any) => (
                                    <div key={attachment.attachment_id} className="attachment-item flex items-center justify-between p-3 border rounded-lg bg-gray-50 border-gray-200">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="attachment-icon shrink-0">
                                                {getFileIcon(attachment.file_name)}
                                            </div>
                                            <div className="attachment-info overflow-hidden">
                                                <p className="text-sm font-medium text-gray-700 truncate" title={attachment.file_name}>
                                                    {attachment.file_name}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                                            onClick={() => window.open(getFileUrl(attachment.file_url), '_blank')}
                                        >
                                            <Eye size={16} />
                                            View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-card">
                        <h2 className="card-title">Document Upload</h2>
                        <div className="upload-area">
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx"
                            />
                            <div className="file-input-wrapper cursor-pointer" onClick={triggerFileUpload}>
                                <div className="file-input-display">
                                    {filePreview ? `1 document selected` : "Choose document"}
                                </div>
                            </div>
                            <button type="button" className="upload-btn" onClick={triggerFileUpload}>                                
                                <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/uploaded-icon.svg`} alt="Upload" width={20} height={20} />
                                Upload {filePreview ? '(1)' : '(0)'}
                            </button>
                        </div>

                        <div className="upload-helper-text">
                            <span>Uploaded by document / File type PDF, PPT, JPEG, DOC</span>
                            <span>File size MAX 50MB</span>
                        </div>

                        <div className="uploaded-preview-grid">
                            {filePreview && (
                                <div key={filePreview.id} className="uploaded-file-card bg-gray-50 border border-gray-200 mb-4">
                                    {filePreview.previewUrl ? (
                                        <Image
                                            src={filePreview.previewUrl}
                                            alt={filePreview.file.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                            <FileText size={40} className="text-gray-400 mb-2" />
                                            <span className="text-[10px] text-gray-500 text-center break-all line-clamp-2">
                                                {filePreview.file.name}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="remove-file-btn"
                                        onClick={() => removeFile()}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            {errors.document && <span className="text-red-500 text-xs mt-1 block">{errors.document.message as string}</span>}
                        </div>
                        <div className="form-group">
                            <Label className="input-label">Description <span className="required">*</span></Label>
                            <textarea className={`form-select form-textarea ${errors.submissionText ? "border-red-500" : ""}`} {...register("submissionText")} placeholder="Enter description"></textarea>
                            {errors.submissionText && <span className="text-red-500 text-xs">{errors.submissionText.message}</span>}

                        </div>
                    </div>

                    <div className="submit-btn-wrapper">
                        <Button type="submit" variant="primary" className="py-2 px-5 submit-btn">Submit</Button>
                    </div>
                </form>
            </div>
        </>
    );
}
