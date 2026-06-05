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

console.log('NODE_ENV=', process.env.NODE_ENV);
console.log('Using DB_HOST=', process.env.DB_HOST, 'DB_NAME=', process.env.DB_NAME);

export const config = {
  env,
  port: process.env.SERVICE_PORT || 9050,
  node_env: env,
  db: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT!,
    user: process.env.DB_USERNAME!,
    pass: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'mivdjh32hjfdgppkmdu8',
    expiresIn: process.env.JWT_EXPIRES_IN || '60d',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.zeptomail.in',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || 'emailapikey',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@instivera.com',
  },
};

export default config;
