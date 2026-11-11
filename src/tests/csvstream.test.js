import app from "../app.js";
import request from "supertest";
import assert from "node:assert";
import test from "node:test";

test("GET /links/:short_code/clicks.csv for csv streaming endpoint testing", async (csv) => {
  let generatedShortCode;
  const testUrl = "https://youtube.com";

  // 1. Creating a new short code
  await csv.test("creating a new short code for redirection", async () => {
    const res = await request(app).post("/links").send({ target_url: testUrl });

    assert.strictEqual(res.statusCode, 201);
    generatedShortCode = res.body.data.short_code;
    assert.ok(generatedShortCode, "A short code was successfully generated");
  });

  // 2. Testing the redirection (to generate click logs)
  await csv.test("carrying out redirection", async () => {
    const redirect = await request(app)
      .get(`/${generatedShortCode}`)
      .redirects(0);
    assert.strictEqual(redirect.statusCode, 302);
  });

  // 3. Testing the CSV streaming endpoint
  await csv.test(
    "creating stream getAnalytics with the download csv with the appropriate header",
    async () => {
      const res = await request(app).get(
        `/links/${generatedShortCode}/clicks.csv`,
      );

      assert.strictEqual(res.statusCode, 200);

      // Verify the csv content type
      assert.match(res.headers["content-type"], /text\/csv/);
      assert.ok(
        res.headers["content-disposition"].includes("attachment"),
        "content-disposition must be set as a download attachment",
      );

      // Verifying if the csv body contains the required columns
      assert.ok(res.text, "the response body must contain CSV data");
      assert.ok(
        res.text.includes("clicked_at") || res.text.includes("referrer"),
      );
    },
  );

  // 4. Testing 404 for non-existent short code
  await csv.test(
    "Should return 404 when exporting CSV for non-existent short code",
    async () => {
      const res = await request(app).get("/links/nonexistentcsv/clicks.csv");

      assert.strictEqual(res.statusCode, 404);
    },
  );
});
