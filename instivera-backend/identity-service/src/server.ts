import { config } from "./config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import otpRoutes from "./routes/otpRoutes";
import { pool } from "./db";
import { getMainModels, testConnection } from "./models";
import { errorHandler } from "./middleware/errorHandler";
import { pinoHttp } from "pino-http";
import logger from "./utils/logger";
import phonePeRoutes from "./routes/phonePeRoutes";
import razorpayRoutes from "./routes/razorpayRoutes";
import institutionRoutes from "./routes/institutionRoutes";

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { startNotificationAndPhonePeWorker, stopNotificationWorker } from "./workers/notificationWorker";
import { tenantMiddleware } from "./middleware/tenantMiddleware";
import { Sequelize } from "sequelize";
import { stopPhonePeSchedulers } from "./workers/phonepeCronEngine";


// N changes 20May2026
import rbacRoutes from "./routes/rbac.routes";
import classRoutineRoutes from "./routes/classRoutineRoutes";
import { tenantsService } from "@shared/tenants";

const app = express();
tenantsService.init(getMainModels());

function loadSwaggerDocument() {
  const candidatePaths = [
    path.join(__dirname, "swagger", "swagger.yaml"),
    path.join(process.cwd(), "dist", "swagger", "swagger.yaml"),
    path.join(process.cwd(), "public", "swagger", "swagger.yaml"),
  ];

  const swaggerPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!swaggerPath) {
    throw new Error(`Swagger spec not found. Checked: ${candidatePaths.join(", ")}`);
  }

  return YAML.load(swaggerPath);
}

const swaggerDocument = loadSwaggerDocument();
const persistentUploadPath = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "files");

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use("/api/identity/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api/identity/api-docs.json", (req, res) => {
  res.json(swaggerDocument);
});

app.use(tenantMiddleware);
app.use("/api/identity", authRoutes);

app.use("/api/identity/otp", otpRoutes);
app.use("/api/identity/payments/phonepe", phonePeRoutes);
app.use("/api/identity/institutions", institutionRoutes);

app.use("/api/identity/payments/razorpay", razorpayRoutes);
// Static files for generated PDFs
const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "files");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/api/identity/uploads/files", express.static(persistentUploadPath));

app.get('/health', (req, res) => { res.status(200).send('Service is healthy'); });

// N Changes 20 may 2026
app.use("/api/identity/rbac", rbacRoutes);
app.use("/api/identity/class-routines", classRoutineRoutes);

// Register error handler 
app.use(errorHandler);

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
        },
        dialectOptions: {
          connectTimeout: 60000
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
