import {pool} from '../server.js'
import app from '../app.js'
import request from 'supertest'
import assert from 'node:assert'
import test from 'node:test'

test('GET /links/:short_code/clicks.csv for csv streaming endpoint testing' async (csv) => {
    let generatedShortCode
    const testUrl = 'https://youtube.com'

    // creating a new short code and carrying redirection
    await csv.test('creating a new short code for rediredction', async () => {
        const res = await request(app).post('/links').send({original_url: testUrl})

        assert.strictEqual(res.statusCode, 201)
        generatedShortCode = res.body.data.short_code
        assert.ok(generatedShortCode, 'A short code was successfully generated')

        // testing the rediection
        const redirect = await request(app).get(`/${generatedShortCode}`).redirects(0)

        // testing the csv streaming if it is working 
        await csv.test('creating stream getAnalytics with the download csv with the approprate header', async () => {
            const res = await request(app).get(`/links/${generatedShortCode}/click.csv`)

            assert.strictEqual(res.statusCode, 200)

            // verify the csv content type
            assert.match(res.headers['content-type'], /text\/csv\)
            assert.ok(res.headers['content-Disposition'].includes('attachment'), 'content-disposition must be set as a download attachement')

            // verifying if the csv body contain the required columns
            assert.ok(res.text, 'the response body javascript object must contain a csv data')
            assert.ok(res.text.includes('clicked_at') || res.text.includes('referer'))
        })

        await csvTest.test('Should return 404 when exporting CSV for non-existent short code', async () => {
        const res = await request(app).get('/links/nonexistentcsv/csv');

        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.body.success, false);
    });

})