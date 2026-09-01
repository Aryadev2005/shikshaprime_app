import express from "express";
import cors from "cors";
import { config } from "./config";
import { testConnection } from "./models";
import { errorHandler } from "./middleware/errorHandler";
import { Sequelize } from "sequelize";
import { pool } from "./db";
import { tenantMiddleware } from "./middleware/tenantMiddleware";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import fs from "fs";
import socialAccountRoutes from "./routes/socialAccountRoutes";
import socialPostRoutes from "./routes/socialPostRoutes";
import socialAnalyticsRoutes from "./routes/socialAnalyticsRoutes";
import mediaLibraryRoutes from "./routes/mediaLibraryRoutes";
import socialWebhookRoutes from "./routes/socialWebhookRoutes";
import { initScheduleWorker } from "./workers/scheduleWorker";
import { initAnalyticsWorker } from "./workers/analyticsWorker";

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

app.use("/api/socialmedia/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api/socialmedia/api-docs.json", (req, res) => {
  res.json(swaggerDocument);
});

app.use(tenantMiddleware);

// Serve static files (like uploaded images)
app.use("/api/socialmedia/uploads/files", express.static(persistentUploadPath));

app.use("/api/socialmedia/accounts", socialAccountRoutes);
app.use("/api/socialmedia/posts", socialPostRoutes);
app.use("/api/socialmedia/analytics", socialAnalyticsRoutes);
app.use("/api/socialmedia/library", mediaLibraryRoutes);
app.use("/api/socialmedia/webhooks", socialWebhookRoutes);

app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
});

app.get("/", (req, res) => {
      res.json({
            status: "success",
            message: "Social media Service is running",
            data: {
                  service: "social-media-service",
                  version: "1.0.0",
                  port: config.port,
            },
      });
});

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

const startServer = async () => {
  try {
    await testConnection();
    initScheduleWorker();
    initAnalyticsWorker();
    const server = app.listen(config.port, () => {
      console.log(`Social media service running on port ${config.port} in ${process.env.NODE_ENV || config.env}`);
    });
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
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
export default app;
