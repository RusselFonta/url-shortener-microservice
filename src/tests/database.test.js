import { pool } from "../server.js";
import assert from "node:assert";
import test from "node:test";

test(" Database Layer & Pool Integration Test Suite", async (dbTest) => {
  await dbTest.test(
    "Should successfully connect and execute a basic query",
    async () => {
      const client = await pool.connect();
      try {
        const result = await client.query("SELECT NOW() as current_time");
        assert.ok(
          result.rows.length > 0,
          "Database should return timestamp row",
        );
        assert.ok(
          result.rows[0].current_time,
          "Current time should be present",
        );
      } finally {
        client.release();
      }
    },
  );

  await dbTest.test(
    "Links table should enforce uniqueness on short_code",
    async () => {
      const client = await pool.connect();
      const testCode = "uniqueshort";
      const testUrl = "https://youtube.com";

      try {
        await client.query(
          "INSERT INTO links (short_code, original_url) VALUES ($1, $2) ON CONFLICT (short_code) DO NOTHING",
          [testCode, testUrl],
        );

        await assert.rejects(async () => {
          await client.query(
            "INSERT INTO links (short_code, original_url) VALUES ($1, $2)",
            [testCode, "https://github.com"],
          );
        }, "Database must reject duplicate short codes");
      } finally {
        // Cleanup test record
        await client.query("DELETE FROM links WHERE short_code = $1", [
          testCode,
        ]);
        client.release();
      }
    },
  );

  // 3. Test atomic click count incrementing
  await dbTest.test(
    "Click count column should increment atomically",
    async () => {
      const client = await pool.connect();
      const testCode = "clicktest";
      const testUrl = "https://github.com";

      try {
        // Insert setup link
        await client.query(
          "INSERT INTO links (short_code, original_url, click_count) VALUES ($1, $2, $3)",
          [testCode, testUrl, 0],
        );

        // Perform atomic increment
        const updateRes = await client.query(
          "UPDATE links SET click_count = click_count + 1 WHERE short_code = $1 RETURNING click_count",
          [testCode],
        );

        assert.strictEqual(
          Number(updateRes.rows[0].click_count),
          1,
          "Click count should increment to 1",
        );
      } finally {
        await client.query("DELETE FROM links WHERE short_code = $1", [
          testCode,
        ]);
        client.release();
      }
    },
  );
});
