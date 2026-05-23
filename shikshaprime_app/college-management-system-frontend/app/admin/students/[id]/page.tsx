"use client";
import React, { useEffect, useState, useContext } from "react";
import "./student-details.css";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/src/hooks/useApi";
import { getStudentById, Student, updateStudent } from "@/src/services/studentService";
import { ArrowLeft, User, Save, X, ChevronLeft, Download, Mail, Phone, Calendar, Hash, MapPin, GraduationCap, Globe, Users, CreditCard, Award } from "lucide-react";
import { AuthContext } from "@/src/context/authContext";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/src/context/notificationContext";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { format } from 'date-fns';
import { useAppSelector } from "@/src/store/hooks";
import { buildApiUrl } from "@/src/utils/tenantUrlBuilder";
import { useTenant } from "@/src/hooks/useTenant";

// Zod schema for student edit form
// Base schema for all users
const baseStudentEditSchema = z.object({
    mobile: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long").optional().or(z.literal('')),
    guardian_mobile: z.string().min(10, "Guardian mobile must be at least 10 digits").max(15, "Phone number is too long").optional().or(z.literal('')),
    guardian_email: z.string().email("Invalid email address").optional().or(z.literal('')),
    address_line: z.string().optional(),
    pin_code: z.string().min(6, "Pin code must be 6 digits").max(6, "Pin code must be 6 digits").optional().or(z.literal('')),
    state: z.string().optional(),
    city: z.string().optional(),
    university_registration_number: z.string().min(1, 'Registration number is required'),
});

// Extended schema for admin users (currently identical but kept for future use)
const adminStudentEditSchema = baseStudentEditSchema.extend({});

// Type that includes all possible fields
export type StudentEditFormData = z.infer<typeof adminStudentEditSchema>;

// Function to get the appropriate schema based on user role
const getStudentEditSchema = (isAdmin: boolean) => {
    return isAdmin ? adminStudentEditSchema : baseStudentEditSchema;
};

// Dummy Data for Results
const dummyResults = [
    { semester: "Sem 1", subject: "Mathematics", marks: 85, grade: "A+" },
    { semester: "Sem 1", subject: "Physics", marks: 78, grade: "A" },
    { semester: "Sem 1", subject: "Chemistry", marks: 82, grade: "A" }, // Changed to A to match color map key existence
    { semester: "Sem 2", subject: "Mathematics", marks: 88, grade: "A+" }, // Changed O to A+ for simplicity/consistency with map
    { semester: "Sem 2", subject: "Physics", marks: 75, grade: "B+" },
    { semester: "Sem 2", subject: "Chemistry", marks: 79, grade: "A" },
];

// Dummy Data for Attendance
const dummyAttendance = [
    { month: "January", workingDays: 22, presentDays: 20, percentage: 90.9 },
    { month: "February", workingDays: 20, presentDays: 18, percentage: 90.0 },
    { month: "March", workingDays: 23, presentDays: 21, percentage: 91.3 },
    { month: "April", workingDays: 21, presentDays: 19, percentage: 90.4 },
    { month: "May", workingDays: 22, presentDays: 22, percentage: 100.0 },
];

const payment = [
    {
        "id": 1,
        "paymentFor": "Admission Fee",
        "paymentMode": "Online",
        "status": "Paid",
        "price": 5000
    },
    {
        "id": 2,
        "paymentFor": "Tuition Fee - January",
        "paymentMode": "Cash",
        "status": "Pending",
        "price": 7500
    },
    {
        "id": 3,
        "paymentFor": "Exam Fee",
        "paymentMode": "UPI",
        "status": "Paid",
        "price": 1500
    },
    {
        "id": 4,
        "paymentFor": "Library Fee",
        "paymentMode": "Card",
        "status": "Failed",
        "price": 800
    },
    {
        "id": 5,
        "paymentFor": "Transport Fee",
        "paymentMode": "Online",
        "status": "Paid",
        "price": 3000
    }
]


const getGradeClass = (grade: string) => {
    const map: Record<string, string> = {
        'A+': 'grade-A-plus',
        'A': 'grade-A',
        'B+': 'grade-B-plus',
        'B': 'grade-B',
        'C': 'grade-C'
    };
    return map[grade] || 'grade-C';
};

