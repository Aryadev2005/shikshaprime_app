import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  dbUrl: string;
  jwtSecret: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  dbUrl: process.env.DB_URL || 'mongodb://localhost:27017/assignment',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
};

export default config;