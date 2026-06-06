import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const env = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
else dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('[gateway] JWT_SECRET env var is required');
}

const config = {
  env,
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET,
  logLevel: process.env.LOG_LEVEL || 'info',
  identityServiceUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:9050',
  studentServiceUrl:  process.env.STUDENT_SERVICE_URL  || 'http://localhost:9051',
  paymentServiceUrl:  process.env.PAYMENT_SERVICE_URL  || 'http://localhost:9053',
  feesServiceUrl:     process.env.FEES_SERVICE_URL     || 'http://localhost:9056',
  teacherServiceUrl:  process.env.TEACHER_SERVICE_URL  || 'http://localhost:9060',
  chatServiceUrl:     process.env.CHAT_SERVICE_URL     || 'http://localhost:9055',
  noticeServiceUrl:   process.env.NOTICE_SERVICE_URL   || 'http://localhost:9057',
};

export default config;
