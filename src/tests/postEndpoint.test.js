import request from "supertest";
import { pool } from "../config/db.js";
import app from "../app.js";
import assert from "node:assert";
import { test, after } from "node:test";

const createdShortCodes = [];

test("POST /links endpoint comprehensive test suite", async (t) => {
  await t.test(
    "A randomly generated short code must be created (201)",
    async () => {
      const res = await request(app)
        .post("/links")
        .send({ target_url: "https://youtube.com" });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.target_url, "https://youtube.com");
      assert.ok(res.body.data.short_code);

      createdShortCodes.push(res.body.data.short_code);
    },
  );

  await t.test(
    "Generated short codes must respect regex format and be unique",
    async () => {
      const regex = /^[a-zA-Z0-9_-]{3,16}$/;

      const urls = [
        "https://google.com",
        "https://github.com",
        "https://youtube.com",
      ];

      const responses = await Promise.all(
        urls.map((target_url) =>
          request(app).post("/links").send({ target_url }),
        ),
      );

      responses.forEach((res) => {
        assert.strictEqual(res.statusCode, 201);
        assert.match(res.body.data.short_code, regex);
        createdShortCodes.push(res.body.data.short_code);
      });

      const codes = responses.map((res) => res.body.data.short_code);
      const uniqueCodes = new Set(codes);

      assert.strictEqual(
        uniqueCodes.size,
        codes.length,
        "Generated short codes must be unique",
      );
    },
  );

  await t.test("Should accept a future expires_at date (201)", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app).post("/links").send({
      target_url: "https://github.com",
      expires_at: futureDate,
    });

    assert.strictEqual(res.statusCode, 201);
    assert.ok(res.body.data.short_code);
    assert.ok(res.body.data.expires_at);

    assert.strictEqual(
      new Date(res.body.data.expires_at).toISOString(),
      futureDate,
    );

    createdShortCodes.push(res.body.data.short_code);
  });

  await t.test("Should reject a past expires_at date (400)", async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app).post("/links").send({
      target_url: "https://github.com",
      expires_at: pastDate,
    });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  await t.test("Should reject requests with invalid URLs (400)", async () => {
    const res = await request(app)
      .post("/links")
      .send({ target_url: "not-a-valid-url" });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  await t.test(
    "Should reject requests with missing target_url field (400)",
    async () => {
      const res = await request(app).post("/links").send({});

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
    },
  );
});

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
