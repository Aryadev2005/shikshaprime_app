"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useApi } from "@/src/hooks/useApi";
import "./student-profile.css";
import {
  studentProfile,
  getMyStudentContactInfo,
  getMyStudentAcademicInfo,
  Student
} from "@/src/services/studentService";
import {
  getStudentDashboard
} from "@/src/services/studentDashboardService";
import {
  getMyAttendanceRecords
} from "@/src/services/studentMyAttendanceService";
import {
  getStudentPayments
} from "@/src/services/paymentService";
import { useTenant } from "@/src/hooks/useTenant";
import { buildApiUrl } from "@/src/utils/tenantUrlBuilder";
import { User } from "lucide-react";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type DocumentItem = {
  name: string;
  url: string;
};

const normalizeStatus = (value: unknown) => String(value ?? "").trim().toLowerCase();

const normalizeDocumentUrl = (url?: string | null) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
};

const getPaymentStatusStyle = (status: string) => {
  switch (String(status || "").toUpperCase()) {
    case 'COMPLETE':
    case 'PAID':
      return "bg-[#dff8e8] text-[#27b66f]";
    case 'PENDING':
      return "bg-[#ffe9cd] text-[#f1a22c]";
    case 'FAILED':
    case 'OVERDUE':
      return "bg-[#ffe1e7] text-[#ef6a8a]";
    default:
      return "bg-[#f5f6f9] text-[#7f8797]";
  }
};

const getAssignmentStatusColors = (status: string) => {
  switch (normalizeStatus(status)) {
    case 'completed':
    case 'submitted':
    case 'checked':
      return { color: "#5fba72", label: "COMPLETED" };
    case 'overdue':
    case 'late':
      return { color: "#d95656", label: "OVERDUE" };
    case 'pending':
    default:
      return { color: "#d9a756", label: "PENDING" };
  }
};

const getAssignmentGradientStyle = (index: number) => {
  const gradients = [
    "from-[#f1b150] to-[#e39c2f]",
    "from-[#f4bb70] to-[#efa94d]",
    "from-[#4bd17e] to-[#23b663]",
    "from-[#f16f75] to-[#db4851]",
    "from-[#43aae0] to-[#2980b9]",
    "from-[#9b59b6] to-[#8e44ad]"
  ];
  return gradients[index % gradients.length];
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not Available";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();
};

