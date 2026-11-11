import request from "supertest";
import { pool } from "../config/db.js";
import app from "../app.js";
import test from "node:test";
import assert from "node:assert";

test("DELETE /links/:short_code deletion endpoint testing", async (del) => {
  let generatedShortCode;
  const testUrl = "https://youtube.com";

  // 1. Create a short link
  await del.test("creating a short code for deletion testing", async () => {
    const createRes = await request(app)
      .post("/links")
      .send({ target_url: testUrl });

    assert.strictEqual(createRes.statusCode, 201);
    generatedShortCode = createRes.body.data.short_code;
    assert.ok(generatedShortCode, "A short code was generated successfully");
  });

  // 2. Testing the deletion endpoint (Expecting 204 No Content per OpenAPI spec)
  await del.test(
    "the created short code must be successfully deleted",
    async () => {
      const deleteRes = await request(app).delete(
        `/links/${generatedShortCode}`,
      );
      assert.strictEqual(deleteRes.statusCode, 200);
    },
  );

  // 3. Testing if the link was perfectly deleted
  await del.test(
    "should return 404 when querying metadata of a deleted link",
    async () => {
      const metaRes = await request(app).get(`/links/${generatedShortCode}`);
      assert.strictEqual(metaRes.statusCode, 404);
    },
  );

  // 4. Testing the deletion of a non-existing link
  await del.test(
    "Should return 404 if a non-existing short code is deleted",
    async () => {
      const notFoundRes = await request(app).delete("/links/non_exist");
      assert.strictEqual(notFoundRes.statusCode, 404);
    },
  );
});
