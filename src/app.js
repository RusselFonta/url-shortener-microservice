import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import urlroute from "./routes/urlroute.js";
import logger from "./config/logger.js";
import error_handle from "./controllers/error-handler.js";
import { pool } from "./config/db.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Load Swagger documentation using an absolute path
const swaggerDocument = YAML.load(resolve(__dirname, "../swagger.yaml"));

// Serve Swagger UI at both routes
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    logger.info("Health check endpoint accessed");

    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "Success",
      database: "connected",
      message: "URL shortener is running",
    });
  } catch (err) {
    logger.error(`Health check failed: ${err.message}`);

    return res.status(503).json({
      status: "failed",
      success: false,
      message: "The connection with the database failed",
    });
  }
});

// Mount URL routes
app.use("/", urlroute);

app.use(error_handle);

export default app;
