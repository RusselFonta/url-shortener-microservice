import "dotenv/config";
import app from "./app.js";
import { pool } from "./config/db.js";

const PORT = process.env.PORT || 3000;

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
