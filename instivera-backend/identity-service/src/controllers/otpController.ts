import { Request, Response, NextFunction } from 'express';
import { OtpService } from '../services/otpService';
import axios from 'axios';

const otpService = new OtpService();

// ---------------------------------------------------------------------------
// Retry helper — exponential backoff: 1 s → 2 s → 4 s (up to maxAttempts)
// ---------------------------------------------------------------------------
async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    baseDelayMs = 1000
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxAttempts) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
                console.warn(`⚠️  SMS attempt ${attempt} failed. Retrying in ${delay}ms…`, (err as any)?.message);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

// ---------------------------------------------------------------------------
// Send OTP via SMS — wraps actual HTTP call with withRetry
// ---------------------------------------------------------------------------
const sendSMSViaTEXTLOCAL = async (phoneNumber: string, otp: string): Promise<boolean> => {
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

    try {
        const response = await withRetry(
            () => axios.get(`${url}?${params.toString()}`, { timeout: 30000 }),
            3,   // up to 3 attempts
            1000 // 1 s base delay → 1 s, 2 s, 4 s
        );
        console.log('SMS API Response:', response.data);
        return response.status === 200 && response.data?.ErrorCode === '000';
    } catch (error: any) {
        console.error('❌ SMS sending failed after all retries:', error?.message);
        return false;
    }
};

// ---------------------------------------------------------------------------
// POST /send-otp  (SMS)
// ---------------------------------------------------------------------------
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

        // Generate & save OTP (delivery_status = 'pending')
        const { otp } = await otpService.sendOtp(phoneNumber, req.tenant);

        // Attempt delivery (with automatic retries)
        const smsSuccess = await sendSMSViaTEXTLOCAL(phoneNumber, otp);

        // Record final delivery outcome in DB
        await otpService.updateSmsDeliveryStatus(
            phoneNumber,
            smsSuccess ? 'sent' : 'failed',
            req.tenant
        );

        if (!smsSuccess) {
            console.warn(`📋 Dev fallback OTP for ${phoneNumber}: ${otp}`);
            return res.status(503).json({
                status: 0,
                data: null,
                message: 'We had trouble delivering your OTP. Please try again in a moment.'
            });
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

// ---------------------------------------------------------------------------
// POST /verify-otp  (SMS)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /check-validation/:phone_number
// ---------------------------------------------------------------------------
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