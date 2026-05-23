"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import "./create-teacher.css";
import { Loader } from "@/components/ui/loader";
import { useApi } from "@/src/hooks/useApi";
import { createTeacher } from "@/src/services/teacherService";
import { fetchPrograms, fetchClasses, fetchAcademicYears } from "@/src/services/CommonService";
import { fetchMasterDepartments } from "@/src/services/departmentService";
import useRoleGuard from "@/src/hooks/useRoleGuard";
import CascadingSubjectSelect from "./CascadingSubjectSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { CapitalizedInput } from "@/src/components/ui/CapitalizedInput";

// Comprehensive Subject List for all types of colleges
const SUBJECTS_LIST = [
    // ===== SCIENCE & MATHEMATICS =====
    { value: "mathematics", label: "Mathematics", category: "Science" },
    { value: "applied_mathematics", label: "Applied Mathematics", category: "Science" },
    { value: "statistics", label: "Statistics", category: "Science" },
    { value: "physics", label: "Physics", category: "Science" },
    { value: "chemistry", label: "Chemistry", category: "Science" },
    { value: "biology", label: "Biology", category: "Science" },
    { value: "zoology", label: "Zoology", category: "Science" },
    { value: "botany", label: "Botany", category: "Science" },
    { value: "microbiology", label: "Microbiology", category: "Science" },
    { value: "biotechnology", label: "Biotechnology", category: "Science" },
    { value: "environmental_science", label: "Environmental Science", category: "Science" },

    // ===== ENGINEERING & TECHNOLOGY =====
    { value: "computer_science", label: "Computer Science", category: "Engineering" },
    { value: "information_technology", label: "Information Technology", category: "Engineering" },
    { value: "data_structures", label: "Data Structures", category: "Engineering" },
    { value: "algorithms", label: "Algorithms", category: "Engineering" },
    { value: "database_management", label: "Database Management Systems", category: "Engineering" },
    { value: "operating_systems", label: "Operating Systems", category: "Engineering" },
    { value: "computer_networks", label: "Computer Networks", category: "Engineering" },
    { value: "software_engineering", label: "Software Engineering", category: "Engineering" },
    { value: "web_development", label: "Web Development", category: "Engineering" },
    { value: "artificial_intelligence", label: "Artificial Intelligence", category: "Engineering" },
    { value: "machine_learning", label: "Machine Learning", category: "Engineering" },
    { value: "cyber_security", label: "Cyber Security", category: "Engineering" },
    { value: "cloud_computing", label: "Cloud Computing", category: "Engineering" },
    { value: "electronics", label: "Electronics", category: "Engineering" },
    { value: "electrical_engineering", label: "Electrical Engineering", category: "Engineering" },
    { value: "mechanical_engineering", label: "Mechanical Engineering", category: "Engineering" },
    { value: "civil_engineering", label: "Civil Engineering", category: "Engineering" },
    { value: "chemical_engineering", label: "Chemical Engineering", category: "Engineering" },
    { value: "automobile_engineering", label: "Automobile Engineering", category: "Engineering" },
    { value: "aerospace_engineering", label: "Aerospace Engineering", category: "Engineering" },
    { value: "robotics", label: "Robotics", category: "Engineering" },
    { value: "iot", label: "Internet of Things (IoT)", category: "Engineering" },
    { value: "vlsi", label: "VLSI Design", category: "Engineering" },
    { value: "embedded_systems", label: "Embedded Systems", category: "Engineering" },
    { value: "digital_electronics", label: "Digital Electronics", category: "Engineering" },
    { value: "signal_processing", label: "Signal Processing", category: "Engineering" },
    { value: "control_systems", label: "Control Systems", category: "Engineering" },
    { value: "thermodynamics", label: "Thermodynamics", category: "Engineering" },
    { value: "fluid_mechanics", label: "Fluid Mechanics", category: "Engineering" },
    { value: "structural_engineering", label: "Structural Engineering", category: "Engineering" },
    { value: "engineering_drawing", label: "Engineering Drawing", category: "Engineering" },
    { value: "engineering_mechanics", label: "Engineering Mechanics", category: "Engineering" },

    // ===== COMMERCE & BUSINESS =====
    { value: "accountancy", label: "Accountancy", category: "Commerce" },
    { value: "cost_accounting", label: "Cost Accounting", category: "Commerce" },
    { value: "financial_accounting", label: "Financial Accounting", category: "Commerce" },
    { value: "management_accounting", label: "Management Accounting", category: "Commerce" },
    { value: "business_studies", label: "Business Studies", category: "Commerce" },
    { value: "economics", label: "Economics", category: "Commerce" },
    { value: "microeconomics", label: "Microeconomics", category: "Commerce" },
    { value: "macroeconomics", label: "Macroeconomics", category: "Commerce" },
    { value: "business_economics", label: "Business Economics", category: "Commerce" },
    { value: "commerce", label: "Commerce", category: "Commerce" },
    { value: "taxation", label: "Taxation", category: "Commerce" },
    { value: "auditing", label: "Auditing", category: "Commerce" },
    { value: "banking", label: "Banking", category: "Commerce" },
    { value: "insurance", label: "Insurance", category: "Commerce" },
    { value: "business_law", label: "Business Law", category: "Commerce" },
    { value: "corporate_law", label: "Corporate Law", category: "Commerce" },
    { value: "entrepreneurship", label: "Entrepreneurship", category: "Commerce" },

    // ===== MBA / MANAGEMENT =====
    { value: "marketing_management", label: "Marketing Management", category: "Management" },
    { value: "financial_management", label: "Financial Management", category: "Management" },
    { value: "human_resource_management", label: "Human Resource Management", category: "Management" },
    { value: "operations_management", label: "Operations Management", category: "Management" },
    { value: "strategic_management", label: "Strategic Management", category: "Management" },
    { value: "project_management", label: "Project Management", category: "Management" },
    { value: "supply_chain_management", label: "Supply Chain Management", category: "Management" },
    { value: "organizational_behavior", label: "Organizational Behavior", category: "Management" },
    { value: "business_communication", label: "Business Communication", category: "Management" },
    { value: "managerial_economics", label: "Managerial Economics", category: "Management" },
    { value: "business_analytics", label: "Business Analytics", category: "Management" },
    { value: "international_business", label: "International Business", category: "Management" },
    { value: "e_commerce", label: "E-Commerce", category: "Management" },
    { value: "digital_marketing", label: "Digital Marketing", category: "Management" },
    { value: "retail_management", label: "Retail Management", category: "Management" },
    { value: "hospital_management", label: "Hospital Management", category: "Management" },
    { value: "event_management", label: "Event Management", category: "Management" },

    // ===== ARTS & HUMANITIES =====
    { value: "english", label: "English", category: "Arts" },
    { value: "english_literature", label: "English Literature", category: "Arts" },
    { value: "hindi", label: "Hindi", category: "Arts" },
    { value: "hindi_literature", label: "Hindi Literature", category: "Arts" },
    { value: "sanskrit", label: "Sanskrit", category: "Arts" },
    { value: "bengali", label: "Bengali", category: "Arts" },
    { value: "tamil", label: "Tamil", category: "Arts" },
    { value: "telugu", label: "Telugu", category: "Arts" },
    { value: "marathi", label: "Marathi", category: "Arts" },
    { value: "gujarati", label: "Gujarati", category: "Arts" },
    { value: "urdu", label: "Urdu", category: "Arts" },
    { value: "french", label: "French", category: "Arts" },
    { value: "german", label: "German", category: "Arts" },
    { value: "spanish", label: "Spanish", category: "Arts" },
    { value: "history", label: "History", category: "Arts" },
    { value: "ancient_history", label: "Ancient History", category: "Arts" },
    { value: "medieval_history", label: "Medieval History", category: "Arts" },
    { value: "modern_history", label: "Modern History", category: "Arts" },
    { value: "geography", label: "Geography", category: "Arts" },
    { value: "political_science", label: "Political Science", category: "Arts" },
    { value: "sociology", label: "Sociology", category: "Arts" },
    { value: "psychology", label: "Psychology", category: "Arts" },
    { value: "philosophy", label: "Philosophy", category: "Arts" },
    { value: "anthropology", label: "Anthropology", category: "Arts" },
    { value: "public_administration", label: "Public Administration", category: "Arts" },
    { value: "journalism", label: "Journalism", category: "Arts" },
    { value: "mass_communication", label: "Mass Communication", category: "Arts" },

    // ===== LAW =====
    { value: "constitutional_law", label: "Constitutional Law", category: "Law" },
    { value: "criminal_law", label: "Criminal Law", category: "Law" },
    { value: "civil_law", label: "Civil Law", category: "Law" },
    { value: "contract_law", label: "Contract Law", category: "Law" },
    { value: "property_law", label: "Property Law", category: "Law" },
    { value: "family_law", label: "Family Law", category: "Law" },
    { value: "intellectual_property", label: "Intellectual Property Law", category: "Law" },
    { value: "environmental_law", label: "Environmental Law", category: "Law" },
    { value: "labor_law", label: "Labor Law", category: "Law" },
    { value: "international_law", label: "International Law", category: "Law" },
    { value: "cyber_law", label: "Cyber Law", category: "Law" },

    // ===== MEDICAL & HEALTH =====
    { value: "anatomy", label: "Anatomy", category: "Medical" },
    { value: "physiology", label: "Physiology", category: "Medical" },
    { value: "biochemistry", label: "Biochemistry", category: "Medical" },
    { value: "pharmacology", label: "Pharmacology", category: "Medical" },
    { value: "pathology", label: "Pathology", category: "Medical" },
    { value: "medicine", label: "Medicine", category: "Medical" },
    { value: "surgery", label: "Surgery", category: "Medical" },
    { value: "pediatrics", label: "Pediatrics", category: "Medical" },
    { value: "gynecology", label: "Gynecology", category: "Medical" },
    { value: "orthopedics", label: "Orthopedics", category: "Medical" },
    { value: "dermatology", label: "Dermatology", category: "Medical" },
    { value: "psychiatry", label: "Psychiatry", category: "Medical" },
    { value: "radiology", label: "Radiology", category: "Medical" },
    { value: "nursing", label: "Nursing", category: "Medical" },
    { value: "pharmacy", label: "Pharmacy", category: "Medical" },
    { value: "physiotherapy", label: "Physiotherapy", category: "Medical" },

    // ===== DESIGN & CREATIVE ARTS =====
    { value: "fine_arts", label: "Fine Arts", category: "Design" },
    { value: "graphic_design", label: "Graphic Design", category: "Design" },
    { value: "fashion_design", label: "Fashion Design", category: "Design" },
    { value: "interior_design", label: "Interior Design", category: "Design" },
    { value: "textile_design", label: "Textile Design", category: "Design" },
    { value: "product_design", label: "Product Design", category: "Design" },
    { value: "animation", label: "Animation", category: "Design" },
    { value: "visual_communication", label: "Visual Communication", category: "Design" },
    { value: "photography", label: "Photography", category: "Design" },
    { value: "film_studies", label: "Film Studies", category: "Design" },
    { value: "music", label: "Music", category: "Design" },
    { value: "performing_arts", label: "Performing Arts", category: "Design" },

    // ===== AGRICULTURE =====
    { value: "agronomy", label: "Agronomy", category: "Agriculture" },
    { value: "horticulture", label: "Horticulture", category: "Agriculture" },
    { value: "soil_science", label: "Soil Science", category: "Agriculture" },
    { value: "plant_pathology", label: "Plant Pathology", category: "Agriculture" },
    { value: "entomology", label: "Entomology", category: "Agriculture" },
    { value: "agricultural_economics", label: "Agricultural Economics", category: "Agriculture" },
    { value: "food_technology", label: "Food Technology", category: "Agriculture" },
    { value: "dairy_technology", label: "Dairy Technology", category: "Agriculture" },

    // ===== PHYSICAL EDUCATION & SPORTS =====
    { value: "physical_education", label: "Physical Education", category: "Sports" },
    { value: "sports_science", label: "Sports Science", category: "Sports" },
    { value: "yoga", label: "Yoga", category: "Sports" },
    { value: "health_education", label: "Health Education", category: "Sports" },

    // ===== GENERAL / COMMON =====
    { value: "general_studies", label: "General Studies", category: "General" },
    { value: "moral_science", label: "Moral Science", category: "General" },
    { value: "value_education", label: "Value Education", category: "General" },
    { value: "communication_skills", label: "Communication Skills", category: "General" },
    { value: "soft_skills", label: "Soft Skills", category: "General" },
    { value: "aptitude", label: "Aptitude", category: "General" },
    { value: "reasoning", label: "Reasoning", category: "General" },
    { value: "quantitative_aptitude", label: "Quantitative Aptitude", category: "General" },
    { value: "verbal_ability", label: "Verbal Ability", category: "General" },
];

