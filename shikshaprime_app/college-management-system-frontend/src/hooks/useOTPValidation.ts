import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/src/services/apiClient';

interface OTPState {
    isValidated: boolean;
    isLoading: boolean;
    error: string | null;
    phoneNumber: string;
}

export function useOTPValidation() {
    const [state, setState] = useState<OTPState>({
        isValidated: false,
        isLoading: false,
        error: null,
        phoneNumber: ''
    });

    const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null, phoneNumber }));
        
        try {
            const response = await apiClient.post('/identity/otp/send', {
                phoneNumber: phoneNumber
            });

            const result = response.data;
            
            if (result.status === 1) {
                setState(prev => ({ ...prev, isLoading: false }));
                return { success: true, message: 'OTP sent successfully' };
            } else {
                setState(prev => ({ ...prev, isLoading: false, error: result.message }));
                return { success: false, message: result.message || 'Failed to send OTP' };
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to send OTP';
            setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
            return { success: false, message: errorMessage };
        }
    };

    const verifyOTP = async (phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        try {
            const response = await apiClient.post('/identity/otp/verify', {
                phoneNumber: phoneNumber,
                otp: otp
            });

            const result = response.data;
            
            if (result.status === 1) {
                setState(prev => ({ 
                    ...prev, 
                    isValidated: true, 
                    isLoading: false, 
                    error: null 
                }));
                toast.success('Phone number verified successfully!');
                return { success: true, message: 'OTP verified successfully' };
            } else {
                setState(prev => ({ ...prev, isLoading: false, error: result.message }));
                return { success: false, message: result.message || 'Invalid OTP' };
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to verify OTP';
            setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
            return { success: false, message: errorMessage };
        }
    };

    const resetValidation = () => {
        setState({
            isValidated: false,
            isLoading: false,
            error: null,
            phoneNumber: ''
        });
    };

    return {
        ...state,
        sendOTP,
        verifyOTP,
        resetValidation
    };
}