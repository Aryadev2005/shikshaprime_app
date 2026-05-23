"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    ChevronDown,
    Link as LinkIcon,
    Image as ImageIcon,
} from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";
import "./student-admission.css";
import { Loader } from "@/components/ui/loader";
import { useApi } from "@/src/hooks/useApi";
import { fetchStudentByRegistrationId, getRegistrationByRegId, registerStudentAdmission } from "@/src/services/studentRegistrationService";
import { useAppSelector } from "@/src/store/hooks";
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";


const documentSchema = z.object({
    documentType: z.string().min(1, "Document type is required"),
    documentName: z.string().min(1, "Document name is required"),
    documentFile: z.any().optional(),
});

const subjectSchema = z.object({
    subject_id: z.number(),
    subject_name: z.string(),
    is_core: z.number(),
});

export const admissionSchema = z.object({
    registrationId: z.string().optional(),
    studentName: z.string().optional(),
    gender: z.string().optional(),
    className: z.string(),
    dob: z.string(),
    classApplyingFor: z.string().optional(),
    departmentName: z.string().optional(),
    section: z.string().optional(),
    // subject: z.string().optional(),
    subjects: z.array(subjectSchema).min(1, "Please select a one optional subject"),
    semester: z.string().min(1, "Please select a semister"),
    academicYear: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().optional(),
    nationality: z.string(),
    caste: z.string(),
    degree: z.string(),
    idProofType: z.string(),
    idProofNumber: z.string(),
    religion: z.string(),

    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    guardianName: z.string().optional(),
    guardianMobileNumber: z.string().optional(),
    guardianEmailId: z.string().optional(),

    // address: z.string(),
    addressLine: z.string().optional(),
    pinCode: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),

    previousSchoolName: z.string().optional(),
    lastClassPassed: z.string().optional(),
    boardUniversity10th: z.string().optional(),
    boardUniversity12th: z.string().optional(),
    tenClassPercentage: z.string(),
    twelveClassPercentage: z.string(),
    qualification: z.string().optional(),
    yearOfPassing10th: z.string().optional(),
    yearOfPassing12th: z.string().optional(),
    boardUniversityGraduation: z.string().optional(),
    graduationPercentage: z.string().optional(),
    yearOfPassingGraduation: z.string().optional(),
    tenthQualification: z.string().optional(),
    twelveQualification: z.string().optional(),
    graduationQualification: z.string().optional(),
    documents: z.array(documentSchema),
}).superRefine((data, ctx) => {
    //const hasSection = data.section && data.section.trim() !== "";
    const hasSemester = data.semester && data.semester.trim() !== "";
    const hasSubjects = data.subjects && data.subjects.length > 0;
    if (
        //!hasSection && 
        !hasSemester && !hasSubjects) {
        const msg = "At least one of Section, Semester, or Subject must be selected";
        //ctx.addIssue({ code: "custom", message: msg, path: ["section"] });
        ctx.addIssue({ code: "custom", message: msg, path: ["semester"] });
        ctx.addIssue({ code: "custom", message: msg, path: ["subjects"] });
    }

    // Custom validation: If there are exactly two optional subjects, user must select exactly one
    if (data.subjects && Array.isArray(data.subjects)) {
        // Find optional subjects (is_core === 0)
        const optionalSubjects = data.subjects.filter((s: any) => s.is_core === 0);
        // If user selected more than one optional subject, error
        if (optionalSubjects.length > 1) {
            ctx.addIssue({
                code: "custom",
                message: "You must select only one optional subject.",
                path: ["subjects"]
            });
        }
    }
});

export type AdmissionData = z.infer<typeof admissionSchema>;

