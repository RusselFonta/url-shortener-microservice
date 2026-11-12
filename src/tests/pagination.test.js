import request from "supertest";
import app from "../app.js";
import { test, after } from "node:test";
import assert from "node:assert";
import { pool } from "../config/db.js";

test("GET /links/:short_code/clicks keyset pagination test suite", async (pageTest) => {
  let shortCode;
  let linkId;
  const testUrl = "https://youtude.com";

  await pageTest.test("Setup: Create link and seed click logs", async () => {
    const createRes = await request(app)
      .post("/links")
      .send({ target_url: testUrl });

    assert.strictEqual(createRes.statusCode, 201);
    shortCode = createRes.body.data.short_code;
    linkId = createRes.body.data.id;

    // Seed multiple click logs directly for reliable cursor testing
    for (let i = 1; i <= 5; i++) {
      await pool.query(
        "INSERT INTO click_log (link_id, referrer, user_agent) VALUES ($1, $2, $3)",
        [linkId, `https://ref-${i}.com`, `Agent-${i}`],
      );
    }
  });

  // 2. Test fetching the first page with a limit
  await pageTest.test(
    "Should retrieve first page of clicks with correct limit and next_cursor",
    async () => {
      const res = await request(app).get(`/links/${shortCode}/clicks?limit=2`);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.status, "success");
      assert.strictEqual(
        res.body.data.length,
        2,
        "Should respect pagination limit of 2",
      );
      assert.ok(
        res.body.pagination.next_cursor,
        "Should provide a next_cursor for subsequent requests",
      );
      assert.strictEqual(res.body.pagination.has_more, true);
    },
  );

  // 3. Test fetching subquence pages using after
  await pageTest.test(
    "Should retrieve next page using after cursor parameter",
    async () => {
      // First, fetch page 1 to grab the cursor
      const page1 = await request(app).get(
        `/links/${shortCode}/clicks?limit=2`,
      );
      const cursor = page1.body.pagination.next_cursor;

      // Fetch page 2 using the cursor
      const page2 = await request(app).get(
        `/links/${shortCode}/clicks?limit=2&after=${cursor}`,
      );

      assert.strictEqual(page2.statusCode, 200);
      assert.ok(page2.body.data.length > 0, "Should return subsequent records");
    },
  );

  // 4. Test invalid parameters handling
  await pageTest.test(
    "Should reject invalid limit parameters with 400",
    async () => {
      const res = await request(app).get(
        `/links/${shortCode}/clicks?limit=500`,
      );
      assert.strictEqual(res.statusCode, 400);
    },
  );
});

// Clean up database connection pool so tests don't hang
after(async () => {
  await pool.end();
});
