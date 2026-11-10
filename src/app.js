import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import urlroute from "./routes/urlroute.js";
import logger from "./config/logger.js";
import error_handle from "./controllers/error-handler.js";

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

// Health check route
app.get("/health", (req, res) => {
  logger.info("Health check endpoint accessed");
  res
    .status(200)
    .json({ status: "Success", message: "URL shortener is running" });
});

// Mounting url-route
app.use("/", urlroute);

app.use(error_handle);

export default app;
