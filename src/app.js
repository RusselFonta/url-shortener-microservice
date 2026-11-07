import express from "express";
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import urlroute from "./routes/urlroute.js"; 
import logger from "./config/logger.js";

const app = express();

// Security Middleware
app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

const swaggerDocument = YAML.load('./swagger.yaml');

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mounting url-route
app.use("/", urlroute);

// Health check route
app.get("/health", (req, res) => {
  logger.info("Health check endpoint accessed");
  res
    .status(200)
    .json({ status: "Success", message: "URL shortener is running" });
});

export default app;