import express from 'express';
import cors from 'cors';
import { config } from './config';
import chatRoutes from './routes/chatRoutes';
import { tenantMiddleware } from './middleware/tenantMiddleware';
import { Sequelize } from 'sequelize';
import { pool } from './db';
import { testConnection } from './models';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';

const app = express();

function loadSwaggerDocument() {
  const candidatePaths = [
    path.join(__dirname, 'swagger', 'swagger.yaml'),
    path.join(process.cwd(), 'dist', 'swagger', 'swagger.yaml'),
    path.join(process.cwd(), 'public', 'swagger', 'swagger.yaml'),
  ];

  const swaggerPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!swaggerPath) {
    throw new Error(`Swagger spec not found. Checked: ${candidatePaths.join(', ')}`);
  }

  return YAML.load(swaggerPath);
}

const swaggerDocument = loadSwaggerDocument();
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/chat/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/chat/api-docs.json', (req, res) => {
  res.json(swaggerDocument);
});

app.use(tenantMiddleware);
app.set('trust proxy', 1);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    service: 'Chat Service', 
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShikshaPrime Chat Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/chat',
      documentation: '/api/chat/health'
    }
  });
});

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
        timezone: '+05:30', // IST timezone
      },      
    );
  }
  return tenantConnections[tenant];
}
async function start() {  
  try {
    await testConnection();
    const server = app.listen(config.port, () => {
      console.log(`Chat service running on port ${config.port} in ${process.env.NODE_ENV || config.env}`);
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
  } catch (err) {
    console.error("Failed to start service — DB connection error:", err);
    process.exit(1);
  }
}

start();
