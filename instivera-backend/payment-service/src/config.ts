import dotenv from "dotenv";
import path from "path";
import fs from "fs";

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
console.log('Using DB_NAME=', process.env.DB_NAME);

export const config = {
  env,
  port: process.env.SERVICE_PORT || 9053,
  db: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT!,
    user: process.env.DB_USERNAME!,
    pass: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt_secret: process.env.JWT_SECRET!,
  identityServiceUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:9050/api/identity',
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    username: process.env.SMTP_USERNAME || "",
    password: process.env.SMTP_PASSWORD || "",
    fromEmail: process.env.SMTP_FROM_EMAIL,
    fromName: process.env.SMTP_FROM_NAME,
    secure: process.env.SMTP_SECURE === "true"
  },
};
