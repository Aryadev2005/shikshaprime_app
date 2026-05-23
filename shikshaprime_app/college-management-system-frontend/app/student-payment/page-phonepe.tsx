"use client";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { Loader } from "@/components/ui/loader";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getRegistrationByRegId, studentRegistrationPayment, type FeeStructure } from "@/src/services/studentRegistrationService";
import { PhonePeIntegration } from '@/src/utils/phonePeIntegration';
import './student-payment.css';
import { useTenant } from "@/src/hooks/useTenant";

const paymentSchema = z.object({
    registrationId: z.string().min(1, "Registration ID is required"),
    studentName: z.string().min(1, "Student name is required"),
    mobileNumber: z.string().optional(),
    emailId: z.email("Invalid email address"),
    className: z.string().min(1, "Class is required"),
    academicYear: z.string().min(1, "Academic year is required"),
    agreed: z.boolean().refine(val => val === true, {
        message: "You must agree to the terms and conditions"
    })
});

type PaymentData = z.infer<typeof paymentSchema>;

function StudentPaymentContent() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const [feeStructure, setFeeStructure] = useState<FeeStructure[]>([]);
    const [selectedAmount, setSelectedAmount] = useState<number>(0);
    const [registrationData, setRegistrationData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const tenant = useTenant();
        
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<PaymentData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {}
    });
    
    const watchedRegistrationId = watch("registrationId");

    // Load fee structure and initial registration data on component mount
    useEffect(() => {
        const regIdFromQuery = searchParams.get("regId");
        const paymentIdFromQuery = searchParams.get("paymentId");
        
        if (regIdFromQuery) {
            setValue("registrationId", regIdFromQuery);
        }
    }, []);

    // Load registration data when registration ID changes
    useEffect(() => {
        const loadRegistrationData = async () => {
            if (watchedRegistrationId && watchedRegistrationId.length > 0) {
                try {
                    const response = await getRegistrationByRegId(watchedRegistrationId);
                    if (response.status === 1) {
                        const regData = response.data;
                        setRegistrationData(regData);
                        setValue("studentName", `${regData.first_name} ${regData.last_name}`);
                        setValue("mobileNumber", regData.mobile || "");
                        setValue("emailId", regData.email || "");
                        
                        // Precompute selected amount based on status
                        if (regData.status === 'REGISTRATION_PENDING') {
                            setSelectedAmount(100);
                        } else if (regData.status === 'PAYMENT_PENDING') {
                            setSelectedAmount(500);
                        } else {
                            setSelectedAmount(0);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load registration data:", err);
                    setError("Registration ID not found");
                }
            }
        };
        loadRegistrationData();
    }, [watchedRegistrationId, setValue]);

    const processPhonePePayment = async (orderData: any) => {
        if (!tenant) return;
        console.log("🎯 processPhonePePayment called with:", orderData);

        try {
            setLoading(true);
            setError("");

            // Use PhonePe integration
            await PhonePeIntegration.processPayment(
                orderData.student_payment_id || orderData.payment_id,
                orderData.amount,
                tenant,
                (result) => {
                    console.log("✅ Payment successful:", result);
                    toast.success("Payment completed successfully!");
                },
                (error) => {
                    console.error("❌ Payment failed:", error);
                    setError(error.message || "Payment failed");
                    toast.error("Payment failed: " + (error.message || "Unknown error"));
                }
            );

        } catch (error: any) {
            console.error("❌ Payment processing error:", error);
            setError(error.message || "Payment processing failed");
            toast.error("Payment failed: " + (error.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: PaymentData) => {
        console.log("🔥 FORM SUBMIT - Starting PhonePe payment process");
        console.log("📋 Form data:", data);

        // Validate prerequisite data
        if (!registrationData) {
            setError("Please enter a valid registration ID first");
            return;
        }

        // Determine fee type from registration status
        let feeType: 'REGISTRATION' | 'ADMISSION';
        let amountToPay: number;
        if (registrationData.status === 'REGISTRATION_PENDING') {
            feeType = 'REGISTRATION';
            amountToPay = 100; // Registration fee
        } else if (registrationData.status === 'PAYMENT_PENDING') {
            feeType = 'ADMISSION';
            amountToPay = 500; // Admission fee
        } else {
            setError("Payment is not allowed for current status: " + registrationData.status);
            return;
        }

        setLoading(true);
        setError("");

        try {
            console.log("🔥 Calling studentRegistrationPayment API...");

            const paymentData = {
                registration_id: registrationData.id,
                fee_type: feeType,
                amount: amountToPay,
                payment_mode: "UPI",
                student_details: {
                    name: data.studentName,
                    email: data.emailId,
                    mobile: data.mobileNumber || registrationData.mobile,
                    class_name: registrationData.class_name,
                    academic_year: registrationData.academic_year
                }
            };

            const orderResponse = await studentRegistrationPayment(paymentData);
            console.log("🎯 Order response:", orderResponse);

            if (orderResponse.status === 1) {
                // Process payment with PhonePe
                await processPhonePePayment({
                    ...orderResponse.data,
                    amount: amountToPay,
                    fee_type: feeType,
                    student_details: paymentData.student_details
                });
            } else {
                throw new Error(orderResponse.message || "Failed to create payment order");
            }

        } catch (err: any) {
            console.error("❌ Payment submission error:", err);
            setError(err.message || "Payment submission failed");
            toast.error("Payment failed: " + (err.message || "Payment submission failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <Image                            
                                src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/logo.svg`}
                                alt="ShikshaPrime Logo"
                                width={60}
                                height={60}
                                className="mr-4"
                            />
                            <h1 className="text-3xl font-bold text-gray-800">
                                Student Payment Portal
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            Secure payment processing powered by PhonePe
                        </p>
                    </div>

                    {/* Payment Form */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Registration ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Registration ID *
                                </label>
                                <Input
                                    type="text"
                                    {...register("registrationId")}
                                    placeholder="Enter your registration ID"
                                    className="w-full"
                                />
                                {errors.registrationId && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.registrationId.message}
                                    </p>
                                )}
                            </div>

                            {/* Auto-filled fields (shown when registration data is loaded) */}
                            {registrationData && (
                                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                        Student Details
                                    </h3>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Student Name *
                                            </label>
                                            <Input
                                                type="text"
                                                {...register("studentName")}
                                                className="w-full bg-white"
                                                readOnly
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <Input
                                                type="email"
                                                {...register("emailId")}
                                                className="w-full bg-white"
                                            />
                                            {errors.emailId && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {errors.emailId.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Amount */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-800 mb-2">
                                            Payment Amount
                                        </h4>
                                        <div className="text-2xl font-bold text-blue-600">
                                            ₹{selectedAmount}
                                        </div>
                                        <p className="text-sm text-blue-600 mt-1">
                                            {registrationData.status === 'REGISTRATION_PENDING' 
                                                ? 'Registration Fee' 
                                                : 'Admission Fee'
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Terms and Conditions */}
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    {...register("agreed")}
                                    className="mt-1"
                                    id="agreed"
                                />
                                <label htmlFor="agreed" className="text-sm text-gray-700">
                                    I agree to the terms and conditions and authorize the payment
                                </label>
                            </div>
                            {errors.agreed && (
                                <p className="text-red-500 text-sm">
                                    {errors.agreed.message}
                                </p>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading || !registrationData}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold text-lg shadow-lg transition-all duration-300"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <Loader />
                                        <span className="ml-2">Processing...</span>
                                    </div>
                                ) : (
                                    `Pay ₹${selectedAmount} with PhonePe`
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-sm text-green-700">
                                Secure payment processing with PhonePe
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StudentPaymentPage() {
    return (
        <Suspense fallback={<Loader />}>
            <StudentPaymentContent />
        </Suspense>
    );
}
