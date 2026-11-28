import request from "supertest";
import { pool } from "../config/db.js";
import app from "../app.js";
import { test, after } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";

const createdShortCodes = [];

test("GET /:short_code redirection and telemetry test suite", async (t) => {
  let generatedShortCode;
  const testUrl = "https://github.com";

  // Create a valid link for redirection testing.
  await t.test("Setup: Create a link for redirection testing", async () => {
    const res = await request(app).post("/links").send({ target_url: testUrl });

    assert.strictEqual(res.statusCode, 201);

    generatedShortCode = res.body.data.short_code;
    createdShortCodes.push(generatedShortCode);

    assert.ok(generatedShortCode);
  });

  // Test successful redirection.
  await t.test(
    "Should successfully redirect with 302 and correct location header",
    async () => {
      const res = await request(app).get(`/${generatedShortCode}`).redirects(0);

      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res.headers.location, testUrl);
    },
  );

  // Test click count and telemetry.
  await t.test("Should increment click count upon redirection", async () => {
    await request(app).get(`/${generatedShortCode}`).redirects(0);

    const res = await request(app).get(`/links/${generatedShortCode}`);

    assert.strictEqual(res.statusCode, 200);

    assert.ok(
      Number(res.body.data.click_count) >= 2,
      "Click count should reflect multiple redirections",
    );
  });

  await t.test(
    "Should accurately record 10 concurrent redirects in click_count and click_log",
    async () => {
      const before = await pool.query(
        `SELECT
          l.id,
          l.click_count,
          (
            SELECT COUNT(*)
            FROM click_log c
            WHERE c.link_id = l.id
          ) AS log_count
        FROM links l
        WHERE l.short_code = $1`,
        [generatedShortCode],
      );

      assert.strictEqual(before.rowCount, 1);

      const initialClickCount = Number(before.rows[0].click_count);
      const initialLogCount = Number(before.rows[0].log_count);

      const concurrentRequests = 10;

      const responses = await Promise.all(
        Array.from({ length: concurrentRequests }, () =>
          request(app).get(`/${generatedShortCode}`).redirects(0),
        ),
      );

      for (const response of responses) {
        assert.strictEqual(response.statusCode, 302);
        assert.strictEqual(response.headers.location, testUrl);
      }

      const after = await pool.query(
        `SELECT
          l.click_count,
          (
            SELECT COUNT(*)
            FROM click_log c
            WHERE c.link_id = l.id
          ) AS log_count
        FROM links l
        WHERE l.short_code = $1`,
        [generatedShortCode],
      );

      assert.strictEqual(
        Number(after.rows[0].click_count) - initialClickCount,
        concurrentRequests,
        "All 10 redirects must increment click_count",
      );

      assert.strictEqual(
        Number(after.rows[0].log_count) - initialLogCount,
        concurrentRequests,
        "All 10 redirects must create click_log records",
      );
    },
  );

  // Security regression: SQL injection through Referer header.
  await t.test(
    "Should safely store an injection shaped Referer header verbatim",
    async () => {
      const maliciousReferer =
        "https://attacker.example/'; DROP TABLE links; --";

      const res = await request(app)
        .get(`/${generatedShortCode}`)
        .set("Referer", maliciousReferer)
        .redirects(0);

      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res.headers.location, testUrl);

      // Verify that the Referer was stored exactly as received.
      const logRes = await pool.query(
        `SELECT c.referrer
         FROM click_log c
         INNER JOIN links l ON c.link_id = l.id
         WHERE l.short_code = $1
         AND c.referrer = $2
         ORDER BY c.id DESC
         LIMIT 1`,
        [generatedShortCode, maliciousReferer],
      );

      assert.strictEqual(logRes.rowCount, 1);

      assert.strictEqual(
        logRes.rows[0].referrer,
        maliciousReferer,
        "Referer must be stored verbatim",
      );

      // Verify that the links table remains intact.
      const tableRes = await pool.query(
        "SELECT id FROM links WHERE short_code = $1",
        [generatedShortCode],
      );

      assert.strictEqual(
        tableRes.rowCount,
        1,
        "The links table must remain intact",
      );
    },
  );

  // Test expired link behavior.
  await t.test(
    "Should return 410 Gone when a short link has expired",
    async () => {
      const expiredShortCode = `exp${crypto.randomBytes(4).toString("hex")}`;

      await pool.query(
        `INSERT INTO links (
          target_url,
          short_code,
          click_count,
          is_active,
          expires_at,
          created_at
        )
        VALUES ($1, $2, 0, TRUE, NOW() - INTERVAL '1 hour', NOW())`,
        [testUrl, expiredShortCode],
      );

      createdShortCodes.push(expiredShortCode);

      const res = await request(app).get(`/${expiredShortCode}`).redirects(0);

      assert.strictEqual(res.statusCode, 410);
    },
  );

  // Test non-existent short codes.
  await t.test("Should return 404 for non-existent short codes", async () => {
    const res = await request(app).get("/dont_exist").redirects(0);

    assert.strictEqual(res.statusCode, 404);
    assert.ok(res.body.message);
  });
});

// Clean up test records and database connection.
after(async () => {
  try {
    if (createdShortCodes.length > 0) {
      await pool.query("DELETE FROM links WHERE short_code = ANY($1::text[])", [
        createdShortCodes,
      ]);
    }
  } finally {
    await pool.end();
  }
});
