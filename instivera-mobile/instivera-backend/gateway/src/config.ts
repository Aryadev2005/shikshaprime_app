import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  logLevel: string;
  identityServiceUrl: string;
  studentServiceUrl: string;
  paymentServiceUrl: string;
  teacherServiceUrl: string;
  chatServiceUrl: string;
  feesServiceUrl: string;
  noticeServiceUrl: string;
}

const loadConfig = (): Config => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Please set it before starting the service.',
    );
  }

  return {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret,
    logLevel: process.env.LOG_LEVEL || 'info',
    identityServiceUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:9050',
    studentServiceUrl: process.env.STUDENT_SERVICE_URL || 'http://localhost:9051',
    paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:9053',
    teacherServiceUrl: process.env.TEACHER_SERVICE_URL || 'http://localhost:9060',
    chatServiceUrl: process.env.CHAT_SERVICE_URL || 'http://localhost:9055',
    feesServiceUrl: process.env.FEES_SERVICE_URL || 'http://localhost:9056',
    noticeServiceUrl: process.env.NOTICE_SERVICE_URL || 'http://localhost:9057',
  };
};

const config = loadConfig();

export default config;
