"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import "./teachers.css";
import "./[id]/teacher-details.css";
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
import { getTeachers, searchTeachers } from "@/src/services/teacherService";
import { Teacher } from "@/src/types/teacherTypes";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/src/context/authContext";
import { useNotify } from "@/src/context/notificationContext";
import { Loader } from "@/components/ui/loader";
import Image from "next/image";
import Link from "next/link";

export default function TeacherPanelPage() {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { success: notifySuccess, error: notifyError } = useNotify();

    const { data, error, loading, call } = useApi(getTeachers);
    const { data: searchData, loading: searchLoading, call: callSearch } = useApi(searchTeachers);

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [totalTeachers, setTotalTeachers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const hasFetched = useRef(false);
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Search filter states
    const [empIdFilter, setEmpIdFilter] = useState("");
    const [teacherNameFilter, setTeacherNameFilter] = useState("");
    const [teacherEmailFilter, setTeacherEmailFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [designationFilter, setDesignationFilter] = useState("");

    // Fetch teachers on mount
    const fetchTeachers = async (page: number = 1) => {
        setIsLoading(true);
        try {
            const response = await call();
            if (response?.data?.rows) {
                setTeachers(response.data.rows);
                setTotalTeachers(response.data.count || response.data.rows.length);
                setTotalPages(Math.ceil((response.data.count || response.data.rows.length) / 50));
            } else {
                setTeachers([]);
                setTotalTeachers(0);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Error fetching teachers:", err);
            setTeachers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchTeachers(1);
    }, []);

    // Handle search
    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const query = [empIdFilter, teacherNameFilter, teacherEmailFilter, departmentFilter, designationFilter]
                .filter(filter => filter.trim())
                .join(" ");

            // Only search if at least one filter is provided
            if (!query.trim()) {
                fetchTeachers(1);
                setIsSearchActive(false);
                return;
            }

            const response = await callSearch(query);
            if (response?.data?.rows) {
                setTeachers(response.data.rows);
                setTotalTeachers(response.data.count || response.data.rows.length);
                setTotalPages(Math.ceil((response.data.count || response.data.rows.length) / 50));
                setIsSearchActive(true);
            } else {
                setTeachers([]);
                setTotalTeachers(0);
                setTotalPages(1);
                setIsSearchActive(true);
            }
        } catch (err) {
            console.error("Error searching teachers:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear search
    const handleClearSearch = () => {
        setEmpIdFilter("");
        setTeacherNameFilter("");
        setTeacherEmailFilter("");
        setDepartmentFilter("");
        setDesignationFilter("");
        setIsSearchActive(false);
        fetchTeachers(1);
    };

    // Navigate to teacher details
    const handleViewTeacher = (teacherId: number) => {
        setIsLoading(true);
        if (!teacherId || isNaN(teacherId)) {
            console.error("Invalid teacher ID:", teacherId);
            return;
        }
        router.push(`/admin/teachers/${teacherId}`);
    };

    // Handle edit teacher
    const handleEditTeacher = (teacherId: number) => {
        setIsLoading(true);
        if (!teacherId || isNaN(teacherId)) {
            console.error("Invalid teacher ID:", teacherId);
            return;
        }
        router.push(`/admin/teachers/${teacherId}?edit=true`);
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

    // Get full teacher name
    const getFullTeacherName = (teacher: Teacher) => {
        if (teacher.first_name && teacher.last_name) {
            return `${teacher.first_name} ${teacher.last_name}`;
        }
        return teacher.employee_name || teacher.first_name || teacher.last_name || "-";
    };

    // Redux state for dropdowns
    const { departments } = useAppSelector((state) => state.departments);

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        if (isSearchActive) {
            // If search is active, re-search with new page
            handleSearch();
        } else {
            fetchTeachers(page);
        }
    };

    return (
        <>
            {isLoading && <Loader />}
            <div className="teacher-panel-wrapper">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-dark text-md font-semibold">Teacher List</h3>
                    <Link href={'/admin/create-teacher'} className="primary-btn rounded-md text-sm text-white py-2 px-4 hover:bg-white hover:text-primary">Create Teacher</Link>
                </div>
                {/* Search Filters Row */}
                <div className="search-filters-row">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Teacher Emp Id"
                            value={empIdFilter}
                            onChange={(e) => setEmpIdFilter(e.target.value)}
                            className="search-input"
                        />
                        <Search className="search-icon" />
                    </div>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Teacher Name"
                            value={teacherNameFilter}
                            onChange={(e) => setTeacherNameFilter(e.target.value)}
                            className="search-input"
                        />
                        <Search className="search-icon" />
                    </div>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Teacher Email"
                            value={teacherEmailFilter}
                            onChange={(e) => setTeacherEmailFilter(e.target.value)}
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
                            placeholder="Designation"
                            value={designationFilter}
                            onChange={(e) => setDesignationFilter(e.target.value)}
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

                {/* Teacher Table */}
                <div className="teacher-table-wrapper">
                    <table className="teacher-table">
                        <thead>
                            <tr>
                                <th>Emp Id.</th>
                                <th>Teacher Name</th>
                                <th>Designation</th>
                                <th>Dept</th>
                                <th>Email</th>
                                <th>Phone No.</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading || searchLoading ? (
                                <tr>
                                    <td colSpan={7} className="loading-cell">Loading...</td>
                                </tr>
                            ) : teachers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty-cell">No teachers found</td>
                                </tr>
                            ) : (
                                teachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td className="id-cell">{teacher.employee_id || teacher.id}</td>
                                        <td>{getFullTeacherName(teacher)}</td>
                                        <td>{teacher.designation || "-"}</td>
                                        <td>{departments?.find((d: any) => d.id === Number(teacher.department_id))?.name || teacher.department_id || "-"}</td>
                                        <td>{teacher.email}</td>
                                        <td>{teacher.phone || teacher.mobile}</td>
                                        <td>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="view-btn" title="More Actions">
                                                        <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/more-icon.svg`} alt="" width={24} height={24} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleViewTeacher(teacher.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditTeacher(teacher.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
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