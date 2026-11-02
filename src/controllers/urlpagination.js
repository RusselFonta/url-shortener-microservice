import {pool} from '../server.js'
import { transform } from 'zod'

export const csv_stream = {
    csv_log: async (req, res ) => {
        try{
            const {short_code} = req.params
            const {cursor, limit = 10} = req.query
            const select_query = 'SELECT orginal_url FROM links WHERE short_code = $1'

            const shortcode_value = [short_code]
            const url_result = await pool.query(select_query, shortcode_value);
            const short_store = url_result.rows[0]

            if(short_store.length === 0){
                return res.status(404).json({
                    status:'Failed',
                    message: 'short url is not found'
                })
            }

            const num_click = short_store.click_count


            // keyset pagination configuration for click_log
            const clickLog_query = `SELECT id , clicked_at, ip_address, user_agent FROM click_log WHERE short_code = $1`
            if(cursor){
                clickLog_query += `AND id < $2`
                shortcode_value.push(cursor)
            }

            const parseLimit = parseInt(limit, 10)
            clickLog_query += `ORDER BY id  DESC LIMIT $${shortcode_value.length + 1}`
            shortcode_value.push(parseLimit)

            const clickLog_result = await pool.query(clickLog_query,shortcode_value)
            const clicked = clickLog_result.rows

            // Determine the the next cursor from the cleint 
            const next_cursor = clicked.length > 0 ? clicked[clicked.length - 1].id : null ;

            return res.status(200).json({
                status: 'success',
                totaol_clicked: num_click,
                data: clicked,
                pagination: {
                    limit: parseLimit,
                    has_more: clicked.length === parseLimit,
                    next_cursor: next_cursor
                }

            })

        }catch(err){
            return res.status(500).json({
                status:'failed',
                message: 'a problem has occured in the backend during analytics',
                error: err.message
            })
        }
    }