"use client";
import React, { useState, useRef, useEffect } from "react";
import "../notices.css";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, UploadCloud, X, FileText, ImageIcon, AlertCircle, CheckCircle2, } from "lucide-react";
import { useApi } from "@/src/hooks/useApi";
import { getNoticesById, saveNotice } from "@/src/services/noticesService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { CapitalizedInput } from "@/src/components/ui/CapitalizedInput";
import { Button } from "@/components/ui/button";

// ----------------------------------------------------------------
// Zod Schema
// ----------------------------------------------------------------
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_EXTENSIONS = ".pdf, .jpg, .jpeg, .png";

const noticeSchema = z
    .object({
        title: z.string({ message: 'Notice title is required.' }).min(3, "Title must be at least 3 characters.").max(150, "Title must not exceed 150 characters."),
        description: z.string({ message: "Notice description is required." }).min(10, "Description must be at least 10 characters.").max(500, "Description must not exceed 500 characters."),
        from_date: z.string({ message: "From date is required." }).min(1, "From date is required."),
        to_date: z.string({ message: "To date is required." }).min(1, "To date is required."),
        // attachment is validated separately via useRef + custom state
    })
    .refine((data) => new Date(data.to_date) >= new Date(data.from_date), {
        message: "To date must be on or after From date.",
        path: ["to_date"],
    });

export type NoticeFormValues = z.infer<typeof noticeSchema>;

