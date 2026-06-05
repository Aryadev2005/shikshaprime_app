import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${nodeEnv}`);
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const env = process.env as Record<string, string | undefined>;

const jwtSecretStr = env['JWT_SECRET'] || '';
if (!jwtSecretStr) {
  throw new Error('JWT_SECRET environment variable is required.');
}

const config = {
  port: parseInt(env['PORT'] || '4000', 10),
  nodeEnv,
  // kept for auth-middleware compatibility
  jwtSecret: jwtSecretStr,
  logLevel: env['LOG_LEVEL'] || 'info',
  // DB connection — used by gateway/src/db.ts
  db: {
    host: env['DB_HOST'] || '69.62.84.110',
    port: parseInt(env['DB_PORT'] || '3306', 10),
    user: env['DB_USERNAME'] || 'shikshaprime_main',
    pass: env['DB_PASSWORD'] || '',
    name: env['DB_NAME'] || 'shikshaprime_main',
  },
  // JWT settings used by new auth/JWT utils
  jwt: {
    secret: jwtSecretStr,
    expiresIn: env['JWT_EXPIRES_IN'] || '60d',
  },
  // Email settings for OTP
  email: {
    host: env['EMAIL_HOST'] || 'smtp.zeptomail.in',
    port: parseInt(env['EMAIL_PORT'] || '587', 10),
    user: env['EMAIL_USER'] || 'emailapikey',
    pass: env['EMAIL_PASS'] || '',
    from: env['EMAIL_FROM'] || 'noreply@instivera.com',
  },
  // Upstream URLs — used only by registration.service.ts (proxy to ShikshaPrime)
  identityServiceUrl: env['IDENTITY_SERVICE_URL'] || 'http://localhost:9050',
  studentServiceUrl: env['STUDENT_SERVICE_URL'] || 'http://localhost:9051',
  paymentServiceUrl: env['PAYMENT_SERVICE_URL'] || 'http://localhost:9053',
  teacherServiceUrl: env['TEACHER_SERVICE_URL'] || 'http://localhost:9060',
  chatServiceUrl: env['CHAT_SERVICE_URL'] || 'http://localhost:9055',
  feesServiceUrl: env['FEES_SERVICE_URL'] || 'http://localhost:9056',
  noticeServiceUrl: env['NOTICE_SERVICE_URL'] || 'http://localhost:9057',
  // PhonePe
  phonepe: {
    merchantId: env['PHONEPE_MERCHANT_ID'] || '',
    saltKey: env['PHONEPE_SALT_KEY'] || '',
    saltIndex: env['PHONEPE_SALT_INDEX'] || '1',
    baseUrl: env['PHONEPE_BASE_URL'] || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  },
};

export default config;
