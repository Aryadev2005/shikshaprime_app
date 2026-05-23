"use client";
import React, { useEffect, useState, useContext } from "react";
import "./teacher-details.css";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/src/hooks/useApi";
import { getTeacherById, updateTeacher, createTeacherAssignment, deleteTeacherAssignment } from "@/src/services/teacherService";
import { Teacher } from "@/src/types/teacherTypes";
import { ArrowLeft, User, Save, X, ChevronLeft, Edit, Plus, Trash2 } from "lucide-react";
import { AuthContext } from "@/src/context/authContext";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/src/context/notificationContext";
import { useForm } from "react-hook-form";
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
import CascadingSubjectSelect from "../../create-teacher/CascadingSubjectSelect";
import { fetchPrograms, fetchClasses, fetchAcademicYears } from "@/src/services/CommonService";
import { useFieldArray } from "react-hook-form";

// Zod schema for teacher edit form
const baseTeacherEditSchema = z.object({
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long").optional().or(z.literal('')),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    qualification: z.string().optional(),
    experience_years: z.number().optional(),
    designation: z.string().optional(),
    address: z.string().optional(),
});

// Type for teacher edit form
export type TeacherEditFormData = z.infer<typeof baseTeacherEditSchema>;

export default function TeacherDetailsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useContext(AuthContext)!;
    const { success: notifySuccess, error: notifyError } = useNotify();
    const teacherId = params.id as string;
    const isEditMode = searchParams.get('edit') === 'true';
    const isAdmin = user?.role === 'admin';

    // Fetch departments from Redux store
    const { departments } = useAppSelector((state) => state.departments);

    const { data, loading, error, call } = useApi(getTeacherById);
    const { call: callUpdateTeacher } = useApi(updateTeacher);
    const { call: callCreateAssignment } = useApi(createTeacherAssignment);
    const { call: callDeleteAssignment } = useApi(deleteTeacherAssignment);
    const [teacher, setTeacher] = useState<any | null>(null);
    const [programs, setPrograms] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [newAssignments, setNewAssignments] = useState<any[]>([{
        subject: '',
        program: '',
        class: '',
        academicYear: ''
    }]);

    // Initialize form with react-hook-form and zod
    const form = useForm<TeacherEditFormData>({
        resolver: zodResolver(baseTeacherEditSchema),
        defaultValues: {
            phone: '',
            email: '',
            qualification: '',
            experience_years: 0,
            designation: '',
            address: '',
        },
    });

    useEffect(() => {
        if (teacherId) {
            fetchTeacher();
            loadDropdownData();
        }
    }, [teacherId]);

    const loadDropdownData = async () => {
        try {
            const [programsRes, classesRes, academicYearsRes] = await Promise.all([
                fetchPrograms(),
                fetchClasses(),
                fetchAcademicYears()
            ]);

            if (programsRes.status === 1) setPrograms(programsRes.data || []);
            if (classesRes.status === 1) setClasses(classesRes.data || []);
            if (academicYearsRes.status === 1) setAcademicYears(academicYearsRes.data || []);
        } catch (error) {
            console.error("Error loading dropdown data:", error);
        }
    };

    const fetchTeacher = async () => {
        setIsLoading(true);
        try {
            const response = await call(Number(teacherId));
            if (response?.data) {
                setTeacher(response.data);
                console.log("Fetched teacher:", response.data);

                // Reset form with fetched data
                const formValues: any = {
                    phone: response.data.phone || response.data.mobile || '',
                    email: response.data.email || '',
                    qualification: response.data.qualification || '',
                    experience_years: response.data.experience_years || 0,
                    designation: response.data.designation || '',
                    address: response.data.address || '',
                };

                form.reset(formValues);
            }
        } catch (err) {
            console.error("Error fetching teacher:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy');
        } catch (error) {
            return "-";
        }
    };

    // Get full teacher name
    const getFullTeacherName = (teacher: Teacher) => {
        if (teacher.first_name && teacher.last_name) {
            return `${teacher.first_name} ${teacher.last_name}`;
        }
        return teacher.employee_name || teacher.first_name || teacher.last_name || "-";
    };

    // Handle back navigation
    const handleBack = () => {
        router.push('/admin/teachers');
    };

    // Handle edit toggle
    const handleEditToggle = () => {
        if (isEditMode) {
            router.push(`/admin/teachers/${teacherId}`);
        } else {
            router.push(`/admin/teachers/${teacherId}?edit=true`);
        }
    };

    // Assignment management functions
    const handleAddAssignment = () => {
        setNewAssignments([...newAssignments, {
            subject: '',
            program: '',
            class: '',
            academicYear: ''
        }]);
    };

    const handleDeleteAssignment = async (assignmentId: number) => {
        try {
            setIsLoading(true);
            await callDeleteAssignment(assignmentId);
            await fetchTeacher(); // Refresh teacher data to show updated assignments
            notifySuccess("Assignment deleted successfully");
        } catch (error) {
            console.error("Error deleting assignment:", error);
            notifyError("Failed to delete assignment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveAssignment = (index: number) => {
        if (newAssignments.length > 1) {
            const updated = newAssignments.filter((_, i) => i !== index);
            setNewAssignments(updated);
        }
    };

    const handleAssignmentChange = (index: number, field: string, value: string) => {
        const updated = [...newAssignments];
        updated[index] = { ...updated[index], [field]: value };
        setNewAssignments(updated);
    };

    const handleSaveAssignments = async () => {
        try {
            // Create new assignments only - existing ones can be deleted individually
            for (const assignment of newAssignments) {
                if (assignment.subject && assignment.program && assignment.class && assignment.academicYear) {
                    const payload = {
                        teacher_id: parseInt(teacher.id),
                        program_id: parseInt(assignment.program),
                        class_id: parseInt(assignment.class), // Required field for TeacherAssignment model
                        semester_id: parseInt(assignment.class), // Same value as class_id
                        academic_year_id: parseInt(assignment.academicYear),
                        section_id: null,
                        subject_id: parseInt(assignment.subject),
                        is_class_incharge: false,
                        is_active: 1
                    };
                    console.log('Assignment payload:', payload); // For debugging
                    await callCreateAssignment(teacher.id, payload);
                }
            }

            // Reset assignment form
            setNewAssignments([{
                subject: '',
                program: '',
                class: '',
                academicYear: ''
            }]);
        } catch (error) {
            console.error("Error saving assignments:", error);
            throw error; // Re-throw to be handled by calling function
        }
    };

    // Handle form submission
    const onSubmit = async (values: TeacherEditFormData) => {
        if (!teacher) return;

        try {
            setIsLoading(true);
            console.log("Updating teacher with values:", values);

            // Update teacher profile
            const response = await callUpdateTeacher(teacher.id, values);
            if (response?.status === 'success') {
                // Save new assignments if any
                await handleSaveAssignments();
                
                notifySuccess("Teacher updated successfully");
                // Refresh teacher data
                await fetchTeacher();
                // Exit edit mode
                router.push(`/admin/teachers/${teacherId}`);
            } else {
                throw new Error(response?.message || "Update failed");
            }
        } catch (error) {
            console.error("Error updating teacher:", error);
            notifyError("Failed to update teacher");
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || isLoading) {
        return <Loader />;
    }

    if (error || !teacher) {
        return (
            <div className="teacher-details-error">
                <h2>Error loading teacher details</h2>
                <p>{error || "Teacher not found"}</p>
                <Button onClick={handleBack}>Back to Teachers</Button>
            </div>
        );
    }

    return (
        <>
            {isLoading && <Loader />}
            <div className="teacher-details-container">
                {/* Header */}
                <div className="teacher-details-header">
                    <div className="teacher-header-left">
                        <Link href={'/admin/teachers'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link>
                        <div className="teacher-header-info">
                            <h1>{getFullTeacherName(teacher)}</h1>
                            <div className="flex items-center">
                                <p>Emp ID: {teacher.employee_id}</p>&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;
                                <p className="teacher-role">{teacher.designation || "Teacher"}</p>&nbsp;&nbsp;&nbsp;<p className="teacher-dept">
                                    {departments?.find((d: any) => d.id === Number(teacher.department_id))?.name || "Department"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teacher Profile Card */}
                <div className="teacher-profile-card form-card">
                    {isEditMode ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="teacher-edit-form">
                                <div className="form-grid">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mobile Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter mobile number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="qualification"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Qualification</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter qualification" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="designation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Designation</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter designation" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter address" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Subject Assignments Section in Edit Mode */}
                                <div className="assignments-section mt-6">
                                    <h3 className="section-title text-[var(--primary)] mb-4">Subject Assignments</h3>
                                    
                                    {/* Current Assignments Table */}
                                    {teacher.teacher_classes && teacher.teacher_classes.length > 0 && (
                                        <div className="current-assignments mb-6">
                                            <h4 className="text-md font-semibold mb-3">Current Assignments</h4>
                                            <div className="teacher-table-wrapper">
                                                <table className="teacher-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Program</th>
                                                            <th>Department</th>
                                                            <th>Class</th>
                                                            <th>Year</th>
                                                            <th>Subject</th>
                                                            <th>Date Assigned</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {teacher.teacher_classes.map((cls: any) => (
                                                            <tr key={cls.id}>
                                                                <td>{cls.program?.name}</td>
                                                                <td>{cls.subject?.department?.name}</td>
                                                                <td>{cls.class?.name}</td>
                                                                <td>{cls.academic_year?.name}</td>
                                                                <td>{cls.subject?.name}</td>
                                                                <td>{formatDate(cls.assigned_date)}</td>
                                                                <td>
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteAssignment(cls.id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* New Assignments Form */}
                                    <div className="form-card">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-md font-semibold">Add New Subject Assignments</h4>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                                onClick={handleAddAssignment}
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {newAssignments.map((assignment, index) => (
                                                <div key={index} className="assignment-row border p-4 rounded-md">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            {/* Subject Cascading Select */}
                                                            <CascadingSubjectSelect
                                                                value={assignment.subject}
                                                                onChange={(value) => handleAssignmentChange(index, 'subject', value)}
                                                                required
                                                            />

                                                            <div className="grid grid-cols-3 gap-4 mt-3">
                                                                {/* Program */}
                                                                <div className="form-group">
                                                                    <label className="block text-sm font-medium mb-1">Program</label>
                                                                    <select
                                                                        className="form-select w-full p-2 border rounded"
                                                                        value={assignment.program}
                                                                        onChange={(e) => handleAssignmentChange(index, 'program', e.target.value)}
                                                                    >
                                                                        <option value="">Select Program</option>
                                                                        {programs.map((prg: any) => (
                                                                            <option key={prg.id} value={prg.id}>
                                                                                {prg.class_name || prg.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                {/* Year */}
                                                                <div className="form-group">
                                                                    <label className="block text-sm font-medium mb-1">Year</label>
                                                                    <select
                                                                        className="form-select w-full p-2 border rounded"
                                                                        value={assignment.class}
                                                                        onChange={(e) => handleAssignmentChange(index, 'class', e.target.value)}
                                                                    >
                                                                        <option value="">Select Year</option>
                                                                        {classes.map((cls: any) => (
                                                                            <option key={cls.id} value={cls.id}>
                                                                                {cls.class_name || cls.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                {/* Academic Year */}
                                                                <div className="form-group">
                                                                    <label className="block text-sm font-medium mb-1">Year</label>
                                                                    <select
                                                                        className="form-select w-full p-2 border rounded"
                                                                        value={assignment.academicYear}
                                                                        onChange={(e) => handleAssignmentChange(index, 'academicYear', e.target.value)}
                                                                    >
                                                                        <option value="">Select Year</option>
                                                                        {academicYears.map((year: any) => (
                                                                            <option key={year.id} value={year.id}>
                                                                                {year.academic_year || year.year || year.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Remove Assignment Button */}
                                                        {newAssignments.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleRemoveAssignment(index)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <Button type="submit" disabled={isLoading}>
                                        <Save size={16} />
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    ) : (
                        <>
                            <div className="teacher-info-grid">
                                <div className="info-item">
                                    <label>Employee ID :</label>
                                    <span>{teacher.employee_id || "-"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Full Name :</label>
                                    <span>{getFullTeacherName(teacher)}</span>
                                </div>
                                <div className="info-item">
                                    <label>Designation :</label>
                                    <span>{teacher.designation || "-"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Department :</label>
                                    <span>{departments?.find((d: any) => d.id === Number(teacher.department_id))?.name || "-"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Email :</label>
                                    <span>{teacher.email || "-"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Mobile :</label>
                                    <span>{teacher.phone || teacher.mobile || "-"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Qualification :</label>
                                    <span>{teacher.qualification || "-"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Experience :</label>
                                    <span>{teacher.experience_years ? `${teacher.experience_years} years` : "-"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Date of Birth :</label>
                                    <span>{formatDate(teacher.dob || "")}</span>
                                </div>
                                <div className="info-item">
                                    <label>Joining Date :</label>
                                    <span>{formatDate(teacher.joining_date || "")}</span>
                                </div>
                                <div className="info-item">
                                    <label>HOD :</label>
                                    <span>{teacher.is_hod ? "Yes" : "No"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Status :</label>
                                    <span className={teacher.is_active ? "status-active" : "status-inactive"}>
                                        {teacher.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <div className="info-item col-span-3">
                                    <label>Address</label>
                                    <span>{teacher.address || "-"}</span>
                                </div>
                            </div>
                            <br />
                            
                            {/* Subject Assignments Section */}
                            <div className="assignments-section">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="section-title text-[var(--primary)]">Subject Assignments</h3>
                                </div>

                                {/* Display existing assignments table - READ ONLY in view mode */}
                                <div className="teacher-table-wrapper">
                                    <table className="teacher-table">
                                        <thead>
                                            <tr>
                                                <th>Program</th>
                                                <th>Department</th>
                                                <th>Class</th>
                                                <th>Year</th>
                                                <th>Subject</th>
                                                <th>Date Assigned</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teacher.teacher_classes && teacher.teacher_classes.length > 0 ? (
                                                teacher.teacher_classes.map((cls: any) => (
                                                    <tr key={cls.id}>
                                                        <td>{cls.program?.name}</td>
                                                        <td>{cls.subject?.department?.name}</td>
                                                        <td>{cls.class?.name}</td>
                                                        <td>{cls.academic_year?.name}</td>
                                                        <td>{cls.subject?.name}</td>
                                                        <td>{formatDate(cls.assigned_date)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-4">
                                                        No assignments found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}