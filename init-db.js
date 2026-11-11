import pkg from "pg";
import dotenv from "dotenv"

dotenv.config()
const {Client} = pkg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
    console.log("A successful coneection was established with render");
    await client.query(createTablesQuery);
    console.log("the required table are created with success!");
  } catch (err) {
    console.error("Error :", err.message);
  } finally {
    await client.end();
  }
}

initDB();
