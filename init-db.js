
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pkg;

const isLocal = process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    target_url TEXT NOT NULL,
    short_code VARCHAR(16) UNIQUE NOT NULL,
    click_count BIGINT DEFAULT 0 NOT NULL CHECK (click_count >= 0),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'links'
        AND column_name = 'original_url'
    ) THEN
      ALTER TABLE links
      RENAME COLUMN original_url TO target_url;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'links'
        AND column_name = 'expired_at'
    ) THEN
      ALTER TABLE links
      RENAME COLUMN expired_at TO expires_at;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'links_click_count_nonnegative'
        AND conrelid = 'links'::regclass
    ) THEN
      ALTER TABLE links
      ADD CONSTRAINT links_click_count_nonnegative
      CHECK (click_count >= 0);
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS click_log (
    id BIGSERIAL PRIMARY KEY,
    link_id BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    referrer TEXT,
    user_agent TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_click_log_keyset
  ON click_log(clicked_at DESC, id DESC);

  CREATE INDEX IF NOT EXISTS idx_click_log_link_id
  ON click_log(link_id);

  CREATE INDEX IF NOT EXISTS idx_click_log_link_id_clicked
  ON click_log(link_id, clicked_at DESC, id DESC);

  -- Supports pagination ordered by id DESC for a specific link
  CREATE INDEX IF NOT EXISTS idx_click_log_link_id_id
  ON click_log(link_id, id DESC);
`;

async function initDB() {
  try {
    await client.connect();

    console.log("A successful connection was established with the database");

    await client.query(createTablesQuery);

    console.log("The required tables and migrations were applied successfully!");
  } catch (err) {
    console.error("Database initialization error:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

initDB();
