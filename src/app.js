import express from "express";
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'path'
import urlroute from "./routes/urlroute.js"; 

const app = express();

app.use(express.json());
const swaggerDocument = YAML.load('./swagger.yaml')

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// mounting my url-route for
app.use("/", urlroute);

// Setting up a route waiting for incoming http get request
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "Success", message: "URL shortener is running" });
});

export default app;  