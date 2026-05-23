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
    User,
    Download
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
import { StudentIdCardList } from "./StudentIdCard";
import { Button } from "@/components/ui/button";

export default function StudentPanelPage() {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { success: notifySuccess, error: notifyError } = useNotify();

    const { data, error, loading, call } = useApi(getStudents);
    const { data: searchData, loading: searchLoading, call: callSearch } = useApi(searchStudents);
    const { data: studentData, loading: studentDataLoading, call: studentDataCall } = useApi(getStudentsByClass);

    const [students, setStudents] = useState<Student[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const hasFetched = useRef(false);
    const [isSearchActive, setIsSearchActive] = useState(false);

    // ID Card Selection state
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [isGeneratingId, setIsGeneratingId] = useState<boolean>(false);

    // Redux state for dropdowns
    // const { academicYears } = useAppSelector((state) => state.academic);
    const { departments } = useAppSelector((state) => state.departments);

    // Search filter states
    const [rollNumberFilter, setRollNumberFilter] = useState("");
    const [studentNameFilter, setStudentNameFilter] = useState("");
    const [studentEmailFilter, setStudentEmailFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [academicYearFilter, setAcademicYearFilter] = useState("");

    // Fetch students on mount
    const fetchStudents = async (page: number = 1) => {
        setIsLoading(true);
        try {
            const response = await call(page, 50);
            if (response?.data) {
                setStudents(response.data);
                setTotalStudents(response.count || response.data.length);
                setTotalPages(Math.ceil((response.count || response.data.length) / 50));
            }
        } catch (err) {
            console.error("Error fetching students:", err);
            setStudents([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchStudents(1);
    }, []);

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
                fetchStudents(1);
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
        fetchStudents(1);
    };

    // Navigate to student details
    const handleViewStudent = (studentId: number) => {
        setIsLoading(true);
        if (!studentId || isNaN(studentId)) {
            console.error("Invalid student ID:", studentId);
            return;
        }
        router.push(`/admin/students/${studentId}`);
    };

    // Handle edit student
    const handleEditStudent = (studentId: number) => {
        setIsLoading(true);
        if (!studentId || isNaN(studentId)) {
            console.error("Invalid student ID:", studentId);
            return;
        }
        router.push(`/admin/students/${studentId}?edit=true`);
    };

    // Format date for display
    const formatDate = (dateString: string | undefined | null) => {
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
            fetchStudents(page);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudents(students.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (studentId: number, checked: boolean) => {
        if (checked) {
            setSelectedStudents(prev => [...prev, studentId]);
        } else {
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        }
    };

    const generateSelectedIDCards = async () => {
        if (selectedStudents.length === 0) return;
        setIsGeneratingId(true);

        const cardWidth = 54;   // mm
        const cardHeight = 86;  // mm

        let successCount = 0;

        try {
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            for (const studentId of selectedStudents) {
                const el = document.getElementById(`id-card-${studentId}`);
                if (!el) continue;

                const canvas = await html2canvas(el, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    onclone: (clonedDoc) => {
                        // Remove Tailwind v4 stylesheets to avoid lab/oklch color parsing errors
                        clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.remove());
                        clonedDoc.querySelectorAll('style').forEach(el => el.remove());
                    }
                });

                const imgData = canvas.toDataURL('image/png');

                // Create a card-sized PDF for each student individually
                const pdf = new jsPDF('p', 'mm', [cardWidth, cardHeight]);
                pdf.addImage(imgData, 'PNG', 0, 0, cardWidth, cardHeight);

                // Find the student name to use in file name
                const student = students.find(s => s.id === studentId);
                const safeName = student?.student_name
                    ? student.student_name.replace(/\s+/g, '_')
                    : String(studentId);

                pdf.save(`Student_ID_Card_${safeName}.pdf`);
                successCount++;
            }

            if (successCount > 0) {
                notifySuccess(`Downloaded ${successCount} ID Card${successCount > 1 ? 's' : ''} successfully.`);
            }
        } catch (error) {
            console.error("Error generating ID cards:", error);
            notifyError("Failed to generate ID cards.");
        } finally {
            setIsGeneratingId(false);
        }
    };

    const downloadIndividualIDCard = async (studentId: number) => {
        try {
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            const el = document.getElementById(`id-card-${studentId}`);
            if (!el) return;

            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    // Remove all stylesheets to avoid lab/oklch color parsing errors from Tailwind v4
                    clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.remove());
                    clonedDoc.querySelectorAll('style').forEach(el => el.remove());
                }
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', [54, 86]);
            pdf.addImage(imgData, 'PNG', 0, 0, 54, 86);
            pdf.save(`Student_ID_Card_${studentId}.pdf`);
            notifySuccess('ID Card generated successfully.');
        } catch (error) {
            console.error("Error generating ID card:", error);
            notifyError("Failed to generate ID card.");
        }
    };

    return (
        <>
            {isLoading && <Loader />}
            <div className="student-panel-wrapper relative">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-dark text-md font-semibold">Student List</h3>
                    {selectedStudents.length > 0 && (
                        <Button
                            variant={'primary'}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors ml-auto shadow-sm"
                            onClick={generateSelectedIDCards}
                            disabled={isGeneratingId}
                        >
                            {isGeneratingId ? (
                                <> <Loader /> Generating... </>
                            ) : (
                                <><Download className="h-4 w-4" />Download Selected ID Cards ({selectedStudents.length})</>
                            )}
                        </Button>
                    )}
                </div>

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
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 border focus:ring-primary cursor-pointer"
                                        checked={students.length > 0 && selectedStudents.length === students.length}
                                        onChange={handleSelectAll}
                                        title="Select All Students"
                                    />
                                </th>
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
                            {loading || searchLoading || isLoading ? (
                                <tr>
                                    <td colSpan={8} className="loading-cell">Loading...</td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="empty-cell">No students found</td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id} className={selectedStudents.includes(student.id) ? "bg-indigo-50" : ""}>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 border focus:ring-primary cursor-pointer"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                                            />
                                        </td>
                                        <td className="id-cell">{student.roll_number || student.id}</td>
                                        <td>{student?.university_registration_number ? student?.university_registration_number : '--'}</td>
                                        <td>{student.student_name}</td>
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
                                                    <DropdownMenuItem
                                                        onClick={() => downloadIndividualIDCard(student.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download ID Card
                                                    </DropdownMenuItem>
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
                        const maxVisible = 5;
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

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

            {/* Hidden ID Cards for PDF Generation */}
            <StudentIdCardList
                students={students}
                departments={departments ?? []}
                formatDate={formatDate}
            />
        </>
    );
}

