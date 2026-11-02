import crypto from 'crypto';
import { pool } from '../server';
import { success } from 'zod';

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

        // verify is the url was enter 
        if(!original_url){
            return res.status(400).json({
                status: 'failed',
                message: 'the original rl is missing '
            })
        }

        const short_code = crypto.randomBytes(4).toString('hex');

        // inserting value into the database
        const querytext = " INSERT INTO links (orginal_url, short_code, click_count, created_at) VALUES($1, $2, 0, NOW()) RETURNING id, orginal_url, short_code, click_count, created_at"
        const values = [original_url, short_code]

        // use pool.query(...) for a faster  and clean code enabling multiple users handling in simultaneous manner
        // why did i use pool.query(...) over client.query(...): it enables me to handle multiple user in a faster manner and prevent manual managements
        const output = await pool.query(querytext, values)

        // extrating inserted data from the database table
        const record_url = output.rows[0]

        const protocol_host = `${req.protocol}://${req.get('host')}`;
        const generated_url = `${protocol_host}/${record_url.short_code}`

            return res.status(200).json({
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
        return res.status(500).json({
            status: 'failed',
            success: false,
            message: 'An error occured in your in backend',
            error: err.message
        })

    }
    }
}


//PART 2: atomic redirection and telemetry controller
url_redirection: async (req, res) => {
    try {
        const {short_code} = req.params

        // searching for the origianl url in the database 
        const select= 'SELECT orginal_url, is_active, created_at FROM links WHERE short_code = $2'

        const value = [short_code]
        const output = await pool.connect(select, value)

        if(!output.rows.lenght === 0){
            return res.status(404).json({
                status: 'failed',
                success: false,
                message: 'the short url was not found in the database'
            })
        }

    }catch(err){

    }
}