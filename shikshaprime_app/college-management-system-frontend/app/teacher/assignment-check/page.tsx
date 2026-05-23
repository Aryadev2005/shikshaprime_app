"use client";

import React, { useState, useMemo, useEffect } from 'react';
import './assignment-check.css';
import { Search, ChevronDown, Filter, Eye, X, MoreVertical, Calendar, User, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import Image from 'next/image';
import { useAppSelector } from '@/src/store/hooks';
import { useApi } from "@/src/hooks/useApi";
import { useDebounce } from "@/src/hooks/useDebounce";
import { teacherGetStudentAssignment } from '@/src/services/teacherService';

// --- Dummy Data ---
export default function AssignmentCheckPage() {
    const { classes } = useAppSelector((state) => state.classes);
    const { departments } = useAppSelector((state) => state.departments);
    const { programs } = useAppSelector((state) => state.programs);
    const { TeacherDetails } = useAppSelector((state) => state.teaDetails);
    // --- States ---
    // const [activeCourse, setActiveCourse] = useState("English");
    const [activeStream, setActiveStream] = useState("");
    const [activeProgram, setActiveProgram] = useState("");

    const [filters, setFilters] = useState({
        class: "",
        section: "",
        rollNo: "",
        studentId: "",
        studentName: ""
    });

    const debouncedRollNo = useDebounce(filters.rollNo, 500);
    const debouncedStudentId = useDebounce(filters.studentId, 500);
    const debouncedStudentName = useDebounce(filters.studentName, 500);

    // const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    // const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    // const [gradeValue, setGradeValue] = useState("");
    // const [feedbackValue, setFeedbackValue] = useState("");



    // --- Handlers ---
    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            class: "",
            section: "",
            rollNo: "",
            studentId: "",
            studentName: ""
        });
    };


    const getStatusClass = (status: string) => {
        if (!status) return '';
        switch (status.toLowerCase()) {
            case 'not_submitted': return 'ac-status-pending';
            case 'overdue': return 'ac-status-overdue';
            case 'submitted': return 'ac-status-submitted';
            case 'graded': return 'ac-status-submitted'; // Keeping green for now
            default: return '';
        }
    };


    const { data: assignmentListData, loading: assignmentListDataLoading, error: assignmentListDataError, call: assignmentListDataCall }: any = useApi(teacherGetStudentAssignment);

    // --- Filtering Logic ---
    const filteredAssignments = useMemo(() => {
        return Array.isArray(assignmentListData?.data)
            ? assignmentListData.data
            : (assignmentListData?.data?.assignments || []);
    }, [assignmentListData]);

    useEffect(() => {
        assignmentListDataCall({
            stream: activeStream,
            program_id: activeProgram,
            class_id: filters.class,
            section_id: filters.section,
            roll_no: debouncedRollNo,
            student_id: debouncedStudentId,
            student_name: debouncedStudentName,
            page: 1,
            limit: 50
        });
    }, [activeStream, activeProgram, filters.class, filters.section, debouncedRollNo, debouncedStudentId, debouncedStudentName]);


    return (
        <div className="assignment-check-wrapper">
            {/* <div className="content-header">
                <h3>Assignment</h3>
                <div className="header-actions">
                </div>
            </div> */}

            {/* --- Top Teal Filter Bar --- */}
            <div className="ac-top-filter-bar">
                <div className="ac-course-block">
                    <span className="ac-course-label">Course Name:</span>
                    <span className="ac-course-value">{TeacherDetails?.designation}</span>
                </div>

                <div className="ac-divider"></div>

                <div className="ac-dropdown-block">
                    <span className="ac-dropdown-label">Stream: <span className='active-dropdown'>{departments?.find(d => d.id.toString() === activeStream)?.name || "Select Stream"}</span></span>
                    <ChevronDown className="ac-dropdown-icon" />
                    <select className="ac-dropdown-select" value={activeStream} onChange={(e) => setActiveStream(e.target.value)}>
                        <option value="" disabled>Select Stream</option>
                        {departments?.length > 0 && departments.map((item) => <option key={item?.id} value={item?.id}>{item?.name}</option>)}
                    </select>
                </div>

                <div className="ac-divider"></div>

                <div className="ac-dropdown-block">
                    <span className="ac-dropdown-label">Program: <span className='active-dropdown'>{programs?.find(p => p.id.toString() === activeProgram)?.name || "Select Program"}</span></span>
                    <ChevronDown className="ac-dropdown-icon" />
                    <select
                        className="ac-dropdown-select"
                        value={activeProgram}
                        onChange={(e) => setActiveProgram(e.target.value)}
                    >
                        <option disabled>Select Program</option>
                        {programs?.length > 0 && programs.map((item) => <option key={item?.id} value={item?.id}>{item?.name}</option>)}
                    </select>
                </div>

                <div className="ac-divider"></div>

                <div className="ac-dropdown-block" style={{ flex: 0, padding: '0.6rem' }}>
                    <MoreVertical className="ac-dropdown-icon" />
                </div>
            </div>

            {/* --- Secondary Search Row --- */}
            <div className="ac-filters-row">
                <div className="ac-filter-btn">
                    <Filter />
                </div>

                <div className="ac-filter-group">
                    <Label className="ac-filter-label">Class :</Label>
                    <select
                        className="ac-filter-select"
                        value={filters.class}
                        onChange={(e) => handleFilterChange('class', e.target.value)}
                    >
                        <option value="" disabled>Select Class</option>
                        {classes?.length > 0 && classes.map((item) => <option key={item?.id} value={item?.id}>{item?.name}</option>)}
                    </select>
                </div>

                <div className="ac-filter-group">
                    <Label className="ac-filter-label">Section :</Label>
                    <select
                        className="ac-filter-select"
                        value={filters.section}
                        onChange={(e) => handleFilterChange('section', e.target.value)}
                    >
                        <option value="">Select Section</option>
                        <option value="1st SEM">1st SEM</option>
                        <option value="2st SEM">2st SEM</option>
                        <option value="3st SEM">3st SEM</option>
                    </select>
                </div>

                <div className="ac-filter-icon-group">
                    <Label className="">Roll no :</Label>
                    <Input
                        type="text"
                        className="ac-filter-input"
                        placeholder="Search roll no"
                        value={filters.rollNo}
                        onChange={(e) => handleFilterChange('rollNo', e.target.value)}
                    />
                    <Search className="ac-search-icon" />
                </div>

                <div className="ac-filter-icon-group">
                    <Label className="ac-filter-label">Student ID :</Label>
                    <Input
                        type="text"
                        className="ac-filter-input"
                        placeholder="Search Student ID"
                        value={filters.studentId}
                        onChange={(e) => handleFilterChange('studentId', e.target.value)}
                    />
                    <Search className="ac-search-icon" />
                </div>

                <div className="ac-filter-icon-group">
                    <Label className="ac-filter-label">Student Name :</Label>
                    <Input
                        type="text"
                        className="ac-filter-input"
                        placeholder="Search Student"
                        value={filters.studentName}
                        onChange={(e) => handleFilterChange('studentName', e.target.value)}
                    />
                    <Search className="ac-search-icon" />
                </div>

                {Object.values(filters).some(v => v !== "") && (
                    <button className="ac-clear-btn" onClick={handleClearFilters} title="Clear Filters">
                        <X />
                    </button>
                )}
            </div>

            {/* --- Assignment List --- */}
            <div className="ac-list-wrapper">
                <h4 className="ac-list-title">Assignment List</h4>
                <div className="ac-table-scroll">
                    <table className="ac-table custom-student-table">
                        <thead>
                            <tr>
                                <th>Student name</th>
                                <th>Program</th>
                                <th>Class</th>
                                <th>Section</th>
                                <th className="ac-th-sortable ac-sort-active">
                                    <div className="ac-th-sort-wrapper">
                                        Submitted Date
                                        <ChevronDown className="ac-sort-icon" />
                                    </div>
                                </th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Mark</th>
                                <th>Grade</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignmentListDataLoading ? (
                                <tr>
                                    <td colSpan={9} className="ac-loading-cell">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            <span>Loading assignments...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAssignments.length > 0 ? (
                                filteredAssignments.map((item: any) => (
                                    <tr key={item.submission_id || item.assignment_id}>
                                        <td>
                                            <div className="ac-student-name-cell">
                                                <span className="ac-student-name">{item.student_name}</span>
                                                <span className="ac-student-id">- {item.student_id}</span>
                                            </div>
                                        </td>
                                        <td>{item.program_name}</td>
                                        <td>{item.class_name}</td>
                                        <td>{item.section_name}</td>
                                        <td>{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '--'}</td>
                                        <td>{item.title}</td>
                                        <td>
                                            <span className={`ac-status-badge ${getStatusClass(item.status)}`}>
                                                {item.status === "not_submitted" ? 'Pending' : item.status === "submitted" ? 'Submitted' : 'Graded'}
                                            </span>
                                        </td>
                                        <td>{item.marks_obtained} / {item.maximum_marks || 100}</td>
                                        <td>
                                            {item.marks_obtained === null || item.marks_obtained === undefined ? (
                                                <span className="ac-grade-dash">--</span>
                                            ) : (
                                                <span className="ac-grade-value">{item.grade}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="ac-action-cell">
                                                {/* <Link className='ac-view-btn' href={`/teacher/assignment-check/${item.submission_id}`} title="View Submission">
                                                    <Image src="/images/icons/view-icon-02.svg" alt="View" width={20} height={24} />
                                                </Link> */}
                                                {(item.status === 'not_submitted') && (
                                                    <Link className="ac-grade-btn" href={`/teacher/assignment-check/${item.submission_id}`} >Grade</Link>
                                                )}
                                                {(item.status === 'submitted' || item.status === 'graded') && (
                                                    <Link className='ac-view-btn' href={`/teacher/assignment-check/${item.submission_id}`} title="View Submission">
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="ac-empty-cell">
                                        <div className="ac-empty-content">
                                            <AlertCircle className="ac-empty-icon" />
                                            <p className="ac-empty-text">No assignments found</p>
                                            <p className="ac-empty-subtext">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
