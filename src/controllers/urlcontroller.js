import crypto from 'crypto';
import { pool } from '../server.js';
import transform from 'node:stream'

export const checkController = {
    getHealth: (_req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'The server is healthy',
            timestamp: new Date().toISOString(),
        });
    }
};

export const url_generator = {
    // 1. Generate short URL (POST /shorten)
    short_url: async (req, res) => {
        try {
            const { original_url } = req.body;

            if (!original_url) {
                return res.status(400).json({
                    status: 'failed',
                    message: 'The original url is missing'
                });
            }

            const short_code = crypto.randomBytes(4).toString('hex');

            const querytext = `
                INSERT INTO links (orginal_url, short_code, click_count, created_at) 
                VALUES ($1, $2, 0, NOW()) 
                RETURNING id, orginal_url, short_code, click_count, created_at;
            `;
            const values = [original_url, short_code];

            const output = await pool.query(querytext, values);
            const record_url = output.rows[0];

            const protocol_host = `${req.protocol}://${req.get('host')}`;
            const generated_url = `${protocol_host}/${record_url.short_code}`;

            return res.status(201).json({
                status: 'success',
                message: 'The short url was generated successfully',
                data: {
                    id: record_url.id,
                    original_url: record_url.orginal_url,
                    short_code: record_url.short_code,
                    shorten_url: generated_url,
                    click_count: record_url.click_count,
                    created_at: record_url.created_at
                }
            });

        } catch (err) {
            return res.status(500).json({
                status: 'failed',
                success: false,
                message: 'An error occurred in your backend',
                error: err.message
            });
        }
    },

    // 2. Atomic Redirection & Telemetry (GET /:short_code)
    url_redirection: async (req, res) => {
        const client = await pool.connect();
        
        try {
            const { short_code } = req.params;

            await client.query('BEGIN')
            const selectQuery = `
                SELECT orginal_url, is_active, expired_at 
                FROM links 
                WHERE short_code = $1;
            `;
            const output = await client.query(selectQuery, [short_code]);

            if (output.rows.length === 0) {
                return res.status(404).json({
                    status: 'failed',
                    success: false,
                    message: 'The short url was not found in the database'
                });
            }
            
            const result = output.rows[0];

            if (!result.is_active) {
                return res.status(400).json({
                    status: 'failed',
                    success: false,
                    message: 'The short url is not active'
                });
            }

            if (result.expired_at && new Date() > new Date(result.expired_at)) {
                return res.status(410).json({
                    status: 'failed',
                    success: false,
                    message: 'The short url has expired'
                });
            }

            const update_query = `
                UPDATE links 
                SET click_count = click_count + 1 
                WHERE short_code = $1;
            `;
            await client.query(update_query, [short_code]);

            await client.query('COMMIT');
            client.release();

            return res.redirect(302, result.orginal_url);

        } catch (err) {
            return res.status(500).json({
                status: 'failed',
                success: false,
                message: 'An error occurred during redirection',
                error: err.message
            });
        }
    }
}


// keyset Pagination and csv streaming 
export const getAnalitics = {
    csv_log: async (req, res) => {
        try {

            const {short_code} = req.params

            // verifying if the links exist and gettinf=g the id at the same time
            const links_query = `SELECT id FROM links WHERE short_code = $1 `
            const links_result = await pool.query(links_query, [short_code])
            const result = links_result.rows

            if(result.length === 0){
                return res.status(404).json({
                    status: 'failed',
                    message: 'the short code is not found'
                })
            }

        // prepararing the http header to initait csv file installation
        res.setHeader('content-Type', 'text/csv')
        res.setHeader('content-Disposition', 'attachment; filename = "smart_meter_log.csv"')

        // immedaite  writing to the csv header
        res.write('id, clicked_at, referrer, user_agent\n')

        // creating the transformer flus
        // the tranformer stream convert each object of the database to a raw csv raw data

        // 1. creating the transformer instance for recieving data from the database and sending it back to the modified data
        const csv_transformer = new tranformer({
            // send an caution to the node backend for the arrival of the flux to the javacript object
            objectMode: true,
            tranformer(row, encoding, callback){
                const clickAt = new Date(row.clicked_at).toISOString()
                const csv_line = `${row.id}, ${row.clicked_at}, ${row.referrer}, ${row.user_agent}`
                callback(null, csv_line)
            }
        })

        // connecting the end of the transformer to the pipe of the user responde
        csv_transformer.pipe(res)

        let last_id = 0
        let hasMore_data = true
        const batch_size = 5000;
        const linkID = links_result.rows[0].id

        while(hasMore_data){
            
            // optimsing the request by using the id of the key (keyset pagination)
            const query_select = `SELECT id , clicked_at, referrer, user_agent FROM click_log WHERE link_id = $1 AND id > $2 ORDER BY id DECS LIMIT $3`
            const data = [linkID, last_id, batch_size]
            const output = await pooL.query(query_select, data)
            const db_data = output.rows

            if(db_data.length === 0){
                hasMore_data = false
                break
            }

            for (const row of db_data){
                csv_transformer.write(row)
            }

            last_id = db_data[db_data.length -1].id
            // if the object package recieved are less than limit demanded
            if(db_data.length <  batch_size){
                hasMore_data = false
            }

            csv_transformer.end()


        }

        }catch(err){
            return res.status(500).json({
                success: 'failed',
                message: 'An error occured in during the exportation process of the csv',
                error: err.message
            })
        }
    }

}