// Move TinyEditor outside to avoid re-creation on every render
const TinyEditor = ({ name, title, control, error }: { name: keyof AdmissionData, title: string, control: any, error?: any }) => {
    // Ensure TinyMCE only runs on client to avoid hydration mismatch
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="form-card no-padding">
                <h4 className="card-label px-6 pt-4">{title}</h4>
                <div className="editor-container h-[300px] bg-gray-50 flex items-center justify-center">
                    <Loader />
                </div>
            </div>
        );
    }



    return (
        <div className="form-card no-padding student-admission-container">
            <h4 className="card-label px-6 pt-4">{title}</h4>
            <div className="editor-container">
                <Controller
                    name={name}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <Editor
                            apiKey="fgukdlp1g5ewiex6clfbvzvzqtx6j6wt153yos64gkje9n00"
                            value={value as string}
                            onEditorChange={(content) => onChange(content)}
                            init={{
                                height: 300,
                                menubar: false,
                                plugins: [
                                    "advlist", "autolink", "lists", "link", "image",
                                    "charmap", "preview", "anchor", "searchreplace",
                                    "visualblocks", "code", "fullscreen",
                                    "insertdatetime", "media", "table", "help", "wordcount"
                                ],
                                toolbar:
                                    "undo redo | formatselect | " +
                                    "bold italic underline strikethrough | " +
                                    "alignleft aligncenter alignright | " +
                                    "bullist numlist | link image | removeformat"
                            }}
                        />
                    )}
                />
            </div>
            {error && <span className="error-message text-xs text-red-500 mt-1 block">{error.message}</span>}
        </div>
    );
};

export default function StudentAdmissionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader /></div>}>
            <StudentAdmissionForm />
        </Suspense>
    );
}

function StudentAdmissionForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [registrationData, setRegistrationData] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
    const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
    const [subjectErrorMsg, setSubjectErrorMsg] = useState<string>("");
    const subjectDropdownRef = React.useRef<HTMLDivElement>(null);
    const { call: submitAdmissionForm, loading: submittingAdmission } = useApi(registerStudentAdmission);
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<AdmissionData>({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            studentName: "",
            academicYear: "",
            section: "",
            className: "",
            departmentName: "",
            email: "",
            fatherName: "",
            tenClassPercentage: "",
            twelveClassPercentage: "",
            registrationId: "",
            qualification: "",
            yearOfPassing10th: "",
            documents: [{ documentType: "", documentName: "", documentFile: null }],
            nationality: '',
            caste: '',
            degree: '',
            idProofType: '',
            idProofNumber: '',
        }
    });

    const { classes } = useAppSelector((state) => state.classes);
    const { departments } = useAppSelector((state) => state.departments);

    // UseFieldArray to manage documents array
    const { fields, append, remove } = useFieldArray({
        control,
        name: "documents"
    });

    const params = useParams();
    const searchParams = useSearchParams();
    const registrationIdFromParams = searchParams.get("registrationId") || params?.registrationId || params?.registration_id;

    useEffect(() => {
        if (registrationIdFromParams) {
            console.log("Search query from id:", registrationIdFromParams);
            if (typeof registrationIdFromParams === 'string') {
                setValue("registrationId", registrationIdFromParams);
            } else if (Array.isArray(registrationIdFromParams)) {
                setValue("registrationId", registrationIdFromParams[0]);
            }
        } else {
            console.log("No registration id found in params.");
        }
    }, [registrationIdFromParams, setValue]);

    const getFileUrl = (path: string) => {
        if (!path) return "";
        return path.replace("http:", "https:").replace(
            "https://localhost/api", "http://localhost:8080/api"
        );
    };
    // const getFileUrl = (path: string) => {
    //     if (!path) return "";
    //     return path.replace("http://localhost/api", "http://localhost:8080/api");
    // };

    const Req = () => <span className="required-star">*</span>;

    const ErrorMsg = ({ name }: { name: keyof AdmissionData }) => (
        errors[name] ? <span className="error-message text-xs text-red-500 mt-1 block">{errors[name]?.message}</span> : null
    );

    //Fetch registration data
    const { call: fetchRegisteredStudent } = useApi(fetchStudentByRegistrationId);
    const watchedRegistrationId = watch("registrationId");
    const formatCaste = (caste?: string) => {
        if (!caste) return "";

        const upperCases = ["SC", "ST", "OBC"];

        if (upperCases.includes(caste.toUpperCase())) {
            return caste.toUpperCase();
        }

        // Title Case for others
        return caste
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    useEffect(() => {
        const loadRegistrationData = async () => {
            if (watchedRegistrationId && watchedRegistrationId.length > 0) {
                setIsLoading(true);
                try {
                    const response = await getRegistrationByRegId(watchedRegistrationId);
                    if (response.status === 1) {
                        const regData = response.data;
                        setRegistrationData(regData);
                        // Pre-select mandatory (core) subjects
                        if (regData.subjects && Array.isArray(regData.subjects)) {
                            const mandatorySubjects = regData.subjects.filter((s: any) => s.is_core === 1);
                            const mandatoryIds = mandatorySubjects.map((s: any) => s.subject_id);
                            setSelectedSubjects(mandatoryIds);
                            // setValue("subject", mandatoryIds.join(","));
                            setValue("subjects", mandatorySubjects.map((s: any) => ({
                                subject_id: s.subject_id,
                                subject_name: s.subject_name,
                                is_core: s.is_core,
                            })));
                        }
                        setValue("studentName", `${regData.student_name}`);
                        setValue("gender", `${regData.gender}`);
                        setValue("academicYear", regData.academic_year || "");
                        setValue("section", "");
                        setValue("className", regData.class_name || "");
                        setValue("dob", regData.date_of_birth || "");
                        setValue("departmentName", regData.department_name || "");
                        setValue("fatherName", regData.father_name || "");
                        setValue("motherName", regData.mother_name || "");
                        setValue("previousSchoolName", regData.previous_school_name || "");
                        setValue("email", regData.email || "");
                        setValue("mobile", regData.mobile || "");
                        setValue("addressLine", regData.address_line || "");
                        setValue("city", regData.city || "");
                        setValue("state", regData.state || "");
                        setValue("pinCode", regData.pin_code || "");
                        setValue("lastClassPassed", regData.last_class_passed || "");
                        setValue("boardUniversity10th", regData.board_university_10th || "ICSE");
                        setValue("boardUniversity12th", regData.board_university_12th || "ISC");
                        setValue("guardianName", regData.guardian_name || "");
                        setValue("guardianMobileNumber", regData.guardian_mobile || "7890743945");
                        setValue("guardianEmailId", regData.guardian_email || "abc@gmail.com");
                        setValue("tenClassPercentage", regData.ten_percentage || "88");
                        setValue("twelveClassPercentage", regData.twelve_percentage || "75");
                        setValue("tenthQualification", regData.qualification || "10th");
                        setValue("twelveQualification", regData.qualification || "12th");
                        setValue("graduationQualification", regData.qualification || "Graduation");
                        setValue("yearOfPassing10th", regData.year_of_passing_10th || "2020");
                        setValue("yearOfPassing12th", regData.year_of_passing_12th || "2022");
                        setValue("nationality", regData.nationality || "India");
                        setValue("religion", regData?.religion ? regData.religion.charAt(0).toUpperCase() + regData.religion.slice(1).toLowerCase() : "");
                        setValue("caste", formatCaste(regData?.caste) || "");
                        setValue("degree", regData.program_name || "");
                        setValue(
                            "idProofType",
                            regData?.id_proof_type
                                ? regData.id_proof_type
                                    .replace(/-/g, " ")
                                    .toLowerCase()
                                    .split(" ")
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(" ")
                                : ""
                        );
                        setValue("idProofNumber", regData.id_proof_number || "");
                        setValue("boardUniversityGraduation", regData.board_university_graduation ? regData.board_university_graduation : "");
                        setValue("graduationPercentage", regData.graduation_percentage ? regData.graduation_percentage : "");
                        setValue("yearOfPassingGraduation", regData.year_of_passing_graduation ? regData.year_of_passing_graduation : "");

                        // Populate documents for validation
                        if (regData.documents) {
                            const docs: any[] = [];
                            if (regData.documents.aadhar) docs.push({ documentType: "AADHAR", documentName: "Aadhar Card", documentFile: regData.documents.aadhar });
                            if (regData.documents.birth_certificate) docs.push({ documentType: "BIRTH_CERT", documentName: "Birth Certificate", documentFile: regData.documents.birth_certificate });
                            if (regData.documents.ten_marksheet) docs.push({ documentType: "SCHOOL_CERT", documentName: "10th Marksheet", documentFile: regData.documents.ten_marksheet });
                            if (regData.documents.twelve_marksheet) docs.push({ documentType: "SCHOOL_CERT", documentName: "12th Marksheet", documentFile: regData.documents.twelve_marksheet });
                            if (regData.documents.physically_challenged_certificate) docs.push({ documentType: "SCHOOL_CERT", documentName: "Physically Challenged", documentFile: regData.documents.physically_challenged_certificate });
                            if (docs.length > 0) {
                                setValue("documents", docs);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Failed to load registration data:", err);
                    setError("Registration ID not found");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadRegistrationData();
    }, [watchedRegistrationId, setValue]);

    useEffect(() => {
        console.log("registrationData", registrationData);
    }, [registrationData]);

    // Close subject dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target as Node)) {
                setSubjectDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubjectToggle = (subjectId: number, isCore: number) => {
        if (isCore === 1) return; // Mandatory subjects cannot be unchecked

        const allSubjects: any[] = registrationData?.subjects ?? [];
        const availableOptional = allSubjects.filter((s: any) => s.is_core === 0);
        const mandatoryIds: number[] = allSubjects
            .filter((s: any) => s.is_core === 1)
            .map((s: any) => s.subject_id);

        setSelectedSubjects(prev => {
            const wasSelected = prev.includes(subjectId);
            // Toggle: if deselecting, keep only mandatory; if selecting, add to mandatory
            const updated: number[] = wasSelected
                ? mandatoryIds
                : [...mandatoryIds, subjectId];

            // Update form value
            const fullSubjects = allSubjects
                .filter((s: any) => updated.includes(s.subject_id))
                .map((s: any) => ({
                    subject_id: s.subject_id,
                    subject_name: s.subject_name,
                    is_core: s.is_core,
                }));
            setValue("subjects", fullSubjects, { shouldValidate: false, shouldDirty: true });

            // Manual error management — Zod superRefine can't see available options
            if (availableOptional.length > 0) {
                const selectedOptional = updated.filter(id => {
                    const subj = allSubjects.find((s: any) => s.subject_id === id);
                    return subj && subj.is_core === 0;
                });
                if (selectedOptional.length === 0) {
                    setSubjectErrorMsg("Please select at least one optional subject.");
                } else if (selectedOptional.length > 1) {
                    setSubjectErrorMsg("You must select only one optional subject.");
                } else {
                    setSubjectErrorMsg("");
                }
            } else {
                setSubjectErrorMsg("");
            }

            return updated;
        });
    };

    const getSubjectDisplayLabel = () => {
        if (!registrationData?.subjects || selectedSubjects.length === 0) return "Select Subjects";
        const names = registrationData.subjects
            .filter((s: any) => selectedSubjects.includes(s.subject_id))
            .map((s: any) => s.subject_name);
        return names.length > 0 ? names.join(", ") : "Select Subjects";
    };


    // submit student data
    const onSubmit = async (formData: AdmissionData) => {
        // Guard: if optional subjects are available but none selected, block submission
        const allSubjectsOnSubmit: any[] = registrationData?.subjects ?? [];
        const availableOptionalOnSubmit = allSubjectsOnSubmit.filter((s: any) => s.is_core === 0);
        if (availableOptionalOnSubmit.length > 0) {
            const selectedOptionalOnSubmit = selectedSubjects.filter(id => {
                const subj = allSubjectsOnSubmit.find((s: any) => s.subject_id === id);
                return subj && subj.is_core === 0;
            });
            if (selectedOptionalOnSubmit.length === 0) {
                setSubjectErrorMsg("Please select at least one optional subject.");
                return;
            }
            if (selectedOptionalOnSubmit.length > 1) {
                setSubjectErrorMsg("You must select only one optional subject.");
                return;
            }
        }

        // Build subjects payload from selectedSubjects state
        const subjectsPayload = allSubjectsOnSubmit
            .filter((s: any) => selectedSubjects.includes(s.subject_id))
            .map((s: any) => ({
                subject_id: s.subject_id,
                subject_name: s.subject_name,
                is_core: s.is_core,
            }));

        // Only send the 4 required fields to the API
        const payload = {
            registration_id: formData.registrationId,
            section: formData.section,
            semester: formData.semester,
            subjects: subjectsPayload,
        };

        // console.log("Submitting admission payload:", payload);

        try {
            const response = await submitAdmissionForm(payload as any);
            if (response && (response.status === 1 || response.status === "success")) {
                toast.success("Student admission form created successfully!");
                router.push("/admin/students");
                reset();
            } else {
                toast.error(response?.error || "Failed to create admission form");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
        }
    };

    // Determine if the submit button should be disabled
    const allSubjects = registrationData?.subjects ?? [];
    const availableOptional = allSubjects.filter((s: any) => s.is_core === 0);
    const selectedOptional = selectedSubjects.filter(id => {
        const subj = allSubjects.find((s: any) => s.subject_id === id);
        return subj && subj.is_core === 0;
    });
    const isSubjectInvalid = availableOptional.length === 2 && selectedOptional.length !== 1;

    return (
        <>
        
            
            {isLoading && <Loader />}
            {submittingAdmission && <Loader />}
            <div className="admission-container">
                <div className="admission-content">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Section Header */}
                        {/* <div className="content-header">
                            <h3 className="section-title">Student Admission</h3>
                        </div> */}
                        <div className="form-card">
                            <div className="form-grid one-cols">
                                <div className="form-group">
                                    <label className="input-label">Registration Id<Req /></label>
                                    <Input
                                        {...register("registrationId")}
                                        placeholder="Registration Id"
                                        className={`shadcn-input ${errors.registrationId ? 'border-red-500' : ''}`}
                                        readOnly
                                    />
                                    <ErrorMsg name="registrationId" />
                                </div>

                            </div>
                        </div>

                        {/* Academic Details Section */}
                        <div className="form-card">
                            <div className="form-grid four-cols mb-3 grid gap-3 gap-y-0">
                                <div className="form-group">
                                    <label className="input-label">Student Name <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("studentName")}
                                            placeholder="Name"
                                            readOnly
                                            className={`shadcn-input ${errors.studentName ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="studentName" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Gender <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("gender")}
                                            placeholder="Gender"
                                            readOnly
                                            className={`shadcn-input ${errors.gender ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="gender" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Dob <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("dob")}
                                            placeholder="Date of birth"
                                            readOnly
                                            className={`shadcn-input ${errors.dob ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="dob" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Nationality <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("nationality")}
                                            placeholder="Nationality"
                                            readOnly
                                            className={`shadcn-input ${errors.nationality ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="nationality" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Email <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("email")}
                                            placeholder="Email"
                                            readOnly
                                            className={`shadcn-input ${errors.email ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="email" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Mobile <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("mobile")}
                                            placeholder="Mobile"
                                            readOnly
                                            className={`shadcn-input ${errors.mobile ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="mobile" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Religion <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("religion")}
                                            placeholder="Religion"
                                            readOnly
                                            className={`shadcn-input ${errors.nationality ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="religion" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Social Class <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("caste")}
                                            placeholder="Caste"
                                            readOnly
                                            className={`shadcn-input ${errors.caste ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="caste" />
                                </div>

                                <div className="form-group">
                                    <label className="input-label">Program Applying For <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("degree")}
                                            placeholder="Degree"
                                            readOnly
                                            className={`shadcn-input ${errors.degree ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="degree" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Year Applying For <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("className")}
                                            placeholder="Class name"
                                            readOnly
                                            className={`shadcn-input ${errors.className ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="className" />
                                </div>

                                <div className="form-group">
                                    <label className="input-label">Department Name <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("departmentName")}
                                            placeholder="Department name"
                                            readOnly
                                            className={`shadcn-input ${errors.departmentName ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="departmentName" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Academic Year <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("academicYear")}
                                            placeholder="Academic Year"
                                            readOnly
                                            className={`shadcn-input ${errors.academicYear ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="academicYear" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">ID Proof Type <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("idProofType")}
                                            placeholder="ID Proof Type"
                                            readOnly
                                            className={`shadcn-input ${errors.idProofType ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="idProofType" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">ID Proof Number <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("idProofNumber")}
                                            placeholder="ID Proof Number"
                                            readOnly
                                            className={`shadcn-input ${errors.idProofNumber ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="idProofNumber" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Semester <Req /></label>
                                    <div className={`custom-select-wrapper ${errors.semester ? 'select-error' : ''}`}>
                                        <select {...register("semester")} className="custom-select-reg" defaultValue="">
                                            <option value="">Select Semester</option>
                                            {registrationData?.semesters.length > 0 && registrationData?.semesters.map((item: any) => (<option key={item.semester_id} value={item.semester_id}> {item.semester_name} </option>))}
                                        </select>
                                    </div>
                                    {errors.semester && <span className="error-message text-xs text-red-500 mt-1 block">{errors.semester.message}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Section</label>
                                    <div className={`custom-select-wrapper ${errors.section ? 'select-error' : ''}`}>
                                        <select {...register("section")} className="custom-select-reg" defaultValue="">
                                            <option value="">Select Section</option>
                                            {registrationData?.sections && registrationData?.sections?.map((item: any) => (<option key={item?.code} value={item?.code}> {item?.name} </option>))}
                                        </select>
                                    </div>
                                    {errors.section && <span className="error-message text-xs text-red-500 mt-1 block">{errors.section.message}</span>}
                                </div>
                            </div>
                            <div className="form-grid grid lg:grid-cols-1 md:grid-cols-2 sm:grid-cols-1 grid-cols-1 mb-0 grid gap-3 gap-y-0">

                                <div className="form-group">
                                    <label className="input-label">Subject <Req /></label>
                                    <div className="subject-dropdown-wrapper" ref={subjectDropdownRef}>
                                        <button
                                            type="button"
                                            className="subject-dropdown-trigger"
                                            onClick={() => setSubjectDropdownOpen(prev => !prev)}
                                        >
                                            <span className="subject-dropdown-label">{getSubjectDisplayLabel()}</span>
                                            <ChevronDown
                                                size={16}
                                                className={`subject-dropdown-arrow ${subjectDropdownOpen ? 'open' : ''}`}
                                            />
                                        </button>
                                        {subjectDropdownOpen && (
                                            <div className="subject-dropdown-menu">
                                                {registrationData?.subjects && registrationData.subjects.length > 0 ? (
                                                    registrationData.subjects.map((item: any) => {
                                                        const isMandatory = item.is_core === 1;
                                                        const isChecked = selectedSubjects.includes(item.subject_id);
                                                        return (
                                                            <label
                                                                key={item.subject_id}
                                                                className={`subject-dropdown-item ${isMandatory ? 'mandatory' : 'optional'
                                                                    }`}
                                                                onClick={() => handleSubjectToggle(item.subject_id, item.is_core)}
                                                            >
                                                                <span className={`subject-checkbox ${isChecked ? 'checked' : ''
                                                                    } ${isMandatory ? 'mandatory-check' : ''}`}>
                                                                    {isChecked && (
                                                                        <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                        </svg>
                                                                    )}
                                                                </span>
                                                                <span className="subject-name">{item.subject_name}</span>
                                                                {isMandatory && (
                                                                    <span className="subject-badge mandatory-badge">Mendetory</span>
                                                                )}
                                                                {!isMandatory && (
                                                                    <span className="subject-badge optional-badge">Optional</span>
                                                                )}
                                                            </label>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="subject-dropdown-empty">No subjects available</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {subjectErrorMsg && (
                                        <span className="error-message text-xs text-red-500 mt-1 block">
                                            {subjectErrorMsg}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="form-card">
                            <div className="form-grid grid lg:grid-cols-5 md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-4 lg:gap-y-3 md:gap-y-3 gap-y-0 lg:mb-0">
                                <div className="form-group">
                                    <label className="input-label">Father's Name <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("fatherName")}
                                            placeholder="Parent Name"
                                            readOnly
                                            className={`shadcn-input ${errors.fatherName ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="fatherName" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Mother's Name </label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("motherName")}
                                            placeholder="Parent Name"
                                            className={`shadcn-input ${errors.motherName ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="motherName" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Guardian Name <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("guardianName")}
                                            placeholder="Parent Name"
                                            readOnly
                                            className={`shadcn-input ${errors.guardianName ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="guardianName" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Guardian Mobile Number </label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("guardianMobileNumber")}
                                            placeholder="Mobile Number"
                                            className={`shadcn-input ${errors.guardianMobileNumber ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="guardianMobileNumber" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Guardian Email ID </label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("guardianEmailId")}
                                            placeholder="Mobile Number"
                                            className={`shadcn-input ${errors.guardianEmailId ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="guardianEmailId" />
                                </div>
                            </div>
                        </div>
                        <div className="form-card">
                            <div className="form-grid grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-4 gap-y-0 mb-4 lg:mb-0">
                                <div className="form-group">
                                    <label className="input-label">Address Line</label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("addressLine")}
                                            placeholder="Enter address line"
                                            className={`shadcn-input ${errors.addressLine ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="addressLine" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">City</label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("city")}
                                            placeholder="Enter city"
                                            className={`shadcn-input ${errors.city ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="city" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">State</label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("state")}
                                            placeholder="Enter state"
                                            className={`shadcn-input ${errors.state ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="state" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">PIN Code</label>
                                    <div className="custom-select">
                                        <Input
                                            {...register("pinCode")}
                                            placeholder="Enter pin code"
                                            className={`shadcn-input ${errors.pinCode ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="pinCode" />
                                </div>
                            </div>
                        </div>
                        <div className="form-card">
                            <h3 className="font-bold text-dark mb-3">Academic Details</h3>
                            <div className="form-grid four-cols mb-4 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 gap-y-0">
                                <div className="form-group">
                                    <label className="input-label">Class <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            type="text"
                                            {...register("tenthQualification")}
                                            placeholder="Qualification"
                                            readOnly
                                            className={`shadcn-input ${errors.tenthQualification ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="tenthQualification" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Board / University <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            type="text"
                                            {...register("boardUniversity10th")}
                                            placeholder="Board / University"
                                            readOnly
                                            className={`shadcn-input ${errors.boardUniversity10th ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="boardUniversity10th" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Percentage <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            type="number"
                                            {...register("tenClassPercentage")}
                                            placeholder="Percentage"
                                            readOnly
                                            className={`shadcn-input ${errors.tenClassPercentage ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="tenClassPercentage" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Year of Passing <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            type="text"
                                            {...register("yearOfPassing10th")}
                                            placeholder="Year of Passing"
                                            readOnly
                                            className={`shadcn-input ${errors.yearOfPassing10th ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="yearOfPassing10th" />
                                </div>
                            </div>
                            <div className="form-grid four-cols mb-4 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 gap-y-0">
                                <div className="form-group">
                                    <label className="input-label">Class <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            type="text"
                                            {...register("twelveQualification")}
                                            placeholder="Qualification"
                                            readOnly
                                            className={`shadcn-input ${errors.twelveQualification ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="twelveQualification" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Board / University <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            type="text"
                                            {...register("boardUniversity12th")}
                                            placeholder="Board / University"
                                            readOnly
                                            className={`shadcn-input ${errors.boardUniversity12th ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="boardUniversity12th" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Percentage <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            type="number"
                                            {...register("twelveClassPercentage")}
                                            placeholder="Percentage"
                                            readOnly
                                            className={`shadcn-input ${errors.twelveClassPercentage ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="twelveClassPercentage" />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Year of Passing <Req /></label>
                                    <div className="custom-select">
                                        <Input
                                            type="text"
                                            {...register("yearOfPassing12th")}
                                            placeholder="Year of Passing"
                                            readOnly
                                            className={`shadcn-input ${errors.yearOfPassing12th ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <ErrorMsg name="yearOfPassing12th" />
                                </div>
                            </div>
                            {registrationData?.graduation_percentage && (
                                <div className="form-grid four-cols mb-4 lg:mb-0 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 gap-y-0 ">
                                    <div className="form-group">
                                        <label className="input-label">Class <Req /></label>
                                        <div className="custom-select">
                                            <Input
                                                type="text"
                                                {...register("graduationQualification")}
                                                placeholder="Qualification"
                                                readOnly
                                                className={`shadcn-input ${errors.graduationQualification ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        <ErrorMsg name="graduationQualification" />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Board / University <Req /></label>
                                        <div className="custom-select">
                                            <Input
                                                type="text"
                                                {...register("boardUniversityGraduation")}
                                                placeholder="Board / University"
                                                readOnly
                                                className={`shadcn-input ${errors.boardUniversityGraduation ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        <ErrorMsg name="boardUniversityGraduation" />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Percentage <Req /></label>
                                        <div className="custom-select">
                                            <Input
                                                type="number"
                                                {...register("graduationPercentage")}
                                                placeholder="Percentage"
                                                readOnly
                                                className={`shadcn-input ${errors.graduationPercentage ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        <ErrorMsg name="graduationPercentage" />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Year of Passing <Req /></label>
                                        <div className="custom-select">
                                            <Input
                                                type="text"
                                                {...register("yearOfPassingGraduation")}
                                                placeholder="Year of Passing"
                                                readOnly
                                                className={`shadcn-input ${errors.yearOfPassingGraduation ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        <ErrorMsg name="yearOfPassingGraduation" />
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* document */}
                        <div className="form-card">
                            <h4 className="card-label px-0 pt-0">Documents</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-0">
                                <>{console.log("document", registrationData)}</>
                                {registrationData?.documents ? (
                                    [
                                        { key: 'aadhar', title: 'Aadhar Card' },
                                        { key: 'birth_certificate', title: 'Birth Certificate' },
                                        { key: 'ten_marksheet', title: '10th Marksheet' },
                                        { key: 'twelve_marksheet', title: '12th Marksheet' },
                                        { key: 'graduation', title: 'graduation' },
                                        { key: 'caste_certificate', title: 'Caste certificate' },
                                        { key: 'physically_challenged_certificate', title: 'Physically Challenged' },
                                    ].map((doc) => {
                                        const url = registrationData.documents[doc.key];
                                        if (!url) return null;
                                        const fullUrl = getFileUrl(url);
                                        return (
                                            <div key={doc.key} className="flex flex-col border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white h-full">
                                                <div className="bg-gray-50 border-b px-3 py-2">
                                                    <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wide truncate" title={doc.title}>
                                                        {doc.title}
                                                    </h4>
                                                </div>
                                                <div className="p-3 flex-1 flex flex-col items-center justify-center bg-gray-50/30">
                                                    <iframe
                                                        src={fullUrl}
                                                        className="w-full h-32 border rounded bg-white shadow-sm"
                                                        title={doc.title}
                                                    />
                                                </div>
                                                <div className="p-2 border-t bg-gray-50 flex justify-center">
                                                    <a
                                                        href={fullUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                                                    >
                                                        <LinkIcon className="h-3 w-3" />
                                                        View Full Document
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-6 text-center text-gray-400 italic">
                                        Enter a Registration ID to view documents.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="action-row">
                            <button
                                type="submit"
                                className="create-form-btn"
                                // disabled={submittingAdmission || isSubjectInvalid}
                                disabled={submittingAdmission}
                            >
                                {submittingAdmission ? "Creating..." : "Student Create"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}