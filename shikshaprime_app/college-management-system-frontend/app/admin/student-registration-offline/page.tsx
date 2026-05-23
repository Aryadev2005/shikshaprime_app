"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import './student-registration-offline.css';
import { useAppSelector } from "@/src/store/hooks";
import { fetchAcademicYears } from "@/src/services/CommonService";
import { useEffect, useState } from "react";
import { useApi } from "@/src/hooks/useApi";
import { Loader } from "@/components/ui/loader";

const registrationSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.string().optional(),
    dob: z.string().min(1, "Date of birth is required"),
    classApplyingFor: z.string().min(1, "Class is required"),
    dept: z.string().min(1, "Department is required"),
    academicYear: z.string().min(1, "Academic year is required"),
    fatherName: z.string().min(1, "Father's name is required"),
    motherName: z.string().optional(),
    mobileNumber: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
    emailId: z.string().email("Invalid email address"),
    addressLine: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pinCode: z.string().optional(),
    previousSchoolName: z.string().optional(),
    lastClassPassed: z.string().optional(),
    boardUniversity: z.string().optional(),
});

type RegistrationData = z.infer<typeof registrationSchema>;

export default function StudentRegistrationOfflinePage() {
    const [isLoading, setIsLoading] = useState(false);
    // const { data: academicYearsData, error: academicYearsError, loading: academicYearsLoading, call: fetchAcademicYearsCall } = useApi(fetchAcademicYears);

    // useEffect(() => {
    //     fetchAcademicYearsCall();
    // }, []);

    // useEffect(() => {
    //     if (academicYearsData) {
    //         console.log("academicYearsData", academicYearsData);
    //     }
    // }, [academicYearsData]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegistrationData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            gender: "",
            dob: "",
            classApplyingFor: "",
            dept: "",
            academicYear: "",
            fatherName: "",
            motherName: "",
            mobileNumber: "",
            emailId: "",
            addressLine: "",
            city: "",
            state: "",
            pinCode: "",
            previousSchoolName: "",
            lastClassPassed: "",
            boardUniversity: ""
        }
    });

    // Accessing Redux state
    const { academicYears } = useAppSelector((state) => state.academic);
    const { classes } = useAppSelector((state) => state.classes);
    const { departments } = useAppSelector((state) => state.departments);

    // Example: Log or use the data
    console.log("Redux Access Details:===============>", academicYears, classes, departments);

    const onSubmit = (data: RegistrationData) => {
        setIsLoading(true);
        console.log("Saving Offline Registration:", data);
        setTimeout(() => setIsLoading(false), 2000);
    };

    const Req = () => <span className="required-star">*</span>;

    const ErrorMsg = ({ name }: { name: keyof RegistrationData }) => (
        errors[name] ? <span className="error-message text-xs text-red-500 mt-1">{errors[name]?.message}</span> : null
    );

    return (
        <>
            {isLoading && <Loader />}
            <div className="offline-registration-container">

                {/* Header Card */}
                <div className="offline-header-card">
                    <h1 className="page-heading">Student Registration</h1>
                    <div className="mode-badge">
                        Registration Mode: <span className="mode-value">Offline</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Student Details */}
                    <div className="form-section">
                        <span className="section-label">Student Details</span>
                        <div className="form-grid-4">
                            <div className="form-group-offline mb-4">
                                <label className="label-offline">First Name<Req /></label>
                                <Input {...register("firstName")} placeholder="First name" className={`input-offline ${errors.firstName ? 'border-red-500' : ''}`} />
                                <ErrorMsg name="firstName" />
                            </div>
                            <div className="form-group-offline mb-4">
                                <label className="label-offline">Last Name<Req /></label>
                                <Input {...register("lastName")} placeholder="Last Name" className={`input-offline ${errors.lastName ? 'border-red-500' : ''}`} />
                                <ErrorMsg name="lastName" />
                            </div>
                            <div className="form-group-offline mb-4">
                                <label className="label-offline">Gender</label>
                                <div className="select-wrapper-offline">
                                    <select {...register("gender")} className="select-offline">
                                        <option value="" disabled>Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    <ChevronDown className="select-icon" size={16} />
                                </div>
                                <ErrorMsg name="gender" />
                            </div>
                            <div className="form-group-offline mb-4">
                                <label className="label-offline">Date of Birth<Req /></label>
                                <Input
                                    {...register("dob")}
                                    placeholder="Date of Birth"
                                    className={`input-offline ${errors.dob ? 'border-red-500' : ''}`}
                                    type="text"
                                    onFocus={(e) => e.target.type = 'date'}
                                    onBlur={(e) => e.target.type = 'text'}
                                />
                                <ErrorMsg name="dob" />
                            </div>
                        </div>
                        <div className="form-grid-4">
                            <div className="form-group-offline">
                                <label className="label-offline">Class / Course Applying For<Req /></label>
                                <div className="select-wrapper-offline">
                                    <select {...register("classApplyingFor")} className="select-offline">
                                        {classes && classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="select-icon" size={16} />
                                </div>
                                <ErrorMsg name="classApplyingFor" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">Dept<Req /></label>
                                <div className="select-wrapper-offline">
                                    <select {...register("dept")} className="select-offline">
                                        {departments && departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="select-icon" size={16} />
                                </div>
                                <ErrorMsg name="dept" />
                            </div>
                            <div className="form-group-offline" style={{ gridColumn: "span 2" }}>
                                <label className="label-offline">Academic Year<Req /></label>
                                <div className="select-wrapper-offline">
                                    <select {...register("academicYear")} className="select-offline">
                                        <option value="" disabled>Academic Year</option>
                                        {academicYears && academicYears.map((year) => (
                                            <option key={year.id} value={year.id}>
                                                {year.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="select-icon" size={16} />
                                </div>
                                <ErrorMsg name="academicYear" />
                            </div>
                        </div>
                    </div>

                    {/* Parent Details */}
                    <div className="form-section">
                        <span className="section-label">Parent / Guardian Details</span>
                        <div className="form-grid-4">
                            <div className="form-group-offline">
                                <label className="label-offline">Father's Name<Req /></label>
                                <Input {...register("fatherName")} placeholder="Father's Name" className={`input-offline ${errors.fatherName ? 'border-red-500' : ''}`} />
                                <ErrorMsg name="fatherName" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">Mother's Name</label>
                                <Input {...register("motherName")} placeholder="Mother's Name" className="input-offline" />
                                <ErrorMsg name="motherName" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">Mobile Number<Req /></label>
                                <Input {...register("mobileNumber")} placeholder="Mobile Number" className={`input-offline ${errors.mobileNumber ? 'border-red-500' : ''}`} />
                                <ErrorMsg name="mobileNumber" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">Email ID<Req /></label>
                                <Input {...register("emailId")} placeholder="Email ID" className={`input-offline ${errors.emailId ? 'border-red-500' : ''}`} />
                                <ErrorMsg name="emailId" />
                            </div>
                        </div>
                    </div>

                    {/* Address Details */}
                    <div className="form-section">
                        <span className="section-label">Address Details</span>
                        <div className="form-grid-4">
                            <div className="form-group-offline">
                                <label className="label-offline">Address Line</label>
                                <Input {...register("addressLine")} placeholder="Address Line" className="input-offline" />
                                <ErrorMsg name="addressLine" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">City</label>
                                <Input {...register("city")} placeholder="City" className="input-offline" />
                                <ErrorMsg name="city" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">State</label>
                                <Input {...register("state")} placeholder="State" className="input-offline" />
                                <ErrorMsg name="state" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">PIN Code</label>
                                <Input {...register("pinCode")} placeholder="PIN Code" className="input-offline" />
                                <ErrorMsg name="pinCode" />
                            </div>
                        </div>
                    </div>

                    {/* Academic Details */}
                    <div className="form-section">
                        <span className="section-label">Academic Details</span>
                        <div className="form-grid-3">
                            <div className="form-group-offline" style={{ gridColumn: "span 1" }}>
                                <label className="label-offline">Previous School Name</label>
                                <div className="select-wrapper-offline">
                                    <select {...register("previousSchoolName")} className="select-offline">
                                        <option value="" disabled>Previous School Name</option>
                                        <option value="School A">School A</option>
                                        <option value="School B">School B</option>
                                    </select>
                                    <ChevronDown className="select-icon" size={16} />
                                </div>
                                <ErrorMsg name="previousSchoolName" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">Last Class Passed</label>
                                <Input {...register("lastClassPassed")} placeholder="Last Class Passed" className="input-offline" />
                                <ErrorMsg name="lastClassPassed" />
                            </div>
                            <div className="form-group-offline">
                                <label className="label-offline">Board / University</label>
                                <Input {...register("boardUniversity")} placeholder="Board / University" className="input-offline" />
                                <ErrorMsg name="boardUniversity" />
                            </div>
                        </div>
                    </div>

                    <div className="action-bar">
                        <Button type="submit" className="btn-save-offline">
                            Save Details
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
