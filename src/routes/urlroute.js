import express from 'express';
import { validation_schema } from '../middlewares/urlvalidation.js';
import { url_generator } from '../controllers/urlcontroller.js';

const router = express.Router();

router.post('/shorten', validation_schema, url_generator.short_url);
router.get('/:short_code', url_generator.url_redirection);

export default router;