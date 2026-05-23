import { config } from "./config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import departmentHierarchyRoutes from "./routes/departmentHierarchyRoutes";
import assignmentRoutes from "./routes/assignmentRoutes";
import { pool } from "./db";
import { testConnection } from "./models";
import { errorHandler } from "./middleware/errorHandler";
import { pinoHttp } from "pino-http";
import logger from "./utils/logger";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { Sequelize } from "sequelize";
import { tenantMiddleware } from "./middleware/tenantMiddleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files BEFORE applying tenant middleware and error handlers
// This ensures /uploads requests are served without tenant/error handler interference
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers["x-correlation-id"] || uuidv4()
}));

app.use(tenantMiddleware);
app.use("/api/student", authRoutes);
app.use("/api/student/departments", departmentHierarchyRoutes);
app.use("/api/student/assignments", assignmentRoutes);

// Register error handler - should be last
app.use(errorHandler);

app.get('/health', (req, res) => { res.status(200).send('Service is healthy'); });

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
      console.log(`Student service running on port ${config.port} in ${process.env.NODE_ENV || config.env}`);
    });

    // Set server timeouts to handle long-running OCR requests (5+ minutes)
    server.timeout = 360000; // 6 minutes
    server.keepAliveTimeout = 360000; // 6 minutes
    server.headersTimeout = 370000; // 6 minutes 10 seconds

    // graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`${signal} received, closing server`);
      server.close(async (err?: Error) => {
        if (err) {
          console.error("Error closing server:", err);
          process.exit(1);
        }
        try {
          await pool.end();
          for (const conn of Object.values(tenantConnections)) {
            await conn.close();
          }
          console.log("DB pool closed, exiting");
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
