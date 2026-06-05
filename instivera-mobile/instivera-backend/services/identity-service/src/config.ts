import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: process.env.PORT || 3001,
    node_env: process.env.NODE_ENV || 'development',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME || 'identity_service',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '60d', // 60 days
    },
    email: {
        service: process.env.EMAIL_SERVICE || 'zeptomail',
        host: process.env.EMAIL_HOST || 'smtp.zeptomail.in',
        port: Number(process.env.EMAIL_PORT) || 587,
        user: process.env.EMAIL_USER || 'emailapikey',
        pass: process.env.EMAIL_PASS || '',
        from: process.env.EMAIL_FROM || 'noreply@instivera.com',
    },
};

export default config;