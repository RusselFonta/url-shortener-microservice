import request from 'supertest'
import {pool} from '../server.js'
import app from '../app.js'
import assert from 'node:assert'
import test from 'node:test'

test('DELETE /links/:short_code deleteion endpoint testing', async (del) => {
    let generatedShortCode
    const testUrl = 'https://youtube.com'

    // create a short links 
    await del.test('creating a short code deletion testing', async () => {
        const res = await request(app).post('/links').send(testUrl)
        assert.strictEqual(res.statusCode, 200)
        generatedShortCode = res.body.data.short_code
        assert.ok(generatedShortCode, 'A short code was generated successfully')
    })

    // testing the deletion endpoint
    await del.test('the created short code most be successfully deleted', async () => {
        const res = await request(app).delete(`/links/${generatedShortCode}`).
        assert.strictEqual(res.statusCode, 200)
    })

    // testing is the links was perfectly deleted
    await del.test('should return 404 when the metadata and redirection a deleted links', async () => {
        const res = await request(app).get(`/links/${generatedShortCode}`)
        assert.strictEqual(res.statusCode, 404)
    })

    // testing the deletion of a non existing links
    await del.test('Sould return 404 if a non existing url is been deleted', async () => {
        const res = await request(app).delete('/non_exist')
        assert.strictEqual(res.statusCode, 404)
    })

})