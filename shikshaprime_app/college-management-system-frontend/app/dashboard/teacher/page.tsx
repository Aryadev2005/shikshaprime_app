"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ApexOptions } from "apexcharts";
import { BookOpenCheck, ClipboardCheck, GraduationCap, Users } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  getTeacherDashboard,
  type TeacherDashboardResponse,
} from "@/src/services/teacherDashboardService";
import "./teacher-dashboard.css";
import { useApi } from "@/src/hooks/useApi";
import { getNoticesLatest } from "@/src/services/noticesService";
import { format } from "date-fns";
import Image from 'next/image';

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const EMPTY_DASHBOARD: TeacherDashboardResponse = {
  summary: {
    totalStudents: 0,
    myClasses: 0,
    submittedAssignments: 0,
    classAverageGrade: 0,
  },
  attendanceOverview: {
    presentToday: 0,
    excusedToday: 0,
    absentToday: 0,
    averageAttendance: 0,
  },
  assignmentProgress: [],
  attendanceTrend: [],
  rosters: [],
  recentClasses: [],
  submissionHeatmap: [],
};

function getHeatmapClass(value: number) {
  if (value >= 5) return "td-hm-green";
  if (value >= 2) return "td-hm-orange";
  return "td-hm-red";
}

const TeacherDashboard = () => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] =
    useState<TeacherDashboardResponse>(EMPTY_DASHBOARD);
  const [selectedDept, setSelectedDept] = useState("Computer Science & Engineering");

  const departments = [
    "Computer Science & Engineering",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Business Administration",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: latestNoticesData, error: latestNoticesError, loading: latestNoticesLoading, call: latestNoticesCall } = useApi(getNoticesLatest);

  useEffect(() => {
    latestNoticesCall();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await getTeacherDashboard();
        if (!cancelled) {
          setDashboardData(response.data || EMPTY_DASHBOARD);
        }
      } catch (error) {
        console.error("Failed to load teacher dashboard", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const attendanceDonutOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    colors: ["#3A93A4", "#F4B043", "#E9724C"],
    labels: ["Present Today", "Excused", "Absent"],
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: { show: false },
            value: {
              show: true,
              fontSize: "32px",
              fontFamily: "inherit",
              fontWeight: 700,
              color: "#3A93A4",
              formatter: () => `${dashboardData.attendanceOverview.averageAttendance}%`,
            },
            total: {
              show: true,
              showAlways: true,
              label: "Average Attendance",
              formatter: () => `${dashboardData.attendanceOverview.averageAttendance}%`,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      // markers: { radius: 12 },
      markers: { size: 6 },
    },
    stroke: { width: 0 },
  };

  const attendanceDonutSeries = [
    dashboardData.attendanceOverview.presentToday,
    dashboardData.attendanceOverview.excusedToday,
    dashboardData.attendanceOverview.absentToday,
  ];

  const assignmentChartOptions: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      fontFamily: "inherit",
      dropShadow: {
        enabled: true,
        top: 3,
        left: 2,
        blur: 4,
        opacity: 0.1,
      },
    },
    colors: ["#3A93A4"],
    stroke: { curve: "smooth", width: 4 },
    xaxis: {
      categories: ["Total Submitted", "Total Pending"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontWeight: 600,
          colors: "#6B7280",
        },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#6B7280" },
      },
    },
    grid: {
      borderColor: "#d5d5d5ff",
      strokeDashArray: 4,
    },
    markers: {
      size: 6,
      colors: ["#3A93A4", "#E9724C"],
      strokeWidth: 2,
      hover: { size: 8 },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `${val} Assignments`,
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -10,
      style: {
        fontSize: "12px",
        colors: ["#3A93A4"],
      },
    },
  };

  const assignmentChartSeries = [
    {
      name: "Total Assignments",
      data: [
        dashboardData.assignmentProgress.reduce((acc, curr) => acc + curr.checked, 0),
        dashboardData.assignmentProgress.reduce(
          (acc, curr) => acc + (curr.pendingReview + curr.late),
          0
        ),
      ],
    },
  ];

  const lineChartOptions: ApexOptions = {
    chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#3A93A4"],
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      title: { text: "Monthly Attendance Trend", style: { fontWeight: 500 } },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: (val: number) => `${Math.round(val)}%`,
      },
    },
    legend: {
      show: false,
    },
    markers: { size: 4 },
    dataLabels: { enabled: false },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        opacityFrom: 0.5,
        opacityTo: 0.1,
      },
    },
  };

  const lineChartSeries = [
    {
      name: "Attendance %",
      type: "area",
      // Mocking monthly data as API currently provides weekly/short term
      data: [75, 82, 78, 85, 80, 88, 92, 85, 80, 85, 90, 88],
    },
  ];

  const statCards = useMemo(
    () => [
      {
        value: dashboardData.summary.totalStudents,
        label: "Total Students",
        icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/student-icon.svg`,
        iconTone: "bg-orange-100 text-orange-500",
        valueTone: "text-orange-500",
      },
      {
        value: dashboardData.summary.myClasses,
        label: "My Classes",
        icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/teacher-icon.svg`,
        iconTone: "bg-blue-100 text-blue-500",
        valueTone: "text-blue-500",
      },
      {
        value: dashboardData.summary.submittedAssignments,
        label: "Submitted Assignments",
        icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/assignment-icon.svg`,
        iconTone: "bg-purple-100 text-purple-600",
        valueTone: "text-purple-600",
      },
      {
        value: `${dashboardData.summary.classAverageGrade}%`,
        label: "Class Avg. Grade",
        icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/admin-revenue-icon.svg`,
        iconTone: "bg-teal-100 text-teal-600",
        valueTone: "text-teal-600",
      },
    ],
    [dashboardData.summary]
  );

  return (
    <div className="td-dashboard-wrapper gap-3 teacher-dashboard">
      {loading && <Loader />}

      <div className="td-stats-row md:gap-3 gap-2 teacher-topup">
        {statCards.map((card:any) => {
          const Icon = card.icon;

          return (
            <div className="td-stat-card form-card" key={card.label}>
              <div className={`td-stat-icon-wrap ${card.iconTone}`}>
                <Image
                  src={card.icon}
                  className="h-12 w-12"
                  alt={card.label}
                  width={48}
                  height={48}
                />
              </div>
              <div className="td-stat-info">
                <h3 className={`td-stat-value ${card.valueTone}`}>{card.value}</h3>
                <p className="td-stat-label">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="td-charts-row">
        <div className="td-chart-card td-chart-col-3 form-card">
          <h2 className="td-card-title">Attendance Overview</h2>
          <p className="td-card-subtitle text-center">Average Attendance</p>
          <div className="td-chart-body">
            {mounted && (
              <Chart
                options={attendanceDonutOptions}
                series={attendanceDonutSeries}
                type="donut"
                height="250"
              />
            )}
          </div>
        </div>

        <div className="td-chart-card td-chart-col-6 form-card">
          <h2 className="td-card-title">Overall Assignment Progress</h2>
          <div className="td-chart-body">
            {mounted && (
              <Chart
                options={assignmentChartOptions}
                series={assignmentChartSeries}
                type="line"
                height="280"
              />
            )}
          </div>
        </div>

        <div className="td-chart-card td-chart-col-3 form-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="td-card-title !mb-0">Student Attendance Chart</h2>
            <select
              className="text-[10px] border border-[#e6edf7] rounded px-1 py-0.5 bg-white outline-none cursor-pointer"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <p className="td-card-subtitle text-center mb-2">Jan to Dec Trend</p>
          <div className="td-chart-body">
            {mounted && (
              <Chart
                options={lineChartOptions}
                series={lineChartSeries}
                type="line"
                height="230"
              />
            )}
          </div>
        </div>
      </div>

      <div className="td-bottom-row">
        <div className="td-card td-flex-2 form-card">
          <h2 className="td-card-title mb-3">My Class Rosters</h2>
          <div className="td-table-responsive">
            <table className="td-roster-table">
              <thead>
                <tr>
                  <th align="left">Section</th>
                  <th align="left">Subject</th>
                  <th align="left">Roster Count</th>
                  <th align="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.rosters.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No roster data found</td>
                  </tr>
                ) : (
                  dashboardData.rosters.map((roster, index) => (
                    <tr key={roster.id || index} className={index === 0 ? "td-bg-light-purple" : ""}>
                      <td>{roster.section}</td>
                      <td>{roster.subject}</td>
                      <td>{roster.rosterCount}</td>
                      <td align="right">
                        <Link className="td-action-link" href="/teacher/students">
                          <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/view-icon-02.svg`} alt="View" width={20} height={24} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="td-card form-card td-flex-1 td-scroll-list-wrap">
          <div className="td-card-header">
            <h2 className="td-card-title">Recent Class</h2>
            <Link href="/teacher/assignment-homework" className="td-add-btn">
              View assignments
            </Link>
          </div>
          <div className="td-recent-list">
            {dashboardData.recentClasses.length === 0 ? (
              <div className="td-recent-item td-border-teal">
                <h4>No recent classes</h4>
                <p>Assignments or class activities will show here once available.</p>
              </div>
            ) : (
              dashboardData.recentClasses.map((item, index) => (
                <div
                  className={`td-recent-item ${index === 0 ? "td-border-orange" : "td-border-teal"}`}
                  key={item.id}
                >
                  <h4>{item.title}</h4>
                  <p>
                    {(item.description || `${item.subjectName} - ${item.className}`).slice(0, 120)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="td-card td-flex-1 form-card notice">
          <h2 className="td-card-title text-white">Notice</h2>
          <div className="mt-3 max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
            {latestNoticesData?.data?.data?.length === 0 && (
              <div className="rounded-[8px] border border-[#e6edf7] bg-white px-3 py-3 text-sm text-[#6b7280]">
                No notice yet
              </div>
            )}

            {latestNoticesData?.data?.data?.map((notice: any) => (
              <article
                key={notice.id}
                className="flex items-center overflow-hidden rounded-[8px] border border-[#e6edf7] bg-white"
              >
                <div className="flex w-[72px] shrink-0 flex-col bg-[#eef5ff] text-center text-[10px] font-bold text-[#3478d8]">
                  <span className="border-b border-[#dae7fb] px-2 py-2 text-[0.8rem]">
                    {format(notice.from_date, 'dd - MMM')}
                  </span>
                  <span className="px-2 py-2 text-[0.8rem] text-[#5f6b84]">
                    {format(notice.to_date, 'dd - MMM')}
                  </span>
                </div>
                <div className="px-3 py-2 font-medium leading-4">
                  <p className="text-[14px] text-dark">{notice.title}</p>
                  <p className="mt-2 text-[10px] text-gray">
                    {notice.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
