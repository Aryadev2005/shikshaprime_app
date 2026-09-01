import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { Op } from 'sequelize';
import { getTenantModels } from '../models';
import { tenantsService } from '@shared/tenants';

export class AuthService {
    async login(username: string, password: string, tenant: string) {
        // Find user by username or email, include tenant info
        const { User } = getTenantModels(tenant);
        const user = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email: username }]
            }
        });

        if (!user) {
            throw new AppError('Invalid username or password', 401);
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            throw new AppError('Invalid password', 401);
        }

        //await User.update({ last_login: })

        // Fetch tenant/institute info
        const institute = await tenantsService.getTenantByName(tenant);

        const payload = {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            email: user.email,
        };
        const token = generateToken(payload);

        return {
            token,
            user: {
                institute_code: institute.access_code || 'SKP001',
                user_type: user.role,
                role: user.role,
                user_code: user.user_id,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                email: user.email || '',
                phone: '',
                username: user.username || '',
                is_email_verified: user.email ? 1 : 0,
                is_phone_verified: 1,
                access_code: 'temp_access',
                institution: institute
            }
        };
    }

    async validateEmail(email: string, tenant: string) {
        const { User } = getTenantModels(tenant);
        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return { exists: false };
        }

        return {
            exists: true,
            user_id: user.user_id,
            first_name: user.first_name || '',
            last_name: user.last_name || ''
        };
    }

    async changePassword(email: string, newPassword: string, tenant: string) {
        const { User } = getTenantModels(tenant);
        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            throw new AppError('User with this email not found', 404);
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await User.update(
            { password_hash: hashedPassword },
            { where: { email } }
        );

        return { message: 'Password changed successfully' };
    }


}


