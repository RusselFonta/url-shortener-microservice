import request from "supertest";
import { pool } from "../config/db.js";
import app from "../app.js";
import { test, after } from "node:test";
import assert from "node:assert";

test("GET /links/:short_code metadata endpoint testing", async (meta) => {
  let generatedShortCode;
  const testUrl = "https://youtube.com";

  await meta.test("creating a link for the metadata testing", async () => {
    const res = await request(app).post("/links").send({ target_url: testUrl });

    assert.strictEqual(res.statusCode, 201);
    generatedShortCode = res.body.data.short_code;
    assert.ok(generatedShortCode, "A short code was generated");
  });

  // testing if the metadata retrieval was done successfully
  await meta.test(
    "complete metadata retrieval and for short code to be valid (200)",
    async () => {
      const res = await request(app).get(`/links/${generatedShortCode}`);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.data.target_url, testUrl);
      assert.strictEqual(res.body.data.short_code, generatedShortCode);
      assert.strictEqual(typeof res.body.data.is_active, "boolean");
      assert.ok(
        typeof res.body.data.click_count === "number" ||
          typeof res.body.data.click_count === "string",
      );
    },
  );

  await meta.test(
    "Should return 404 for metadata non-existent short codes",
    async () => {
      const res = await request(app).get("/links/dont_exist");

      assert.strictEqual(res.statusCode, 404);
    },
  );
});

// cleaning the database connection pool to stop test hanging
after(async () => {
  await pool.end();
});
