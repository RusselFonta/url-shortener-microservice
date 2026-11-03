import express from 'express';
import { validation_schema } from '../middlewares/urlvalidation.js';
import { url_generator, getAnalitics } from '../controllers/urlcontroller.js';

const router = express.Router();

router.post('/links', validation_schema, url_generator.short_url);
router.get('/links/:short_code/clicks.csv', getAnalitics.csv_log);
router.get('/:short_code', url_generator.url_redirection);

export default router;