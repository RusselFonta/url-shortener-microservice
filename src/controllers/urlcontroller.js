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
ad
// generating a random chaine of 8 hexadecimal character 
export const url_generator = {
   short_url: async ( req, res) => {
    try{
        const {original_url} = req.body
        const short_code = crypto.randomBytes(4).toString('hex');

    }catch(err){

    }
    }
}