// Validation Schema
const subjectAssignmentSchema = z.object({
    subject: z.string().optional(),
    program: z.string().optional(),
    class: z.string().optional(),
    academicYear: z.string().optional(),
    assignedDate: z.string().optional(),
});

const classTeacherAssignmentSchema = z.object({
    class: z.string().optional(),
    subject: z.string().optional(),
    assignedDate: z.string().optional(),
});

const teacherFormSchema = z.object({
    // employeeId: z.string().optional(),
    dateOfJoining: z.string().optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    designation: z.string().optional(),
    departmentId: z.string().optional(),
    qualification: z.string().optional(),
    experienceYears: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    emergencyContact: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    subjectAssignments: z.array(subjectAssignmentSchema),
    classTeacherAssignments: z.array(classTeacherAssignmentSchema),
});

export type TeacherFormData = z.infer<typeof teacherFormSchema>;

export default function CreateTeacherPage() {
    const router = useRouter();
    const user = useRoleGuard("admin");
    const [isLoading, setIsLoading] = useState(true);
    const [formError, setFormError] = useState<string>("");
    const [departments, setDepartments] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    const { call: submitTeacher, loading: submitting } = useApi(createTeacher);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
    } = useForm<TeacherFormData>({
        resolver: zodResolver(teacherFormSchema),
        defaultValues: {
            // employeeId: "",
            dateOfJoining: new Date().toISOString().split('T')[0],
            firstName: "",
            lastName: "",
            designation: "",
            departmentId: "",
            qualification: "",
            experienceYears: "",
            email: "",
            phone: "",
            emergencyContact: "",
            dateOfBirth: "",
            address: "",
            subjectAssignments: [{ subject: "", program: "", class: "", academicYear: "", assignedDate: new Date().toISOString().split('T')[0] }],
            classTeacherAssignments: [{ class: "", subject: "", assignedDate: new Date().toISOString().split('T')[0] }],
        }
    });

    // Subject Assignments Field Array
    const {
        fields: subjectFields,
        append: appendSubject,
        remove: removeSubject
    } = useFieldArray({
        control,
        name: "subjectAssignments"
    });

    // Class Teacher Assignments Field Array
    const {
        fields: classFields,
        append: appendClass,
        remove: removeClass
    } = useFieldArray({
        control,
        name: "classTeacherAssignments"
    });

    // Load form data (departments, classes, academic years)
    useEffect(() => {
        const loadFormData = async () => {
            setIsLoading(true);
            setFormError("");
            try {
                const [deptRes, progRes, classRes, yearRes] = await Promise.all([
                    fetchMasterDepartments(),
                    fetchPrograms(),
                    fetchClasses(),
                    fetchAcademicYears()
                ]);

                if (deptRes.status === 1 || deptRes.data) {
                    setDepartments(deptRes.data || []);
                }
                if (progRes.status === 1 || progRes.data) {
                    setPrograms(progRes.data || []);
                }
                if (classRes.status === "success" || classRes.data) {
                    setClasses(classRes.data || []);
                }
                if (yearRes.status === "success" || yearRes.data) {
                    setAcademicYears(yearRes.data || []);
                }
            } catch (error: any) {
                console.error("Failed to load form data:", error);
                setFormError("Failed to load form data");
            } finally {
                setIsLoading(false);
            }
        };

        loadFormData();
    }, []);

    const handleAddSubject = () => {
        appendSubject({
            subject: "",
            class: "",
            academicYear: "",
            assignedDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleAddClass = () => {
        appendClass({
            class: "",
            subject: "",
            assignedDate: new Date().toISOString().split('T')[0]
        });
    };

    const onSubmit = async (data: TeacherFormData) => {
        setIsLoading(true);
        try {
            console.log(data.subjectAssignments);
            // Prepare payload for backend
            const payload = {
                // employee_id: data.employeeId || `EMP${Date.now()}`,
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email || undefined,
                phone: data.phone || undefined,
                emergency_contact: data.emergencyContact || undefined,
                designation: data.designation || undefined,
                department_id: data.departmentId ? parseInt(data.departmentId) : undefined,
                qualification: data.qualification || undefined,
                experience_years: data.experienceYears ? parseFloat(data.experienceYears) : undefined,
                date_of_birth: data.dateOfBirth || undefined,
                date_of_joining: data.dateOfJoining || undefined,
                address: data.address || undefined,
                password: "password123", // Default password, should be changed by teacher
                subjects: data.subjectAssignments
            };

            const response = await submitTeacher(payload);

            if (response?.status === "success") {
                toast.success("Teacher registered successfully!");
                router.push("/admin/teachers");
                reset();
                // TODO: Handle assignments creation if needed
            } else {
                toast.error(response?.message || "Failed to register teacher");
            }
        } catch (error: any) {
            console.error("Failed to create teacher:", error);
            toast.error(error.message || "Failed to register teacher");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        reset();
    };

    const Req = () => <span className="required-star">*</span>;

    if (!user) return null;

    return (
        <div className="create-teacher-container">
            {formError && (
                <div className="error-banner">
                    <p>{formError}</p>
                </div>
            )}

            {/* Form Content */}
            <div className="form-content">
                {isLoading ? (
                    // <div className="flex items-center justify-center py-12">
                        <Loader />
                    // </div>
                ) : (
                    <>
                        <div className="flex items-center mb-3">
                            <Link href={'/admin/teachers'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link><h3 className="text-dark text-lg font-semibold">Create Teacher</h3>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* Personal Information Section */}
                            <div className="form-card">
                                <h3 className="section-title">Personal Information</h3>
                                <div className="form-grid grid grid-cols-2 gap-0 md:grid-cols-4 mb-0 gap-3 gap-y-0">
                                    {/* <div className="form-group">
                                        <Label>Employee ID</Label>
                                        <Input type="text" placeholder="Enter employee ID" {...register("employeeId")}/>
                                    </div> */}
                                    <div className="form-group">
                                        <Label>First Name<Req /></Label>
                                        <CapitalizedInput
                                            type="text"
                                            placeholder="Enter first name"
                                            {...register("firstName")}
                                        />
                                        {errors.firstName && (
                                            <span className="error-message">{errors.firstName.message}</span>
                                        )}
                                    </div>                     
                                    <div className="form-group">
                                        <Label>Last Name<Req /></Label>
                                        <CapitalizedInput
                                            type="text"
                                            placeholder="Enter last name"
                                            {...register("lastName")}
                                        />
                                        {errors.lastName && (
                                            <span className="error-message">{errors.lastName.message}</span>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <Label>Date of Joining</Label>
                                        <Input
                                            type="date"
                                            {...register("dateOfJoining")}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <Label>Designation</Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g., Senior Teacher, Head Teacher"
                                            {...register("designation")}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <Label className="">Department</Label>
                                        <select className="form-select" {...register("departmentId")}>
                                            <option value="">Select Department</option>
                                            {departments.map((dept: any) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.department_name || dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Experience Years */}
                                    <div className="form-group">
                                        <Label>Experience (Years)</Label>
                                        <Input
                                            type="number"
                                            placeholder="Years of experience"
                                            step="0.5"
                                            min="0"
                                            {...register("experienceYears")}
                                        />
                                    </div>
                                    {/* Email */}
                                    <div className="form-group">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            {...register("email")}
                                        />
                                        {errors.email && (
                                            <span className="error-message">{errors.email.message}</span>
                                        )}
                                    </div>
                                    {/* Phone */}
                                    <div className="form-group">
                                        <Label>Phone</Label>
                                        <Input
                                            type="tel"
                                            placeholder="Contact number"
                                            {...register("phone")}
                                        />
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="form-group">
                                        <Label>Emergency Contact</Label>
                                        <Input
                                            type="tel"
                                            placeholder="Emergency contact number"
                                            {...register("emergencyContact")}
                                        />
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="form-group">
                                        <Label>Date of Birth</Label>
                                        <Input
                                            type="date"
                                            {...register("dateOfBirth")}
                                        />
                                    </div>
                                    {/* Qualification */}
                                    <div className="form-group col-span-2 lg:col-span-2 md:col-span-2">
                                        <Label>Qualification</Label>
                                        <Input
                                            className=""
                                            placeholder="e.g., M.Ed., B.Ed., M.Sc."
                                            {...register("qualification")}
                                        />
                                    </div>
                                    {/* Address */}
                                    <div className="form-group col-span-2 lg:col-span-4 md:col-span-2">
                                        <Label>Address</Label>
                                        <Input
                                            className=""
                                            placeholder="Full address"
                                            {...register("address")}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Subject Assignments Section */}
                            <div className="form-card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="section-title mb-0 text-[var(--primary)]" style={{ marginBottom: '0px' }}>Subject Assignments</h3>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="mt-2 flex items-center gap-2 w-10 h-10 bg-[var(--success-foreground)] text-white hover:bg-green-600 cursor-pointer"
                                        onClick={handleAddSubject}
                                    >
                                        <Plus size={16} />
                                    </Button>
                                </div>
                                <div className="form-grid grid gap-3">
                                    {subjectFields.map((field, index) => (
                                        <div key={field.id} className="assignment-row subject-assignment-row flex items-start justify-between gap-2">
                                            <div className="" style={{ flex: '0 0 96%' }}>
                                                {/* Subject */}
                                                {/* <div className="form-group"> */}
                                                <Controller
                                                    control={control}
                                                    name={`subjectAssignments.${index}.subject`}
                                                    render={({ field }) => (
                                                        <CascadingSubjectSelect
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            required
                                                        />
                                                    )}
                                                />
                                                {/* </div> */}

                                                <div className="form-grid grid grid-cols-4 gap-4 md:grid-cols-4 mb-0">
                                                    {/* Program */}
                                                    <div className="form-group">
                                                        <Label>Program</Label>
                                                        <select
                                                            className="form-select"
                                                            {...register(`subjectAssignments.${index}.program`)}
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
                                                        <Label>Year</Label>
                                                        <select
                                                            className="form-select"
                                                            {...register(`subjectAssignments.${index}.class`)}
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
                                                        <Label>Academic Year</Label>
                                                        <select
                                                            className="form-select"
                                                            {...register(`subjectAssignments.${index}.academicYear`)}
                                                        >
                                                            <option value="">Select Year</option>
                                                            {academicYears.map((year: any) => (
                                                                <option key={year.id} value={year.id}>
                                                                    {year.academic_year || year.year || year.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Assigned Date */}
                                                    <div className="form-group">
                                                        <Label>Assigned Date</Label>
                                                        <Input
                                                            type="date"
                                                            {...register(`subjectAssignments.${index}.assignedDate`)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {subjectFields.length > 1 && (
                                                <div>
                                                    {/* Delete Button */}
                                                    <Button
                                                        type="button"
                                                        className="delete-btn bg-warning hover:bg-red-600 text-white px-3 py-1 rounded"
                                                        onClick={() => removeSubject(index)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            )}

                                            <hr></hr>
                                        </div>
                                    ))}

                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-4 mt-8">

                                <Button
                                    type="submit"
                                    className="submit-btn2 cursor-pointer"
                                    disabled={submitting}
                                    variant={'primary'}
                                >
                                    {submitting ? "Registering..." : "Register Teacher"}
                                </Button>
                                {/* <Button
                                    type="button"
                                    variant='outline'
                                    className='py-6 px-5 bg-white'
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button> */}
                            </div>
                        </form>
                    
                    </>
                )}
            </div>
        </div>
    );
}
