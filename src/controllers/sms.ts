import { Response } from 'express';

import { TypedRequest } from '../types/api';

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken);
const { httpStatusCode } = require('../constants');

const sendGreetNotification = async (req: TypedRequest, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    client.messages
      .create({ body: req.t('sms.send.message'), from: process.env.SENDER_PHONE_NUMBER, to: phoneNumber })
      .catch((err) => res.status(httpStatusCode.BAD_REQUEST).send({ message: req.t('sms.send.error') }));

    res.status(httpStatusCode.OK).send(req.t('sms.send.success'));
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

module.exports = {
  sendGreetNotification,
};
