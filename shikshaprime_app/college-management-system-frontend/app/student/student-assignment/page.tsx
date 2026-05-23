"use client";
import React, { useEffect, useState } from "react";
import "./student-assignment.css";
import "react-tooltip/dist/react-tooltip.css";
import { ChevronDown, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Tooltip } from 'react-tooltip'
import Link from "next/link";
import { Loader } from "@/components/ui/loader";
import { getStudentAssignment, getStudentAssignmentFilter } from "@/src/services/assignmentService";
import { useApi } from "@/src/hooks/useApi";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/src/store/hooks";

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Assignment {
    id: string;
    title: string;
    subject_name: string;
    type: string;
    dueDate: string;
    status: "Pending" | "Overdue" | "Submitted";
    // priority: "High" | "Medium" | "Low";
    // grade: string;
}

interface StatCardProps {
    value: string;
    label: string;
    icon: string;
    variant: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon, variant }) => (
    <div className={`stats-card card-${variant}`}>
        <div className="stat-icon-wrapper">
            <Image src={icon} alt={label} width={40} height={40} />
        </div>
        <div className="stat-info">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
        </div>
    </div>
);

export default function StudentAssignmentPage() {
    const { data: studentAssignmentList, loading: studentAssignmentLoading, call: getStudentAssignmentList } = useApi(getStudentAssignment);

    const studentDetails = useAppSelector((state) => state.stuDetails.StudentDetails);
    const [subjectList, setSubjectList] = useState([]);


    const router = useRouter();
    useEffect(() => {
        getStudentAssignmentList();
        applyFilter({ status: "Pending" });
    }, []);

    // useEffect(() => {
    //     console.log("studentAssignmentList", studentAssignmentList);
    // }, [studentAssignmentList]);

    useEffect(() => { setSubjectList(studentDetails?.subjects && JSON.parse(studentDetails?.subjects)) }, [studentDetails])


    const chartOptions: any = {
        chart: {
            type: 'donut',
            // width: 80,
            // height: 80
        },
        labels: ['Submitted', 'Completed Rate'],
        colors: ['#146CDF', '#18DD95'], // Blue and Green from image
        legend: {
            position: 'bottom',
            fontSize: '12px',
            offsetY: -3,
            markers: {
                radius: 4
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val: any) {
                return Math.round(val) + "%";
            },
            style: {
                fontSize: '12px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 'normal',
                colors: ['#fff'], // or your preferred text color
            },
            dropShadow: {
                enabled: false // This removes the shadow
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '0%'
                }
            }
        }
    };

    // Ensure chartSeries always contains valid numbers — ApexCharts crashes on undefined
    const completedRate = studentAssignmentList?.data?.chart?.completedRate ?? 0;
    const remainingRate = studentAssignmentList?.data?.chart?.remainingRate ?? 0;
    const chartSeries = [Number(completedRate), Number(remainingRate)];

    const { data: filteredData, loading: filterLoading, call: applyFilter } = useApi(getStudentAssignmentFilter);

    // Active filter state
    const [activeFilters, setActiveFilters] = useState<{ departmentId?: string; status?: string }>({ status: "Pending" });

    const handleSubjectFilter = (subjectId: string) => {
        const updated = { ...activeFilters, departmentId: subjectId || undefined };
        setActiveFilters(updated);
        applyFilter(updated);
    };

    const handleStatusFilter = (status: string) => {
        const updated = { ...activeFilters, status: status || undefined };
        setActiveFilters(updated);
        applyFilter(updated);
    };

    // Use filtered results when a filter has been applied (filteredData is not null), otherwise use initial load list
    const hasAppliedFilter = filteredData !== null;
    console.log("has Applied Filter", hasAppliedFilter);
    const assignmentList: Assignment[] = hasAppliedFilter ? ((filteredData?.data?.assignments ?? filteredData?.data ?? []) as any) : ((studentAssignmentList?.data?.assignments ?? []) as any);
    console.log("Assignment List", assignmentList);

    // const assignmentSubmitHandeler = (id: any, title: any) => {
    //     const queryString = new URLSearchParams({ data: JSON.stringify({ id: id, title: title }) }).toString();
    //     router.push(`/student/student-assignment/${id}?${queryString}`);
    // }

    // const assignmentViewHandeler = (id: any) => {
    //     const queryString = new URLSearchParams({ data: JSON.stringify({ id: id }) }).toString();
    //     router.push(`/student/student-assignment/view/${id}?${queryString}`);
    // }

    return (
        <>
            {(studentAssignmentLoading || filterLoading) && <Loader />}
            <Tooltip id="my-tooltip" style={{ zIndex: '999', background: 'var(--primary)' }} />
            <div className="student-assignment-wrapper">
                {/* Header Section */}
                <div className="assignment-header">
                    <div>
                        <h1 className="page-title">Assignment</h1>
                    </div>
                </div>

                {/* Overview Section */}
                <div className="assignment-overview">
                    <div className="stats-grid">
                        <StatCard
                            value={studentAssignmentList?.data?.stats?.total === null ? '0' : studentAssignmentList?.data?.stats?.total}
                            label="Total Assignment"
                            icon={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/assignment-icon-total.svg`}
                            variant="total"
                        />
                        <StatCard
                            value={studentAssignmentList?.data?.stats?.pending === null ? '0' : studentAssignmentList?.data?.stats?.pending}
                            label="Pending Assignment"
                            icon={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/assignment-icon-panding.svg`}
                            variant="pending"
                        />
                        <StatCard
                            value={studentAssignmentList?.data?.stats?.submitted === null ? '0' : studentAssignmentList?.data?.stats?.submitted}
                            label="Submitted Assignment"
                            icon={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/assignment-icon-submit.svg`}
                            variant="submitted"
                        />
                        <StatCard
                            value={studentAssignmentList?.data?.stats?.graded === null ? '0' : studentAssignmentList?.data?.stats?.graded}
                            label="Graded Assignment"
                            icon={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/assignment-icon-graded.svg`}
                            variant="graded"
                        />
                        <StatCard
                            value={studentAssignmentList?.data?.stats?.overdue === null ? '0' : studentAssignmentList?.data?.stats?.overdue}
                            label="Overdue Assignment"
                            icon={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/assignment-icon-overdue.svg`}
                            variant="overdue"
                        />
                        <StatCard
                            value={`${studentAssignmentList?.data?.stats?.avgGrade === null ? '0' : studentAssignmentList?.data?.stats?.avgGrade}%`}
                            label="AVG Grade Assignment"
                            icon={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/assignment-icon-avg.svg`}
                            variant="avg"
                        />
                    </div>

                    <div className="chart-card">
                        <h3 className="chart-title text-center">Assignment Progress</h3>
                        <div className="chart-container">
                            {chartSeries[0] > 0 || chartSeries[1] > 0 ? (
                                <Chart
                                    options={chartOptions}
                                    series={chartSeries}
                                    type="donut"
                                    width="100%"
                                    height={178}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-62.5 text-gray-400 text-sm">
                                    {studentAssignmentLoading ? "Loading..." : "No chart data available"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <>{console.log("Subject id:", studentAssignmentList?.data?.assignments)}</>
                <div className="assignment-list-card">
                    <div className="list-header-row">
                        <h2 className="list-title">My Assignment List</h2>
                        <div className="filter-section">
                            <div className="filter-group">
                                <div className="filter-trigger">
                                    <Filter size={18} />
                                </div>
                                <span className="filter-label hidden md:block">Filter :</span>
                            </div>
                            <div className="custom-select-wrap">
                                <select className="custom-select-ui" defaultValue="" onChange={(e) => handleSubjectFilter(e.target.value)}>
                                    <option value="" disabled hidden>Select subject</option>
                                    <option value="">All Subjects</option>
                                    {subjectList?.length > 0 && subjectList?.map((item: any) => (
                                        <option key={item.subject_id} value={item.subject_id}>{item.subject_name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="select-icon" size={16} />
                            </div>
                            <div className="custom-select-wrap">
                                <select
                                    className="custom-select-ui"
                                    defaultValue="Pending"
                                    onChange={(e) => handleStatusFilter(e.target.value)}
                                >
                                    <option value="" disabled hidden>Status</option>
                                    <option value="">All</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                                <ChevronDown className="select-icon" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="student-table-container">
                        <table className="custom-student-table">
                            <thead>
                                <tr>
                                    <th>Assignment</th>
                                    <th>Subject</th>
                                    <th>Type</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    {/* <th>Priority</th> */}
                                    {/* <th>Grade</th> */}
                                    <th align="center" style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignmentList.length === 0 && <tr><td className="text-center" colSpan={6}>No data yet</td></tr>}
                                {assignmentList.length > 0 && assignmentList?.map((item: any) => (
                                    <tr key={item?.id}>
                                        <td>{item?.title}</td>
                                        <td>{item?.subject_name}</td>
                                        <td>{item?.type}</td>
                                        <td>{item?.due_date}</td>
                                        <td>
                                            <span className={`status-pill status-${item.status.toLowerCase()}`}>
                                                {item?.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {
                                                    ((item?.status === "Submitted")) && (
                                                        <>
                                                            <Link className="view" href={`/student/student-assignment/view/${item?.assignment_submission_id}`}><Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/view-icon-02.svg`} alt="View" width={24} height={24} /></Link>
                                                        </>
                                                    )
                                                }
                                                {(item?.status == "Pending" || (item?.status == "Overdue" && item?.allow_late_submissions === 1)) && (
                                                    <><Link className="submit" href={`/student/student-assignment/${item?.id}`} ata-tooltip-id="my-tooltip" data-tooltip-content="Submit Assignment"><Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/send-icon.svg`} alt="View" width={24} height={24} />Assignment Submit</Link></>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-container">
                        <button className="page-btn nav prev">
                            <ChevronLeft size={16} />
                        </button>
                        <button className="page-btn active">1</button>
                        <button className="page-btn nav next">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
