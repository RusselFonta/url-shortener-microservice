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


            // 

        }catch(err){

        }
}