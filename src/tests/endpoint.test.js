import request from 'supertest';
import { pool } from '../server.js';
import app from '../app.js';
import assert from 'node:assert';
import test from 'node:test';

test('POST /links endpoint comprehensive test suite', async (TEP) => {

    await TEP.test('A randomly generated short code must be created (201)', async () => {
        const res = await request(app)
            .post('/links')
            .send({ original_url: 'https://youtube.com' });

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.body.data.original_url, 'https://youtube.com');
        assert.ok(res.body.data.short_code, 'a short code must be generated'); 
    });

    await TEP.test('Generated short codes must respect regex format and be unique', async (st) => {
        const regex = /^[a-zA-Z0-9_-]{3,16}$/;
        
        const res1 = await request(app).post('/links').send({ original_url: 'https://google.com' });
        const res2 = await request(app).post('/links').send({ original_url: 'https://github.com' });
        const res3 = await request(app).post('/links').send({ original_url: 'https://youtube.com' });

        const code1 = res1.body.data.short_code;
        const code2 = res2.body.data.short_code; 
        const code3 = res3.body.data.short_code; 

        assert.match(code1, regex, 'Code 1 format check failed');
        assert.match(code2, regex, 'Code 2 format check failed');
        assert.match(code3, regex, 'Code 3 format check failed');

        const listeCodes = [code1, code2, code3];
        const ensembleUnique = new Set(listeCodes);

        assert.strictEqual(
            ensembleUnique.size, 
            listeCodes.length, 
            'Erreur : Des codes courts identiques ont été générés (doublons) !'
        );
    });

    await TEP.test('Should reject requests with invalid URLs (400)', async () => {
        const res = await request(app)
            .post('/links')
            .send({ original_url: 'not-a-valid-url' });

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
    });

    await TEP.test('Should reject requests with missing original_url field (400)', async () => {
        const res = await request(app)
            .post('/links')
            .send({});

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
    });

});
