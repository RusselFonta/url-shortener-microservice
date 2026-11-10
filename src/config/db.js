import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

// Detect the environment to apply the ssl only when required
const isRender =
  process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost");

// Export the pool so controllers can use it for queries and transactions
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRender ? { rejectUnauthorized: false } : false,
});