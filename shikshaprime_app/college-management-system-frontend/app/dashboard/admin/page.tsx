
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { BellRing, BriefcaseBusiness, EllipsisVertical } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getAdminDashboard,
  type AdminDashboardResponse,
} from "@/src/services/adminDashboardServicef";
import "./admin-dashboard.css";
import Image from "next/image";


const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const EMPTY_DASHBOARD: AdminDashboardResponse = {
  summary: {
    studentsCount: 0,
    teachersCount: 0,
    submittedAssignmentsCount: 0,
    totalRevenue: 0,
  },
  studentDistribution: {
    streamId: null,
    streamName: null,
    boysCount: 0,
    girlsCount: 0,
    totalCount: 0,
    streamOptions: [],
  },
  teacherList: [],
  notices: [],
  attendance: {
    year: new Date().getFullYear(),
    monthly: Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      present: 0,
      absent: 0,
    })),
  },
  earnings: {
    year: new Date().getFullYear(),
    monthly: Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      amount: 0,
    })),
  },
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatNoticeDate(value: string) {
  try {
    return format(parseISO(value), "dd MMM");
  } catch {
    return value;
  }
}

export default function DashboardBodyTailwind() {
  const currentYear = new Date().getFullYear();
  const [attendanceYear, setAttendanceYear] = useState(currentYear);
  const [earningsYear, setEarningsYear] = useState(currentYear);
  const [selectedStreamId, setSelectedStreamId] = useState<number | undefined>(undefined);
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse>(EMPTY_DASHBOARD);
  const topCards = [
    {
      title: "Number of student",
      value: formatCompactNumber(dashboardData.summary.studentsCount),
      icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/student-icon.svg`,
      tone: "from-[#ffffff70] to-[#ffffff70]",
      valueColor: "text-[#E96B43]",
      iconWrap: "bg-[#E96B4320] text-[#E96B4320]",
    },
    {
      title: "Number of Teacher",
      value: formatCompactNumber(dashboardData.summary.teachersCount),
      icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/teacher-icon.svg`,
      tone: "from-[#FFFFFF70] to-[#FFFFFF70]",
      valueColor: "text-[#146CDF]",
      iconWrap: "bg-[#146CDF20] text-[#146CDF20]",
    },
    {
      title: "Submitted Assignment",
      value: formatCompactNumber(dashboardData.summary.submittedAssignmentsCount),
      icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/assignment-icon.svg`,
      tone: "from-[#FFFFFF70] to-[#FFFFFF70]",
      valueColor: "text-[#941B74]",
      iconWrap: "bg-[#941B7420] text-[#941B7420]",
    },
    {
      title: "Total Revenue",
      value: formatCurrencyCompact(dashboardData.summary.totalRevenue),
      icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/admin-revenue-icon.svg`,
      tone: "from-[#FFFFFF70] to-[#FFFFFF70]",
      valueColor: "text-[#2dae75]",
      iconWrap: "bg-[#2dae7520] text-[#2dae7520]",
    },
  ];


  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await getAdminDashboard({
          streamId: selectedStreamId,
          attendanceYear,
          earningsYear,
        });

        if (cancelled) return;

        const nextData = response.data || EMPTY_DASHBOARD;
        setDashboardData(nextData);

        if (
          selectedStreamId === undefined &&
          nextData.studentDistribution.streamId !== null &&
          nextData.studentDistribution.streamId !== undefined
        ) {
          setSelectedStreamId(Number(nextData.studentDistribution.streamId));
        }
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [attendanceYear, earningsYear, selectedStreamId]);

  const attendanceMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];



  const attendanceChartOptions: ApexOptions = {
    chart: {
      type: "line" as const,
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["#2f73db", "#f3b243"],
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    xaxis: {
      categories: attendanceMonths,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#7a8497",
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#7a8497",
          fontSize: "11px",
        },
      },
    },
    grid: {
      borderColor: "#eef2f8",
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    markers: {
      size: 4,
      colors: ["#2f73db", "#f3b243"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => `${val} Students`,
      },
    },
  };

  const attendanceChartSeries = [
    {
      name: "Total Present",
      data: dashboardData.attendance.monthly.map((item) => item.present),
    },
    {
      name: "Total Absent",
      data: dashboardData.attendance.monthly.map((item) => item.absent),
    },
  ];

  const earningsChartOptions: ApexOptions = {
    chart: {
      type: "area" as const,
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: true },
    },
    colors: ["#2dae75"],
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
    },
    xaxis: {
      categories: attendanceMonths,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#7a8497",
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#7a8497",
          fontSize: "11px",
        },
        formatter: (val: number) => `Rs ${formatCompactNumber(val)}`,
      },
    },
    grid: {
      borderColor: "#dfdfdfff",
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) =>
          `Rs ${new Intl.NumberFormat("en-IN").format(val || 0)}`,
      },
    },
  };

  const earningsChartSeries = [
    {
      name: "Total Earnings",
      data: dashboardData.earnings.monthly.map((item) => item.amount),
    },
  ];

  const boysCount = dashboardData.studentDistribution.boysCount;
  const girlsCount = dashboardData.studentDistribution.girlsCount;
  const totalStudents = dashboardData.studentDistribution.totalCount;
  const boysAngle =
    totalStudents > 0 ? Math.round((boysCount / totalStudents) * 360) : 180;

  return (
    <section className="min-h-screen admin-dashboard">
      <div className="mx-auto flex w-full flex-col gap-4 gap-y-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {topCards.map((card:any) => (
            <article
              key={card.title}
              className={`mb-5 flex items-center gap-3 rounded-[5px] border border-white/70 bg-gradient-to-br ${card.tone} px-4 py-3`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 ${card.iconWrap}`}>
                <Image src={card?.icon} className="h-10 w-10" alt={card.title} width={12} height={12} />
              </div>
              <div className="min-w-0">
                <div className={`text-2xl font-bold leading-none ${card.valueColor}`}>
                  {card.value}
                </div>
                <p className="mt-1 text-md font-medium text-[#01244E]">
                  {card.title}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-3 gap-y-0 xl:grid-cols-[0.95fr_1.65fr_0.8fr]">
          <article className="form-card mb-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#1a2436]">Students</h2>
              <select
                value={selectedStreamId ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedStreamId(value ? Number(value) : undefined);
                }}
                className="rounded-md border border-[#d9e1ed] bg-white px-2.5 py-1.5 text-[11px] text-[#6e7789] outline-none"
              >
                <option value="">Select Stream</option>
                {dashboardData.studentDistribution.streamOptions.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center rounded-[10px] bg-[#f9fbff] px-3 py-5">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#f3b243 0deg ${boysAngle}deg, #2f73db ${boysAngle}deg 360deg)`,
                }}
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#30384a] shadow-[inset_0_0_0_1px_#edf1f7]">
                  {totalStudents}
                </div>
              </div>

              <p className="mt-3 text-xs font-medium text-[#5d6880]">
                {dashboardData.studentDistribution.streamName || "No stream selected"}
              </p>

              <div className="mt-4 flex items-center gap-5 text-[11px] text-[#71798c]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f3b243]" />
                  Boys ({boysCount})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2f73db]" />
                  Girls ({girlsCount})
                </div>
              </div>
            </div>
          </article>

          <article className="form-card mb-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1a2436]">Teacher List</h2>
              <img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/dashboard/man-plus-icon.svg`} alt="Teacher list" />
            </div>

            <div className="overflow-x-auto rounded-[8px] border border-[#e5ebf4]">
              <table className="admin-student-table min-w-full border-collapse bg-[#ffffff] text-left">
                <thead className="bg-[#f6f9fd]">
                  <tr className="text-[11px] font-semibold uppercase tracking-wide text-[#5d6880]">
                    <th className="px-3 py-2">Roll no:</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Dept</th>
                    <th className="px-3 py-2">Phone No</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.teacherList.length === 0 ? (
                    <tr className="border-t border-[#edf1f7] text-[12px] text-[#4c566d]">
                      <td className="px-3 py-4 text-center" colSpan={5}>
                        No teachers found
                      </td>
                    </tr>
                  ) : (
                    dashboardData.teacherList.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="border-t border-[#edf1f7] text-[12px] text-[#4c566d]"
                      >
                        <td className="px-3 py-2.5">{teacher.employee_id}</td>
                        <td className="px-3 py-2.5">{teacher.name}</td>
                        <td className="px-3 py-2.5">{teacher.department_name || "N/A"}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <span>{teacher.phone || "N/A"}</span>
                          </div>
                        </td>
                        <td align="right">
                          <button
                            type="button"
                            className="rounded-md p-1 text-[#01244E] transition-colors hover:bg-[#eef3fb] hover:text-[#2f73db]"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="form-card notice-panel mb-0 bg-[#439ce9]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#ffffff]">Notices</h2>
              <BellRing className="h-4 w-4 text-white" />
            </div>

            <div className="space-y-2.5">
              {dashboardData.notices.length === 0 && <div>No Notice yet</div>}
              {dashboardData.notices.map((notice, index) => (
                <article
                  key={`${notice.id}-${index}`}
                  className="flex items-center overflow-hidden rounded-[8px] border border-[#e6edf7] bg-white"
                >
                  <div className="flex w-[72px] shrink-0 flex-col bg-[#eef5ff] text-center text-[10px] font-bold text-[#3478d8]">
                    <span className="border-b border-[#dae7fb] px-2 py-2 text-[0.8rem]">
                      {formatNoticeDate(notice.from_date)}
                    </span>
                    <span className="px-2 py-2 text-[0.8rem] text-[#5f6b84]">
                      {formatNoticeDate(notice.to_date)}
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
          </article>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="form-card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#1a2436]">Attendance</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-[#7a8497]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2f73db]" />
                    Total Present
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f3b243]" />
                    Total Absent
                  </span>
                </div>
              </div>
              <select
                value={attendanceYear}
                onChange={(e) => setAttendanceYear(Number(e.target.value))}
                className="rounded-md border border-[#d9e1ed] bg-white px-2.5 py-1.5 text-[11px] text-[#6e7789] outline-none"
              >
                <option value={currentYear}>Year {currentYear}</option>
                <option value={currentYear - 1}>Year {currentYear - 1}</option>
                <option value={currentYear - 2}>Year {currentYear - 2}</option>
              </select>
            </div>

            <div className="h-[240px] rounded-[10px] border border-[#eef2f8] bg-[#fcfdff] p-3">
              <div className="h-full w-full">
                <Chart
                  options={attendanceChartOptions}
                  series={attendanceChartSeries}
                  type="line"
                  height="100%"
                />
              </div>
            </div>
          </article>

          <article className="form-card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* <BriefcaseBusiness className="h-4 w-4 text-[#6fb7bf]" /> */}
                <h2 className="text-sm font-semibold text-[#1a2436]">Earnings</h2>
              </div>
              <select
                value={earningsYear}
                onChange={(e) => setEarningsYear(Number(e.target.value))}
                className="rounded-md border border-[#d9e1ed] bg-white px-2.5 py-1.5 text-[11px] text-[#6e7789] outline-none"
              >
                <option value={currentYear}>Year {currentYear}</option>
                <option value={currentYear - 1}>Year {currentYear - 1}</option>
                <option value={currentYear - 2}>Year {currentYear - 2}</option>
              </select>
            </div>

            <div className="h-[240px] rounded-[10px] border border-[#eef2f8] bg-[#fcfdff] p-3">
              <div className="h-full w-full">
                <Chart
                  options={earningsChartOptions}
                  series={earningsChartSeries}
                  type="area"
                  height="100%"
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

