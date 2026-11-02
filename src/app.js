import express from "express";
import urlroute from "./routes/urlroute.js"; 

const app = express();

app.use(express.json());

app.use("/", urlroute);

// Setting up a route waiting for incoming http get request
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "Success", message: "URL shortener is running" });
});

export default app;