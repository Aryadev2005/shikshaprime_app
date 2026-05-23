"use client";
import React, { useEffect, useState } from "react";
// import "./StudentIdCard.css";
import { Student } from "@/src/services/studentService";


interface Props {
    students: Student[];
    departments: any[];
    formatDate: (dateString: string | undefined | null) => string;
}

/**
 * StudentIdCardList
 *
 * Renders hidden ID card elements for every student in the list.
 * These cards are positioned off-screen and captured by html2canvas
 * when the user triggers individual or bulk PDF download.
 */
export function StudentIdCardList({ students, departments, formatDate }: Props) {
    return (
        // Positioned off-screen so html2canvas can capture each card without flash
        <div style={{ position: 'fixed', top: -10000, left: -10000, zIndex: -1, pointerEvents: 'none' }}>
            {students.map((student) => {
                const deptName =
                    departments?.find((d: any) => d.id === Number(student.department_id))?.name ||
                    student.department_id ||
                    "-";

                return (
                    <StudentIdCard
                        key={`id-card-${student.id}`}
                        student={student}
                        deptName={String(deptName)}
                        formatDate={formatDate}
                    />
                );
            })}
        </div>
    );
}

// ==============================================================
// Single ID Card Template
// ==============================================================

interface CardProps {
    student: Student;
    deptName: string;
    formatDate: (dateString: string | undefined | null) => string;
}

import { format } from "date-fns";
import { buildApiUrl } from "@/src/utils/tenantUrlBuilder";
import { useTenant } from "@/src/hooks/useTenant";
export function StudentIdCard({ student, deptName, formatDate }: CardProps) {
    const tenant = useTenant();     
    
    // const getFileUrl = (path: string) => {
    //     if (!path) return "";
    //     console.log("Profile Image path ======>", path )
    //     return path.replace("http:", "https:").replace(
    //         "https://localhost/api", "http://localhost:8080/api"
    //     );
    // };
    const getFileUrl = (path: string) => {
        if (!path) return "";
        return buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), path);
    };

    return (
        <>
            {console.log("Profile Image ======>", `http://localhost:8080/${student.profile_img}`)}
            <div
                id={`id-card-${student.id}`}
                style={{
                    width: '204px',   /* ~54mm at 96dpi */
                    height: '325px',  /* ~86mm at 96dpi */
                    background: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0,
                    marginBottom: '12px',
                }}
            >
                {/* Background layers — MUST be absolute+zIndex:0 */}
                <div style={{
                    background: 'linear-gradient(135deg, #E95A43 0%, #E89C05 100%)',
                    width: '100%', height: '35%',
                    position: 'absolute', top: 0, left: 0, zIndex: 0
                }} />
                <div style={{
                    background: '#f8fafc',
                    width: '100%', height: '65%',
                    position: 'absolute', bottom: 0, left: 0, zIndex: 0
                }} />

                {/* Content — position:relative so zIndex works above background layers */}
                <div style={{ position: 'relative', zIndex: 1, marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <h3 style={{ margin: 0, color: '#ffffff', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>College Name</h3>
                    <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,1)', fontSize: '8px' }}>IDENTITY CARD</p>
                </div>

                {/* Profile photo */}
                <div style={{
                    position: 'relative', zIndex: 1, marginTop: '14px', width: '68px', height: '68px', borderRadius: '50%', overflow: 'hidden',
                    border: '3px solid #ffffff', background: '#e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', flexShrink: 0,
                }}>
                    <img
                        src={tenant ? getFileUrl(student.profile_img) : null}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        crossOrigin="anonymous"
                        alt="profile"
                        onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                </div>

                {/* Student details */}
                <div style={{ position: 'relative', zIndex: 1, marginTop: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '88%' }}>
                    <h4 style={{
                        margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#1e293b'
                    }}>{student.student_name}</h4>
                    <p style={{
                        margin: '3px 0 0 10px', fontSize: '9px', color: '#439ce9', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '10px',
                    }}>{deptName}</p>

                    {/* Info table */}
                    <div style={{
                        marginTop: '8px', width: '100%', textAlign: 'left', fontSize: '9px', color: '#334155', lineHeight: '1.7', background: '#f1f5f9', padding: '6px 8px 6px 8px', borderRadius: '4px', border: '1px solid #f1f1f1', boxSizing: 'border-box' as const
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                            <strong style={{ color: '#686868', whiteSpace: 'nowrap' }}>ID No:</strong>
                            <span style={{ color: '#01244E', textAlign: 'right' }}>
                                {student.roll_number || student.student_id}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                            <strong style={{ color: '#686868', whiteSpace: 'nowrap' }}>Reg No:</strong>
                            <span style={{ color: '#01244E', textAlign: 'right' }}>
                                {student.university_registration_number || '-'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                            <strong style={{ color: '#686868', whiteSpace: 'nowrap' }}>DOB:</strong>
                            <span style={{ color: '#01244E', textAlign: 'right' }}>
                                {format(student.dob, "dd-MMM-yyyy").toUpperCase()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginBottom: '10px' }}>
                            <strong style={{ color: '#686868', whiteSpace: 'nowrap' }}>Phone:</strong>
                            <span style={{ color: '#01244E', textAlign: 'right' }}>{student.mobile}</span>
                        </div>
                    </div>
                </div>

                {/* Footer banner */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 2, width: '100%', padding: '0px 6px 5px 6px', background: '#1e3a8a', textAlign: 'center', boxSizing: 'border-box' as const }}>
                    <p style={{ margin: 0, fontSize: '7px', color: '#ffffff', marginBottom: '5px', }}>
                        Address: CL 9-12, Sector II, Salt Lake City, Kolkata - 91
                    </p>
                </div>
            </div>
        </>
    );
}
