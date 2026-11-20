
import "dotenv/config";
import pkg from "pg";

const { Client } = pkg;

const isTest = process.env.NODE_ENV === "test";
const databaseUrl = isTest
  ? process.env.DATABASE_URL_TEST
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    isTest
      ? "DATABASE_URL_TEST is required."
      : "DATABASE_URL is required.",
  );
}

const parsedUrl = new URL(databaseUrl);
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(
  parsedUrl.hostname,
);

const client = new Client({
  connectionString: databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const sampleLinks = [
  {
    code: "github",
    target_url: "https://github.com",
  },
  {
    code: "google",
    target_url: "https://google.com",
  },
  {
    code: "youtube",
    target_url: "https://youtube.com",
  },
];

async function seedDatabase() {
  try {
    await client.connect();

    await client.query("BEGIN");

    for (const link of sampleLinks) {
      const result = await client.query(
        `INSERT INTO links (short_code, target_url)
         VALUES ($1, $2)
         ON CONFLICT (short_code) DO NOTHING
         RETURNING id`,
        [link.code, link.target_url],
      );

      // Skip click records if this sample link already exists.
      if (result.rowCount === 0) continue;

      const linkId = result.rows[0].id;

      for (let i = 1; i <= 3; i++) {
        await client.query(
          `INSERT INTO click_log (link_id, referrer, user_agent)
           VALUES ($1, $2, $3)`,
          [
            linkId,
            "https://example.com",
            `Sample Browser ${i}`,
          ],
        );
      }
    }

    await client.query("COMMIT");

    console.log("Sample data inserted successfully.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Database seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

seedDatabase();
