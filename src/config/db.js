import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

const isTest = process.env.NODE_ENV === "test";

const databaseUrl = isTest
  ? process.env.DATABASE_URL_TEST
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    isTest
      ? "DATABASE_URL_TEST is required when running tests."
      : "DATABASE_URL is required.",
  );
}

// Never allow automated tests to connect to the production database.
if (
  isTest &&
  process.env.DATABASE_URL &&
  databaseUrl === process.env.DATABASE_URL
) {
  throw new Error("Tests cannot use the production DATABASE_URL.");
}

const parsedUrl = new URL(databaseUrl);
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