// ----------------------------------------------------------------
// Helper: file type icon
// ----------------------------------------------------------------
function FileIcon({ type }: { type: string }) {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    return <FileText className="h-4 w-4 text-red-500" />;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export default function CreateNoticePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [attachmentError, setAttachmentError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<NoticeFormValues>({
        resolver: zodResolver(noticeSchema),
    });
    const { call: submitNotice, loading: submitNoticeLoading } = useApi(saveNotice);

    const params = useParams();

    const searchParams = useSearchParams();
    const action = searchParams.get("action");


    // ---- File validation ----
    const validateFile = (file: File): string => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Only PDF, JPG, JPEG, or PNG files are allowed.";
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            return `File size must not exceed ${MAX_FILE_SIZE_MB} MB.`;
        }
        return "";
    };

    const handleFileChange = (file: File | undefined | null) => {
        if (!file) return;
        const err = validateFile(file);
        if (err) {
            setAttachmentError(err);
            setAttachedFile(null);
        } else {
            setAttachmentError("");
            setAttachedFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        handleFileChange(file);
    };

    const handleRemoveFile = () => {
        setAttachedFile(null);
        setAttachmentError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // View API call — only fires when action === 'view'
    const { data: viewNoticeData, call: callNoticeData } = useApi(getNoticesById);
    useEffect(() => {
        if (action !== 'view') return;   // guard: skip on create
        if (!params?.id) return;
        callNoticeData(params.id);
    }, [action, params?.id]);

    // Populate form fields when view data arrives
    useEffect(() => {
        if (!viewNoticeData?.data) return;
        const notice = viewNoticeData.data;
        console.log("Notice Data", notice);
        setValue('title', notice.notice.title);
        setValue('description', notice.notice.description);
        setValue('from_date', notice.notice.from_date);
        setValue('to_date', notice.notice.to_date);
    }, [viewNoticeData, setValue]);

    const getFileUrl = (path: string) => {
        if (!path) return "";
        return path.replace("http:", "https:").replace(
            "https://localhost/api", "http://localhost:8080/api"
        );
    };

    const attachmentUrl = getFileUrl(viewNoticeData?.data?.document?.notice_attachment || viewNoticeData?.data?.document?.notice_attachment);
    const fileExtension = attachmentUrl?.split('.').pop()?.toLowerCase();

    // ---- Submit ----
    const onSubmit = async (data: NoticeFormValues) => {
        // Attachment is required
        if (!attachedFile) {
            setAttachmentError("Attachment is required.");
            return;
        }
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("description", data.description);
            formData.append("from_date", data.from_date);
            formData.append("to_date", data.to_date);
            formData.append("noticeAttachment", attachedFile);

            const result = await submitNotice(formData);

            if (result?.status) {
                handleRemoveFile();
                reset();
                toast.success(result.message);
                router.push("/admin/notices");
            }
        } catch (err: any) {
            console.error("Error submitting notice:", err);
            toast.error('Notice create failed: ' + (err?.message || "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="notices-panel-wrapper">
            {/* Page Header */}
            <div className="mb-4">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                        onClick={() => router.push("/admin/notices")}
                        title="Back to Notices"
                        className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h3 className="text-dark text-lg font-semibold capitalize">{action} Notice</h3>
                </div>
            </div>

            {/* Form Card */}
            <div className="create-notice-card">
                <form onSubmit={handleSubmit(onSubmit)} noValidate>

                    {/* Notice Title */}
                    <div className="form-group">
                        <Label className="form-label" htmlFor="noticeTitle">Notice Title <span style={{ color: "#E53E3E" }}>*</span></Label>
                        <CapitalizedInput
                            id="noticeTitle"
                            type="text"
                            placeholder="e.g., Annual Sports Day 2026"
                            className="edit-input"
                            {...register("title")}
                            readOnly={action === 'view'}
                        />
                        {errors.title && (
                            <p className="field-error">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    {/* Notice Description */}
                    <div className="form-group">
                        <Label className="form-label" htmlFor="noticeDesc">
                            Notice Description <span style={{ color: "#E53E3E" }}>*</span>
                        </Label>
                        <textarea
                            id="noticeDesc"
                            placeholder="Write the full notice description here…"
                            className="notice-textarea"
                            rows={4}
                            {...register("description")}
                            readOnly={action === 'view'}
                        />
                        {errors.description && (
                            <p className="field-error">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errors.description.message}
                            </p>
                        )}
                        <span className="text-xs text-primary">MAX 500 Characters</span>
                    </div>

                    {/* From Date & To Date */}
                    <div className="notice-form-grid" style={{ marginBottom: "1rem" }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <Label className="form-label" htmlFor="fromDate">
                                From Date <span style={{ color: "#E53E3E" }}>*</span>
                            </Label>
                            <Input
                                id="fromDate"
                                type="date"
                                className="date-input"
                                {...register("from_date")}
                                readOnly={action === 'view'}
                            />
                            {errors.from_date && (
                                <p className="field-error">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {errors.from_date.message}
                                </p>
                            )}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <Label className="form-label" htmlFor="toDate">
                                To Date <span style={{ color: "#E53E3E" }}>*</span>
                            </Label>
                            <Input
                                id="toDate"
                                type="date"
                                className="date-input"
                                {...register("to_date")}
                                readOnly={action === 'view'}
                            />
                            {errors.to_date && (
                                <p className="field-error">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {errors.to_date.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Attachment Upload (Create mode) */}
                    {action === 'create' && (
                        <div className="form-group">
                            <Label className="form-label">
                                Attachment <span style={{ color: "#E53E3E" }}>*</span>
                                <span style={{ fontWeight: 400, color: "#A0AEC0", fontSize: "0.75rem", marginLeft: "6px" }}>(PDF, JPG, JPEG, PNG — max 1 MB)</span>
                            </Label>
                            {!attachedFile ? (
                                <div
                                    className={`attachment-dropzone${dragOver ? " drag-over" : ""}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input ref={fileInputRef} type="file" accept={ALLOWED_EXTENSIONS} style={{ display: "none" }} onChange={(e) => handleFileChange(e.target.files?.[0])} />
                                    <div className="attachment-dropzone-icon">
                                        <UploadCloud className="h-8 w-8 mx-auto" />
                                    </div>
                                    <p className="attachment-dropzone-text">Click to browse or drag & drop your file here</p>
                                    <p className="attachment-dropzone-hint">PDF, JPG, JPEG, PNG — Max 5 MB</p>
                                </div>
                            ) : (
                                <div className="attachment-preview">
                                    <FileIcon type={attachedFile.type} />
                                    <span>{attachedFile.name}</span>
                                    <span style={{ color: "#A0AEC0", fontSize: "0.75rem" }}>({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                                    <button type="button" className="attachment-preview-remove" onClick={handleRemoveFile} title="Remove file">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            {attachmentError && (
                                <p className="field-error">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {attachmentError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* View Attachment (View mode) */}
                    {action === 'view' && attachmentUrl && (
                        <div className="form-group mt-6">
                            <Label className="form-label mb-3">Notice Attachment</Label>
                            <div className="attachment-viewer-container border rounded-lg overflow-hidden bg-gray-50 p-4">
                                {['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '') ? (
                                    <div className="flex justify-center">
                                        <img
                                            src={attachmentUrl}
                                            alt="Notice Attachment"
                                            className="max-w-full h-auto rounded shadow-sm"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                toast.error("Failed to load image");
                                            }}
                                        />
                                    </div>
                                ) : fileExtension === 'pdf' ? (
                                    <iframe
                                        src={`${attachmentUrl}#toolbar=0`}
                                        width="100%"
                                        height="600px"
                                        title="PDF Viewer"
                                        className="rounded border"
                                    ></iframe>
                                ) : ['doc', 'docx'].includes(fileExtension || '') ? (
                                    <div className="flex flex-col items-center p-8 bg-white rounded border border-dashed">
                                        <FileText className="h-12 w-12 text-blue-500 mb-3" />
                                        <p className="text-sm font-medium text-gray-700 mb-4">Document: {attachmentUrl.split('/').pop()}</p>
                                        <div className="flex gap-3">
                                            <a
                                                href={attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-primary text-white px-4 py-2 rounded text-sm hover:opacity-90 transition-all"
                                            >
                                                Download Document
                                            </a>
                                            <a
                                                href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(attachmentUrl)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:opacity-90 transition-all font-medium"
                                            >
                                                View Online
                                            </a>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-4 text-center">
                                            * Online viewing requires a publicly accessible URL. <br />
                                            If on localhost, please use the Download button.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center p-8">
                                        <AlertCircle className="h-10 w-10 text-yellow-500 mb-2" />
                                        <p className="text-sm text-gray-600">File type not supported for direct preview.</p>
                                        <a
                                            href={attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 text-primary underline text-sm font-medium"
                                        >
                                            Download File
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {
                        action === 'create' && (
                            <div className="notice-form-actions">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="text-white px-6 py-2 rounded-md text-sm font-semibold transition-all"
                                    disabled={isSubmitting}
                                    style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
                                >
                                    {isSubmitting ? "Submitting…" : "Create Notice"}
                                </Button>
                            </div>
                        )
                    }
                </form>
            </div>
        </div>
    );
}
