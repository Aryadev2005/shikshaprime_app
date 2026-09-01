import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { OtpService } from '../services/otpService';
import { sendOtpEmail, sendOtpEmailForVerification } from '../utils/emailService';

const authService = new AuthService();
const otpService = new OtpService();

export const makeLogin = async (req, res, next: NextFunction) => {
    const { username, password } = req.body;
    try {
        const result = await authService.login(username, password, req.tenant);

        res.status(200).json({
            status: 1,
            data: result.user,
            token: result.token,
            message: 'Login Successful'
        });
    } catch (error) {
        next(error);
    }
};

export const validateEmail = async (req, res: Response, next: NextFunction) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ status: 0, message: 'Email is required' });
        }
        const result = await authService.validateEmail(email, req.tenant);
        res.status(200).json({
            status: 1,
            data: result,
            message: result.exists ? 'User found' : 'User not found'
        });
    } catch (error) {
        next(error);
    }
};

export const sendEmailOtp = async (req, res: Response, next: NextFunction) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ status: 0, message: 'Email is required' });
        }

        // Verify user exists
        const userResult = await authService.validateEmail(email, req.tenant);
        if (!userResult.exists) {
            return res.status(404).json({ status: 0, message: 'No user found with this email' });
        }

        // Generate & store OTP (delivery_status = 'pending')
        const { otp } = await otpService.sendEmailOtp(email, req.tenant);

        // Send OTP via email
        const name = `${userResult.first_name || ''} ${userResult.last_name || ''}`.trim();
        const emailSent = await sendOtpEmail(email, otp, name || 'User');

        // Record final delivery outcome in DB
        await otpService.updateEmailDeliveryStatus(email, emailSent ? 'sent' : 'failed', req.tenant);

        if (!emailSent) {
            console.warn(`📋 Dev fallback OTP for ${email}: ${otp}`);
            return res.status(503).json({
                status: 0,
                message: 'We had trouble delivering your OTP. Please try again in a moment.'
            });
        }

        res.status(200).json({
            status: 1,
            data: { email, expiresIn: 600 },
            message: 'OTP sent to your email address'
        });
    } catch (error) {
        next(error);
    }
};

export const userSendEmailOtp = async (req, res: Response, next: NextFunction) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ status: 0, message: 'Email is required' });
        }

        // Generate & store OTP (delivery_status = 'pending')
        const { otp } = await otpService.sendEmailOtp(email, req.tenant);
        const emailSent = await sendOtpEmailForVerification(email, otp);

        // Record final delivery outcome in DB
        await otpService.updateEmailDeliveryStatus(email, emailSent ? 'sent' : 'failed', req.tenant);

        if (!emailSent) {
            console.warn(`📋 Dev fallback OTP for ${email}: ${otp}`);
            return res.status(503).json({
                status: 0,
                message: 'We had trouble delivering your OTP. Please try again in a moment.'
            });
        }

        res.status(200).json({
            status: 1,
            data: { email, expiresIn: 600 },
            message: 'OTP sent to your email address'
        });

    } catch(error) {
        next(error);
    }
}
export const verifyEmailOtp = async (req, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) {
            return res.status(400).json({ status: 0, message: 'Email and OTP are required' });
        }

        const result = await otpService.verifyEmailOtp(email, otp, req.tenant);

        if (!result.success) {
            return res.status(400).json({
                status: 0,
                data: { attemptsLeft: result.attemptsLeft },
                message: 'Invalid OTP. Please try again.'
            });
        }

        res.status(200).json({
            status: 1,
            data: { email, verified: true },
            message: 'Email OTP verified successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res: Response, next: NextFunction) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
        // The route is `requireAuth`ed, so req.user is the caller's own token.
        const callerEmail = req.user?.email;
        if (!callerEmail) {
            return res.status(401).json({ status: 0, message: 'Authentication required' });
        }

        if (!newPassword) {
            return res.status(400).json({ status: 0, message: 'New password is required' });
        }
        if (!currentPassword) {
            return res.status(400).json({ status: 0, message: 'Current password is required' });
        }
        // A token is not authority to change *someone else's* password. An
        // omitted email defaults to the caller; a mismatched one is refused.
        if (email && String(email).toLowerCase() !== String(callerEmail).toLowerCase()) {
            return res.status(403).json({ status: 0, message: 'You can only change your own password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ status: 0, message: 'Password must be at least 6 characters' });
        }
        const result = await authService.changePassword(callerEmail, currentPassword, newPassword, req.tenant);
        res.status(200).json({
            status: 1,
            data: result,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};