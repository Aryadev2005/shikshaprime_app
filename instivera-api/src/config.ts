import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const env = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
else dotenv.config();

const config = {
  env,
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:8081').split(','),
  db: {
    host: process.env.DB_HOST || '69.62.84.110',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'shikshaprime_main',
    user: process.env.DB_USERNAME || 'root',
    pass: process.env.DB_PASSWORD || '',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.zeptomail.in',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@instivera.com',
  },
  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID || '',
    saltKey: process.env.PHONEPE_SALT_KEY || '',
    saltIndex: parseInt(process.env.PHONEPE_SALT_INDEX || '1', 10),
    baseUrl: process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes',
  },
};

export default config;
