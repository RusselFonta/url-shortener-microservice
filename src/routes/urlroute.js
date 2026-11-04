import express from 'express';
import { validation_schema } from '../middlewares/urlvalidation.js';
import { url_generator, getAnalitics } from '../controllers/urlcontroller.js';

const router = express.Router();

// short url generating
router.post('/links', validation_schema, url_generator.short_url);

// csv streaming
router.get('/links/:short_code/clicks.csv', getAnalitics.csv_log);

// delecting the url
router.delete('/links/:short_code', getAnalitics.deleteUrl);

// redirection
router.get('/:short_code', url_generator.url_redirection); 



export default router;