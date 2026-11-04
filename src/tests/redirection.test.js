import request from 'supertest'
import { pool } from '../server.js'
import app from '../app.js'
import assert from 'node:assert'
import test from 'node:test'

test('GET /:short_code redirection and telemetry test suite', async (red) => {

    let generatedShortCode;
    const testUrl = 'https://github.com'

    // Create a short link first so we have a valid code to test redirection
    await red.test('Setup: Create a link for redirection testing', async () => {
        const res = await request(app)
            .post('/links')
            .send({ original_url: testUrl })

        assert.strictEqual(res.statusCode, 201);
        generatedShortCode = res.body.data.short_code;
        assert.ok(generatedShortCode, 'A short code was generated');
    });

    // Test successful redirection 
    await red.test('Should successfully redirect and return 302 status with correct location header', async () => {
        const res = await request(app)
            .get(`/${generatedShortCode}`)

        assert.strictEqual(res.statusCode, 302);
        assert.strictEqual(res.headers.location, testUrl);
    });

    // testing click count and the telemetry
    await red.test('Should increment click count and log telemetry upon redirection', async () => {
        // Trigger another redirect to increment clicks
        await request(app)
            .get(`/${generatedShortCode}`)
            .redirects(0);

        //verify if the automation occured also in the metadat
        const res = await request(app).get(`/links/${generatedShortCode}`);

        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body.data.click_count >= 2, 'Click count should reflect multiple redirections'); 
    });

    // testing if the short code exit
    await red.test('Should return 404 for non-existent short codes', async () => {
        const res = await request(app)
            .get('/dont_exist')
            .redirects(0)

        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.body.success, false)
    })

})

