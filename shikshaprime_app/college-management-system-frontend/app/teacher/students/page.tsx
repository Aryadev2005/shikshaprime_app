"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import "./students.css";
import "./[id]/student-details.css";
import { useAppSelector } from "@/src/store/hooks";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    MoreHorizontal,
    Edit,
    User
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApi } from "@/src/hooks/useApi";
import { getStudents, getStudentsByClass, searchStudents, Student } from "@/src/services/studentService";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/src/context/authContext";
import { useNotify } from "@/src/context/notificationContext";
import { Loader } from "@/components/ui/loader";
import Image from "next/image";

export default function StudentPanelPage() {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { success: notifySuccess, error: notifyError } = useNotify();

    // const { data, error, loading, call } = useApi(getStudents);
    const { data: searchData, loading: searchLoading, call: callSearch } = useApi(searchStudents);
    const { data: studentData, loading: studentDataLoading, call: studentDataCall } = useApi(getStudentsByClass);

    const [students, setStudents] = useState<Student[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const hasFetched = useRef(false);
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Redux state for dropdowns
    const { academicYears } = useAppSelector((state) => state.academic);
    const { departments } = useAppSelector((state) => state.departments);
    const { TeacherDetails } = useAppSelector((state) => state.teaDetails);


    // Search filter states
    const [rollNumberFilter, setRollNumberFilter] = useState("");
    const [studentNameFilter, setStudentNameFilter] = useState("");
    const [studentEmailFilter, setStudentEmailFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [academicYearFilter, setAcademicYearFilter] = useState("");

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        // fetchStudents(1);
    }, []);


    const studentFetchList = async (teacherDetails: any) => {
        if (!teacherDetails?.teacher_classes || teacherDetails.classes.length === 0) return;
        
        setIsLoading(true);
        try {
            const academicYearId = teacherDetails.classes[0]?.academic_year_id;
            const departmentId = teacherDetails.subject?.department?.id;
            
            const results = await Promise.all(
                teacherDetails.classes.map((cls: any) => {
                    // console.log("TeacherDetails ====>", cls);
                    return studentDataCall(
                        String(cls.program?.id),
                        String(cls?.subject?.department?.id),
                        String(academicYearId),
                        String(cls.class?.id)
                    )
                }
                )
            );
            console.log("Student Details ====>", results);
            // Aggregate all students from all classes and remove duplicates by student id
            const allStudents = results.flatMap((res: any) => res?.data || []);
            const uniqueStudents = Array.from(new Map(allStudents.map((s: any) => [s.id, s])).values());

            setStudents(uniqueStudents);
            setTotalStudents(uniqueStudents.length);
            setTotalPages(1);
        } catch (error) {
            console.error("Error fetching students by class:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        studentFetchList(TeacherDetails);
    }, [TeacherDetails]);

    // Handle search
    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const filters: any = {};
            if (rollNumberFilter.trim()) filters.roll_number = rollNumberFilter.trim();
            if (studentNameFilter.trim()) filters.student_name = studentNameFilter.trim();
            if (studentEmailFilter.trim()) filters.email = studentEmailFilter.trim();
            if (departmentFilter.trim()) filters.dept_name = departmentFilter.trim();
            if (academicYearFilter.trim()) filters.academic_year = academicYearFilter.trim();

            // Only search if at least one filter is provided
            if (Object.keys(filters).length === 0) {
                setIsSearchActive(false);
                return;
            }

            const response = await callSearch(filters);
            if (response?.data) {
                setStudents(response.data);
                setTotalStudents(response.count || response.data.length);
                setTotalPages(Math.ceil((response.count || response.data.length) / 50));
                setIsSearchActive(true);
            }
        } catch (err) {
            console.error("Error searching students:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear search
    const handleClearSearch = () => {
        setRollNumberFilter("");
        setStudentNameFilter("");
        setStudentEmailFilter("");
        setDepartmentFilter("");
        setAcademicYearFilter("");
        setIsSearchActive(false);
        studentFetchList(TeacherDetails);
    };

    // Navigate to student details
    const handleViewStudent = (studentId: number) => {
        setIsLoading(true);
        if (!studentId || isNaN(studentId)) {
            console.error("Invalid student ID:", studentId);
            return;
        }
        router.push(`/teacher/students/${studentId}`);
    };

    // Handle edit student
    const handleEditStudent = (studentId: number) => {
        setIsLoading(true);
        if (!studentId || isNaN(studentId)) {
            console.error("Invalid student ID:", studentId);
            return;
        }
        router.push(`/teacher/students/${studentId}?edit=true`);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        if (isSearchActive) {
            // If search is active, re-search with new page
            handleSearch();
        } else {
            studentFetchList(TeacherDetails);
            // fetchStudents(page);
        }
    };



    return (
        <>
            {console.log("Student List ======>", students)}
            {isLoading && <Loader />}
            <div className="student-panel-wrapper">
                {/* Header Card */}
                {/* <div className="student-header-card">
                <h2 className="student-header-title">Search Students</h2>
            </div> */}

                {/* Search Filters Row */}
                <div className="search-filters-row">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Student Roll No"
                            value={rollNumberFilter}
                            onChange={(e) => setRollNumberFilter(e.target.value)}
                            className="search-input"
                        />
                        <Search className="search-icon" />
                    </div>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Student Name"
                            value={studentNameFilter}
                            onChange={(e) => setStudentNameFilter(e.target.value)}
                            className="search-input"
                        />
                        <Search className="search-icon" />
                    </div>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Student Email"
                            value={studentEmailFilter}
                            onChange={(e) => setStudentEmailFilter(e.target.value)}
                            className="search-input"
                        />
                        <Search className="search-icon" />
                    </div>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Department Name"
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="search-input"
                        />
                        <Search className="search-icon" />
                    </div>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Academic Year (e.g., 2025)"
                            value={academicYearFilter}
                            onChange={(e) => setAcademicYearFilter(e.target.value)}
                            className="search-input"
                        />
                        <Search className="search-icon" />
                    </div>
                    <button className="search-btn" onClick={handleSearch}>
                        <Search className="h-5 w-5" />
                    </button>
                    {isSearchActive && (
                        <button className="clear-btn" onClick={handleClearSearch} title="Clear Search">
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Student Table */}
                <div className="student-table-wrapper">
                    <table className="student-table">
                        <thead>
                            <tr>
                                <th>Roll No.</th>
                                <th>Reg No</th>
                                <th>Student Name</th>
                                <th>Dept</th>
                                <th>Email</th>
                                <th>Phone No.</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchLoading || isLoading ? (
                                <tr>
                                    <td colSpan={7} className="loading-cell">Loading...</td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty-cell">No students found</td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="id-cell">{student.roll_number || student.id}</td>
                                        <td>{student.university_registration_number ? student.university_registration_number : '--'}</td>
                                        <td>{student.student_name}</td>
                                        {/* <td>{student.father_name}</td> */}
                                        <td>{departments?.find((d: any) => d.id === Number(student.department_id))?.name || student.department_id || "-"}</td>
                                        <td>{student.email}</td>
                                        <td>{student.mobile}</td>
                                        <td>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="view-btn" title="More Actions">
                                                        <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/more-icon.svg`} alt="" width={24} height={24} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleViewStudent(student.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </DropdownMenuItem>
                                                    {user?.user_type !== "teacher" && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleEditStudent(student.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-wrapper">
                    <button
                        className="page-nav-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    {(() => {
                        // Logic to determine visible page numbers
                        const maxVisible = 5;
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                        // Adjust start if we're near the end to keep 5 items visible if possible
                        if (endPage - startPage + 1 < maxVisible) {
                            startPage = Math.max(1, endPage - maxVisible + 1);
                        }

                        const pages = [];
                        for (let i = startPage; i <= endPage; i++) {
                            pages.push(i);
                        }

                        return pages.map((page) => (
                            <button
                                key={page}
                                className={`page-num-btn ${currentPage === page ? "active" : ""}`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ));
                    })()}

                    <button
                        className="page-nav-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </>
    );
}
