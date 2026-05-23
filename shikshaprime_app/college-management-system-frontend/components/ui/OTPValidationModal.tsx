"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OTPValidationModalProps {
    show: boolean;
    onHide: () => void;
    phoneNumber: string;
    onVerificationSuccess: () => void;
    onSendOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
    onVerifyOTP: (phoneNumber: string, otp: string) => Promise<{ success: boolean; message: string }>;
}

export default function OTPValidationModal({ 
    show, 
    onHide, 
    phoneNumber, 
    onVerificationSuccess,
    onSendOTP,
    onVerifyOTP 
}: OTPValidationModalProps) {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Timer countdown for resend OTP
    useEffect(() => {
        if (show && resendTimer > 0) {
            const timer = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
    }, [show, resendTimer]);

    // Reset state when modal opens
    useEffect(() => {
        if (show) {
            setOtp('');
            setError('');
            setLoading(false);
            setResendTimer(60);
            setCanResend(false);
            setIsVerifying(false);
        }
    }, [show]);

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const result = await onVerifyOTP(phoneNumber, otp);
            if (result.success) {
                onVerificationSuccess();
                onHide();
            } else {
                setError(result.message || 'Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setError('');
        
        try {
            const result = await onSendOTP(phoneNumber);
            if (result.success) {
                setResendTimer(60);
                setCanResend(false);
                setOtp('');
            } else {
                setError(result.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(value);
        setError('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && otp.length === 6) {
            handleVerifyOTP();
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Verify Mobile Number</h2>
                    <button
                        onClick={onHide}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                        disabled={isVerifying}
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Info Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-blue-700 text-sm">
                            OTP sent to <strong>{phoneNumber}</strong>
                        </p>
                        <p className="text-blue-600 text-xs mt-1">
                            Please enter the 6-digit OTP to continue
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter OTP <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={handleOTPChange}
                            onKeyPress={handleKeyPress}
                            maxLength={6}
                            disabled={isVerifying}
                            className="otp-input-field"
                            style={{color: "#000000"}}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-3">
                        <Button 
                            onClick={handleVerifyOTP}
                            disabled={otp.length !== 6 || isVerifying}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {isVerifying ? 'Verifying...' : 'Verify OTP'}
                        </Button>

                        {/* Resend OTP */}
                        <div className="text-center">
                            {canResend ? (
                                <Button 
                                    variant="outline"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                    {loading ? 'Sending...' : 'Resend OTP'}
                                </Button>
                            ) : (
                                <p className="text-gray-500 text-sm">
                                    Resend OTP in {resendTimer}s
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}