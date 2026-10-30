import "dotenv/config";
import app from "./app.js";
import pkg from "pg";

const { Pool } = pkg;
const PORT = process.env.PORT;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Testing the connection to the postgreSQL database
// reserving a place for my server
pool
  .query("SELECT NOW()")
  .then(() => {
    console.log("A connection was establish with the database");
  })

  .catch((err) => {
    console.error(
      "An error occurred during the connection process with the database",
      err.message,
    );
  });

// starting the server
app.listen(PORT, () => {
  console.log(`the server is running on port http://localhost:${PORT}`);
});
