import express from 'express';

const {
  sendGreetNotification,
} = require('../controllers/sms');

const router = express();

router.post('/send-message', sendGreetNotification);

export default router;
