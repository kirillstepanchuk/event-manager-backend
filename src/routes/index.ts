import express from 'express';

import eventRouter from './event';
import authRouter from './auth';
import smsRouter from './sms';
import userRouter from './user';
import advertisementRouter from './advertisement';
import interestedCategoriesRouter from './interestedCategories';

const router = express();

router.use(eventRouter);
router.use(authRouter);
router.use(smsRouter);
router.use(userRouter);
router.use(advertisementRouter);
router.use(interestedCategoriesRouter);

export default router;
