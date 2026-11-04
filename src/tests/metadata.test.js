import request from 'supertest'
import {pool} from '../server.js'
import app from '../app.js'
import test from 'node:test'
import assert from 'node:assert'

test('GET /links/:short_code metadata endpoint testing', async (meta) => {
    let generatedShortCode
    const testUrl = 'https://youtude.com'

    await meta.test('creating a links for the metadata testing', async () => {
        const res = await request(app).post('/links').send({original_url: testUrl})

        assert.strictEqual(res.statusCode, 201)
        generatedShortCode = res.body.data.short_code
        assert.ok(generatedShortCode, 'A short code was generated')
    })

    // testing id the metadata retrieval was done successfully
    await meta.test('complete metadata retrieval and for short code to be valid (200)', async () => {
        const res = await request(app).get(`/links/${generatedShortCode}`)

        assert.strictEqual(res.statusCode, 200)
        assert.strictEqual(res.body.data.original_url, testUrl)
        assert.strictEqual(res.body.data.short_code, generatedShortCode )
        assert.strictEqual(typeof res.body.data.is_active , 'boolean')
        assert.strictEqual(typeof res.body.data.click_count, 'number')

    })

    await red.test('Should return 404 for metadata non-existent short codes', async () => {
        const res = await request(app)
            .get('/links/dont_exist')
            .redirects(0)

        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.body.success, false)
    })

})