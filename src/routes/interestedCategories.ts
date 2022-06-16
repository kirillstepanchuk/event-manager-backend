import express from 'express';

import validate from '../middleware/validate';
import verifyToken from '../middleware/verifyToken';
import { setCategoriesSchema } from './validationSchemas/interestedCategories';

const { handleSetInterestedCategories, handleGetInterestedCategories } = require('../controllers/interestedCategories');

const router = express();

router.post('/set-interested-categories', validate(setCategoriesSchema), verifyToken, handleSetInterestedCategories);
router.get('/get-interested-categories', verifyToken, handleGetInterestedCategories);

export default router;
