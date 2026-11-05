import pkg from "pg";
import dotenv from "dotenv"

dotenv.config()
const {Client} = pkg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const createTablesQuery = `
  DROP TABLE IF EXISTS click_log CASCADE;
DROP TABLE IF EXISTS links CASCADE;
CREATE TABLE links (
    id BIGSERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(16) UNIQUE NOT NULL,
    click_count BIGINT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE click_log (
    id  BIGSERIAL PRIMARY KEY,
    link_id BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    referrer TEXT,
    user_agent TEXT
);

-- Performing index 
-- index for fast short code lookup during redirection
CREATE INDEX idx_links_short_code ON links(short_code);

-- cursor based(keyset) optimization for pagination log
-- a method used  optimizaing database for large data procesing or moving throught large amount of data
CREATE INDEX idx_click_log_keyset ON click_log(clicked_at DESC, id DESC );

-- foreign key index to optimize the CASCADE  process when a user or link is delected 
-- indexing on the foriegn key that uses ON DELETE CASCADE or ON UPDATE CASCADE help to prevent most common cause of database lockup and severe performance drop
-- Hence by indexing on the foriegn key column in the child table , the database convert the slow full table scan into a lightning fast index seek

CREATE INDEX idx_click_log_link_id ON click_log(link_id);
`;

async function initDB() {
  try {
    await client.connect();
    console.log("A successful coneection was established with render");
    await client.query(createTablesQuery);
    console.log("the required table are created with success!");
  } catch (err) {
    console.error("Erreur :", err.mesage);
  } finally {
    await client.end();
  }
}

initDB();
