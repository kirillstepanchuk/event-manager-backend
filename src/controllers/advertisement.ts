import { Response } from 'express';

import connection, { dbParameters } from '../configs/db.config';
import { TypedRequest } from '../types/api';
import getPaymentSession from '../utils/getPaymentSession';

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const { httpStatusCode, SUCCESS_PAYMENT_STATUS } = require('../constants');
const { convertToSQLDateTime } = require('../utils/convertToSQLDateTime');

const handleBuyEventAdvertisement = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const {
      paymenthMethod, paymentData, currency, successRoute, cancelRoute,
    } = req.body;

    const startDateTime = convertToSQLDateTime(new Date(req.body.startDatetime));
    const endDateTime = convertToSQLDateTime(new Date(req.body.endDatetime));

    const sqlQuery = `
    REPLACE INTO ${dbParameters.NAME}.advertisements (eventId, category, advStartDate, advEndDate, position) 
    VALUES ('${req.body.evenId}', '${req.body.eventCategory}', '${startDateTime}', '${endDateTime}', '${req.body.position}');`;

    connection.query(sqlQuery, async () => {
      const session = await getPaymentSession(
        paymenthMethod, paymentData, currency, successRoute, cancelRoute,
      );

      return res.status(httpStatusCode.OK).send({
        url: session.url,
        session_id: session.id,
      });
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      err: error.message,
      message: req.t('requestError.message'),
    });
  }
};

const handleConfirmEventAdvertisement = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.body.session_id);
    if (session.payment_status !== SUCCESS_PAYMENT_STATUS) {
      return res.status(httpStatusCode.BAD_REQUEST).send({ message: req.t('advertisement.confirBuying.error') });
    }

    const sqlQuery = `
    UPDATE ${dbParameters.NAME}.advertisements 
    SET isConfirmed = '1' 
    WHERE eventId = '${req.body.event_id}';`;

    connection.query(sqlQuery, () => res.status(httpStatusCode.OK).send({ message: req.t('advertisement.confirBuying.success') }));
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

module.exports = {
  handleBuyEventAdvertisement,
  handleConfirmEventAdvertisement,
};
