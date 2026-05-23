import { config } from "./config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import otpRoutes from "./routes/otpRoutes";
import { pool } from "./db";
import { testConnection } from "./models";
import { errorHandler } from "./middleware/errorHandler";
import { pinoHttp } from "pino-http";
import logger from "./utils/logger";
import phonePeRoutes from "./routes/phonePeRoutes";
import institutionRoutes from "./routes/institutionRoutes";

import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { startNotificationAndPhonePeWorker, stopNotificationWorker } from "./workers/notificationWorker";
import { tenantMiddleware } from "./middleware/tenantMiddleware";
import { Sequelize } from "sequelize";
import { stopPhonePeSchedulers } from "./workers/phonepeCronEngine";

const app = express();

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use("/api/identity/institutions", institutionRoutes);
app.use(tenantMiddleware);
app.use("/api/identity", authRoutes);
app.use("/api/identity/otp", otpRoutes);
app.use("/api/identity/payments/phonepe", phonePeRoutes);
// Static files for generated PDFs
const filesDir = path.resolve(process.cwd(), "storage");
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}
app.use("/api/identity/files", express.static(filesDir));

app.get('/health', (req, res) => { res.status(200).send('Service is healthy'); });

// Register error handler 
app.use(errorHandler);

app.use(pinoHttp({ 
  logger, 
  genReqId: (req) => req.headers["x-correlation-id"] || uuidv4() 
}));

const tenantConnections: Record<string, Sequelize> = {};

export function getTenantSequelize(tenant: string): Sequelize {
  if (!tenantConnections[tenant]) {
    tenantConnections[tenant] = new Sequelize(
      `shikshaprime_${tenant}`, // tenant-specific database
      `shikshaprime_${tenant}`,
      config.db.pass,
      {
        host: config.db.host,
        port: Number(config.db.port),
        dialect: "mysql",
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      },      
    );
  }
  return tenantConnections[tenant];
}

async function start() {  
  try {
    await testConnection();
    const server = app.listen(config.port, () => {
      console.log(`Identity service running on port ${config.port} in ${process.env.NODE_ENV || config.env}`);
    });

    // start background worker for queued notifications (email/SMS)
    startNotificationAndPhonePeWorker();
    
    // graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`${signal} received, closing server`);
      server.close(async (err?: Error) => {
        if (err) {
          console.error("Error closing server:", err);
          process.exit(1);
        }
        try {
          stopNotificationWorker();
          stopPhonePeSchedulers();
          await pool.end();
          for (const conn of Object.values(tenantConnections)) {
            await conn.close();
          }
          console.log("All DB pools closed, exiting");
          process.exit(0);
        } catch (closeErr) {
          console.error("Error closing DB pool:", closeErr);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("Failed to start service — DB connection error:", err);
    process.exit(1);
  }
}

start();
