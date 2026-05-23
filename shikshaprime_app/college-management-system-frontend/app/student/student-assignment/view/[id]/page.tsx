"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, Trash2, CheckSquare, Square, FileText, Eye, FileIcon, Image as LucideImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import "./view.css";
import { format } from 'date-fns';
import Zoom, { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useApi } from "@/src/hooks/useApi";
import { studentAssignmentView } from "@/src/services/assignmentService";
import { useAppSelector } from "@/src/store/hooks";
import { useSearchParams, useRouter, useParams } from "next/navigation";

export default function StudentAssignmentViewPage({ params }: { params: { id: string; title: string } }) {
    const { data: studentAssignmentViewList, error: studentAssignmentError, loading: studentAssignmentLoading, call: getStudentAssignmentCall } = useApi(studentAssignmentView);
    const studentDetails = useAppSelector((state) => state.stuDetails.StudentDetails);
    // const searchParams = useSearchParams();
    const [zoomedImg, setZoomedImg] = useState<string | null>(null);
    const [selectedDocs, setSelectedDocs] = useState<(string | number)[]>([]);
    const param = useParams();
    const [studentData, setStudentData] = useState<{
        documents: any[];
        date: string;
        status: string;
        title: string;
        submissionText: string,
    }>({ documents: [], date: '', status: '', title: '', submissionText: '' });


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
                return <FileText size={20} className="text-red-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
                return <LucideImage size={20} className="text-blue-500" />;
            case 'doc':
            case 'docx':
                return <FileText size={20} className="text-blue-700" />;
            case 'ppt':
            case 'pptx':
                return <FileText size={20} className="text-orange-500" />;
            default:
                return <FileIcon size={20} className="text-gray-500" />;
        }
    };


    // useEffect(() => {
    //     const dataParam = searchParams.get('data');
    //     if (dataParam) {
    //         try {
    //             const assignmentInfo = JSON.parse(dataParam);
    //             if (assignmentInfo && assignmentInfo.id) {
    //                 getStudentAssignmentCall(assignmentInfo.id);
    //             }
    //         } catch (err) {
    //             console.error("Failed to parse assignmentInfo from query param", err);
    //         }
    //     }
    // }, [searchParams]);

    useEffect(() => { console.log(param?.id); if (param?.id) { getStudentAssignmentCall(param?.id) } }, [param]);


    useEffect(() => {
        if (studentAssignmentViewList?.data) {
            console.log("Processing API data:", studentAssignmentViewList.data);
            const data = studentAssignmentViewList.data;

            // Handle documents properly as an array of objects for the UI
            const documentsRaw = data?.document?.submitted_file;
            const documentsArray = Array.isArray(documentsRaw) ? documentsRaw : (documentsRaw ? [documentsRaw] : []);

            const mappedDocs = documentsArray.map((doc: any, index: number) => {
                const url = typeof doc === 'string' ? doc : (doc.url || doc.path || doc.file_url || '');
                const formattedUrl = getFileUrl(url);
                const isPdf = url.toLowerCase().endsWith('.pdf');

                return {
                    id: index,
                    preview: formattedUrl,
                    url: formattedUrl,
                    isPdf: isPdf,
                    title: typeof doc === 'string' ? url.split('/').pop() : (doc.title || doc.file_name || `Document ${index + 1}`)
                };
            });

            setStudentData(prev => ({
                documents: mappedDocs,
                date: data?.submission?.submitted_at || prev.date,
                status: data?.submission.status || prev.status,
                title: data?.submission?.assignment_title || prev.title,
                submissionText: data?.submission?.submission_text || prev.submissionText,
            }));
        }
    }, [studentAssignmentViewList]);

    return (
        <>
            <div className="view-assignment-container p-0 space-y-3">
                {/* Header */}
                <div className="assignment-header-card flex flex-col md:flex-row justify-between items-center rounded-lg gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Link href="/student/student-assignment">
                            <Button
                                size="icon"
                                className="bg-primary text-white rounded-md h-9 w-9 shadow-md border-0"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800">{studentData?.title}</h2>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <span className="font-semibold text-slate-700 text-sm md:text-base">Date: {studentData?.date ? format(new Date(studentData.date), 'dd MMM yyyy') : '--'}</span>
                        <span className={`px-6 py-2 rounded-md font-medium text-sm text-white shadow-sm uppercase ${studentData?.status === 'Pending' ? 'bg-[#E91E63]' : 'bg-green-500'}`}>
                            {studentData?.status}
                        </span>
                    </div>

                </div>

                {/* Selection Toolbar */}

                {/* Main Card */}
                <div className="form-card">
                    {/* Student Info */}
                    <div className="mb-8">
                        <h3 className="text-xl md:text-2xl font-bold text-[#146CDF] mb-4">{studentDetails?.student_name}</h3>
                        <div className="flex flex-wrap items-center gap-y-3 text-sm md:text-base text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="mr-4">
                                <span className="bg-[var(--bg-info-color)] text-white px-3 py-1 rounded text-sm font-bold shadow-sm">
                                    Roll: {studentDetails.roll_number}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mr-4">
                                <span>Program:</span>
                                <span className="font-bold text-slate-900">{studentDetails.program_name}</span>
                            </div>
                            <div className="hidden md:block w-px h-5 bg-slate-300 mx-2"></div>
                            <div className="flex items-center gap-2 mr-4">
                                <span>Class:</span>
                                <span className="font-bold text-slate-900">{studentDetails.class_name}</span>
                            </div>
                            <div className="hidden md:block w-px h-5 bg-slate-300 mx-2"></div>
                            <div className="flex items-center gap-2">
                                <span>Section:</span>
                                <span className="font-bold text-slate-900">{studentDetails.section_name}</span>
                            </div>
                            <div className="items-center gap-2 w-full" style={{ flex: '0 0 100%' }}>
                                <span className="font-bold">Submission Text:</span>
                                <span className="font-normal text-slate-900 w-full block mt-1 p-3 bg-white rounded border border-slate-200">{studentData.submissionText || 'No text provided'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Teacher Attachments */}
                    {studentAssignmentViewList?.data?.transformedAttachments && studentAssignmentViewList.data.transformedAttachments.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                {/* <FileText className="h-5 w-5 text-blue-600" /> */}
                                Assignment Attachments
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {studentAssignmentViewList.data.transformedAttachments.map((attachment: any) => (
                                    <div key={attachment.attachment_id} className="teacher-attachment-item flex items-center justify-between p-3 border rounded-lg bg-white border-slate-200 hover:shadow-sm transition-all duration-200 shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="teacher-attachment-icon shrink-0 p-2 bg-slate-50 rounded-md">
                                                {getFileIcon(attachment.file_name)}
                                            </div>

                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-slate-700 truncate" title={attachment.file_name}>
                                                    {attachment.file_name}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1 border border-blue-100"
                                            onClick={() => window.open(getFileUrl(attachment.file_url), '_blank')}
                                        >
                                            <Eye size={14} />
                                            View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            {/* <CheckSquare className="h-5 w-5 text-green-600" /> */}
                            Submitted Assignment Docs
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {studentAssignmentLoading ? (
                            <Loader />
                        ) : studentData?.documents?.length > 0 ? (
                            studentData.documents.map((doc: any) => (
                                <div key={doc.id} className={`doc-preview-card border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md group relative transition-all duration-200 ${selectedDocs.includes(doc.id) ? 'ring-2 ring-blue-500 border-blue-500 scale-[1.02]' : 'border-slate-200'}`}>
                                    <div className="relative aspect-[4/2] w-full bg-slate-100 flex items-center justify-center">
                                        {doc.isPdf ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-12 w-12 text-red-500" />
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    View PDF
                                                </a>
                                            </div>
                                        ) : (
                                            <>
                                                <ControlledZoom
                                                    isZoomed={zoomedImg === doc.preview}
                                                    onZoomChange={(zoom) => {
                                                        setZoomedImg(zoom ? doc.preview : null);
                                                    }}
                                                >
                                                    <img
                                                        src={doc.preview}
                                                        alt={doc.title}
                                                        draggable={false}
                                                        className="w-full h-full object-contain"
                                                        style={{ background: "#fff" }}
                                                    />
                                                </ControlledZoom>
                                                {zoomedImg !== doc.preview && (
                                                    <button
                                                        className="absolute top-3 right-3 bg-[#0F172A]/80 backdrop-blur-sm text-white p-2 rounded-md hover:bg-[#0F172A] shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                        onClick={() => setZoomedImg(doc.preview)}
                                                        type="button"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                                        <p className="text-xs font-semibold text-slate-600 truncate">{doc.title}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-white rounded-full shadow-sm">
                                        <Trash2 className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No documents uploaded yet</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
