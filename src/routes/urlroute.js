import express from 'express'
import { validation_schema } from '../middlewares/urlvalidation'
import { checkController } from '../controllers/urlcontroller'


export const router = express.Router()

// Initiation of a post endpoint
router.post('/shorten', validation_schema, checkController)
