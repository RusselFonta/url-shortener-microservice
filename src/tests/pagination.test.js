import request from "supertest";
import app from "../app.js";
import { test, after } from "node:test";
import assert from "node:assert";
import { pool } from "../config/db.js";

let shortCode;
let linkId;

const expectedClickIds = [];

test("GET /links/:short_code/clicks keyset pagination test suite", async (pageTest) => {
  const testUrl = "https://youtube.com";

  await pageTest.test("Setup: Create link and seed click logs", async () => {
    const createRes = await request(app)
      .post("/links")
      .send({ target_url: testUrl });

    assert.strictEqual(createRes.statusCode, 201);

    shortCode = createRes.body.data.short_code;
    linkId = createRes.body.data.id;

    assert.ok(shortCode);
    assert.ok(linkId);

    // Seed five click records.
    for (let i = 1; i <= 5; i++) {
      const result = await pool.query(
        `INSERT INTO click_log (link_id, referrer, user_agent)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [linkId, `https://ref-${i}.com`, `Agent-${i}`],
      );

      expectedClickIds.push(Number(result.rows[0].id));
    }
  });

  await pageTest.test(
    "Should retrieve first page with correct limit and next_cursor",
    async () => {
      const res = await request(app).get(`/links/${shortCode}/clicks?limit=2`);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.status, "success");
      assert.strictEqual(res.body.data.length, 2);
      assert.ok(res.body.pagination.next_cursor);
      assert.strictEqual(res.body.pagination.has_more, true);
    },
  );

  await pageTest.test(
    "Should retrieve the next page using the after cursor",
    async () => {
      const page1 = await request(app).get(
        `/links/${shortCode}/clicks?limit=2`,
      );

      const cursor = page1.body.pagination.next_cursor;

      const page2 = await request(app).get(
        `/links/${shortCode}/clicks?limit=2&after=${cursor}`,
      );

      assert.strictEqual(page2.statusCode, 200);
      assert.strictEqual(page2.body.data.length, 2);
    },
  );

  await pageTest.test(
    "Should return every click record exactly once and omit next_cursor on the final page",
    async () => {
      const retrievedIds = [];
      let cursor = null;
      let finalPage;

      while (true) {
        const url = cursor
          ? `/links/${shortCode}/clicks?limit=2&after=${cursor}`
          : `/links/${shortCode}/clicks?limit=2`;

        const res = await request(app).get(url);

        assert.strictEqual(res.statusCode, 200);

        for (const click of res.body.data) {
          retrievedIds.push(Number(click.id));
        }

        finalPage = res.body;

        if (!res.body.pagination.next_cursor) {
          break;
        }

        cursor = res.body.pagination.next_cursor;
      }

      // All five seeded records must be returned.
      assert.strictEqual(retrievedIds.length, expectedClickIds.length);

      // No records should be duplicated.
      assert.strictEqual(
        new Set(retrievedIds).size,
        retrievedIds.length,
        "Pagination must not return duplicate click records",
      );

      // No records should be skipped.
      assert.deepStrictEqual(
        [...retrievedIds].sort((a, b) => a - b),
        [...expectedClickIds].sort((a, b) => a - b),
      );

      // The final page must not have another cursor.
      assert.ok(
        !finalPage.pagination.next_cursor,
        "The final page must not return a next_cursor",
      );

      assert.strictEqual(finalPage.pagination.has_more, false);
    },
  );

  await pageTest.test(
    "Should reject invalid limit parameters with 400",
    async () => {
      for (const invalidLimit of ["abc", "0", "500"]) {
        const res = await request(app).get(
          `/links/${shortCode}/clicks?limit=${invalidLimit}`,
        );

        assert.strictEqual(
          res.statusCode,
          400,
          `Limit ${invalidLimit} should be rejected`,
        );
      }
    },
  );
});

// Clean up test records and database connection.
after(async () => {
  try {
    if (shortCode) {
      await pool.query("DELETE FROM links WHERE short_code = $1", [shortCode]);
    }
  } finally {
    await pool.end();
  }
});
