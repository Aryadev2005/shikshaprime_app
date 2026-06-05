import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  db: {
    host: string;
    username: string;
    password: string;
    database: string;
  };
  jwtSecret: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '9051', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shikshaprime_main',
  },
  jwtSecret: process.env.JWT_SECRET || 'student_service_secret',
};

export default config;