import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const env = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

if (!process.env.JWT_SECRET) {
  throw new Error('[fees-service] JWT_SECRET env var is required');
}

const config = {
  env,
  port: parseInt(process.env.SERVICE_PORT || '9056', 10),
  db: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT!,
    user: process.env.DB_USERNAME!,
    pass: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt_secret: process.env.JWT_SECRET,
};

export default config;
