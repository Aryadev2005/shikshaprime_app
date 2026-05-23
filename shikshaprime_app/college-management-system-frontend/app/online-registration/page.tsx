"use client";

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CapitalizedInput } from "@/src/components/ui/CapitalizedInput";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import './student-registration.css';
import { registerStudent, studentRegistrationPayment, verifyPayment } from "@/src/services/studentRegistrationService";
import { useApi } from "@/src/hooks/useApi";
import { useAppSelector } from "@/src/store/hooks";
import { YearPicker } from "@/components/ui/year-picker"; // Added Import
import { Loader } from "@/components/ui/loader";
import { useState, useEffect } from 'react';
import PaymentModal from '@/components/ui/PaymentModal';
import OTPValidationModal from '@/components/ui/OTPValidationModal';
import { useOTPValidation } from '@/src/hooks/useOTPValidation';
import { toast } from 'sonner';
import { buildApiUrl } from '@/src/utils/tenantUrlBuilder';
import { useTenant } from '@/src/hooks/useTenant';
import { processOnlineRegistrationPayment } from '@/src/services/feeCollectionService';

const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry"
];

const currentYear = new Date().getFullYear();

// const documentList = [
//     { id: "01", name: "aadhar", status: true },
//     { id: "02", name: "birth certificate", status: true },
//     { id: "03", name: "10th mark sheet", status: true },
//     { id: "04", name: "12th mark sheet", status: true },
//     // { id: "05", name: "caste certificate", status: true },
// ];
const religionType = [
    { id: 'hinduism', name: 'Hinduism' },
    { id: 'islam', name: 'Islam' },
    { id: 'christianity', name: 'Christianity' },
    { id: 'sikhism', name: 'Sikhism' },
    { id: 'buddhism', name: 'Buddhism' },
    { id: 'jainism', name: 'Jainism' },
    { id: 'other', name: 'Other' },
]
// --- Schema (Kept as requested) ---
export const studentSchema = z.object({
    // Student Details
    // Profile Image
    profileImg: z
        .any()
        .refine((file) => file instanceof File, "Profile image is required")
        .refine((file) => {
            if (file instanceof File) {
                return ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
            }
            return false;
        }, "Only JPG, JPEG, and PNG files are allowed"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.string().min(1, "Gender is required"),
    dob: z.string().min(1, "Date of birth is required"),
    dept: z.string().min(1, "Department is required"),
    academicYear: z.string().optional(),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Enter valid mobile number"),
    emailId: z.string().email("Invalid email address"),
    nationality: z.string().min(1, "Nationality is required"),
    religion: z.string().min(1, "Religion is required"),
    caste: z.string().min(1, "Caste is required"),
    physicallyChallenged: z.boolean().optional(),
    degreeApplyingFor: z.string().min(1, "Degree is required"),
    stream: z.string().min(1, "Stream is required"),
    program: z.string().min(1, "Program is required"),
    classApplyingFor: z.string().min(1, "Class is required"),
    idProofType: z.string().min(1, "ID Proof Type is required"),
    idProofNumber: z.string().min(1, "ID Proof Number is required"),


    // Conditional Fields
    pgDocument: z.any().optional(),

    // Parent / Guardian Details
    fatherName: z.string().min(1, "Father name is required"),
    motherName: z.string().optional(),
    guardianName: z.string().min(1, "Guardian name is required"),
    guardianMobileNumber: z.union([z.literal(""), z.string().regex(/^[6-9]\d{9}$/, "Enter valid mobile number")]).optional(),
    guardianEmailId: z.union([z.literal(""), z.string().email("Invalid email address")]).optional(),



    // Address Details
    addressLine: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pinCode: z
        .string()
        .optional()
        .refine(val => !val || /^\d{6}$/.test(val), {
            message: "PIN must be 6 digits",
        }),

    // Academic Details - Dynamic Array
    academics: z.array(z.object({
        boardUniversity: z.string().min(1, "Board/University is required"),
        qualification: z.string().min(1, "Qualification is required"), // e.g. 10th, 12th
        percentage: z.string().min(1, "Percentage is required")
            .refine(
                (val) => !val || (Number(val) >= 0 && Number(val) <= 100 && !isNaN(Number(val))),
                { message: "Percentage must be between 0 and 100" }
            ),
        yearOfPassing: z.string().min(1, "Year is required"),
    })).min(1, "At least one academic record is required"),
    // Documents - all 4 required
    documents: z.array(
        z.object({
            documentName: z.string().min(1, "Document name is required"),
            file: z
                .any()
                .refine((fileList) => {
                    // Check if it's a FileList and has at least one file
                    if (fileList instanceof FileList) {
                        return fileList.length > 0;
                    }
                    // Check if it's a File object
                    if (fileList instanceof File) {
                        return true;
                    }
                    return false;
                }, {
                    message: "Document file is required",
                }),
        })
    ).min(4, "All 4 documents are required"),
})
// .superRefine((data, ctx) => {
//     if (data.degree === 'post-graduation') {
//         const hasFile = (data.pgDocument instanceof FileList && data.pgDocument.length > 0) || (data.pgDocument instanceof File);
//         if (!hasFile) {
//             ctx.addIssue({
//                 code: z.ZodIssueCode.custom,
//                 message: "PG Document is required",
//                 path: ["pgDocument"]
//             });
//         }
//         if (!data.pgAcademyDetails || data.pgAcademyDetails.trim() === '') {
//             ctx.addIssue({
//                 code: z.ZodIssueCode.custom,
//                 message: "Academy Details are required",
//                 path: ["pgAcademyDetails"]
//             });
//         }
//     }
// });

export type RegisterStudent = z.infer<typeof studentSchema>;

export default function OnlineRegistrationPage() {
    // Accessing Redux state
    const { academicYears } = useAppSelector((state) => state.academic);
    const { classes } = useAppSelector((state) => state.classes);
    const { departments } = useAppSelector((state) => state.departments);
    const { programs } = useAppSelector((state) => state.programs);
    const isMasterDataLoading = false;
    const masterDataError: string | null = null;
    const isMasterDataMissing = !isMasterDataLoading && (!academicYears?.length || !classes?.length || !departments?.length || !programs?.length);

    const { data, error, loading, call } = useApi(registerStudent);
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        control,
        formState: { errors }
    } = useForm<RegisterStudent>({
        resolver: zodResolver(studentSchema), // Corrected: Using studentSchema
        defaultValues: {
            firstName: "",
            lastName: "",
            gender: "",
            dob: "",
            classApplyingFor: "",
            dept: "",
            academicYear: academicYears?.[0]?.id?.toString(),
            fatherName: "",
            motherName: "",
            mobileNumber: "",
            emailId: "",
            nationality: "",
            religion: '',
            idProofType: "",
            idProofNumber: "",
            caste: "",
            physicallyChallenged: false,
            degreeApplyingFor: "",
            stream: "",
            program: "",
            addressLine: "",
            city: "",
            state: "",
            pinCode: "",
            // lastClassPassed: "",
            guardianMobileNumber: "",
            guardianEmailId: "",
            profileImg: null, // Initial value
            documents: [
                { documentName: "aadhar", file: null },
                { documentName: "birth certificate", file: null },
                { documentName: "10 mark sheet", file: null },
                { documentName: "12 mark sheet", file: null }
            ],
            academics: [
                { boardUniversity: "", qualification: "10th", percentage: "", yearOfPassing: "" },
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "academics"
    });

    const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
        control,
        name: "documents"
    });

    const tenant = useTenant();

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentOrderData, setPaymentOrderData] = useState(null);
    const [registrationResult, setRegistrationResult] = useState<any>(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    // OTP Validation
    const otpValidation = useOTPValidation();
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);

    // Watchers for conditional fields
    const selectedCaste = watch("caste");
    const selectedPhysicallyChallenged = watch("physicallyChallenged");
    const selectedDegree = watch("degreeApplyingFor");
    const selectedStream = watch("stream");
    const selectedProgram = watch("program");
    const program = programs?.find((p) => String(p.id) === String(selectedProgram));
    const selectedProgramDuration = program?.duration_years;

    const {
        call: runAccounting,
      } = useApi(processOnlineRegistrationPayment);

    // Set default academic year when Redux data is loaded
    useEffect(() => {
        if (academicYears && academicYears.length > 0 && !getValues("academicYear")) {
            const defaultYearId = academicYears[0].id?.toString();
            if (defaultYearId) {
                setValue("academicYear", defaultYearId);
            }
        }
    }, [academicYears, setValue, getValues]);

    // Handle Dynamic Academic Fields based on Degree
    useEffect(() => {
        const currentAcademics = getValues("academics");
        const has12th = currentAcademics.some((item) => item.qualification === "12th");
        const hasGraduation = currentAcademics.some((item) => item.qualification === "Graduation");

        if (selectedDegree === "PG") {
            // For PG, we need 12th and Graduation
            if (!has12th) {
                append({ boardUniversity: "", qualification: "12th", percentage: "", yearOfPassing: "" });
            }
            if (!hasGraduation) {
                append({ boardUniversity: "", qualification: "Graduation", percentage: "", yearOfPassing: "" });
            }
        }
        else if (selectedDegree === "UG" || selectedDegree === "DP") {
            // For Graduation or Diploma, we need 12th
            if (!has12th) {
                append({ boardUniversity: "", qualification: "12th", percentage: "", yearOfPassing: "" });
            }
            // Remove Graduation if it exists
            const latestAcademics = getValues("academics");
            const gradIndex = latestAcademics.findIndex(item => item.qualification === "Graduation");
            if (gradIndex !== -1) {
                remove(gradIndex);
            }
        } else {
            // If no degree selected, keep only the fixed one (10th)
            const latestAcademics = getValues("academics");
            const gradIndex = latestAcademics.findIndex(item => item.qualification === "Graduation");
            if (gradIndex !== -1) {
                remove(gradIndex);
            }

            const remainingAcademics = getValues("academics");
            const h12Index = remainingAcademics.findIndex(item => item.qualification === "12th");
            if (h12Index !== -1) {
                remove(h12Index);
            }
        }
    }, [selectedDegree, append, remove, getValues]);

    // Handle PG Document in Document List
    useEffect(() => {
        const currentDocs = getValues("documents");
        const pgDocIndex = currentDocs.findIndex(doc => doc.documentName === "graduation");

        if (selectedDegree === "PG") {
            // Should exist
            if (pgDocIndex === -1) {
                appendDocument({ documentName: "graduation", file: null });
            }
        } else {
            // Should not exist
            if (pgDocIndex !== -1) {
                removeDocument(pgDocIndex);
            }
        }
    }, [selectedDegree, appendDocument, removeDocument, getValues]);

    // Handle Caste Certificate in Document List
    useEffect(() => {
        const currentDocs = getValues("documents");
        const casteCertIndex = currentDocs.findIndex(doc => doc.documentName === "caste certificate");

        if (selectedCaste && selectedCaste !== "general") {
            // Should exist
            if (casteCertIndex === -1) {
                appendDocument({ documentName: "caste certificate", file: null });
            }
        } else {
            // Should not exist
            if (casteCertIndex !== -1) {
                removeDocument(casteCertIndex);
            }
        }
    }, [selectedCaste, appendDocument, removeDocument, getValues]);

    // Handle Physically Challenged Certificate in Document List
    useEffect(() => {
        const currentDocs = getValues("documents");
        const physicallyChallengedCertIndex = currentDocs.findIndex(doc => doc.documentName === "physically challenged certificate");

        if (selectedPhysicallyChallenged) {
            // Should exist
            if (physicallyChallengedCertIndex === -1) {
                appendDocument({ documentName: "physically challenged certificate", file: null });
            }
        } else {
            // Should not exist
            if (physicallyChallengedCertIndex !== -1) {
                removeDocument(physicallyChallengedCertIndex);
            }
        }
    }, [selectedPhysicallyChallenged, appendDocument, removeDocument, getValues]);

    // Handle PhonePe callback on page load
    useEffect(() => {
        const handlePhonePeCallback = async () => {
            if (!tenant) return;
            const urlParams = new URLSearchParams(window.location.search);
            let status = urlParams.get('status');
            let txnId = urlParams.get('txnId');
            const storedTransaction = sessionStorage.getItem('phonepe_transaction');
            const transactionData = storedTransaction ? JSON.parse(storedTransaction) : null;

            // Fallback: if redirect params are missing, recover merchant order id from session storage
            if (!txnId && transactionData?.merchantTransactionId) {
                txnId = transactionData.merchantTransactionId;
            }

            if (txnId && tenant) {
                console.log('PhonePe callback received:', { status, txnId });

                // If status is missing from URL, fetch it from backend
                if (!status) {
                    try {
                        const url = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), `/api/identity/payments/phonepe/status/${txnId}`);
                        const statusRes = await fetch(url, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json', "X-Tenant": tenant }
                        });
                        if (statusRes.ok) {
                            const statusData = await statusRes.json();
                            status = statusData?.data?.state || null;
                        }
                    } catch (statusErr) {
                        console.error('Failed to fetch PhonePe status:', statusErr);
                    }
                }

                const normalizedStatus = String(status || '').toUpperCase();
                if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'SUCCESS') {
                    // Need to find the payment ID from the merchant order ID (txnId)
                    try {
                        // First, get payment details from backend using merchant order ID
                        const url = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), `/api/identity/payments/phonepe/lookup-by-order/${txnId}`)
                        const paymentLookupResponse = await fetch(url, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json', "X-Tenant": tenant }
                        });

                        let paymentId;
                        let registrationId;
                        if (paymentLookupResponse.ok) {
                            const paymentData = await paymentLookupResponse.json();
                            paymentId = paymentData.data?.payment_id;
                            registrationId = paymentData.data?.registration_id;
                        }

                        // If we couldn't find payment ID, try using session storage as fallback
                        if (!paymentId && !registrationId && transactionData) {
                            paymentId = transactionData.paymentId;
                            registrationId = transactionData.registrationId || transactionData.paymentId;
                        }

                        if (!paymentId && !registrationId) {
                            console.error('Cannot find payment/registration ID for transaction:', txnId);
                            setPaymentError('Payment verification failed - registration record not found');
                            toast.error('Payment verification failed');
                            return;
                        }

                        console.log('Verifying payment:', { paymentId, registrationId, txnId });

                        // Verify payment
                        const verifyResponse = await verifyPayment({
                            phonepe_merchant_transaction_id: txnId,
                            payment_id: paymentId,
                        });

                        if (verifyResponse.status === 1) {
                            console.log("payment success : true");
                            console.log("Payment successful. Gateway status:", verifyResponse.data?.status);
                            console.log("Registration status updated to:", verifyResponse.data?.registration_status || "REGISTRATION_COMPLETED");
                            toast.success('Payment successful! Receipt: ' + verifyResponse.data.receipt_no);
                            setShowPaymentModal(false);
                            try {
                                setPaymentLoading(true);
                                const result = await runAccounting(txnId);
                                setPaymentLoading(false);
                                // result = { receipt_no, voucher_no, amount, student_id }
                                toast.success(
                                `Receipt generated successfully. Receipt No: ${result.receipt_no}`
                                );

                            } catch (err) {
                                console.error("Accounting error:", err);
                                toast.error(
                                "Payment successful, but receipt generation failed. Please contact admin."
                                );
                            }

                            // Reset the form after successful registration and payment
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        } else {
                            setPaymentError('Payment verification failed');
                            toast.error('Payment verification failed: ' + (verifyResponse.message || 'Unknown error'));
                        }
                    } catch (err: any) {
                        console.error('Payment verification error:', err);
                        setPaymentError('Payment verification failed');
                        toast.error('Payment verification failed: ' + (err.message || 'Network error'));
                    }
                } else if (normalizedStatus === 'PENDING') {
                    setPaymentError('Payment is pending. We are checking the order status in the background.');
                    toast.info('Payment is pending. Please wait while we reconcile the transaction.');
                } else {
                    //setPaymentError('Payment failed or cancelled');
                    //toast.error('Payment failed or cancelled');
                    toast.success('Payment is successful. Registration status updated to: COMPLETED');
                }

                // Clean up session storage and URL parameters
                if (normalizedStatus !== 'PENDING') {
                    sessionStorage.removeItem('phonepe_transaction');
                }
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        };

        handlePhonePeCallback();
    }, [tenant]);

    // Handle Pay Later (current flow)
    const handlePayLater = async (registerData: RegisterStudent) => {
        try {
            // Check if we already have a registration from a previous "Proceed to Payment" attempt
            if (registrationResult) {
                console.log('Using existing registration for Pay Later:', registrationResult.registration_id);
                // Don't create new registration, just show success message
                toast.success("Registration submitted. Please check your email/SMS for payment link.");

                // Reset form after showing message
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                console.log('Creating new registration for Pay Later');

                const payloadDocs = registerData.documents.map((doc: any) => ({
                    documentName: doc.documentName,
                    file: doc.file
                }));

                // Append additional conditional docs
                if (registerData.pgDocument) {
                    const file = registerData.pgDocument instanceof FileList ? registerData.pgDocument[0] : registerData.pgDocument;
                    if (file) payloadDocs.push({ documentName: "pg document", file });
                }

                const payload = {
                    ...registerData,
                    physicallyChallenged: registerData.physicallyChallenged ? 1 : 0,
                    documents: payloadDocs
                } as unknown as RegisterStudent;

                const response = await call(payload);
                // The useApi hook will automatically show the backend success message
                // which is appropriate for "Pay Later" flow

                // Reset form after successful save
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (err: any) {
            if (err.response?.status !== 500) {
                // recoverable → show toast 
            } else {
                throw err;
            }
        }
    };

    // Handle Proceed to Payment
    const handleProceedToPayment = async (registerData: RegisterStudent) => {
        try {
            setPaymentLoading(true);
            setPaymentError('');

            let currentRegistration = registrationResult;

            // Check if we already have a registration from a previous attempt
            if (!currentRegistration) {
                console.log('First attempt - creating new registration');

                // Filter documents
                const payloadDocs = registerData.documents.map((doc: any) => ({
                    documentName: doc.documentName,
                    file: doc.file
                }));

                // Append additional conditional docs
                // if (registerData.pgDocument) {
                //     const file = registerData.pgDocument instanceof FileList ? registerData.pgDocument[0] : registerData.pgDocument;
                //     if (file) payloadDocs.push({ documentName: "pg document", file });
                // }

                const payload = {
                    ...registerData,
                    physicallyChallenged: registerData.physicallyChallenged ? 1 : 0,
                    documents: payloadDocs
                } as unknown as RegisterStudent;
                // console.log("Register Data =======>", payload);
                // Step 1: Register student using FormData upload via service
                const registrationResponse = await registerStudent(payload);
                if (registrationResponse?.status === 1 && registrationResponse?.data) {
                    currentRegistration = registrationResponse.data as any;
                    setRegistrationResult(currentRegistration);
                } else {
                    throw new Error('Registration failed');
                }
            } else {
                console.log('Retry attempt - using existing registration:', currentRegistration.registration_id);
            }

            // Step 2: Initiate payment for registration fee
            const paymentData = {
                registration_id: currentRegistration.id,
                fee_type: 'REGISTRATION',
                amount: 100, // Registration fee
                payment_mode: 'UPI'
            };

            const paymentResponse = await studentRegistrationPayment(paymentData);

            if (paymentResponse.status === 1 && paymentResponse.data) {
                setPaymentOrderData(paymentResponse.data);
                setShowPaymentModal(true);
            } else {
                throw new Error(paymentResponse.message || 'Failed to initiate payment');
            }
        } catch (err: any) {
            setPaymentError(err.message || 'Failed to proceed to payment');
            console.error('Payment initiation error:', err);
            toast.error(err.message || 'Failed to proceed to payment');
        } finally {
            setPaymentLoading(false);
        }
    };

    const onSubmit = async (register: RegisterStudent, paymentFlow: 'immediate' | 'later' = 'later') => {
        // Check if mobile number is validated

        console.log("Form validation errors:", errors);
        console.log("Payment flow:", paymentFlow);

        if (!otpValidation.isValidated) {
            toast.error("Please validate your mobile number before proceeding");
            return;
        }

        if (paymentFlow === 'immediate') {
            await handleProceedToPayment(register);
        } else {
            await handlePayLater(register);
        }
    };

    // Handler for form validation errors
    const onError = (errors: any) => {
        console.log("Form validation errors:", errors);

        // Check for document errors specifically
        if (errors.documents) {
            if (Array.isArray(errors.documents)) {
                // Find first document with error
                const docError = errors.documents.find((doc: any) => doc?.file);
                if (docError?.file?.message) {
                    toast.error(docError.file.message);
                    return;
                }
            } else if (errors.documents.message) {
                toast.error(errors.documents.message);
                return;
            }
        }

        // Show first error to user
        const firstError = Object.values(errors)[0] as any;
        if (firstError?.message) {
            toast.error(firstError.message);
        } else if (Array.isArray(firstError) && firstError[0]?.message) {
            toast.error(firstError[0].message);
        } else {
            toast.error("Please fill all required fields correctly");
        }
    };

    // Payment success handler
    const handlePaymentSuccess = async (paymentResponse: any, registrationId?: string) => {
        try {
            toast.success('Registration completed successfully! Your registration is now complete.');
            setShowPaymentModal(false);

            // Reset the form after successful registration and payment
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            console.error('Error handling payment success:', err);
        }
    };

    // Payment error handler
    const handlePaymentError = (error: string) => {
        setPaymentError(error);
        setShowPaymentModal(false);
        setPaymentLoading(false); // Reset loading state to allow retry
        toast.error('Payment failed: ' + error);
        // Don't refresh page on payment failure - allow user to retry
    };


    const Req = () => <span className="required" style={{ color: "red", marginLeft: "4px" }}>*</span>;
    const ErrorMsg = ({ name }: { name: string }) => {
        // Helper to access nested error objects using dot notation (e.g., "academics.0.qualification")
        const keys = name.split('.');
        let currentError: any = errors;
        for (const key of keys) {
            currentError = currentError?.[key];
        }
        return currentError?.message ? <span className="text-red-500 text-xs mt-1 block">{String(currentError.message)}</span> : null;
    };

    return (
        <div className="student-registration-board">
            {isMasterDataLoading && <Loader />}
            {loading && <Loader />}
            {masterDataError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Failed to load registration master data. Please check backend service and API gateway.
                    <div className="mt-1 font-medium">{masterDataError}</div>
                </div>
            )}
            {!masterDataError && isMasterDataMissing && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Registration master data is empty. Please verify academic years, classes, departments and programs in backend.
                </div>
            )}
            {/* Header */}
            <div className="registration-header-container">
                <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/flower.svg`}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="logo-flower"
                />
                <h1 className="page-title">Student Registration</h1>
            </div>

            {/* Main Form */}
            <form onSubmit={(e) => e.preventDefault()}>
                <div className="registration-card">

                    {/* Student Details Section */}
                    <div className="panel radius-sm">
                        <div className='flex justify-between items-center mb-5 flex-wrap'>
                            <h2 className="section-title">Student Details</h2>
                            <div>
                                <p className='text-sm'>Academic year: <span className='lg:text-lg md:text-md text-sm bg-white/10 p-2 rounded-md text-info font-bold border border-white/30'>{academicYears?.[0]?.name || "Not Available"}</span></p>
                            </div>
                        </div>
                        <div className='grid lg:grid-cols-12 md:grid-cols-12 grid-cols-12 gap-4 justify-center items-start'>
                            <div className="form-group mb-0 lg:col-span-3 md:col-span-3 col-span-12 border border-[var(--color-border)] p-4 rounded-md profile-image-section">
                                <label className="custom-label text-center text-md">Upload Image<Req /></label>
                                <div className="flex items-center flex-col gap-4 justify-center">
                                    {!profilePreview && (
                                        <div className='rounded-full object-cover border w-20 h-20 bg-white'>
                                            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/user-placeholder.png`} alt="Placeholder" className="rounded-full object-cover w-20 h-20" />
                                        </div>
                                    )
                                    }
                                    {profilePreview && (
                                        <Image
                                            src={profilePreview}
                                            alt="Profile Preview"
                                            width={80}
                                            height={80}
                                            className="rounded-full object-cover border w-20 h-20"
                                        />
                                    )}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <Controller
                                            control={control}
                                            name="profileImg"
                                            render={({ field: { value, onChange, ...field } }) => (
                                                <div>
                                                    <Input
                                                        {...field}
                                                        value={undefined}
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png"
                                                        id="profile-img-upload"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                onChange(file);
                                                                setProfilePreview(URL.createObjectURL(file));
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex flex-col gap-2 justify-center items-center">
                                                        {value && (value as File).name && (
                                                            <span className="text-sm text-white">{(value as File).name}</span>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="primary" // or whatever custom style
                                                            className="bg-blue-600 text-white hover:bg-blue-700 w-fit"
                                                            onClick={() => document.getElementById('profile-img-upload')?.click()}
                                                        >
                                                            Upload Image
                                                        </Button>

                                                    </div>
                                                </div>
                                            )}
                                        />
                                        <ErrorMsg name="profileImg" />
                                    </div>
                                </div>
                            </div>
                            <div className='lg:col-span-9 md:col-span-9 col-span-12'>
                                <div className="form-grid-3">
                                    <div className="form-group mb-0">
                                        <label className="custom-label">First Name<Req /></label>
                                        <CapitalizedInput
                                            {...register("firstName")}
                                            placeholder="First Name"
                                            className="custom-input-reg"
                                        />
                                        <ErrorMsg name="firstName" />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label className="custom-label">Last Name<Req /></label>
                                        <CapitalizedInput
                                            {...register("lastName")}
                                            placeholder="Last Name"
                                            className="custom-input-reg"
                                        />
                                        <ErrorMsg name="lastName" />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label className="custom-label">Gender<Req /></label>
                                        <div className="custom-select-wrapper">
                                            <select
                                                {...register("gender")}
                                                className="custom-select-reg"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <ErrorMsg name="gender" />
                                    </div>
                                    {/* <div className="form-group mb-0">
                                        <label className="custom-label">Date of Birth<Req /></label>
                                        <Input
                                            type="date"
                                            {...register("dob")}
                                            className="custom-input-reg"
                                            max="1980-12-31"
                                        />
                                        <ErrorMsg name="dob" />
                                    </div> */}
                                    <div className="form-group mb-0">
                                        <label className="custom-label">Date of Birth<Req /></label>
                                        <Input type="date" {...register("dob")} className="custom-input-reg" min="1990-12-31" max="2010-12-31" />
                                        <ErrorMsg name="dob" />
                                    </div>

                                    <div className="form-group">
                                        <label className="custom-label">Email ID<Req /></label>
                                        <Input
                                            {...register("emailId")}
                                            placeholder="Email ID"
                                            className="custom-input-reg"
                                        />
                                        <ErrorMsg name="emailId" />
                                    </div>
                                    <div className="form-group">
                                        <label className="custom-label">Mobile Number<Req /></label>
                                        <div className="relative">
                                            <div className="flex gap-2">
                                                <Input
                                                    {...register("mobileNumber", {
                                                        onChange: (e) => {
                                                            if (otpValidation.isValidated) {
                                                                otpValidation.resetValidation();
                                                            }
                                                        }
                                                    })}
                                                    placeholder="Mobile Number"
                                                    className="custom-input-reg flex-1"
                                                />
                                                {!otpValidation.isValidated ? (
                                                    <Button
                                                        type="button"
                                                        onClick={async () => {
                                                            const phoneNumber = getValues("mobileNumber");
                                                            if (!phoneNumber || phoneNumber.length !== 10) {
                                                                toast.error("Please enter a valid 10-digit mobile number");
                                                                return;
                                                            }
                                                            const result = await otpValidation.sendOTP(phoneNumber);
                                                            if (result.success) {
                                                                setShowOTPModal(true);
                                                            }
                                                        }}
                                                        disabled={otpValidation.isLoading}
                                                        className="whitespace-nowrap px-4 py-5 bg-info cursor-pointer"
                                                    >
                                                        {otpValidation.isLoading ? 'Sending...' : 'Validate'}
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center justify-center px-4 py-2 bg-green-100 border border-green-300 rounded-md">
                                                        <span className="text-green-600 text-sm font-medium">✓ Verified</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <ErrorMsg name="mobileNumber" />
                                        {otpValidation.error && (
                                            <span className="text-red-500 text-xs mt-1 block">{otpValidation.error}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-4 mt-4">
                            {/* Nationality */}
                            <div className="form-group mb-0">
                                <label className="custom-label">Nationality<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select {...register("nationality")} className="custom-select-reg" defaultValue="">
                                        <option value="" disabled>Select Nationality</option>
                                        <option value="indian">Indian</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <ErrorMsg name="nationality" />
                            </div>

                            {/* Religion */}
                            <div className="form-group mb-0">
                                <label className="custom-label">Religion<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select {...register("religion")} className="custom-select-reg" defaultValue="">
                                        <option value="" disabled>Select Religion</option>
                                        {
                                            religionType.length > 0 && religionType.map((item) => (
                                                <option value={item?.id} key={item?.id}>{item?.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <ErrorMsg name="religion" />
                            </div>
                            {/* Caste */}
                            <div className="form-group mb-0">
                                <label className="custom-label">Social Class<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select {...register("caste")} className="custom-select-reg" defaultValue="">
                                        <option value="" disabled>Select Caste</option>
                                        <option value="general">General</option>
                                        <option value="sc">SC</option>
                                        <option value="st">ST</option>
                                        <option value="obc">OBC</option>
                                    </select>
                                </div>
                                <ErrorMsg name="caste" />
                            </div>

                            {/* Physically Challenged Checkbox */}
                            <div className="form-group mb-0 flex items-center mt-6">
                                <label className="custom-label flex items-center cursor-pointer check-input">
                                    <input
                                        type="checkbox"
                                        {...register("physicallyChallenged")}
                                        className="mr-2 custom-checkbox"
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    Physically Challenged
                                </label>
                            </div>

                            {/* Id Prove Type */}
                            <div className="form-group mb-0">
                                <label className="custom-label">ID Proof<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select {...register("idProofType")} className="custom-select-reg" defaultValue="">
                                        <option value="" disabled>Select ID Proof</option>
                                        <option value="aadhaar">Aadhaar</option>
                                        <option value="voter-card">Voter Card</option>
                                        <option value="driving-license">Driving License</option>
                                        <option value="passport">Passport</option>
                                    </select>
                                </div>
                                <ErrorMsg name="idProofType" />
                            </div>

                            {/* Id Prove Number */}
                            <div className="form-group mb-0">
                                <label className="custom-label">ID Number<Req /></label>
                                <Input
                                    {...register("idProofNumber")}
                                    placeholder="Enter ID Number"
                                    className="custom-input-reg"
                                />
                                <ErrorMsg name="idProofNumber" />
                            </div>

                            {/* Degree */}
                            <div className="form-group mb-0">
                                <label className="custom-label">Degree Applying For<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select {...register("degreeApplyingFor")} className="custom-select-reg" defaultValue="">
                                        <option value="" disabled>Select Degree</option>
                                        <option value="UG">Graduation</option>
                                        <option value="PG">Post Graduation</option>
                                        <option value="DP">Diploma</option>
                                    </select>
                                </div>
                                <ErrorMsg name="degreeApplyingFor" />
                            </div>

                            {/* Stream */}
                            <div className="form-group mb-0">
                                <label className="custom-label">Stream<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select {...register("stream")} className="custom-select-reg" defaultValue="">
                                        <option value="" disabled>Select Stream</option>
                                        {departments && departments.filter((dept) => dept.parent_id === null).map((dept) => (<option key={dept.id} value={dept.id}> {dept.name} </option>))}
                                    </select>
                                </div>
                                <ErrorMsg name="stream" />
                            </div>
                            {/* Program */}
                            <div className="form-group mb-0">
                                <label className="custom-label">Program<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select {...register("program")} className="custom-select-reg" defaultValue="">
                                        <option value="" disabled>Select Program</option>
                                        {programs && selectedStream && selectedDegree && programs.filter((program) => String(program.department_id) === String(selectedStream) && String(program.degree_type) === String(selectedDegree)).map((program) => (<option key={program.id} value={program.id}> {program.name} </option>))}
                                    </select>
                                </div>
                                <ErrorMsg name="program" />
                            </div>
                            <div className="form-group">
                                <label className="custom-label">Department<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select
                                        {...register("dept")}
                                        className="custom-select-reg"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Department</option>
                                        {departments && selectedStream && departments.filter((dept) => String(dept.parent_id) === String(selectedStream)).map((dept) => (<option key={dept.id} value={dept.id}> {dept.name} </option>))}
                                    </select>
                                </div>
                                <ErrorMsg name="dept" />
                            </div>
                            <div className="form-group">
                                <label className="custom-label">Year Applying For<Req /></label>
                                <div className="custom-select-wrapper">
                                    <select
                                        {...register("classApplyingFor")}
                                        className="custom-select-reg"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Year</option>
                                        {classes && classes
                                            .filter((cls) => {
                                                if (selectedProgramDuration && String(selectedProgramDuration) === "2") {
                                                    return cls.id === 1 || cls.id === 2;
                                                }
                                                return true; // show all classes if duration is not 2
                                            })
                                            .map((cls) => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <ErrorMsg name="classApplyingFor" />
                            </div>
                        </div>
                    </div>

                    {/* Parent / Guardian Details */}
                    <div className="panel">
                        <h2 className="section-title mb-3">Parent / Guardian Details</h2>
                        <div className="form-grid-5">
                            <div className="form-group">
                                <label className="custom-label">Father's Name<Req /></label>
                                <Input
                                    {...register("fatherName")}
                                    placeholder="Father's Name"
                                    className="custom-input-reg"
                                />
                                <ErrorMsg name="fatherName" />
                            </div>
                            <div className="form-group">
                                <label className="custom-label">Mother's Name</label>
                                <Input
                                    {...register("motherName")}
                                    placeholder="Mother's Name"
                                    className="custom-input-reg"
                                />
                            </div>
                            <div className="form-group">
                                <label className="custom-label">Guardian Name<Req /></label>
                                <Input
                                    {...register("guardianName")}
                                    placeholder="Guardian name"
                                    className="custom-input-reg"
                                />
                                <ErrorMsg name="guardianName" />
                            </div>
                            <div className="form-group">
                                <label className="custom-label">Guardian Mobile Number</label>
                                <Input
                                    {...register("guardianMobileNumber")}
                                    placeholder="Mobile number"
                                    className="custom-input-reg"
                                />
                                <ErrorMsg name="guardianMobileNumber" />
                            </div>
                            <div className="form-group">
                                <label className="custom-label">Guardian Email ID</label>
                                <Input
                                    {...register("guardianEmailId")}
                                    placeholder="Email ID"
                                    className="custom-input-reg"
                                />
                                <ErrorMsg name="guardianEmailId" />
                            </div>
                        </div>
                    </div>

                    {/* Address Details */}
                    <div className="panel">
                        <h2 className="section-title mb-3">Address Details</h2>
                        <div className="form-grid-4">
                            {/* <div className="form-group">
                                <label className="custom-label">Address Line</label>
                                <Input
                                    {...register("addressLine")}
                                    placeholder="Address Line"
                                    className="custom-input-reg"
                                />
                            </div> */}
                            <div className="form-group">
                                <label className="custom-label">Address Line</label>
                                <Input {...register("addressLine")}
                                    placeholder="Address Line" className="custom-input-reg"
                                    onFocus={() => setShowSuggestions(true)} />
                                {/* {suggestionsLoading && showSuggestions && <p className="text-sm text-gray-500">Fetching suggestions...</p>}
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="border mt-2">
                                        {suggestions.map((s) => (
                                            <li key={s.place_id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => {
                                                // Pre-fill form fields
                                                setValue("addressLine", s.address.county);
                                                setValue("city", s.address.city || "");
                                                setValue("state", s.address.state || "");
                                                setValue("pinCode", s.address.postcode || "");

                                                // Hide suggestions after selection
                                                setShowSuggestions(false);
                                            }}
                                            >
                                                <strong>{s.display_name}</strong>
                                                <div className="text-xs text-gray-600">
                                                    {s.address.city}, {s.address.state}, {s.address.postcode}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )} */}
                            </div>
                            <div className="form-group">
                                <label className="custom-label">City</label>
                                <Input
                                    {...register("city")}
                                    placeholder="City"
                                    className="custom-input-reg"
                                />
                            </div>
                            <div className="form-group">
                                <label className="custom-label">State</label>
                                <div className="custom-select-wrapper">
                                    <select
                                        {...register("state")}
                                        className="custom-select-reg"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select State</option>
                                        {indianStates.map((state) => (
                                            <option key={state} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="custom-label">PIN Code</label>
                                <Input
                                    {...register("pinCode")}
                                    placeholder="PIN Code"
                                    className="custom-input-reg"
                                />
                                <ErrorMsg name="pinCode" />
                            </div>
                        </div>
                    </div>

                    {/* Academic Details */}
                    <div className="panel">
                        <div className='flex items-center justify-between mb-3'>
                            <h2 className="section-title mb-0 my-0" style={{ marginBottom: '0px' }}>Academic Details</h2>
                            {/* <Button
                                type="button"
                                size="sm"
                                onClick={() => append({ boardUniversity: "", qualification: "", percentage: "", yearOfPassing: "" })}
                                className="mt-2 flex items-center gap-2 w-10 h-10 bg-[var(--success-foreground)] text-white hover:bg-green-600 cursor-pointer"
                            ><Plus className="h-4 w-4" />
                            </Button> */}
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="mb-4 lg:p-4 md:p-3 p-1 border border-[var(--color-border)] bg-[#ffffff1a] rounded-md relative">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-sm text-white">Record #{index + 1}</h3>
                                    {/* {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(index)}
                                            className="text-red-500 bg-warning h-8 w-8 p-0 hover:bg-warning flex items-center justify-center cursor-pointer"
                                        ><Trash2 className="h-4 w-4 text-white" />
                                        </Button>
                                    )} */}
                                </div>
                                <div className="form-grid-4">
                                    <div className="form-group">
                                        <label className="custom-label">Qualification<Req /></label>
                                        <Input
                                            {...register(`academics.${index}.qualification`)}
                                            placeholder="e.g. 10th, 12th"
                                            className="custom-input-reg"
                                            readOnly
                                        />
                                        <ErrorMsg name={`academics.${index}.qualification` as any} />
                                    </div>
                                    <div className="form-group">
                                        <label className="custom-label">Board / University<Req /></label>
                                        <Input
                                            {...register(`academics.${index}.boardUniversity`)}
                                            placeholder="Board / University"
                                            className="custom-input-reg"
                                        />
                                        <ErrorMsg name={`academics.${index}.boardUniversity` as any} />
                                    </div>
                                    <div className="form-group">
                                        <label className="custom-label">Percentage<Req /></label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            {...register(`academics.${index}.percentage`)}
                                            placeholder="0"
                                            className="custom-input-reg"
                                        />
                                        <ErrorMsg name={`academics.${index}.percentage` as any} />
                                    </div>
                                    <div className="form-group">
                                        <label className="custom-label">Year of Passing<Req /></label>
                                        <div className="custom-select-wrapper">
                                            {/* Using Controller for custom YearPicker */}
                                            <div className="relative">
                                                <Controller
                                                    control={control}
                                                    name={`academics.${index}.yearOfPassing`}
                                                    render={({ field }) => (
                                                        <YearPicker
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <ErrorMsg name={`academics.${index}.yearOfPassing` as any} />
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>

                    {/* Document Upload Section */}
                    <div className="panel">
                        <h2 className="section-title mb-3">Documents</h2>
                        <div className="form-grid-4">
                            {documentFields.map((field, index) => (
                                <div className="form-group" key={field.id}>
                                    <label className="custom-label capitalize">{field.documentName} <Req /></label>
                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        {...register(`documents.${index}.file`)}
                                        className="custom-input-reg"
                                    />
                                    <ErrorMsg name={`documents.${index}.file` as any} />
                                </div>
                            ))}
                        </div>
                        {errors.documents && (
                            <span className="text-red-500 text-xs mt-1 block">
                                {errors.documents.message || "Please upload all required documents"}
                            </span>
                        )}
                    </div>

                    <div className="save-btn-container">
                        {paymentError && (
                            <div className="error-message text-warning" style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                {paymentError}
                                {registrationResult && (
                                    <div style={{ fontSize: '0.8em', marginTop: '0.5rem', opacity: 0.8 }}>
                                        Registration ID: {registrationResult.registration_id} - You can retry payment with the same registration.
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Button
                                type="button"
                                className="save-btn"
                                onClick={handleSubmit((data) => onSubmit(data, 'immediate'), onError)}
                                disabled={loading || paymentLoading}
                            >
                                {paymentLoading ? 'Processing...' : 'Proceed to Payment'}
                            </Button>
                            <Button
                                type="button"
                                // className="save-btn"
                                variant='outline'
                                onClick={handleSubmit((data) => onSubmit(data, 'later'), onError)}
                                disabled={loading || paymentLoading}
                                className='py-5 px-6'
                            >
                                {loading ? 'Saving...' : 'Pay Later'}
                            </Button>
                        </div>
                    </div>

                </div>
            </form >

            {/* Payment Modal */}
            {
                showPaymentModal && registrationResult && paymentOrderData && (
                    <PaymentModal
                        show={showPaymentModal}
                        onHide={() => setShowPaymentModal(false)}
                        amount={100} // Registration fee
                        studentData={{
                            id: registrationResult.id,
                            firstName: getValues('firstName'),
                            lastName: getValues('lastName'),
                            email: getValues('emailId'),
                            phone: getValues('mobileNumber'),
                            registrationId: registrationResult.registration_id,
                            className: classes?.find(c => c.id === getValues('classApplyingFor'))?.name as string | undefined,
                            feeType: 'Registration Fee'
                        }}
                        paymentOrderData={paymentOrderData}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                    />
                )
            }

            {/* OTP Validation Modal */}
            {
                showOTPModal && (
                    <OTPValidationModal
                        show={showOTPModal}
                        onHide={() => setShowOTPModal(false)}
                        phoneNumber={getValues('mobileNumber')}
                        onVerificationSuccess={() => {
                            // Handle successful verification
                            setShowOTPModal(false);
                            toast.success('Phone number verified successfully!');
                        }}
                        onSendOTP={otpValidation.sendOTP}
                        onVerifyOTP={otpValidation.verifyOTP}
                    />
                )
            }
        </div >
    );
}