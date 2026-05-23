import { Request, Response, NextFunction } from 'express';
import { OtpService } from '../services/otpService';
import axios from 'axios';

const otpService = new OtpService();

// Send OTP via SMS API
const sendSMSViaTEXTLOCAL = async (phoneNumber: string, otp: string): Promise<boolean> => {
    try {
        const digitsOnly = (phoneNumber || '').replace(/\D/g, '');
        const normalizedNumber = digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly;

        const message = `${otp} is the OTP (One Time Password) for ShikshaPrime (valid for 10 mins). Please do not share this with others. -ShikshaPrime (a RetechPrime initiative)`;

        const url = 'http://sms.designhost.in/api/mt/SendSMS';
        const params = new URLSearchParams();
        params.append('user', 'retechprime');
        params.append('password', '123456');
        params.append('senderid', 'RETECP');
        params.append('channel', 'Trans');
        params.append('DCS', '0');
        params.append('flashsms', '0');
        params.append('number', normalizedNumber);
        params.append('text', message);

        console.log(`📱 Sending SMS to ${normalizedNumber}`);

        const attempt = async () => axios.get(`${url}?${params.toString()}`, { timeout: 30000 });

        let response;
        try {
            response = await attempt();
        } catch (err: any) {
            if (['ECONNABORTED'].includes(err?.code) || /ETIMEDOUT|timeout/i.test(err?.message || '')) {
                console.warn('First SMS attempt timed out, retrying once...');
                response = await attempt();
            } else {
                throw err;
            }
        }

        console.log('SMS API Response:', response.data);
        return response.status === 200 && response.data?.ErrorCode === '000';
    } catch (error: any) {
        console.error('SMS sending error:', error?.message);
        return false;
    }
};

export const sendOTP = async (req, res, next: NextFunction) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ status: 0, data: null, message: 'Phone number is required' });
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ status: 0, data: null, message: 'Please enter a valid 10-digit mobile number' });
        }

        const { otp } = await otpService.sendOtp(phoneNumber, req.tenant);

        const smsSuccess = await sendSMSViaTEXTLOCAL(phoneNumber, otp);
        if (!smsSuccess) {
            console.warn(`🧪 Development OTP for ${phoneNumber}: ${otp}`);
        }

        res.status(200).json({
            status: 1,
            data: { phoneNumber, expiresIn: 600 },
            message: 'OTP sent successfully to your mobile number'
        });

    } catch (error) {
        next(error);
    }
};

export const verifyOTP = async (req, res, next: NextFunction) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ status: 0, data: null, message: 'Phone number and OTP are required' });
        }

        const result = await otpService.verifyOtp(phoneNumber, otp, req.tenant);

        if (!result.success) {
            return res.status(400).json({
                status: 0,
                data: { attemptsLeft: result.attemptsLeft },
                message: 'Invalid OTP. Please try again.'
            });
        }

        res.status(200).json({
            status: 1,
            data: { phoneNumber, verified: true },
            message: 'Phone number verified successfully'
        });

    } catch (error) {
        next(error);
    }
};

export const checkValidation = async (req, res, next: NextFunction) => {
    try {
        const { phone_number } = req.params;

        if (!phone_number) {
            return res.status(400).json({ status: 0, data: null, message: 'Phone number is required' });
        }

        const result = await otpService.checkValidation(phone_number as string, req.tenant);

        res.status(200).json({
            status: 1,
            data: result,
            message: 'Validation status fetched'
        });

    } catch (error) {
        next(error);
    }
};