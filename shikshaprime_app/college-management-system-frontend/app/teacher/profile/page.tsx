"use client";

import Image from "next/image";
import { ChevronRight, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import "./teacher-profile.css";
import { getMyTeacherProfilePage, teacherGetStudentAssignment, TeacherProfilePageResponse } from "@/src/services/teacherService";
import { useTenant } from "@/src/hooks/useTenant";
import { buildApiUrl } from "@/src/utils/tenantUrlBuilder";
import Link from "next/link";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00"];
const slotPositions = ["top-5", "top-16", "top-28", "top-[8.75rem]", "top-[12.25rem]"];

type AssignmentCheckItem = {
  submission_id?: number | string | null;
  assignment_id?: number | string | null;
  student_name?: string | null;
  student_id?: string | null;
  submitted_at?: string | null;
  title?: string | null;
  status?: string | null;
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "Not Available";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not Available";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();
};

const getWeekColumns = () => {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      key: index,
      day: `${date.toLocaleDateString("en-GB", { weekday: "short" })} - ${String(date.getDate()).padStart(2, "0")}`,
      chips: [] as Array<{
        top: string;
        label: string;
        subLabel: string;
      }>,
    };
  });
};

const getSubjectShortCode = (subjectName?: string | null) => {
  if (!subjectName) return "CLS";

  const words = subjectName
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export default function Page() {
  const currentYear = new Date().getFullYear();
  const tenant = useTenant();
  const apiUrl = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), "/api");
  const [profileData, setProfileData] = useState<TeacherProfilePageResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [assignmentItems, setAssignmentItems] = useState<AssignmentCheckItem[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [mounted, setMounted] = useState(false);
  const hasLoadedProfile = useRef(false);
  const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadAssignments = async () => {
      if (active) {
        setAssignmentLoading(true);
      }

      try {
        const response = await teacherGetStudentAssignment({
          stream: "",
          program_id: "",
          class_id: "",
          section_id: "",
          roll_no: "",
          student_id: "",
          student_name: "",
          page: 1,
          limit: 50,
        });

        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.assignments)
            ? response.data.assignments
            : [];

        if (active) {
          setAssignmentItems(data);
        }
      } catch (error) {
        console.error("Failed to load assignment check list", error);
        if (active) {
          setAssignmentItems([]);
        }
      } finally {
        if (active) {
          setAssignmentLoading(false);
        }
      }
    };

    loadAssignments();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const isInitialLoad = !hasLoadedProfile.current;
      if (active) {
        if (isInitialLoad) {
          setInitialLoading(true);
        } else {
          setAttendanceLoading(true);
        }
      }
      try {
        const response = await getMyTeacherProfilePage(selectedYear);
        if (active) {
          setProfileData(response.data);
          hasLoadedProfile.current = true;
        }
      } catch (error) {
        console.error("Failed to load teacher profile", error);
      } finally {
        if (active) {
          if (isInitialLoad) {
            setInitialLoading(false);
          } else {
            setAttendanceLoading(false);
          }
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [selectedYear]);

  const teacher = profileData?.teacher;
  const teacherName = [teacher?.first_name, teacher?.last_name].filter(Boolean).join(" ") || "Teacher";
  const subjectNames = Array.from(
    new Set((profileData?.classAssignments || []).map((item) => item.subjectName).filter(Boolean))
  );
  const teacherMeta = [
    { label: "DOB", value: formatDate(teacher?.dob) },
    { label: "Phone", value: teacher?.phone || teacher?.mobile || "Not Available" },
    { label: "Designation", value: teacher?.designation || "Not Available" },
    { label: "Email", value: teacher?.email || "Not Available" },
    { label: "Experience", value: teacher?.experience_years ? `${teacher.experience_years} years` : "Not Available" },
    { label: "Emergency no.", value: teacher?.emergency_contact || "Not Available" },
    { label: "Department", value: teacher?.department_name || "Not Available" },
  ];

  const profileImageUrl = teacher?.image
    ? `${apiUrl.replace("/api", "")}${teacher.image.startsWith("/") ? teacher.image : `/${teacher.image}`}`
    : null;

  const weekColumns = getWeekColumns();
  (profileData?.classAssignments || []).slice(0, weekColumns.length * timeSlots.length).forEach((assignment, index) => {
    const columnIndex = index % weekColumns.length;
    const slotIndex = Math.floor(index / weekColumns.length) % slotPositions.length;

    weekColumns[columnIndex].chips.push({
      top: slotPositions[slotIndex],
      label: getSubjectShortCode(assignment.subjectName),
      subLabel: `${assignment.className} ${assignment.programName}`.trim(),
    });
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const attendanceData = months.map((month) => {
    const record = (profileData?.monthlyAttendance || []).find(
      (item) => item.month.substring(0, 3).toLowerCase() === month.toLowerCase()
    );
    return record ? record.percentage : 0;
  });

  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "40%",
        distributed: true,
      },
    },
    colors: ["#82258d"],
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: months,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#7a8497", fontSize: "10px", fontWeight: 600 },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        style: { colors: "#98a2b3", fontSize: "10px" },
        formatter: (val: number) => `${val}%`,
      },
    },
    grid: {
      show: true,
      borderColor: "#e5ebf3",
      strokeDashArray: 4,
      position: "back",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val}%`,
      },
    },
  };

  const chartSeries = [
    {
      name: "Attendance",
      data: attendanceData,
    },
  ];

  if (initialLoading) {
    return (
      <section className="min-h-screen teacher-profile">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.65fr)]">
            <div className="grid gap-4">
              <div className="h-52 animate-pulse rounded-[5px] bg-[#dfe9f3]" />
              <div className="h-80 animate-pulse rounded-[5px] bg-[#eef3f8]" />
            </div>
            <div className="grid gap-3">
              <div className="h-72 animate-pulse rounded-[5px] bg-[#eef3f8]" />
              <div className="h-52 animate-pulse rounded-[5px] bg-[#eef3f8]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen teacher-profile">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="w-full">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(390px,0.65fr)]">
            <div className="grid gap-4">
              <article className="rounded-[5px] bg-[#43aae0] px-4 py-4 shadow-[0_12px_30px_rgba(67,170,224,0.22)] sm:px-5">
                <div className="grid gap-4 lg:grid-cols-[96px_minmax(0,1fr)] xl:grid-cols-[100px_minmax(0,1.05fr)_minmax(240px,0.9fr)]">
                  <div className="flex items-start justify-center lg:items-start">
                    <div className="flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_24px_rgba(255,255,255,0.35)]">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt={teacherName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-[#566074]" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-start">
                    <h1 className="text-[1.85rem] font-medium leading-tight text-white">
                      {teacherName}
                    </h1>
                    <p className="mt-3 text-[1.35rem] font-medium leading-tight text-white/95">
                      {subjectNames.length > 0 ? subjectNames.join(", ") : "No subjects assigned"}
                    </p>
                    <p className="mt-2 text-xs font-medium text-white/85">
                      {teacher?.address || "Address not available"}
                    </p>

                    <div className="mt-4 inline-flex w-full max-w-[80%] items-center justify-between rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#5b4b3e]">
                      <span className="text-[#666A6D] text-regular">Date of Joining:</span>
                      <span className="text-dark">{formatDate(teacher?.joining_date || teacher?.date_of_joining)}</span>
                    </div>
                  </div>

                  <div className="grid gap-x-6 gap-y-3 border-l border-white/20 pl-0 sm:grid-cols-2 xl:pl-5">
                    {teacherMeta.map((item) => (
                      <div key={item.label} className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
                          {item.label}
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="form-card">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#1f2432]">Schedule</h2>
                </div>

                <div className="overflow-x-auto rounded-[5px]">
                  <div className="w-full bg-tranparent">
                    <div className="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] border-b border-[#eef2f7] bg-transparent px-2 py-2 text-center text-[14px] font-semibold text-[#5d677d] gap-1">
                      <div className="py-3" />
                      {weekColumns.map((column) => (
                        <div key={column.day} className="bg-white py-3 last:border-r-0 rounded-[5px]">
                          {column.day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-[62px_repeat(5,minmax(0,1fr))]">
                      <div className="border-r border-[#eef2f7] bg-[#fbfcff] rounded-tl-sm">
                        {timeSlots.map((time) => (
                          <div
                            key={time}
                            className="flex h-14 items-start justify-center border-b border-[#eef2f7] pt-3 text-[11px] font-semibold text-[#4e586f] last:border-b-0"
                          >
                            {time}
                          </div>
                        ))}
                      </div>

                      {weekColumns.map((column) => (
                        <div
                          key={column.day}
                          className="relative h-[280px] border-r border-[#eef2f7] last:border-r-0 bg-white last:rounded-tr-[5px]"
                        >
                          <div className="absolute inset-0">
                            {timeSlots.map((time) => (
                              <div
                                key={`${column.day}-${time}`}
                                className="h-14 border-b border-[#eef2f7] last:border-b-0"
                              />
                            ))}
                          </div>

                          <div className="relative h-full px-2 py-2">
                            {column.chips.map((chip) => (
                              <div
                                key={`${column.day}-${chip.label}-${chip.subLabel}`}
                                className={`absolute left-2 right-2 ${chip.top} flex items-center gap-2 rounded-full bg-[#ffb948] px-2 py-1.5 text-[10px] font-semibold text-white`}
                              >
                                <span className="flex items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#000000] w-[24px] h-[24px]" style={{ flex: '0 0 24px' }}>
                                  {chip.label}
                                </span>
                                <span className="truncate">{chip.subLabel}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div className="grid gap-2 md:gap-3">
              <article className="form-card" style={{ marginBottom: '0px' }}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#1f2432]">Attendence</h2>
                  <div className="inline-flex items-center gap-2 rounded-[5px] border border-[#e4eaf3] bg-white text-[14px] font-medium text-[#7e8798] px-1 py-1 min-w-[80px]">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/filter-icon.svg`}
                      alt="Filter icon"
                      width={12}
                      height={12}
                      className="h-6 w-6"
                    />
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-transparent outline-none cursor-pointer"
                      disabled={attendanceLoading}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-[5px] bg-[#fbfcff] p-0 shadow-[inset_0_0_0_1px_#eef2f7]">
                  <div className="relative h-[180px] w-full">
                    {mounted && (
                      <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        height="100%"
                        width="100%"
                      />
                    )}
                    {attendanceLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-[5px] bg-white/75 backdrop-blur-[1px]">
                        <div className="h-28 w-[92%] animate-pulse rounded-[5px] bg-[#eef3f8]" />
                      </div>
                    )}
                  </div>
                </div>
              </article>

              <article className="form-card">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#1f2432]">
                    Assignment Task
                  </h2>
                </div>

                <div className="space-y-2">
                  {assignmentLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`assignment-skeleton-${index}`}
                        className="h-[68px] animate-pulse rounded-[5px] bg-[#fbfcff]"
                      />
                    ))
                  ) : assignmentItems.length > 0 ? (
                    assignmentItems.map((task, index) => (
                      <article key={task.submission_id || task.assignment_id || `${task.title || "task"}-${index}`}>
                        <Link href={`assignment-check/${task?.submission_id}`} className="flex items-center justify-between gap-3 rounded-[5px] bg-[#fbfcff] px-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#273042]">{task.title || "Untitled Assignment"}</p>
                            <p className="mt-1 text-[11px] font-medium text-[#8d96a7]">
                              {task.student_name
                                ? `${task.student_name}${task.student_id ? ` - ${task.student_id}` : ""}`
                                : "Student not available"}
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-[#8d96a7]">{task.submitted_at ? formatDate(task.submitted_at) : "Not submitted yet"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-1 text-[12px] font-bold uppercase ${task.status?.toLowerCase() === "submitted"
                              ? "bg-[#dff8e8] text-[#27b66f]"
                              : "bg-[#ffe9cd] text-[#f1a22c]"
                              }`}>
                              {(!task.status || task.status.toLowerCase() === "not_submitted") ? "Pending" : task.status}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#9ea8b8]" />
                          </div>
                        </Link>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[5px] bg-[#fbfcff] px-3 py-6 text-center text-sm text-[#8d96a7]">
                      No assignments found
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="h-24 w-1 rounded-full bg-[#f8c556]" />
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
