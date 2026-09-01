import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const runtimeEnv = process.env.NODE_ENV || "development";
const envFile = path.resolve(process.cwd(), `.env.${runtimeEnv}`);
const defaultEnvFile = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else if (fs.existsSync(defaultEnvFile)) {
  dotenv.config({ path: defaultEnvFile });
}

export const appConfig = {
  env: runtimeEnv,
  port: Number(process.env.PORT || process.env.SERVICE_PORT || 4005),
  encryptionKey: process.env.APP_ENCRYPTION_KEY || "",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || "library_db",
    user: process.env.DB_USER || process.env.DB_USERNAME || "root",
    pass: process.env.DB_PASS || process.env.DB_PASSWORD || "",
  },
  redis: {
    url: process.env.REDIS_URL || "",
  },
};
