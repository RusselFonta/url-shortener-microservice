import crypto from 'crypto';
import { pool } from '../server';

export const checkController = {
    getHealth: (_req, res) => {
        res.status(200).json({
            status:'success',
            message: 'the server is healthty',
            timestamp: new Date().toISOString(),
        })
    }
}

// generating a random chaine of 8 hexadecimal character 
export const url_generator = {
   short_url: async ( req, res) => {
    try{
        const {original_url} = req.body
        const short_code = crypto.randomBytes(4).toString('hex');

        // inserting value into the database
        const querytext = " INSERT INTO links (orginal_url, short_code, click_count, created_at) VALUES($1, $2, 0, NOW()) RETURNING (id, orginal_url, short_code, click_count, created_at)"
        const values = [original_url, short_code]

        // use pool.query(...) for a faster  and clean code enabling multiple users handling in simultaneous manner
        // why did i use pool.query(...) over client.query(...): it enables me to handle multiple user in a faster manner and prevent manual managements
        const output = await pool.query(querytext, values)
        const record_url = output.rows[0]

        const protocol_host = `${req.protocol}://${req.get('host')}`;
        const generated_url = `${protocol_host}/${record_url.short_code}`

        res.status(200).json({
            status: 'success',
            message: 'the short url was generated succefully',
            data: {
                id: record_url.id,
                original_url: record_url.original_url,
                short_code: record_url.short_code,
                shorten_url: generated_url,
                click_count: record_url.click_count,
                created_at: record_url.created_at
            }
        })

    }catch(err){

    }
    }
}