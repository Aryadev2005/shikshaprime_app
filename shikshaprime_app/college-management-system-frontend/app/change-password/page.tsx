"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { validateUserEmail, changePassword, sendEmailOtp, verifyEmailOtp } from "@/src/services/authService";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/src/lib/utils";

export const changePasswordSchema = z
    .object({
        email: z.string().min(1, "Email is required").email("Invalid email format"),
        newPassword: z
            .string()
            .min(1, "New password is required")
            .min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePassword() {
    const router = useRouter();
    const Req = () => (
        <span className="required" style={{ color: "red", marginLeft: "4px" }}>
            *
        </span>
    );

    // Email validation state
    const [emailValidated, setEmailValidated] = useState(false);
    const [emailValidating, setEmailValidating] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [validatedName, setValidatedName] = useState("");

    // OTP state
    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [otpError, setOtpError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    // Form submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [submitError, setSubmitError] = useState("");

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordForm>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            email: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const emailValue = watch("email");

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleValidateEmail = async () => {
        if (!emailValue || !emailValue.includes("@")) {
            setEmailError("Please enter a valid email address");
            setEmailValidated(false);
            return;
        }

        setEmailValidating(true);
        setEmailError("");
        setEmailValidated(false);
        setValidatedName("");
        setOtpSent(false);
        setOtpVerified(false);
        setOtpValue("");
        setOtpError("");

        try {
            const result = await validateUserEmail(emailValue);
            if (result.data?.exists) {
                setEmailValidated(true);
                setValidatedName(
                    `${result.data.first_name || ""} ${result.data.last_name || ""}`.trim()
                );
                setEmailError("");

                // Automatically send OTP after email validation
                await handleSendOtp();
            } else {
                setEmailValidated(false);
                setEmailError("No user found with this email address");
            }
        } catch (err: any) {
            setEmailValidated(false);
            setEmailError(err.message || "Failed to validate email");
        } finally {
            setEmailValidating(false);
        }
    };

    const handleSendOtp = async () => {
        setOtpSending(true);
        setOtpError("");

        try {
            await sendEmailOtp(emailValue);
            setOtpSent(true);
            setResendCooldown(60);
            setOtpValue("");
        } catch (err: any) {
            setOtpError(err?.response?.data?.message || err.message || "Failed to send OTP");
        } finally {
            setOtpSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpValue || otpValue.length !== 6) {
            setOtpError("Please enter a valid 6-digit OTP");
            return;
        }

        setOtpVerifying(true);
        setOtpError("");

        try {
            const result = await verifyEmailOtp(emailValue, otpValue);
            if (result.status === 1) {
                setOtpVerified(true);
                setOtpError("");
            } else {
                setOtpError(result.message || "Invalid OTP");
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err.message || "OTP verification failed";
            setOtpError(msg);
        } finally {
            setOtpVerifying(false);
        }
    };

    const onSubmit = async (data: ChangePasswordForm) => {
        if (!emailValidated) {
            setSubmitError("Please validate your email first");
            return;
        }

        if (!otpVerified) {
            setSubmitError("Please verify the OTP sent to your email");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");
        setSuccessMessage("");

        try {
            await changePassword(data.email, data.newPassword);
            setSuccessMessage("Password changed successfully! Redirecting to login...");
            reset();
            setEmailValidated(false);
            setValidatedName("");
            setOtpSent(false);
            setOtpVerified(false);
            setOtpValue("");

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                router.push("/auth/login");
            }, 2000);
        } catch (err: any) {
            setSubmitError(err.message || "Failed to change password");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-0 md:p-0 transition-all duration-300">
            {isSubmitting && <Loader />}
            <div className="form-card bg-white p-8 rounded-xl shadow-lg mx-auto border border-gray-100" style={{ maxWidth: "600px" }}>
                <div className="mb-8 text-center">
                    <h3 className="text-xl font-bold text-[var(--text-dark)]">Change Password</h3>
                    <p className="text-gray-500 font-medium">Verify your email, confirm OTP, and set a new password</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-6">
                        {/* Step 1: Email field with Validate button */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                                Email <Req />
                            </Label>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="h-12 pr-10 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                        disabled={otpVerified}
                                        {...register("email", {
                                            onChange: () => {
                                                setEmailValidated(false);
                                                setEmailError("");
                                                setValidatedName("");
                                                setOtpSent(false);
                                                setOtpVerified(false);
                                                setOtpValue("");
                                                setOtpError("");
                                            },
                                        })}
                                    />
                                    {/* Status icon inside input */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {emailValidated && (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        )}
                                        {emailError && !emailValidating && (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleValidateEmail}
                                    disabled={emailValidating || otpSending || !emailValue || otpVerified}
                                    className={cn(
                                        "h-12 px-6 font-semibold transition-colors rounded-lg",
                                        emailValidated ? "bg-green-500 hover:bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                                    )}
                                >
                                    {emailValidating || otpSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : emailValidated ? (
                                        "Verified ✓"
                                    ) : (
                                        "Validate"
                                    )}
                                </Button>
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-xs font-medium">
                                    {errors.email.message}
                                </p>
                            )}
                            {emailError && (
                                <p className="text-red-500 text-xs font-medium">{emailError}</p>
                            )}
                            {validatedName && (
                                <p className="text-green-600 text-xs font-medium">
                                    User found: {validatedName}
                                </p>
                            )}
                        </div>

                        {/* Step 2: OTP Verification */}
                        {otpSent && !otpVerified && (
                            <div className="space-y-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-2 text-blue-700 mb-1">
                                    <Mail className="h-4 w-4" />
                                    <span className="text-sm font-semibold">OTP sent to your email</span>
                                </div>
                                <Label className="text-sm font-semibold text-gray-700">
                                    Enter 6-digit OTP <Req />
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="______"
                                        value={otpValue}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                            setOtpValue(val);
                                            setOtpError("");
                                        }}
                                        className="h-12 text-center text-xl tracking-[0.5em] font-mono border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleVerifyOtp}
                                        disabled={otpVerifying || otpValue.length !== 6}
                                        className="h-12 px-6 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                    >
                                        {otpVerifying ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "Verify"
                                        )}
                                    </Button>
                                </div>
                                {otpError && (
                                    <p className="text-red-500 text-xs font-medium">{otpError}</p>
                                )}
                                <div className="flex items-center justify-between">
                                    <p className="text-gray-500 text-xs">
                                        Didn&apos;t receive the OTP?
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSendOtp}
                                        disabled={resendCooldown > 0 || otpSending}
                                        className="text-blue-600 hover:text-blue-700 text-xs font-semibold h-auto p-0"
                                    >
                                        {otpSending ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : null}
                                        {resendCooldown > 0
                                            ? `Resend in ${resendCooldown}s`
                                            : "Resend OTP"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* OTP Verified badge */}
                        {otpVerified && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700">
                                <ShieldCheck className="h-5 w-5" />
                                <span className="text-sm font-semibold">Email OTP verified successfully</span>
                            </div>
                        )}

                        {/* Step 3: New Password */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                                New Password <Req />
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-12 pr-12 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
                                    disabled={!otpVerified}
                                    {...register("newPassword")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    disabled={!otpVerified}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="text-red-500 text-xs font-medium">
                                    {errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                                Confirm New Password <Req />
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-12 pr-12 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
                                    disabled={!otpVerified}
                                    {...register("confirmPassword")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    disabled={!otpVerified}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs font-medium">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="h-12 mt-4 font-bold text-lg shadow-md hover:shadow-lg transition-all"
                            disabled={!otpVerified || isSubmitting}
                        >
                            {isSubmitting ? "Changing Password..." : "Update Password"}
                        </Button>

                        {successMessage && (
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-center font-medium">
                                {successMessage}
                            </div>
                        )}
                        {submitError && (
                            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-center font-medium">
                                {submitError}
                            </div>
                        )}
                    </div>
                </form>
            </div>

        </div>
    );
}