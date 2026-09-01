import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// import swaggerUi from "swagger-ui-express";
import libraryRoutes from "./routes/libraryRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { testConnection } from "./models";
import { appConfig } from "./config/appConfig";
import { logger } from "./logs/logger";
import { kohaSettingsService } from "./services/kohaSettingsService";
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
    path.join(process.cwd(), "public", "swagger", "swagger.yaml")    
  ];

  const swaggerPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!swaggerPath) {
    throw new Error(`Swagger spec not found. Checked: ${candidatePaths.join(", ")}`);
  }

  return YAML.load(swaggerPath);
}

const swaggerDocument = loadSwaggerDocument();

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());

app.use("/api/library/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api/library/api-docs.json", (_req, res) => res.json(swaggerDocument));

app.use(tenantMiddleware);
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use("/api/library", libraryRoutes);
app.get("/", (_req, res) => res.json({ success: true, message: "ok", data: {} }));
app.get("/health", (_req, res) =>
  res.json({
    success: true,
    message: "Library management service healthy",
    data: { env: appConfig.env, port: appConfig.port },
  })
);
app.use(errorHandler);

async function startServer() {
  try {
    await testConnection();
    await kohaSettingsService.refresh();
    app.listen(appConfig.port, () => {
      logger.info(
        { env: appConfig.env, port: appConfig.port, dbHost: appConfig.db.host },
        "Library management service started"
      );
    });
  } catch (error: any) {
    logger.error({ err: error?.message || error }, "Failed to start server");
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") startServer();

export default app;
