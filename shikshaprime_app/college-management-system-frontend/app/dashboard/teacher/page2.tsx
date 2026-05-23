"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/src/context/authContext";
import './admin-dashboard.css';
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useApi } from "@/src/hooks/useApi";
import { getNoticesLatest } from "@/src/services/noticesService";
import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import { buildApiUrl } from "@/src/utils/tenantUrlBuilder";
import { useTenant } from "@/src/hooks/useTenant";

export default function TeacherDashboard() {
    const tenant = useTenant();    
    const { user } = useContext(AuthContext)!;
    const { data: latestNoticesData, error: latestNoticesError, loading: latestNoticesLoading, call: latestNoticesCall } = useApi(getNoticesLatest);
    const getFileUrl = (path: string) => {
        if (!path) return "";
        return buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), path);
    }
    useEffect(() => {
        latestNoticesCall();
    }, []);
    return (
        <>
            <div className="admin-dashboard-container">

                {/* Header (Simplified based on image context) */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-[#01244E]">Welcome Teacher user</h1>
                    {/* Search bar could go here if needed as per top nav in design */}
                </div>

                {/* Top Stats Row */}
                {/* <div className="stats-grid">
          <div className="stat-card orange">
            <div>
              <div className="stat-title">Total Students</div>
              <div className="stat-value">3250</div>
            </div>
            <div className="stat-icon">
              <Users className="text-white" size={24} />
            </div>
          </div>

          <div className="stat-card purple">
            <div>
              <div className="stat-title">New Admissions</div>
              <div className="stat-value">420 <span className="text-lg font-normal">/per year</span></div>
            </div>
            <div className="stat-icon">
              <Landmark className="text-white" size={24} />
            </div>
          </div>

          <div className="stat-card blue">
            <div>
              <div className="stat-title">Dropouts</div>
              <div className="stat-value">8 <span className="text-lg font-normal">with reason</span></div>
            </div>
            <div className="stat-icon">
              <UserMinus className="text-white" size={24} />
            </div>
          </div>

          <div className="stat-card magenta">
            <div>
              <div className="stat-title">Attendance Summary</div>
              <div className="stat-value">91% <span className="text-lg font-normal">Avg</span></div>
            </div>
            <div className="stat-icon">
              <FileText className="text-white" size={24} />
            </div>
          </div>
        </div> */}

                <div className="dashboard-main-grid">
                    {/* <div className="card-white" style={{ minHeight: '400px' }}>
            <div className="section-header">
              <h3 className="section-title">Academic Performance</h3>
            </div>
            <div className="h-64">
              <Chart options={academicChartOptions} series={academicChartSeries} type="line" height={300} />
              <div className="text-center text-sm font-semibold text-gray-600 mt-2">
                Internal vs University Exam performance trends
              </div>
            </div>
          </div> */}

                    <div className="card-white relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="section-title mb-0">Notices</h3>
                            <div className="flex gap-2">
                                <button className="swiper-prev-btn p-1.5 rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button className="swiper-next-btn p-1.5 rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="notices-slider-container px-0">
                            <Swiper
                                modules={[Pagination, Autoplay, Navigation]}
                                spaceBetween={20}
                                slidesPerView={1}
                                pagination={{ clickable: true }}
                                navigation={{
                                    nextEl: '.swiper-next-btn',
                                    prevEl: '.swiper-prev-btn',
                                }}
                                autoplay={{ delay: 30000, disableOnInteraction: false }}
                                breakpoints={{
                                    640: { slidesPerView: 1 },
                                    768: { slidesPerView: 2 },
                                    1024: { slidesPerView: 2 },
                                }}
                                observer={true}
                                observeParents={true}
                                className="notices-swiper"
                                style={{ width: '100%', height: '100%' }}
                            >
                                {latestNoticesData?.data?.data?.length > 0 && latestNoticesData?.data?.data.map((item: any) => (
                                    <SwiperSlide key={item.id}>
                                        <div className="notice-item-horizontal p-4 border rounded-lg bg-[#f8f9fa] h-full flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex flex-row items-center relative gap-2">
                                                        <span className="text-[12px] py-0.5 px-3 bg-[#7f7bda] rounded-sm text-white flex items-center font-medium whitespace-nowrap">{format(parseISO(item?.from_date), 'dd MMM')}</span>
                                                        <div className="w-[15px] h-[2px] bg-gradient-to-r from-[#7f7bda] to-[#ab0b87]"></div>
                                                        <span className="text-[12px] py-0.5 px-3 bg-[#ab0b87] rounded-sm text-white mt-0 font-medium whitespace-nowrap">{format(parseISO(item?.to_date), 'dd MMM')}</span>
                                                    </div>
                                                    <Link href={tenant ? getFileUrl(item?.attachment) : ''} target="_blank" className="view-btn rounded-sm h-8 w-8 flex items-center justify-center border border-[#01244E] text-[#01244E] hover:bg-[#01244E] hover:text-white transition-colors">
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                                <h4 className="font-bold text-sm text-[#01244E] line-clamp-1 mb-1 capitalize">{item?.title}</h4>
                                                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{item?.description}</p>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>

                    {/* <div className="card-white">
            <h3 className="section-title mb-6">Faculty Members</h3>
            <div className="faculty-list px-0">
              {teachersData?.data?.data?.length > 0 ? (
                teachersData?.data?.data.map((teacher: any) => (
                  <div key={teacher.id} className="faculty-item flex items-center gap-4 p-3 border-b last:border-0">
                    <div className="h-10 w-10 rounded-full bg-[#E76F51] text-white flex items-center justify-center font-bold overflow-hidden">
                      {teacher.profile_image ? (
                        <Image 
                          src={getFileUrl(teacher.profile_image)} 
                          alt={teacher.employee_name} 
                          width={40} 
                          height={40} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        teacher.employee_name?.charAt(0) || 'F'
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-[#01244E]">{teacher.employee_name}</h4>
                      <p className="text-xs text-gray-500">{teacher.designation} • {teacher.department?.name || 'Faculty'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 bg-[#FFE8D6] text-[#E76F51] rounded-full uppercase font-medium">
                        {teacher.employee_id}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-gray-500">No faculty members found</div>
              )}
            </div>
          </div> */}
                </div>

                {/* <div className="finance-row">
        <div className="flex flex-col gap-6">
          <div className="card-white">
            <h3 className="section-title mb-4">Finance Snapshot</h3>
            <div className="flex gap-2 mb-4">
              <button className="bg-[#E76F51] text-white px-3 py-1 text-sm rounded">Department</button>
              <button className="bg-[#FFE8D6] text-[#E76F51] px-3 py-1 text-sm rounded">Head of Expense</button>
            </div>

            <div className="bg-white rounded-lg">
              <div className="finance-item">
                <span className="finance-label">Annual Budget</span>
                <span className="finance-value highlight-orange">₹12 Cr</span>
              </div>
              <div className="finance-item">
                <span className="finance-label">Expenses Incurred</span>
                <span className="finance-value highlight-orange">₹6.2 Cr</span>
              </div>
              <div className="finance-item">
                <span className="finance-label">Fee Collection %</span>
                <span className="finance-value highlight-orange">92%</span>
              </div>
              <div className="finance-item">
                <span className="finance-label">Scholarships Distributed</span>
                <span className="finance-value highlight-orange">₹43L</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-white" style={{ background: '#f8f9fa', border: 'none', boxShadow: 'none' }}>
          <h3 className="section-title mb-4">NAAC / NBA / NIRF / UGC Compliance</h3>
          <h4 className="font-semibold text-sm mb-4">Accreditation Status Widget</h4>

          <div className="compliance-container">
            <div className="compliance-item">
              <span className="compliance-label">Some college, but no degree</span>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill prog-orange">80%</div>
              </div>
            </div>
            <div className="compliance-item">
              <span className="compliance-label">Prefer not to say</span>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill prog-purple">92%</div>
              </div>
            </div>
            <div className="compliance-item">
              <span className="compliance-label">Bachelor's degree</span>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill prog-blue">75%</div>
              </div>
            </div>
            <div className="compliance-item">
              <span className="compliance-label">High school diploma</span>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill prog-dark">60%</div>
              </div>
            </div>
            <div className="compliance-item">
              <span className="compliance-label">Associates or technical degree</span>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill prog-gray">96%</div>
              </div>
            </div>
          </div>
        </div>
      </div> */}
                {/* <div className="flex gap-4 justify-end">
        <div className="bg-white p-3 rounded-xl border border-red-200 shadow-sm cursor-pointer hover:bg-gray-50 flex flex-col items-center w-24">
          <Settings size={20} className="mb-1" />
          <span className="text-xs font-semibold">Setting</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-red-200 shadow-sm cursor-pointer hover:bg-gray-50 flex flex-col items-center w-24">
          <Headphones size={20} className="mb-1" />
          <span className="text-xs font-semibold">Help Center</span>
        </div>
      </div> */}
            </div>
            {/* <FooterPage /> */}
        </>
    );
}