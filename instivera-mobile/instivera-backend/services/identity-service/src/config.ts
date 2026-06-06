import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export const env = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

if (!process.env.JWT_SECRET) {
  throw new Error('[identity-service] JWT_SECRET env var is required');
}

export const config = {
  env,
  port: parseInt(process.env.SERVICE_PORT || '9050', 10),
  node_env: env,
  db: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT!,
    user: process.env.DB_USERNAME!,
    pass: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt_secret: process.env.JWT_SECRET,
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '60d',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.zeptomail.in',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    username: process.env.SMTP_USERNAME || 'emailapikey',
    password: process.env.SMTP_PASSWORD || '',
  },
  emailFrom: process.env.EMAIL_FROM || 'noreply@instivera.com',
};

export default config;
