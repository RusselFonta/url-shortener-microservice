import express from 'express';
import { validation_schema } from '../middlewares/urlvalidation.js';

const router = express.Router();

// initiating a post request to endpoint
router.post('/shorten', validation_schema, (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Validation passed successfully!',
    data: req.body,
  });
});

export default router;