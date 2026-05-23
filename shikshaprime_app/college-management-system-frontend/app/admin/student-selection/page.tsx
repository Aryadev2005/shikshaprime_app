"use client";
import { useEffect, useState } from "react";
import "./student-selection.css";
import { useAppSelector } from "@/src/store/hooks";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader"
interface Student {
    id: string;
    skh_id: string;
    student_name: string;
    parent_name: string;
    class_name: string;
    department_name: string;
    email: string;
    mobile: string;
    registration_id?: string;
    status?: string;
}
import {
    Search,
    Calendar,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Bell,
    ChevronDown,
    Copy,
    Filter
} from "lucide-react";
import Image from "next/image";
import { useApi } from "@/src/hooks/useApi";
import { listStudentRegistrations, bulkUpdateStudentRegistrationStatus, resendPaymentLinkForSelectedStudent, getStudentData } from "@/src/services/studentRegistrationService";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent,  DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import StudentModal from "./StudentModal";
import { useNotify } from "@/src/context/notificationContext";
import { Tooltip } from 'react-tooltip'
// import "react-tooltip/dist/react-tooltip.css";
import { Label } from "@/components/ui/label";
import Link from "next/link";
const statusOptions = [
    { id: "REGISTRATION_COMPLETED", value: "Registration Done" },
    { id: "PAYMENT_PENDING", value: "Payment Pending" },
    { id: "PAYMENT_COMPLETED", value: "Payment Completed" },
]
export default function StudentSelectionPage() {
    const notify = useNotify();
    const { data, error, loading, call } = useApi(listStudentRegistrations);
    const { data: bulkUpdateData, error: bulkUpdateError, loading: bulkUpdateLoading, call: callBulkUpdate } = useApi(bulkUpdateStudentRegistrationStatus);
    const { data: updateData, error: updateError, loading: updateLoading, call: callResendpaymentLink } = useApi(resendPaymentLinkForSelectedStudent);
    const { data: studentData, error: ErrorStudentData, loading: LoadingStudentData, call: callStudentData } = useApi(getStudentData);
    const [mockStudents, setMockStudents] = useState<Student[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]); // Pre-select some for demo matching image
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("REGISTRATION_COMPLETED");
    const [search, setSearch] = useState<string>('');
    const [pagination, setpagination] = useState<any>();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 50;
    const [studentViewData, setStudentViewData] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    // search with debounce
    function useDebounce<T>(value: T, delay = 500): T {
        const [debouncedValue, setDebouncedValue] = useState(value);
        useEffect(() => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        }, [value, delay]);

        return debouncedValue;
    }

    const debouncedSearch = useDebounce(search, 500);
    const fetchStudents = async (
        classId: string,
        academicYearId: string,
        statusFilter: string,
        searchText?: string,
        page = 1
    ) => {
        setIsLoading(true);
        try {
            const response = await call({
                classId,
                academicYearId,
                status: statusFilter,
                searchText: searchText,
                page: String(page),
                limit: String(pageSize),
            });
            console.log("Fetched Student Registrations:", response);
            setTotalStudents(response?.pagination?.total || response?.data?.length || 0);
            setMockStudents(response.data as any[]);
            setpagination(response?.pagination)
        } catch (err) {
            console.error(err);
            setMockStudents([]);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchStudents(
            selectedClass,
            selectedAcademicYear,
            selectedStatus,
            debouncedSearch,
            currentPage
        );
    }, [debouncedSearch, selectedClass, selectedAcademicYear, selectedStatus, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedClass, selectedAcademicYear, selectedStatus]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === mockStudents.length) {
            // If all are selected, deselect all
            setSelectedIds([]);
        } else {
            // Otherwise, select all
            setSelectedIds(mockStudents.map(student => student.id));
        }
    };

    const isAllSelected = mockStudents.length > 0 && selectedIds.length === mockStudents.length;
    const selectedStudents = mockStudents.filter(s => selectedIds.includes(s.id));

    useEffect(() => {
        console.log("Selected IDs:", selectedIds);
    }, [selectedIds]);

    const handleSaveStudents = async () => {
        setIsLoading(true);
        if (selectedIds.length === 0) {
            notify.warning("No Selection", "Please select at least one student");
            setIsLoading(false);
            return;
        }

        try {
            const registrationIds = selectedStudents.map(student => student.registration_id).filter(Boolean);
            if (registrationIds.length === 0) {
                notify.warning("Invalid Data", "No valid registration IDs found");
                setIsLoading(false);
                return;
            }
            // console.log("Registration IDs to update to body:", registrationIds);
            // Call bulk status update service
            await callBulkUpdate(registrationIds, "PAYMENT_PENDING");
            notify.success("Students Saved", `${registrationIds.length} student(s) saved successfully!`);
            fetchStudents(selectedClass, selectedAcademicYear, selectedStatus);
            setSelectedIds([]);
        } catch (err) {
            console.error("Error saving students:", err);
            notify.error("Error", "Error saving students");
        } finally {
            setIsLoading(false);
        }
    };


    // Accessing Redux state
    const { academicYears } = useAppSelector((state) => state.academic);
    const { classes } = useAppSelector((state) => state.classes);
    const { departments } = useAppSelector((state) => state.departments);
    console.log("Redux Access Details:===============>", academicYears, classes, departments);

    const resendhandeler = async (id: any) => {
        try {
            const response = await callResendpaymentLink(id);
            console.log("Response", response);
            if (response) {
                toast.success(response?.message)
            }
        } catch (err) {
            console.error("Error saving students:", err);
        }
    }
    const getStudentDataHandeler = async (id: any) => {
        setIsLoading(true);
        try {
            const response = await callStudentData(id);
            if (response) {
                setStudentViewData(response?.data);
                toast.success(response?.message)
            }
        } catch (err) {
            console.log(ErrorStudentData);
            toast.error(ErrorStudentData)
        } finally {
            setIsLoading(false);
        }
    }

    const handleCopyRegistrationId = (registrationId: string) => {
        navigator.clipboard.writeText(registrationId).then(() => {
            toast.success("Registration ID copied to clipboard!");
        }).catch(() => {
            toast.error("Failed to copy registration ID");
        });
    }
    useEffect(() => {
        console.log("Get student data====>", studentData)
        console.log("Get student loading====>", LoadingStudentData)
    }, [studentData])

    return (
        <>
            <Tooltip id="my-tooltip" style={{ zIndex: '999', background: 'var(--primary)' }} />
            {isLoading && <Loader />}
            <div className="student-selection-wrapper">
                {/* Main Content Heading */}
                {/* Page Heading Card / Breadcrumb */}
                {/* <div className="selection-header-card">
                <h2 className="selection-title">Student Selection</h2>
            </div> */}

                <div className={`main-selection-layout ${selectedStatus !== "REGISTRATION_COMPLETED" ? 'full-width' : 'half-width'}`}>
                    {/* Left Section: Student List */}
                    <div className='list-section-card'>
                        <div className="list-header">
                            <div className="list-count items-center search-container">
                                {/* Student List - <span>{totalStudents}</span> */}
                                <label className="mr-2">Search:</label>
                                <Input type="search" onChange={(e) => setSearch(e.target.value)} placeholder="Search by name and registration id" className="bg-white serach-student" />
                            </div>
                            <div className="filter-controls">
                                {/* <span className="filter-label">Filter :</span> */}
                                <div className="bg-primary w-9 h-9 p-2 flex items-center justify-center text-white rounded-sm hidden md:flex"><Filter /></div>
                                <div className="select-container">
                                    <Label>Class</Label>
                                    <select
                                        className="custom-select-small"
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                    >
                                        <option value="">All Classes</option>
                                        {classes && classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="select-arrow h-4 w-4" />
                                </div>
                                {/* <div className="date-input-wrapper">
                                    <div className="select-container">
                                        <select
                                            className="custom-select-small"
                                            value={selectedAcademicYear}
                                            onChange={(e) => setSelectedAcademicYear(e.target.value)}
                                        >
                                            <option value="" disabled>Select Academic Year</option>
                                            {academicYears && academicYears.map((year) => (
                                                <option key={year.id} value={year.id}>
                                                    {year.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="select-arrow h-4 w-4" />
                                    </div>
                                </div> */}
                                <div className="">
                                    <div className="select-container">
                                        <Label>Status</Label>
                                        <select
                                            className="custom-select-small"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            {statusOptions.length > 0 && statusOptions?.map((item) => (
                                                <option key={item?.id} value={item?.id}>{item?.value}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="select-arrow h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="student-table-container">
                            <table className="custom-student-table">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col">
                                            <div className="flex">
                                                {mockStudents.some((item) => item.status === "REGISTRATION_COMPLETED") && (
                                                    <>
                                                        <input
                                                            type="checkbox"
                                                            className="custom-checkbox mr-2"
                                                            checked={isAllSelected}
                                                            onChange={handleSelectAll}
                                                            title="Select all students"
                                                        />Reg - ID
                                                    </>
                                                )}
                                                {mockStudents.some((item) => item.status !== "REGISTRATION_COMPLETED") && (
                                                    <>
                                                        {/* <input
                                                            type="checkbox"
                                                            className="custom-checkbox mr-2"
                                                            checked
                                                            // onChange={handleSelectAll}
                                                            title="Select all students"
                                                            readOnly
                                                        /> */}
                                                        Reg - ID
                                                    </>
                                                )}
                                            </div>
                                        </th>
                                        <th>Student Name</th>
                                        <th>Parent Name</th>
                                        <th>Year</th>
                                        <th>Dept</th>
                                        {/* <th>Email</th> */}
                                        <th>Phone No</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <>
                                        {console.log(mockStudents.some((item) => item.status === "REGISTRATION_COMPLETED"))}
                                    </>
                                    {mockStudents.map(student => (
                                        <tr key={student.id} className={selectedIds.includes(student.id) ? "selected-row" : ""}>
                                            <td className="flex items-center gap-3">
                                                {student?.status === 'REGISTRATION_COMPLETED' && (
                                                    <input
                                                        type="checkbox"
                                                        className="custom-checkbox"
                                                        checked={selectedIds.includes(student.id)}
                                                        onChange={() => toggleSelection(student.id)}
                                                    />
                                                )}
                                                {/* {student?.status === 'PAYMENT_PENDING' && (
                                                    <input type="checkbox" readOnly checked className="custom-checkbox" />
                                                )} */}
                                                <div className="flex items-center gap-2">
                                                    <span className="skh-id-text" data-tooltip-id="my-tooltip" data-tooltip-content={student.registration_id} >{student.registration_id}</span>
                                                    <button
                                                        onClick={() => handleCopyRegistrationId(student.registration_id || '')}
                                                        className="copy-btn"
                                                        title="Copy registration ID"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>{student?.student_name}</td>
                                            <td>{student?.parent_name}</td>
                                            <td>{student?.class_name}</td>
                                            <td>{student?.department_name}</td>
                                            {/* <td>{student?.email}</td> */}
                                            <td>{student?.mobile}</td>
                                            <td>{student?.status === 'REGISTRATION_PENDING' ? 'Registration Pending' : student?.status === 'REGISTRATION_COMPLETED' ? 'REG Completed' : student?.status === 'PAYMENT_COMPLETED' ? 'Payment Completed' : student?.status === 'PAYMENT_COMPLETED' ? 'Payment Completed' : student?.status === 'PAYMENT_PENDING' ? 'Payment Pending' : student?.status}</td>

                                            {
                                                student?.status === 'REGISTRATION_COMPLETED' && (
                                                    <>
                                                        <td align="center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" className="py-0 px-0 bg-transparent border-0 boxShadow-0 shadow-inherit cursor-pointer hover:bg-transparent" style={{ boxShadow: "0px 0px #ffffff" }}>
                                                                        <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/more-icon.svg`} alt="" width={24} height={24} />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="w-40" align="start">
                                                                    <DropdownMenuItem onClick={() => getStudentDataHandeler(student.id)}>View</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </>
                                                )
                                            }
                                            {
                                                student?.status === 'PAYMENT_PENDING' && (
                                                    <>
                                                        <td align="center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" className="py-0 px-0 bg-transparent border-0 boxShadow-0 shadow-inherit cursor-pointer hover:bg-transparent" style={{ boxShadow: "0px 0px #ffffff" }}>
                                                                        <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/more-icon.svg`} alt="" width={24} height={24} />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="w-40" align="start">
                                                                    <DropdownMenuItem onClick={() => getStudentDataHandeler(student.id)}>View</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => resendhandeler(student.registration_id)}>
                                                                        Resend
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </>
                                                )
                                            }
                                            {
                                                student?.status === 'PAYMENT_COMPLETED' && (
                                                    <>
                                                        <td align="center">
                                                            <Link href={`/admin/student-admission?registrationId=${student?.registration_id}`} className="text-white bg-primary py-2 px-3 hover:bg-white hover:text-primary rounded-md" >Admission</Link>
                                                        </td>
                                                    </>
                                                )
                                            }
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <>
                            <div className="pagination-wrapper">
                                <button className="page-nav-btn" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage <= 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {
                                    Array.from({ length: pagination?.totalPages || 1 }, (_, index) => index + 1).map((item) => (
                                        <button
                                            className={`page-num-btn ${currentPage === item ? "active" : ""}`}
                                            key={item}
                                            onClick={() => setCurrentPage(item)}
                                        >
                                            {item}
                                        </button>
                                    ))
                                }
                                <button
                                    className="page-nav-btn"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination?.totalPages || 1))}
                                    disabled={currentPage >= (pagination?.totalPages || 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </>
                    </div>

                    {/* Right Section: Selected Summary */}
                    <>
                        {console.log("Selected status:", selectedStatus)}
                        {
                            selectedStatus === "REGISTRATION_COMPLETED" && (
                                <div className="selected-panel">
                                    <div className="selected-panel-header">
                                        Selected Student - <span>{selectedIds.length > 0 ? selectedIds.length.toString().padStart(2, '0') : ''}</span>
                                    </div>
                                    {
                                        selectedIds.length === 0 && (
                                            <div className="no-selection-message">
                                                No students selected.
                                            </div>
                                        )
                                    }
                                    <div className="selected-cards-list">
                                        {selectedStudents.map(student => (
                                            <div key={student.id} className="student-small-card">
                                                <div className="student-info-mini">
                                                    <span className="mini-name">{student.student_name === "john.doe" ? "Manash sen" : student.student_name}</span>
                                                    <div className="mini-details">
                                                        <ul>
                                                            <li>ID: <b>{student.registration_id}</b></li>
                                                            <li>Class: <b>{student.class_name}</b></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn-remove-student"
                                                    onClick={() => toggleSelection(student.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        className="btn-save-final"
                                        onClick={handleSaveStudents}
                                        disabled={bulkUpdateLoading || selectedIds.length === 0}
                                    >
                                        {bulkUpdateLoading ? "Saving..." : "Save Student"}
                                    </button>
                                </div>
                            )
                        }
                    </>
                </div>
            </div>
            {studentViewData && <StudentModal data={studentViewData} onClose={() => setStudentViewData(null)} />}

        </>
    );
}
