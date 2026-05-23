"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, BookOpen, ClipboardList, IndianRupee, School2, Users } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  getStudentDashboard,
  type StudentDashboardResponse,
} from "@/src/services/studentDashboardService";
import "./student-dashboard.css";
import { format } from "date-fns";

const EMPTY_DASHBOARD: StudentDashboardResponse = {
  summary: {
    studentsCount: 0,
    teachersCount: 0,
    submittedAssignmentsCount: 0,
    totalRevenue: 0,
    upcomingFees: 0,
    paidThisTerm: 0,
    pendingPaymentCount: 0,
  },
  attendance: {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendancePercentage: 0,
  },
  recentPaidFee: null,
  pendingAssignments: [],
  subjects: [],
  notices: [],
  gradedAssignments: [],
};



function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonthDay(value?: string | null) {
  if (!value) return { month: "--", day: "--" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "--", day: "--" };

  return {
    month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
    day: new Intl.DateTimeFormat("en-IN", { day: "2-digit" }).format(date),
  };
}

export default function StudentDashboardBodyTailwind() {
  const [dashboardData, setDashboardData] =
    useState<StudentDashboardResponse>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await getStudentDashboard();
        if (!cancelled) {
          setDashboardData(response.data || EMPTY_DASHBOARD);
        }
      } catch (error) {
        console.error("Failed to load student dashboard", error);
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

  const attendancePercentage = Math.max(
    0,
    Math.min(100, Number(dashboardData.attendance.attendancePercentage || 0))
  );
  const attendanceAngle = Math.round((attendancePercentage / 100) * 360);


  return (
    <section className="min-h-screen bg-transparent">
      {loading && <Loader />}

      <div className="flex w-full flex-col md:gap-3 gap-2 student-dashboard">
        

        <div className="grid md:gap-3 xl:grid-cols-[1.05fr_1.8fr_0.95fr]">
          <article className="form-card">
            <h2 className="text-sm font-semibold text-[#1a2436]">Overall Attendance</h2>
            <div className="mt-2 rounded-[10px] bg-[#f9fbff] px-3 py-5">
              <p className="text-center text-sm font-medium text-[#333d52]">
                Attendance Summary
              </p>

              <div className="mt-4 flex justify-center">
                <div
                  className="relative flex h-44 w-44 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#3790a8 0deg ${attendanceAngle}deg, #f1a74f ${attendanceAngle}deg 360deg)`,
                  }}
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[2rem] font-bold text-[#30384a] shadow-[inset_0_0_0_1px_#edf1f7]">
                    {Math.round(attendancePercentage)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-5 rounded-md bg-white px-3 py-2 text-[11px] text-[#71798c] shadow-[inset_0_0_0_1px_#edf1f7]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3790a8]" />
                  Present Days ({dashboardData.attendance.presentDays})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f1a74f]" />
                  Absent Days ({dashboardData.attendance.absentDays})
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[5px] form-card">
            <h2 className="text-sm font-semibold text-[#1a2436]">Payment Status</h2>
            <div className="mt-3 grid md:gap-3 md:grid-cols-2 xl:grid-cols-2">
              <div className="rounded-[8px] bg-white px-4 py-4 shadow-[0_6px_16px_rgba(115,132,160,0.08)] ring-1 ring-[#edf1f7]">
                <p className="text-sm font-medium text-[#7f8799]">Upcoming</p>
                <p className="text-base font-semibold text-[#495267]">Upcoming Fees</p>
                <p className="mt-2 text-[2rem] font-bold leading-none text-[#e08c42]">
                  {formatCurrency(dashboardData.summary.upcomingFees)}
                </p>
              </div>

              <div className="rounded-[8px] bg-white px-4 py-4 shadow-[0_6px_16px_rgba(115,132,160,0.08)] ring-1 ring-[#edf1f7]">
                <p className="text-sm font-medium text-[#35a870]">Paid</p>
                <p className="text-base font-semibold text-[#495267]">Paid This Term</p>
                <p className="mt-2 text-[2rem] font-bold leading-none text-[#2ea36e]">
                  {formatCurrency(dashboardData.summary.paidThisTerm)}
                </p>
              </div>


              <div className="rounded-[8px] bg-white px-4 py-4 shadow-[0_6px_16px_rgba(115,132,160,0.08)] ring-1 ring-[#edf1f7] md:col-span-2 xl:col-span-1">
                <p className="text-sm font-medium text-[#6aafcb]">Recent Paid</p>
                <p className="text-base font-semibold text-[#495267]">Recent Fee</p>
                <p className="mt-2 truncate text-lg font-bold leading-none text-[#3478d8]">
                  {dashboardData.recentPaidFee?.payment_type_name || "No recent paid fee"}
                </p>
                <p className="mt-2 text-sm font-medium text-[#64748b]">
                  {dashboardData.recentPaidFee
                    ? `${formatCurrency(
                        Number(
                          dashboardData.recentPaidFee.paid_amount ||
                            dashboardData.recentPaidFee.amount
                        )
                      )} on ${formatDate(
                        dashboardData.recentPaidFee.paid_date ||
                          dashboardData.recentPaidFee.updated_at
                      )}`
                    : "No completed payment yet"}
                </p>
              </div>

              <div className="rounded-[8px] bg-[linear-gradient(180deg,#fff7ef_0%,#fff0df_100%)] px-4 py-4 shadow-[0_6px_16px_rgba(115,132,160,0.08)] ring-1 ring-[#fbe6ce]">
                <p className="text-sm font-medium text-[#d29b49]">Pending</p>
                <p className="text-base font-semibold text-[#495267]">Pending Payment</p>
                <p className="mt-2 text-[2rem] font-bold leading-none text-[#f2a12c]">
                  {dashboardData.summary.pendingPaymentCount}
                </p>
                <Link
                  href="/student/payment-dashboard"
                  className="mt-4 inline-flex rounded-md bg-[#f2a12c] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(242,161,44,0.28)]"
                >
                  View all payments
                </Link>
              </div>
            </div>
          </article>

          <article className="form-card">
            <h2 className="text-sm font-semibold text-[#1a2436]">Pending Assignments</h2>
            <div className="mt-3 max-h-[295px] space-y-1 overflow-y-auto pr-1">
              {dashboardData.pendingAssignments.length === 0 && (
                <div className="rounded-[8px] border border-[#e3ebf5] bg-white px-3 py-4 text-sm text-[#6b7280]">
                  No pending assignments
                </div>
              )}

              {dashboardData.pendingAssignments.map((assignment) => {
                const { month, day } = formatMonthDay(assignment.due_date);

                return (
                  <article
                    key={assignment.id}
                    className="flex items-center gap-2 rounded-[8px] border border-[#e3ebf5] bg-white px-2 py-2 shadow-[0_4px_12px_rgba(115,132,160,0.06)]"
                  >
                    <div className="flex w-[56px] shrink-0 flex-col items-center justify-center rounded-[5px] bg-white border px-0 py-0 text-[#34435f] overflow-hidden shadow-md">
                      <span className="text-xs font-semibold uppercase leading-none text-white bg-success w-[56px] text-center py-1">
                        {month}
                      </span>
                      <span className="mt-1 text-2xl font-bold leading-none py-1">
                        {day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#263043]">
                        {assignment.title}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-[#8d96a7]">
                        {(assignment.subject_name || "Subject") +
                          (assignment.due_date
                            ? ` - Due ${formatDate(assignment.due_date)}`
                            : "")}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>
        </div>

        <div className="grid md:gap-3 xl:grid-cols-[1.8fr_0.9fr_0.85fr]">
          <article className="form-card">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#1a2436]">My Subjects</h2>
            </div>
            <div className="mt-3 overflow-x-auto rounded-[8px] border border-[#e5ebf4]">
              <table className="min-w-full border-collapse text-left bg-[#ffffff]">
                <thead className="bg-[#f6f9fd]">
                  <tr className="text-[11px] font-semibold text-[#5d6880]">
                    <th className="px-3 py-2">No.</th>
                    <th className="px-3 py-2">Subject Name</th>
                    <th className="px-3 py-2">Subject Code</th>
                    <th className="px-3 py-2">Subject Description</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.subjects.length === 0 ? (
                    <tr className="border-t border-[#edf1f7] text-[12px] text-[#4c566d]">
                      <td className="px-3 py-4 text-center" colSpan={2}>
                        No subjects found
                      </td>
                    </tr>
                  ) : (
                    dashboardData.subjects.map((subject, index) => (
                      <tr
                        key={`${subject.id}-${subject.name}`}
                        className="border-t border-[#edf1f7] text-[12px] text-[#4c566d]"
                      >
                        <td className="px-3 py-2.5">{index + 1}</td>
                        <td className="px-3 py-2.5">{subject.name}</td>
                        <td className="px-3 py-2.5">{subject?.code || "N/A"}</td>
                        <td className="px-3 py-2.5">{subject?.description || "N/A"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="form-card notice">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Recent Notices</h2>
              <BellRing className="h-4 w-4 text-white" />
            </div>
            <div className="mt-3 max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
              {dashboardData.notices.length === 0 && (
                <div className="rounded-[8px] border border-[#e6edf7] bg-white px-3 py-3 text-sm text-[#6b7280]">
                  No notice yet
                </div>
              )}

              {dashboardData.notices.map((notice:any) => (
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
                // <article
                //   key={notice.id}
                //   className="rounded-[8px] border border-[#e6edf7] bg-white px-3 py-3 shadow-[0_4px_12px_rgba(115,132,160,0.06)]"
                // >
                //   <p className="text-sm font-semibold text-[#263043]">{notice.title}</p>
                //   <p className="mt-1 text-[11px] leading-4 text-[#8d96a7]">
                //     {notice.description || "No description available"}
                //   </p>
                //   <p className="mt-2 text-[10px] font-medium text-[#5a81c7]">
                //     {formatDate(notice.from_date)} to {formatDate(notice.to_date)}
                //   </p>
                // </article>
              ))}
            </div>
          </article>

          <article className="form-card">
            <h2 className="text-sm font-semibold text-[#1a2436]">Latest Results</h2>
            <div className="mt-3 overflow-hidden rounded-[8px] border border-[#e5ebf4]">
              <table className="min-w-full border-collapse text-left bg-[#ffffff]">
                <thead className="bg-[#f6f9fd]">
                  <tr className="text-[11px] font-semibold text-[#5d6880]">
                    <th className="px-3 py-2">Assignment</th>
                    <th className="px-3 py-2">Grade/Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.gradedAssignments.length === 0 ? (
                    <tr className="border-t border-[#edf1f7] text-[12px] text-[#4c566d]">
                      <td className="px-3 py-4 text-center" colSpan={2}>
                        No graded assignments yet
                      </td>
                    </tr>
                  ) : (
                    dashboardData.gradedAssignments.map((result) => (
                      <tr
                        key={result.submission_id}
                        className="border-t border-[#edf1f7] text-[12px] text-[#4c566d]"
                      >
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-[#3b4b64]">
                            {result.assignment_title}
                          </div>
                          <div className="text-[10px] text-[#8d96a7]">
                            {result.subject_name || "Subject"}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#3b4b64]">
                          {result.grade ||
                            (result.marks_obtained !== null &&
                            result.marks_obtained !== undefined
                              ? result.marks_obtained
                              : "N/A")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
