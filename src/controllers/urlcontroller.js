import crypto from 'crypto';
import { pool } from '../server.js';

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


// keyset pagination log and csv streaming