export default function StudentDetailsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useContext(AuthContext)!;
    const { success: notifySuccess, error: notifyError } = useNotify();
    const studentId = params.id as string;
    const isEditMode = searchParams.get('edit') === 'true';
    const isAdmin = user?.role === 'admin';

    // Fetch classes from Redux store
    const { classes } = useAppSelector((state) => state.classes);
    const { departments } = useAppSelector((state) => state.departments);

    const { data, loading, error, call } = useApi(getStudentById);
    const { call: callUpdateStudent } = useApi(updateStudent);
    const [student, setStudent] = useState<Student | null>(null);
    const { programs } = useAppSelector((state) => state.programs);

    const tenant = useTenant();

    const apiUrl = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), "/api");
    const getDocumentUrl = (path: string) => {
        if (!path) return "";
        return apiUrl.replace("/api", "") + path;
    };

    // Initialize form with react-hook-form and zod
    const form = useForm<StudentEditFormData>({
        resolver: zodResolver(getStudentEditSchema(isAdmin)),
        defaultValues: {
            mobile: '',
            guardian_mobile: '',
            guardian_email: '',
            address_line: '',
            pin_code: '',
            state: '',
            city: '',
            university_registration_number: '',

        },
    });

    useEffect(() => {
        if (studentId) {
            fetchStudent();
        }
    }, [studentId]);

    const fetchStudent = async () => {
        setIsLoading(true);
        try {
            const response = await call(studentId);
            if (response?.data) {
                setStudent(response.data);
                console.log("Fetched student:", response.data);

                // Reset form with fetched data
                const formValues: any = {
                    mobile: response.data.mobile || '',
                    guardian_mobile: response.data.guardian_mobile || '',
                    guardian_email: response.data.guardian_email || '',
                    address_line: response.data.address_line || '',
                    pin_code: response.data.pin_code || '',
                    state: response.data.state || '',
                    city: response.data.city || '',
                    university_registration_number: response.data.university_registration_number || ''
                };

                form.reset(formValues);
            }
        } catch (err) {
            console.error("Error fetching student:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Format date for display
    // const formatDate = (dateString: string) => {
    //     if (!dateString) return "-";
    //     const date = new Date(dateString);
    //     return date.toLocaleDateString('en-GB', {
    //         day: '2-digit',
    //         month: '2-digit',
    //         year: 'numeric'
    //     });
    // };

    // Handle form submission
    const onSubmit = async (data: StudentEditFormData) => {
        setIsLoading(true);
        if (!student) return;
        console.log("Form submitted with data:", data);

        try {
            await callUpdateStudent(student.id, data);
            notifySuccess("Student updated successfully!");
            // Refresh student data and exit edit mode
            await fetchStudent();
            router.push(`/admin/students`);
        } catch (err) {
            console.error("Error updating student:", err);
            notifyError("Failed to update student");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        router.push(`/teacher/students/${studentId}`);
    };

    // Check if field is editable
    const isFieldEditable = (fieldName: string) => {
        const alwaysEditableFields = [
            'mobile',
            'guardian_mobile',
            'guardian_email',
            'address_line',
            'pin_code',
            'state',
            'city',
            'university_registration_number'
        ];

        if (alwaysEditableFields.includes(fieldName)) {
            return true;
        }

        return false;
    };

    if (loading) {
        return (
            <div className="student-details-wrapper">
                <div className="loading-container">Loading student details...</div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="student-details-wrapper">
                <div className="error-container">
                    <p>Error loading student details</p>
                    <button onClick={() => router.back()} className="back-btn">
                        <ArrowLeft className="h-4 w-4" /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {console.log("Program ====>", programs)}
            {isLoading && <Loader />}
            <div className="student-details-wrapper">
                {/* Header Card */}
                <div className="details-header-card">
                    <Link href={'/admin/students'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link><h3 className="text-dark text-lg font-semibold">{isEditMode ? 'Edit Student Details' : 'Student Details'}</h3>
                </div>

                {/* Main Content Card */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="details-content-card">
                            {/* Redesigned Modern Profile Section */}
                            <div className="modern-profile-section">
                                {/* Banner / Header Card */}
                                <div className="profile-banner">
                                    <div className="profile-banner-content">
                                        <div className="avatar-container">
                                            <div className="avatar-ring">
                                                {student.profile_img ? (
                                                    <img src={tenant ? getDocumentUrl(student.profile_img) : undefined} alt="Student" className="main-avatar" />
                                                ) : (
                                                    <User className="main-avatar-icon" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="profile-info">
                                            <div className="profile-name-row">
                                                <h2>{student.student_name}</h2>
                                                <span className="student-status">Active Student</span>
                                            </div>

                                            <div className="profile-id-row">
                                                <div className="id-item">
                                                    <Hash size={16} />
                                                    <span>Roll: {student.roll_number || student.student_id || student.id}</span>
                                                </div>
                                                <div className="id-item">
                                                    <Calendar size={16} />
                                                    <span>Admission: {student.admission_date ? format(new Date(student.admission_date), "dd MMM yyyy") : "-"}</span>
                                                </div>
                                                <div className="id-item">
                                                    <GraduationCap size={16} />
                                                    <span>{programs?.find((item) => item?.id === student?.program_id)?.name || "-"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="profile-stats">
                                            <div className="stat-card">
                                                <div className="stat-header">
                                                    <Award size={18} className="text-orange-500" />
                                                    <span>Total Attendance</span>
                                                </div>
                                                <div className="stat-value">{student.attendance_percentage || 0}%</div>
                                                <div className="stat-progress-bar">
                                                    <div
                                                        className="stat-progress-fill"
                                                        style={{ width: `${student.attendance_percentage || 0}%`, background: (student.attendance_percentage || 0) >= 75 ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' : 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)' }}
                                                    ></div>
                                                </div>
                                                <div className="mt-2 text-xs text-white">
                                                    {student.present_count || 0} Present / {student.absent_count || 0} Absent
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="modern-details-grid">
                                    <div className="detail-item">
                                        <div className="item-icon"><Mail size={18} /></div>
                                        <div className="item-content">
                                            <label>Email Address</label>
                                            <span className="item-value">{student.email || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><Phone size={18} /></div>
                                        <div className="item-content">
                                            <label>Mobile Number</label>
                                            {isEditMode && isFieldEditable("mobile") ? (
                                                <FormField
                                                    control={form.control}
                                                    name="mobile"
                                                    render={({ field }) => (
                                                        <FormItem className="w-full">
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Enter phone number"
                                                                    className="editable-input w-full h-8 px-2 py-0 border-none bg-slate-50 focus:bg-white"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ) : (
                                                <span className="item-value">{student.mobile || "-"}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><Hash size={18} /></div>
                                        <div className="item-content">
                                            <label>Uni. Registration</label>
                                            {isEditMode && isFieldEditable("university_registration_number") ? (
                                                <FormField
                                                    control={form.control}
                                                    name="university_registration_number"
                                                    render={({ field }) => (
                                                        <FormItem className="w-full">
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Enter registration number"
                                                                    className="editable-input w-full h-8 px-2 py-0 border-none bg-slate-50 focus:bg-white"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ) : (
                                                <span className="item-value">{student?.university_registration_number || "NA"}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><Globe size={18} /></div>
                                        <div className="item-content">
                                            <label>Department</label>
                                            <span className="item-value">
                                                {departments?.find((d: any) => d.id === Number(student.department_id))?.name || "-"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><User size={18} /></div>
                                        <div className="item-content">
                                            <label>Gender</label>
                                            <span className="item-value">{student.sex || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><Calendar size={18} /></div>
                                        <div className="item-content">
                                            <label>Date of Birth</label>
                                            <span className="item-value">
                                                {student.dob ? format(new Date(student.dob), "dd MMM yyyy") : "-"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><Globe size={18} /></div>
                                        <div className="item-content">
                                            <label>Nationality</label>
                                            <span className="item-value">{student.nationality || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><Users size={18} /></div>
                                        <div className="item-content">
                                            <label>Caste</label>
                                            <span className="item-value">{student?.caste || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><CreditCard size={18} /></div>
                                        <div className="item-content">
                                            <label>ID Proof Type</label>
                                            <span className="item-value">{student?.id_proof_type || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><Hash size={18} /></div>
                                        <div className="item-content">
                                            <label>ID Proof Number</label>
                                            <span className="item-value">{student.id_proof_number || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="item-icon"><Award size={18} /></div>
                                        <div className="item-content">
                                            <label>Admission Year</label>
                                            <span className="item-value">
                                                {classes?.find((c: any) => c.id === Number(student.class_id))?.name || "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DOB Section - Commented out as moved to profile-right */}
                            {/* <div className="dob-section">
                                <div className="info-field">
                                    <span className="info-label"></span>
                                    <span className="field-value"></span>
                                </div>
                            </div> */}

                            {/* Parents Details Section */}
                            <div className="section-block">
                                <h3 className="section-title">Parents Details</h3>
                                <div className="details-grid">
                                    <div className="info-field">
                                        <span className="info-label">Father's Name:</span>
                                        <span className="field-value">{student.father_name || "-"}</span>
                                    </div>
                                    <div className="info-field">
                                        <span className="info-label">Mother's Name:</span>
                                        <span className="field-value">{student.mother_name || "-"}</span>
                                    </div>
                                    <div className="info-field">
                                        <span className="info-label">Guardian Mobile:</span>
                                        {isEditMode && isFieldEditable('guardian_mobile') ? (
                                            <FormField
                                                control={form.control}
                                                name="guardian_mobile"
                                                render={({ field }: { field: ControllerRenderProps<StudentEditFormData, "guardian_mobile"> }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="Enter guardian mobile"
                                                                className="editable-input"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <span className="field-value">{student.guardian_mobile || student.mobile || "-"}</span>
                                        )}
                                    </div>
                                    <div className="info-field">
                                        <span className="info-label">Guardian Email:</span>
                                        {isEditMode && isFieldEditable('guardian_email') ? (
                                            <FormField
                                                control={form.control}
                                                name="guardian_email"
                                                render={({ field }: { field: ControllerRenderProps<StudentEditFormData, "guardian_email"> }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="email"
                                                                placeholder="Enter guardian's email"
                                                                className="editable-input"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <span className="field-value">{student.guardian_email || "-"}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address Details Section */}
                            <div className="section-block">
                                <h3 className="section-title">Address Details</h3>
                                <div className="details-grid">
                                    <div className="info-field">
                                        <span className="info-label">Address Line:</span>
                                        {isEditMode && isFieldEditable('present_village') ? (
                                            <FormField
                                                control={form.control}
                                                name="address_line"
                                                render={({ field }: { field: ControllerRenderProps<StudentEditFormData, "address_line"> }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="Enter address"
                                                                className="editable-input"
                                                                readOnly={!isAdmin}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <span className="field-value">{student.address_line || "-"}</span>
                                        )}
                                    </div>
                                    <div className="info-field">
                                        <span className="info-label">City:</span>
                                        {isEditMode && isFieldEditable('present_district') ? (
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }: { field: ControllerRenderProps<StudentEditFormData, "city"> }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="Enter city"
                                                                className="editable-input"
                                                                readOnly={!isAdmin}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <span className="field-value">{student.city || "-"}</span>
                                        )}
                                    </div>
                                    <div className="info-field">
                                        <span className="info-label">State:</span>
                                        {isEditMode && isFieldEditable('present_state') ? (
                                            <FormField
                                                control={form.control}
                                                name="state"
                                                render={({ field }: { field: ControllerRenderProps<StudentEditFormData, "state"> }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="Enter state"
                                                                className="editable-input"
                                                                readOnly={!isAdmin}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <span className="field-value">{student.state || "-"}</span>
                                        )}
                                    </div>
                                    <div className="info-field">
                                        <span className="info-label">Pin Code:</span>
                                        {isEditMode && isFieldEditable('present_pin_code') ? (
                                            <FormField
                                                control={form.control}
                                                name="pin_code"
                                                render={({ field }: { field: ControllerRenderProps<StudentEditFormData, "pin_code"> }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="Enter pin code"
                                                                className="editable-input"
                                                                maxLength={6}
                                                                readOnly={!isAdmin}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <span className="field-value">{student.pin_code || "-"}</span>
                                        )}
                                    </div>
                                </div>
                            </div>


                            {/* Marksheet Cards Section - Only for Admin */}
                            {user?.role === 'admin' && (
                                <div className="marksheet-section">

                                    <Link target="_blank" href={getDocumentUrl(student?.twelve_marksheet_doc)} className="marksheet-card marksheet-coral relative">
                                        {/* <div className="marksheet-icon"></div> */}
                                        <div className="marksheet-content flex justify-between items-center w-[100%]">
                                            <div>
                                                <div className="marksheet-title">Class X marksheet</div>
                                                <div className="marksheet-percentage">{student.ten_percentage.split('.')[0] || "N/A"}% | {student?.board_university_10th.split('.')[0] || "N/A"}</div>
                                            </div>
                                            <span className="py-1 px-2 text-sm bg-white/100 text-black rounded-md bottom-8 right-3"><Download className="h-4 w-4" /></span>
                                        </div>
                                    </Link>
                                    <Link target="_blank" href={getDocumentUrl(student?.ten_marksheet_doc)} className="marksheet-card marksheet-orange relative">
                                        {/* <div className="marksheet-icon"></div> */}
                                        <div className="marksheet-content flex justify-between items-center w-[100%]">
                                            <div>
                                                <div className="marksheet-title">Class XII marksheet</div>
                                                <div className="marksheet-percentage">{student.twelve_percentage.split('.')[0] || "N/A"}% | {student?.board_university_12th.split('.')[0] || "N/A"}</div>
                                            </div>
                                            <span className="py-1 px-2 text-sm bg-white/100 text-black rounded-md bottom-8 right-3"><Download className="h-4 w-4" /></span>
                                        </div>
                                    </Link>
                                    {
                                        student?.graduation_percentage && (
                                            <Link target="_blank" href={getDocumentUrl(student?.graduation_marksheet_doc)} className="marksheet-card marksheet-peach relative">
                                                {/* <div className="marksheet-icon"></div> */}
                                                <div className="marksheet-content flex justify-between items-center">
                                                    <div>
                                                        <div className="marksheet-title">Graduation</div>
                                                        <div className="marksheet-percentage">{student?.graduation_percentage || "N/A"} | {student?.board_university_graduation.split('.')[0] || "N/A"}</div>
                                                    </div>
                                                    <span className="py-1 px-2 text-sm bg-white/100 text-black rounded-md absolute bottom-8 right-3">Download Marksheet</span>
                                                </div>
                                            </Link>
                                        )
                                    }
                                </div>
                            )}
                        </div>
                        {isEditMode && (
                            <div className="edit-actions justify-end">
                                {/* <Button onClick={handleCancel} variant="outline" className="mr-2">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button> */}
                                <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting} variant={'primary'} className="py-5 px-5">
                                    <Save className="h-4 w-4 mr-2" />
                                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        )}
                        <div className="result-block">
                            <h3 className="section-title">Result</h3>
                            <div className="details-table-container ">
                                <table className="custom-student-table">
                                    <thead>
                                        <tr>
                                            <th>Semester</th>
                                            <th>Subject</th>
                                            <th>Marks</th>
                                            <th>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dummyResults.map((result, index) => (
                                            <tr key={index}>
                                                <td>{result.semester}</td>
                                                <td>{result.subject}</td>
                                                <td>{result.marks}</td>
                                                <td>
                                                    <span className={`grade-badge ${getGradeClass(result.grade)}`}>
                                                        {result.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="attendence-block">
                            <h3 className="section-title">Attendance</h3>
                            <div className="details-table-container">
                                <table className="details-table custom-student-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Working Days</th>
                                            <th>Present Days</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dummyAttendance.map((record, index) => (
                                            <tr key={index}>
                                                <td>{record.month}</td>
                                                <td>{record.workingDays}</td>
                                                <td>{record.presentDays}</td>
                                                <td>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-medium">{record.percentage}%</span>
                                                        <div className="attendance-progress-bg">
                                                            <div
                                                                className="attendance-progress-fill"
                                                                style={{ width: `${record.percentage}%`, backgroundColor: record.percentage >= 75 ? '#10B981' : '#F59E0B' }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="payment-block">
                            <h3 className="section-title">Payment</h3>
                            <div className="details-table-container table-responsive">
                                <table className="details-table custom-student-table">
                                    <thead>
                                        <tr>
                                            <th>Payment For</th>
                                            <th>Payment mode</th>
                                            <th>Status</th>
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payment.length > 0 && payment.map((item) => (
                                            <tr key={item?.id}>
                                                <td>{item?.paymentFor}</td>
                                                <td>{item?.paymentMode}</td>
                                                <td><span className={`status inline-block px-3 py-1 text-xs font-medium rounded-full ${item?.status === 'Paid' ? 'bg-green-100 text-green-700' : item?.status === "Pending" ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item?.status}</span></td>
                                                <td>₹{item?.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </form>
                </Form>

            </div >
        </>
    );
}
