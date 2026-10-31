// importing the express framework into my file es module
import express from "express";

const app = express();

// asking express to build a global middleware for all incoming request
app.use(express());

// setting up a rout waiting for incoming http get request
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "Success", message: "URL shortener is running" });
});

export default app;
