import "dotenv/config";
import app from "./app.js";
import pkg from "pg";

const { Pool } = pkg;
const PORT = process.env.PORT;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Testing the connection to the postgreSQL database
pool.connect((err, client, release) => {
  if (err) {
    console.log(
      "An error occurred during the connection process with the database",
      err.message,
    );
  } else {
    console.log("A connection was establish with the database");
  }
});

// starting the server
app.listen(PORT, () => {
  console.log(`the server is running on port http://localhost:${PORT}`);
});
