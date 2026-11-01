import "dotenv/config";
import app from "./app.js";
import pkg from "pg";

const { Pool } = pkg;
const PORT = process.env.PORT || 3000;

// Export the pool so controllers can use it for queries and transactions
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Testing the connection to the postgreSQL database
pool
  .query("SELECT NOW()")
  .then(() => {
    console.log("A connection was established with the database");
  })
  .catch((err) => {
    console.error(
      "An error occurred during the connection process with the database",
      err.message,
    );
  });

// Starting the server
app.listen(PORT, () => {
  console.log(`The server is running on port http://localhost:${PORT}`);
});