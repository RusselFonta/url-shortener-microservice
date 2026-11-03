import express from 'express';
import {validation_schema}  from '../middlewares/urlvalidation.js';
import { url_generator, getAnalitics} from '../controllers/urlcontroller.js';

const router = express.Router();

router.post('/links', validation_schema, url_generator.short_url);
router.get('/:code', url_generator.url_redirection);
router.get('/links/:code/clicks', getAnalitics.csv_log)




export default router;