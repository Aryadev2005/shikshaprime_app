import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const env = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`[student-service] Loaded ${envFile}`);
} else {
  dotenv.config();
}

const config = {
  env,
  port: parseInt(process.env.SERVICE_PORT || '9051', 10),
  db: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT!,
    user: process.env.DB_USERNAME!,
    pass: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt_secret: process.env.JWT_SECRET || 'mivdjh32hjfdgppkmdu8',
};

export default config;
