import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Client } = pkg;

// Automatically detect local/CI environments to toggle SSL
const isLocal = process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

const createTablesQuery = `
CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    target_url TEXT NOT NULL,
    short_code VARCHAR(16) UNIQUE NOT NULL,
    click_count BIGINT DEFAULT 0 NOT NULL CHECK (click_count >= 0),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS click_log (
    id BIGSERIAL PRIMARY KEY,
    link_id BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    referrer TEXT,
    user_agent TEXT
);

-- Indexes (PostgreSQL ignores these if they already exist)
CREATE INDEX IF NOT EXISTS idx_click_log_keyset ON click_log(clicked_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_click_log_link_id ON click_log(link_id);
CREATE INDEX IF NOT EXISTS idx_click_log_link_id_clicked ON click_log(link_id, clicked_at DESC, id DESC);
`;

async function initDB() {
  try {
    await client.connect();
    console.log("A successful connection was established with the database");
    await client.query(createTablesQuery);
    console.log("The required tables are created with success!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

initDB();