const formatDateShort = (dateString: string | null) => {
  if (!dateString) return ["N/A", "--"];
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-GB', { month: 'short', day: '2-digit' }).toUpperCase();
  const year = date.getFullYear().toString();
  return [month, year];
};

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [attendanceData, setAttendanceData] = useState<number[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activePaymentTab, setActivePaymentTab] = useState("all");
  const tenant = useTenant();
  const apiUrl = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), "/api");
  const getDocumentUrl = (path: string) => {
    if (!path) return "";
    return apiUrl.replace("/api", "") + path;
  };

  // API hooks for different data types
  const { data: profileData, call: fetchProfile, loading: profileLoading } = useApi(studentProfile);
  const { data: contactData, call: fetchContact, loading: contactLoading } = useApi(getMyStudentContactInfo);
  const { data: academicData, call: fetchAcademic, loading: academicLoading } = useApi(getMyStudentAcademicInfo);
  const { data: dashboardData, call: fetchDashboard, loading: dashboardLoading } = useApi(getStudentDashboard);
  const { data: attendanceRecords, call: fetchAttendance, loading: attendanceLoading } = useApi(getMyAttendanceRecords);
  const { data: paymentData, call: fetchPayments, loading: paymentsLoading } = useApi(getStudentPayments);
  const student = profileData?.data as Student | undefined;

  const profileImageUrl = student?.profile_img
    ? `${process.env.NEXT_PUBLIC_API_URL}${normalizeDocumentUrl(student.profile_img)}`
    : `${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/man-techer-icon.svg`;

  const documents: DocumentItem[] = [
    { name: "Aadhaar Card", url: normalizeDocumentUrl(student?.aadhar_doc) || "" },
    { name: "Birth Certificate", url: normalizeDocumentUrl(student?.birth_certificate_doc) || "" },
    { name: "10th Mark Sheet", url: normalizeDocumentUrl(student?.ten_marksheet_doc) || "" },
    { name: "12th Mark Sheet", url: normalizeDocumentUrl(student?.twelve_marksheet_doc) || "" },
    { name: "Graduation Mark Sheet", url: normalizeDocumentUrl(student?.graduation_doc) || "" },
    { name: "Caste Certificate", url: normalizeDocumentUrl(student?.caste_certificate_doc) || "" },
    { name: "Physical Challenge Certificate", url: normalizeDocumentUrl(student?.physically_challenged_certificate) || "" },
  ].filter((document) => Boolean(document.url));

  useEffect(() => {
    fetchProfile();
    fetchContact();
    fetchAcademic();
    fetchDashboard();
  }, []);

  // Fetch payments when tab or profile changes
  useEffect(() => {
    if (student?.id) {
      const statusFilter = activePaymentTab === "all" ? undefined :
        activePaymentTab === "success" ? "paid" : "pending";
      fetchPayments({
        studentId: student.id,
        status: statusFilter as any
      });
    }
  }, [activePaymentTab, student?.id]);

  // Refetch attendance when year changes or profile loads
  useEffect(() => {
    if (student?.id) {
      fetchAttendance({
        studentId: String(student.id),
        year: selectedYear
      });
    }
  }, [selectedYear, student?.id]);

  // Process attendance data for chart
  useEffect(() => {
    if (attendanceRecords?.data?.records) {
      // Group attendance by month and calculate percentages
      const monthlyData = new Array(12).fill(0);
      const monthlyCounts = new Array(12).fill(0);

      attendanceRecords.data.records.forEach(record => {
        const date = new Date(record.attendance_date);
        const month = date.getMonth();
        const status = normalizeStatus((record as any).attendance_status ?? (record as any).status);
        if (status === 'present') {
          monthlyData[month]++;
        }
        monthlyCounts[month]++;
      });

      const monthlyPercentages = monthlyData.map((present, index) => {
        return monthlyCounts[index] > 0 ? Math.round((present / monthlyCounts[index]) * 100) : 0;
      });

      setAttendanceData(monthlyPercentages);
    }
  }, [attendanceRecords]);

  // Debug logs
  useEffect(() => {
    console.log("Profile Data:", profileData);
    console.log("Contact Data:", contactData);
    console.log("Academic Data:", academicData);
    console.log("Dashboard Data:", dashboardData);
    console.log("Attendance Records:", attendanceRecords);
    console.log("Payment Data:", paymentData);
  }, [profileData, contactData, academicData, dashboardData, attendanceRecords, paymentData]);

  const chartOptions: any = {
    chart: {
      type: 'line',
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#43aae0'], // Blue for Attendance

    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#7b8394', fontSize: '10px' }
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        style: { colors: '#7b8394', fontSize: '10px' },
        formatter: (val: number) => `${val}%`
      }
    },
    grid: {
      borderColor: '#d8d8d8ff',
      strokeDashArray: 4,
      padding: {
        left: 10,
        right: 10,
        top: 0,
        bottom: 0
      }
    },

    dataLabels: { enabled: false },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      markers: { size: 6 }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => `${val}%`
      }
    }
  };

  const chartSeries = [
    {
      name: 'Attendance',
      data: attendanceData.length > 0 ? attendanceData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  ];

  // Loading state
  if (profileLoading || contactLoading || academicLoading) {
    return (
      <section className="min-h-screen student-profile">
        <div className="mx-auto flex w-full flex-col gap-5">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.50fr)]">
              <div className="space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className="min-h-screen student-profile">
      <div className="mx-auto flex w-full flex-col gap-5">
        <div className="bg-gradient-to-br">
          <h1 className="mb-4 text-3xl font-regular tracking-[-0.03em] text-dark sm:text-[2.25rem]">
            Welcome in, {student?.student_name || "Student"}
          </h1>

          <div className="grid md:gap-3 gap-2 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.50fr)]">
            <div className="grid md:gap-4 gap-3">
              <div className="grid md:gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
                <article className="overflow-hidden rounded-[5px] bg-[#43aae0]">
                  <div className="grid gap-4 md:p-3 p-2 lg:grid-cols-[120px_minmax(0,1fr)] ">
                    <div className="flex items-start justify-center w-[120px] h-[120px] rounded-full bg-white overflow-hidden">
                      {student?.profile_img ? (
                        <img src={tenant ? getDocumentUrl(student?.profile_img) : undefined} alt="Student" />
                      ) : (
                        <User className="main-avatar-icon" />
                      )}
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="grid gap-3 sm:grid-cols-1">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/75">
                            Roll no
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="flex gap-3 text-[1.85rem] font-semibold leading-none text-white">
                              {student?.roll_number || student?.student_id || student?.id || "Loading..."}
                              {
                                normalizeStatus(student?.sex) === "male" && (
                                  <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/male-icon.svg`} alt="" width={18} height={18} className="h-7 w-7 object-contain" />
                                )
                              }
                              {
                                normalizeStatus(student?.sex) === "female" && (
                                  <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/female-icon.svg`} alt="" width={18} height={18} className="h-7 w-7 object-contain" />
                                )
                              }
                            </p>
                            <span className="text-white/85"></span>
                          </div>
                        </div>
                        <div className="flex grid-cols-2 flex-wrap gap-0 justify-between">
                          <div className="w-1/2 py-2 border-b border-r border-white/30">
                            <p className="text-[0.9rem] font-regular uppercase tracking-[0.08em] text-white/75">DOB</p>
                            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                              {formatDate(student?.dob || null)}
                            </div>
                          </div>

                          <div className="w-1/2 py-2 border-b pl-3 border-white/30">
                            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/75">
                              Gender
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {student?.sex || "Not specified"}
                            </p>
                          </div>

                          <div className="w-1/2 py-2  border-r border-white/30">
                            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/75">
                              Religion
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {student?.religion || "Not specified"}
                            </p>
                          </div>

                          <div className="w-1/2 py-2 pl-3">
                            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/75">
                              Nationality
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {student?.nationality || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 inline-flex w-full items-center justify-between rounded-full bg-[#ffffff] px-4 py-2 text-[11px] font-semibold text-[#5b4b3e] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] sm:w-auto">
                        <span className="uppercase tracking-[0.08em] text-[#8a705f]">
                          Admission Date:
                        </span>
                        <span className="text-dark">{formatDate(student?.admission_date || null)}</span>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="form-card mb-0">
                  <div className="mb-0 flex items-start justify-between gap-3">
                    <h2 className="text-sm font-semibold text-[#1f2432]">
                      Attendance Analytics
                    </h2>

                    <div className="flex gap-2">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="rounded-md border border-[#e4eaf3] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#7e8798] outline-none cursor-pointer"
                      >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-[160px] w-full">
                    {mounted && (
                      <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="line"
                        height="200"
                        width="100%"
                      />
                    )}
                  </div>


                  {/* <div className="mt-4 border-t border-[#edf1f6] pt-3 text-center text-[10px] font-medium text-[#9ca5b4]">
                    Avg Yearly Attendance: <span className="font-semibold text-[#43aae0]">88%</span>
                  </div> */}

                </article>

              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
                <article className="form-card">
                  <h2 className="text-sm font-semibold text-[#1f2432] mb-3">
                    Contact Information
                  </h2>

                  <div className="">
                    <div className="flex flex-col gap-3 border-b border-[#edf1f6] pb-3">
                      <div className="flex items-center justify-between gap-3 rounded-xl">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#455066]">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/e-mail-icon.svg`}
                            alt="Email icon"
                            width={14}
                            height={14}
                            className="h-3.5 w-3.5 object-contain"
                          />
                          {contactData?.data?.email || "No email provided"}
                        </div>
                        <span className="rounded-sm text-2md bg-[#941B74] px-2 py-1 font-medium text-white">
                          {contactData?.data?.phone || "No phone"}
                        </span>
                      </div>

                      <div className="">
                        <div className="flex items-start gap-2 text-sm font-medium text-[#455066]">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/address-white.svg`}
                            alt="Address icon"
                            width={14}
                            height={14}
                            className="mt-0.5 h-3.5 w-3.5"
                          />
                          <span>
                            {contactData?.data?.address || "Address not provided"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-0 p-3 sm:grid-cols-2 bg-white rounded-sm">
                      <div className="px-1 py-1 w-3/3">
                        <p className="text-[14px] font-medium text-[#8e97a8]">
                          Parent name
                        </p>
                        <p className="mt-1 text-sm font-regular text-[#222938]">
                          {contactData?.data?.parent?.fatherName || "Not provided"}
                        </p>
                      </div>
                      <div className="px-1 py-1 w-3/3">
                        <p className="text-[14px] font-medium text-[#8e97a8]">
                          Parent Phone
                        </p>
                        <p className="mt-1 text-sm font-regular text-[#222938]">
                          {contactData?.data?.parent?.parentPhone || "Not provided"}
                        </p>
                      </div>
                      <div className="px-1 py-1 w-3/3">
                        <p className="text-[14px] font-medium text-[#8e97a8]">
                          Parent Email
                        </p>
                        <p className="mt-1 text-xs font-regular text-[#222938] break-all">
                          {contactData?.data?.parent?.fatherEmail || "Not provided"}
                        </p>
                      </div>

                    </div>
                  </div>
                </article>

                <article className="form-card mb-0">
                  <div className="mb-0 flex items-start justify-between gap-3">
                    <h2 className="text-sm font-semibold text-[#1f2432]">
                      Attendance &amp; Performance
                    </h2>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-[#e4eaf3] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#7e8798]"
                    >
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/filter-icon.svg`}
                        alt="Filter icon"
                        width={12}
                        height={12}
                        className="h-3 w-3 object-contain"
                      />
                      1 Year
                    </button>
                  </div>

                  <div className="space-y-4">
                    {dashboardData?.data?.gradedAssignments && dashboardData.data.gradedAssignments.length > 0 ? (
                      dashboardData.data.gradedAssignments.slice(0, 3).map((assignment) => (
                        <div
                          key={assignment.submission_id}
                          className="flex items-center justify-between gap-3 border-b border-[#eef2f7] pb-3 last:border-b-0 last:pb-0"
                        >
                          <p className="text-sm font-medium text-[#3f495f]">
                            {assignment.assignment_title}
                          </p>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-2xl font-semibold leading-none text-[#1f2432]">
                                {assignment.marks_obtained || "--"}
                              </span>
                              <span className="ml-1 text-sm font-medium text-[#a2acbb]">
                                /{assignment.subject_name}
                              </span>
                            </div>
                            {assignment.grade && (
                              <span
                                className={`inline-flex min-w-10 items-center justify-center rounded-full px-2 py-1 text-xs font-bold ${assignment.grade === 'A+' || assignment.grade === 'A'
                                  ? 'bg-[#dbfff0] text-[#20b870]'
                                  : assignment.grade === 'B+' || assignment.grade === 'B'
                                    ? 'bg-[#ffeccf] text-[#e89d22]'
                                    : 'bg-[#ffe1e7] text-[#ef6a8a]'
                                  }`}
                              >
                                {assignment.grade}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm text-[#8e97a8]">
                        No graded assignments found
                      </div>
                    )}
                  </div>
                </article>
              </div>

              <div className="grid md:gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
                <article className="form-card">
                  <h2 className="text-sm font-semibold text-[#1f2432]">
                    Academic Information
                  </h2>

                  <div className="mt-4 p-0">
                    <div className="grid gap-0 md:grid-cols-2 sm:grid-cols-2 grid-cols-2 xl:grid-cols-2">
                      <div className="px-3 py-2 pl-0 flex items-center">
                        <div className="w-[3px] h-[40px] bg-[#5fba72]"></div>
                        <div className="pl-3">
                          <p className="text-[14px] font-medium text-[#8e97a8]">Degree</p>
                          <p className="mt-1 text-sm font-semibold text-[#222938]">
                            {academicData?.data?.degree || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-2 pl-0 flex items-center">
                        <div className="w-[3px] h-[40px] bg-[#1c8fea]"></div>
                        <div className="pl-3">
                          <p className="text-[14px] font-medium text-[#8e97a8]">Stream</p>
                          <p className="mt-1 text-sm font-semibold text-[#222938]">
                            {academicData?.data?.stream || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-2 pl-0 flex items-center">
                        <div className="w-[3px] h-[40px] bg-[#ea1c79]"></div>
                        <div className="pl-3">
                          <p className="text-[14px] font-medium text-[#8e97a8]">Program</p>
                          <p className="mt-1 text-sm font-semibold text-[#222938]">
                            {academicData?.data?.program || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-2 pl-0 flex items-center">
                        <div className="w-[3px] h-[40px] bg-[#ea971c]"></div>
                        <div className="pl-3">
                          <p className="text-[14px] font-medium text-[#8e97a8]">Department</p>
                          <p className="mt-1 text-sm font-semibold text-[#222938]">
                            {academicData?.data?.department || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-[14px] font-medium text-[#8e97a8]">Subject</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {academicData?.data?.subjects && academicData.data.subjects.length > 0 ? (
                          academicData.data.subjects.map((subject, index) => (
                            <span
                              key={index}
                              className="rounded-sm bg-white px-2 py-1 text-sm font-medium text-dark"
                            >
                              {subject}
                            </span>
                          ))
                        ) : dashboardData?.data?.subjects ? (
                          dashboardData.data.subjects.map((subject) => (
                            <span
                              key={subject.id}
                              className="rounded-sm bg-white px-2 py-1 text-sm font-medium text-dark"
                            >
                              {subject.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-[#8e97a8]">No subjects available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>

                <article className="form-card">
                  <h2 className="text-sm font-semibold text-[#1f2432]">
                    Documents &amp; Identity Proof
                  </h2>

                  <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-3">
                    {documents.length > 0 ? documents.map((document) => (
                      <a
                        key={document.name}
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-[15px] flex-col items-center justify-center rounded-[5px] px-3 py-4 text-center bg-[#fbfcff]"
                      >
                        <Image
                          src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/file-icon.svg`}
                          alt="Document icon"
                          width={44}
                          height={44}
                          className="h-11 w-11 object-contain"
                        />
                        <p className="mt-3 text-sm font-semibold leading-5 text-[#2b3242]">
                          {document.name}
                        </p>
                      </a>
                    )) : (
                      <div className="col-span-full text-center py-4 text-sm text-[#8e97a8]">
                        No documents available
                      </div>
                    )}
                  </div>
                </article>
              </div>
            </div>

            <div className="grid md:gap-4 gap-3">
              <article className="form-card">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#1f2432]">
                    Fee Financial Info
                  </h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setActivePaymentTab("all")}
                    className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${activePaymentTab === "all"
                      ? "bg-[#f18733] text-white"
                      : "bg-[#f5f6f9] text-[#7f8797] hover:bg-[#ebecf0]"
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActivePaymentTab("pending")}
                    className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${activePaymentTab === "pending"
                      ? "bg-[#f18733] text-white"
                      : "bg-[#f5f6f9] text-[#7f8797] hover:bg-[#ebecf0]"
                      }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setActivePaymentTab("success")}
                    className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${activePaymentTab === "success"
                      ? "bg-[#f18733] text-white"
                      : "bg-[#f5f6f9] text-[#7f8797] hover:bg-[#ebecf0]"
                      }`}
                  >
                    Success
                  </button>
                </div>

                <div className="mt-4 space-y-1 max-h-80 overflow-y-auto">
                  {paymentData?.data && paymentData.data.length > 0 ? (
                    paymentData.data.map((payment: any) => {
                      const paymentStatus = normalizeStatus(payment.status);
                      const timeDiff = payment.updated_at ?
                        Math.floor((new Date().getTime() - new Date(payment.updated_at).getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      const timeAgo = timeDiff === 0 ? "Today" :
                        timeDiff === 1 ? "1 day ago" : `${timeDiff} days ago`;

                      return (
                        <article
                          key={payment.payment_id || payment.id}
                          className="flex items-center gap-1 rounded-[5px] bg-[#fbfcff] px-3 py-3 shadow-[inset_0_0_0_1px_#eef2f7]"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                            <Image
                              src={paymentStatus === 'paid' ? `${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/credit-payment.svg` : `${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/debit-payment.svg`}
                              alt={payment.payment_type_name || "Payment"}
                              width={18}
                              height={18}
                              className="h-4 w-4 object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#263043]">
                              {payment.payment_type_name || "Payment"}
                            </p>
                            <p className="text-[11px] font-medium text-[#99a2b2]">
                              {timeAgo}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getPaymentStatusStyle(String(payment.status || "pending"))}`}
                          >
                            {String(payment.status || "pending").toUpperCase()}
                          </span>
                        </article>
                      )
                    })
                  ) : dashboardData?.data?.recentPaidFee ? (
                    <article className="flex items-center gap-3 rounded-[16px] bg-[#fbfcff] px-3 py-3 shadow-[inset_0_0_0_1px_#eef2f7]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/profile/credit-payment.svg`}
                          alt="Recent Payment"
                          width={18}
                          height={18}
                          className="h-4 w-4 object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#263043]">
                          {dashboardData.data.recentPaidFee.payment_type_name}
                        </p>
                        <p className="text-[11px] font-medium text-[#99a2b2]">
                          {dashboardData.data.recentPaidFee.paid_date ?
                            formatDate(dashboardData.data.recentPaidFee.paid_date) : "Recently"}
                        </p>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-[#dff8e8] text-[#27b66f]">
                        PAID
                      </span>
                    </article>
                  ) : (
                    <div className="text-center py-4 text-sm text-[#8e97a8]">
                      No payment records found
                    </div>
                  )}
                </div>
              </article>

              <article className="form-card">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-dark decoration-2">
                    Task Track (Assignment)
                  </h2>
                  {/* <button
                    type="button"
                    className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#ef7c66] underline decoration-2 underline-offset-4"
                  >
                    VIEW
                  </button> */}
                </div>

                <div className="space-y-3">
                  {dashboardData?.data?.pendingAssignments && dashboardData.data.pendingAssignments.length > 0 ? (
                    dashboardData.data.pendingAssignments.slice(0, 4).map((assignment) => {
                      const dueDateParts = formatDateShort(assignment.due_date);
                      const { color, label } = getAssignmentStatusColors(assignment.status);
                      return (
                        <article
                          key={assignment.id}
                          className="flex overflow-hidden rounded-[8px] bg-white border border-[#eef2f7] shadow-sm"
                        >
                          <div
                            className="flex items-center justify-center w-[20px] shrink-0 text-white text-[9px] font-bold py-0 px-0 uppercase"
                            style={{ backgroundColor: color }}
                          >
                            <span className="rotate-[-90deg] whitespace-nowrap">{label}</span>
                          </div>
                          <div className="flex flex-1 items-center px-1 py-2">
                            <div className="flex flex-col items-center justify-center px-3 py-2 bg-[#f8f9fb] rounded-md mr-4 min-w-[75px]">
                              <span className="font-bold text-[13px] leading-tight" style={{ color: color }}>{dueDateParts[0]}</span>
                              <span className="text-[#1a202c] font-bold text-[13px] leading-tight mt-1">{dueDateParts[1]}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-[14px] font-bold text-[#1a202c] leading-tight">
                                {assignment.title}
                              </p>
                              <p className="mt-1.5 text-[11px] font-medium text-[#718096] leading-snug">
                                Subject: {assignment.subject_name || "General"} | Type: {assignment.type || "Assignment"}
                              </p>
                            </div>
                          </div>
                        </article>
                      )
                    })
                  ) : (
                    <div className="text-center py-4 text-sm text-[#8e97a8]">
                      No pending assignments found
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
