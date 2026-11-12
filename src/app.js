import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import urlroute from "./routes/urlroute.js";
import logger from "./config/logger.js";
import error_handle from "./controllers/error-handler.js";
import { pool } from "./config/db.js";

const app = express();

// Security Middleware
app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

const swaggerDocument = YAML.load("./swagger.yaml");

// Serve Swagger UI at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check route (Added 'async' so 'await' works correctly)
app.get("/health", async (req, res) => {
  try {
    logger.info("Health check endpoint accessed");
    await pool.query("SELECT 1");

    return res
      .status(200)
      .json({
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

// Mounting url-route
app.use("/", urlroute);

app.use(error_handle);

export default app;
