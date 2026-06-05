import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  db: { host: string; username: string; password: string; database: string };
  jwtSecret: string;
  phonepe: {
    merchantId: string;
    saltKey: string;
    saltIndex: string;
    baseUrl: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '9053', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'payment_db',
  },
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID || '',
    saltKey: process.env.PHONEPE_SALT_KEY || '',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    baseUrl: process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  },
};

export default config;
// Named export so old scaffold references (config.PORT etc.) compile
export { config };
