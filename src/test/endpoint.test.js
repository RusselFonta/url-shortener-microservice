import request from 'supertest';
import app from '../app.js';
import assert from 'node:assert';
import test from 'node:test';

test('POST /links endpoint test suite', async (TEP) => {

    await TEP.test('A randomly generated short code must be created (201)', async () => {
        const res = await request(app)
            .post('/links')
            .send({ target_url: 'https://youtube.com' });

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.body.orginal_url, 'https://youtube.com');
        assert.ok(res.body.data.code, 'a short code must be generated');
    });

    await TEP.test('the sort code most respect this /^[a-zA-Z0-9_-]{3,16}$/ it time is created', async (st) => {
        const regex = /^[a-zA-Z0-9_-]{3,16}$/;
        
        // make 3 post request for testing
        const res1 = await request(app).post('/links').send({ orginal_url: 'https://google.com' });
        const res2 = await request(app).post('/links').send({ orginal_url: 'https://github.com' });
        const res3 = await request(app).post('/links').send({ orginal_url: 'https://youtube.com' });

        // Extracting the code in the body response
        const code1 = res1.body.short_code;
        const code2 = res2.body.short_code;
        const code3 = res3.body.short_code;

        // verifying if they all respect the regex
        assert.match(code1, regex, 'Le code 1 ne respecte pas le format [a-zA-Z0-9_-]{3,16}');
        assert.match(code2, regex, 'Le code 2 ne respecte pas le format [a-zA-Z0-9_-]{3,16}');
        assert.match(code3, regex, 'Le code 3 ne respecte pas le format [a-zA-Z0-9_-]{3,16}');

        // verifying if the short code are all unique
        const listeCodes = [code1, code2, code3];
        const ensembleUnique = new Set(listeCodes);

        assert.strictEqual(
            ensembleUnique.size, 
            listeCodes.length, 
            'Error : identical short were found'
        );
    });

    await TEP.test('should reject requests with invalid URLs (400)', async () => {
        const res = await request(app)
            .post('/links')
            .send({ target_url: 'not-a-valid-url' });

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
    });

});