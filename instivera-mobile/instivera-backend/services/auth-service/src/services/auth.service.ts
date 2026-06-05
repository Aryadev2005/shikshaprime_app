import { Request, Response } from 'express';
import { User } from '../models/auth.model';
import { sendSuccess, sendError } from '../utils/response';
import { hashPassword, comparePassword } from '../utils/passwordUtils';

export class AuthService {
    async register(req: Request, res: Response) {
        try {
            const { username, password } = req.body;
            const hashedPassword = await hashPassword(password);
            const user = await User.create({ username, password: hashedPassword });
            sendSuccess(res, { user }, 'User registered successfully');
        } catch (error) {
            sendError(res, error.message);
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return sendError(res, 'User not found');
            }

            const isMatch = await comparePassword(password, user.password);
            if (!isMatch) {
                return sendError(res, 'Invalid credentials');
            }

            // Generate token logic here (e.g., JWT)
            const token = this.generateToken(user);
            sendSuccess(res, { token }, 'Login successful');
        } catch (error) {
            sendError(res, error.message);
        }
    }

    private generateToken(user: any) {
        // Implement token generation logic (e.g., JWT)
        return 'generated-token'; // Placeholder
    }
}