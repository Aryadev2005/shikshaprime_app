import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    public async register(req: Request, res: Response): Promise<void> {
        try {
            const userData = req.body;
            const result = await this.authService.register(userData);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }

    public async logout(req: Request, res: Response): Promise<void> {
        try {
            await this.authService.logout(req.user.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const authController = new AuthController();