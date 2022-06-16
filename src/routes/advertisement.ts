import express from 'express';

import validate from '../middleware/validate';
import verifyToken from '../middleware/verifyToken';
import { buyAdvertisementSchema, confirmBuyAdvertisementSchema } from './validationSchemas/advertisement';

const {
  handleBuyEventAdvertisement,
  handleConfirmEventAdvertisement,
} = require('../controllers/advertisement');

const router = express();

router.post('/buy-event-advertisement', validate(buyAdvertisementSchema), verifyToken, handleBuyEventAdvertisement);
router.post('/confirm-event-advertisement', validate(confirmBuyAdvertisementSchema), verifyToken, handleConfirmEventAdvertisement);

export default router;
