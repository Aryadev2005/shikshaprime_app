import { config } from "./config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import departmentHierarchyRoutes from "./routes/departmentHierarchyRoutes";
import assignmentRoutes from "./routes/assignmentRoutes";
import learningMaterialRoutes from "./routes/learningMaterialRoutes";
import hierarchyRoutes from "./routes/hierarchyRoutes";
import sessionAttendanceRoutes from "./routes/sessionAttendanceRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { pool } from "./db";
import { testConnection } from "./models";
import { errorHandler } from "./middleware/errorHandler";
import path from "path";
import { Sequelize } from "sequelize";
import { tenantMiddleware } from "./middleware/tenantMiddleware";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import fs from "fs";

const app = express();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files BEFORE applying tenant middleware and error handlers
app.use("/api/student/uploads/files", express.static(persistentUploadPath));

app.use("/api/student/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api/student/api-docs.json", (req, res) => {
  res.json(swaggerDocument);
});

app.use(tenantMiddleware);

// REGISTER SPECIFIC ROUTES BEFORE GENERIC STUDENT ROUTES
// This prevents /api/student/:id from capturing specific paths like /api/student/hierarchy
app.use("/api/student/departments", departmentHierarchyRoutes);
app.use("/api/student/assignments", assignmentRoutes);
app.use("/api/student/learning-materials", learningMaterialRoutes);
app.use("/api/student/notifications", notificationRoutes);
app.use("/api/student/hierarchy", hierarchyRoutes);
app.use("/api/student/session-attendance", sessionAttendanceRoutes);

// Generic student routes (includes /:id) should be last
app.use("/api/student", authRoutes);

// Register error handler - should be last
app.use(errorHandler);

app.get('/health', (req, res) => { res.status(200).send('Service is healthy'); });

const tenantConnections: Record<string, Sequelize> = {};

export function getTenantSequelize(tenant: string): Sequelize {
  if (!tenantConnections[tenant]) {
    tenantConnections[tenant] = new Sequelize(
      `shikshaprime_${tenant}`,
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
