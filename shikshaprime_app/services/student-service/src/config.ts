import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Configuration module - loads environment variables
export const env = process.env.NODE_ENV || "development";
const envFile = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`Loaded env file ${envFile}`);
} else {
  dotenv.config();
}
console.log('NODE_ENV=', process.env.NODE_ENV);
console.log('Using DB_HOST=', process.env.DB_HOST, 'DB_PORT=', process.env.DB_PORT);
console.log('Using DB_USER=', process.env.DB_USERNAME ? '***' : '<missing>');
console.log('Using DB_PASS=', process.env.DB_PASSWORD ? '***' : '<missing>');
console.log('STUDENT_SERVICE_URL=', process.env.STUDENT_SERVICE_URL || '<not set>');
console.log('AIML_SERVICE_URL=', process.env.AIML_SERVICE_URL || '<not set>');
export const config = {
  env,
  port: process.env.SERVICE_PORT || 4000,
  db: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT!,
    user: process.env.DB_USERNAME!,
    pass: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt_secret: process.env.JWT_SECRET!,
  jwt_expires_in: process.env.JWT_EXPIRES_IN!,
  frontendUrl: process.env.FRONTEND_URL,
  identityServiceUrl: process.env.IDENTITY_SERVICE_URL,
  sms: {
    user: process.env.SMS_USER!,
    password: process.env.SMS_PASSWORD!,
    senderId: process.env.SMS_SENDER_ID!,
    peId: process.env.SMS_PEID!,
    templateId: process.env.SMS_DLT_TEMPLATE_ID!,
    channel: process.env.SMS_CHANNEL!,
    route: process.env.SMS_ROUTE!
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID!,
    keySecret: process.env.RAZORPAY_KEY_SECRET!,
    isTestMode: env !== 'production' // Use test credentials unless in production
  },
  smtp: {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!) || 587,
    username: process.env.SMTP_USERNAME!,
    password: process.env.SMTP_PASSWORD!
  },
  secretKey: process.env.SECRET_KEY!,
  studentServiceUrl: process.env.STUDENT_SERVICE_URL || 'http://localhost:9051',
  aimlServiceUrl: process.env.AIML_SERVICE_URL || 'http://localhost:8000'
};