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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/compliance/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api/compliance/api-docs.json", (req, res) => {
  res.json(swaggerDocument);
});

app.use(tenantMiddleware);

app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
});

app.get("/", (req, res) => {
      res.json({
            status: "success",
            message: "Compliance management Service is running",
            data: {
                  service: "compliance-service",
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
        }
      },      
    );
  }
  return tenantConnections[tenant];
}

const startServer = async () => {
  try {
    await testConnection();
    const server = app.listen(config.port, () => {
      console.log(`Compliance service running on port ${config.port} in ${process.env.NODE_ENV || config.env}`);
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
