"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Maximize2, Download, Eye, FileText, Image as ImageIcon, FilePieChart, Loader2, Check, View } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import './assignment-check-view.css';
import { useApi } from "@/src/hooks/useApi";
import { teacherStudentAssignmentSubmit, teacherViewStudentAssignment } from '@/src/services/teacherService';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';
import { buildApiUrl } from '@/src/utils/tenantUrlBuilder';
import { useTenant } from '@/src/hooks/useTenant';

// --- Types ---
interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'ppt' | 'jpg' | 'png';
    url: string;
}

interface StudentSubmission {
    id: string;
    student_name: string;
    roll_number: string;
    stream: string;
    program: string;
    class: string;
    section: string;
    assignmentTitle: string;
    documents: Document[];
    status: string;
    subject_name: string;
    maximum_marks: string;
    submission_text: string;
    title: string;
    type: string;
    grade: string;
    marks_obtained: string;
}

export default function AssignmentCheckViewPage() {
    const params = useParams();
    const router = useRouter();
    const [submission, setSubmission] = useState<StudentSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [mark, setMark] = useState("");
    const [zoom, setZoom] = useState(1);

    const tenant = useTenant();

    const { data: viewAssignmentData, error: errorAssignmentData, loading: loadingAssignmentData, call: callAssignmentData } = useApi(teacherViewStudentAssignment);
    const { data: assignmentSubmitData, error: errorAssignmentSubmitData, loading: loadingAssignmentSubmitData, call: callAssignmentSubmitData } = useApi(teacherStudentAssignmentSubmit);
    useEffect(() => {
        callAssignmentData(params.id)
    }, [params.id]);

    useEffect(() => {
        console.log("viewAssignmentData =====>", viewAssignmentData, loadingAssignmentData)
        if (viewAssignmentData?.data) {
            const data = viewAssignmentData.data;
            setSubmission(data);

            if (data.file_url) {
                const fileUrl = data.file_url;
                const parts = fileUrl.split('.');
                const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : '';

                // Map extension to supported document types
                let type: 'pdf' | 'jpg' | 'png' | 'doc' | 'ppt' = 'pdf';
                if (['jpg', 'jpeg'].includes(extension)) type = 'jpg';
                else if (extension === 'png') type = 'png';
                else if (['doc', 'docx'].includes(extension)) type = 'doc';
                else if (['ppt', 'pptx'].includes(extension)) type = 'ppt';

                setSelectedDoc({
                    id: 'main-file',
                    name: fileUrl.split('/').pop() || 'Assignment File',
                    type: type,
                    url: fileUrl
                });
            }
        }
    }, [viewAssignmentData]);

    const handleBack = () => {
        router.back();
    };

    const handleZoom = () => {
        setZoom(prev => (prev >= 2 ? 1 : prev + 0.25));
    };

    if (!submission) {
        return <div>Submission not found</div>;
    }
    const getFileUrl = (path: string) => {
        if (!path) return "";
        return buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), path);
    };
    const renderViewer = () => {
        if (!selectedDoc) return null;

        switch (selectedDoc.type) {
            case 'jpg':
            case 'png':
                return (
                    <img
                        src={tenant ? getFileUrl(selectedDoc.url) : null}
                        alt={selectedDoc.name}
                        className="acv-image-viewer"
                        style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
                    />
                );
            case 'pdf':
                return (
                    <iframe
                        // src={`${getFileUrl(selectedDoc.url)}#view=FitH`}
                        src={`${tenant ? getFileUrl(selectedDoc.url) : ''}`}
                        className="acv-document-viewer"
                        title={selectedDoc.name}
                    />
                );
            case 'doc':
            case 'ppt':
                // For local development, displaying an info message. 
                // In production, you might use Google Docs Viewer or Office Viewer fallback.
                return (
                    <div className="acv-loading flex-col gap-4">
                        <FileText size={64} />
                        <p className="text-xl font-medium">{selectedDoc.name}</p>
                        <p className="text-sm opacity-70">Document viewer for {selectedDoc.type.toUpperCase()} requires external integration or download.</p>
                        <Button variant="outline" className="mt-4 text-white hover:text-black">
                            <Download className="mr-2" size={16} /> Download to View
                        </Button>
                    </div>
                );
            default:
                return <div className="acv-loading">Unsupported file type</div>;
        }
    };

    const getDocIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="text-red-500" size={16} />;
            case 'jpg':
            case 'png': return <ImageIcon className="text-blue-500" size={16} />;
            case 'doc': return <FileText className="text-blue-700" size={16} />;
            case 'ppt': return <FilePieChart className="text-orange-500" size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const calculateGrade = (marksValue: number) => {
        if (marksValue >= 90) return 'A+';
        if (marksValue >= 80) return 'A';
        if (marksValue >= 70) return 'B';
        if (marksValue >= 60) return 'C';
        if (marksValue >= 50) return 'D';
        if (marksValue <= 50) return 'E';
        return '--';
    };

    const handleProceed = () => {
        console.log("Submitting marks:", mark, calculateGrade(Number(mark)));
        // Call gradeSubmission API here
        callAssignmentSubmitData(params?.id, {
            marks_obtained: mark,
            feedback: "",
            graded_by: calculateGrade(Number(mark)),
        });
        // console.log("assignmentSubmitData", assignmentSubmitData);
        toast.success("Assignment submitted successfully");
        router.push("/teacher/assignment-check");
    };

    return (
        <>
            {/* {!loadingAssignmentData && <Loader />} */}
            <div className="acv-wrapper animate-in fade-in duration-500">
                <div className="acv-header-card">
                    <div className='flex items-center '>
                        <button className="acv-back-btn mr-5" onClick={handleBack}><ChevronLeft size={24} /></button>
                        <h2 className="acv-student-name">{submission.student_name}</h2>
                    </div>

                    <div className="acv-student-info">
                        <div className="acv-student-meta">
                            <div className="acv-meta-item">
                                <span className="acv-meta-label">Roll:</span>
                                <span className="acv-meta-value">{submission.roll_number}</span>
                            </div>
                            <div className="acv-meta-divider"></div>
                            <div className="acv-meta-item">
                                <span className="acv-meta-label">Type:</span>
                                <span className="acv-meta-value">{submission.type}</span>
                            </div>
                            <div className="acv-meta-divider"></div>
                            <div className="acv-meta-item">
                                <span className="acv-meta-label">Program:</span>
                                <span className="acv-meta-value text-[0.8rem]">{submission.program}</span>
                            </div>
                            <div className="acv-meta-divider"></div>
                            <div className="acv-meta-item">
                                <span className="acv-meta-label">Class:</span>
                                <span className="acv-meta-value">{submission.class}</span>
                            </div>
                            <div className="acv-meta-divider"></div>
                            <div className="acv-meta-item">
                                <span className="acv-meta-label">Section:</span>
                                <span className="acv-meta-value">{submission.section}</span>
                            </div>
                        </div>
                    </div>

                    {/* <div className="acv-task-action">
                        <span className="acv-task-label">Assignment Task:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="acv-view-btn flex items-center gap-2">
                                    View <ChevronLeft className="-rotate-90" size={14} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="acv-doc-dropdown-content">
                                {submission?.documents?.map((doc) => (
                                    <DropdownMenuItem
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc)}
                                        className="flex items-center gap-3 cursor-pointer"
                                    >
                                        {getDocIcon(doc.type)}
                                        <span className="flex-1 truncate">{doc.name}</span>
                                        {selectedDoc?.id === doc.id && <Check size={14} className="text-green-500" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div> */}
                </div>

                <div className="acv-main-content">
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <span className="text-label-color">Title:</span>
                            <span className="text-dark text-md font-semibold capitalize">{submission?.title}</span>
                        </div>
                        {
                            submission?.marks_obtained && (
                                <div className='bg-green-200 rounded-md border border-green-500 w-fit p-1 flex items-center'>
                                    <span className='bg-green-500 rounded-md p-2 text-white text-sm w-10 h-10 flex items-center justify-center me-5'>{submission?.grade}</span>
                                    <span className='text-lg font-semibold me-5'>{submission?.marks_obtained} / {submission?.maximum_marks}</span>
                                </div>
                            )
                        }
                    </div>
                    <div className='flex items-start gap-2 flex-col'>
                        <span className="text-label-color">Description:</span>
                        <span className="text-dark text-sm font-normal capitalize" style={{ fontSize: '0.9rem' }}>{submission?.submission_text}</span>
                    </div>

                    <div className="acv-viewer-container">
                        <div className="w-full flex items-center justify-center p-4" style={{ height: '500px' }}>
                            {renderViewer()}
                            {/* <>{console.log("Processed File Path:", selectedDoc ? getFileUrl(selectedDoc.url) : "no-doc")}</> */}
                        </div>

                        {(selectedDoc?.type === 'jpg' || selectedDoc?.type === 'png') && (
                            <button className="acv-zoom-btn" onClick={handleZoom} title="Zoom In">
                                <Maximize2 size={20} />
                            </button>
                        )}
                        <Link href={tenant ? getFileUrl(selectedDoc?.url) : ''} target="_blank" className='absolute right-5 top-5 p-2 bg-primary rounded-md'><Eye size={20} color='white' /></Link>
                    </div>
                    {
                        !submission?.marks_obtained && (
                            <div className="acv-footer-actions">
                                <div className="acv-mark-input-group">
                                    <span className="acv-input-label">Enter Mark</span>
                                    <div className="acv-input-wrapper">
                                        <Input
                                            type="number"
                                            className="acv-mark-input"
                                            placeholder="Enter mark"
                                            value={mark}
                                            onChange={(e) => setMark(e.target.value)}
                                        />
                                        {
                                            mark && <span className="acv-grade-tag">{calculateGrade(Number(mark))}</span>
                                        }
                                    </div>
                                </div>

                                <Button variant='primary' className="acv-proceed-btn" onClick={handleProceed}>
                                    Proceed
                                </Button>
                            </div>
                        )
                    }
                </div>
            </div>
        </>
    );
}
