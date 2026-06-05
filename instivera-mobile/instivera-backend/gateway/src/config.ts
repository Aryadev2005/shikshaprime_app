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

const env = process.env as Record<string, string | undefined>;

const loadConfig = (): Config => {
  const jwtSecret = env['JWT_SECRET'];
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Please set it before starting the service.',
    );
  }

  return {
    port: parseInt(env['PORT'] || '4000', 10),
    nodeEnv: env['NODE_ENV'] || 'development',
    jwtSecret,
    logLevel: env['LOG_LEVEL'] || 'info',
    identityServiceUrl: env['IDENTITY_SERVICE_URL'] || 'http://localhost:9050',
    studentServiceUrl: env['STUDENT_SERVICE_URL'] || 'http://localhost:9051',
    paymentServiceUrl: env['PAYMENT_SERVICE_URL'] || 'http://localhost:9053',
    teacherServiceUrl: env['TEACHER_SERVICE_URL'] || 'http://localhost:9060',
    chatServiceUrl: env['CHAT_SERVICE_URL'] || 'http://localhost:9055',
    feesServiceUrl: env['FEES_SERVICE_URL'] || 'http://localhost:9056',
    noticeServiceUrl: env['NOTICE_SERVICE_URL'] || 'http://localhost:9057',
  };
};

const config = loadConfig();

export default config;
