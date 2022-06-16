const Joi = require('joi');

const { TOKEN_REG_EXP, PAYMENT_SESSION_ID_REG_EXP } = require('../../constants');

const idSchema = Joi.string().alphanum().min(1).max(200).required();
const tokenSchema = Joi.string().pattern(TOKEN_REG_EXP);
const sessionIdSchema = Joi.string().pattern(PAYMENT_SESSION_ID_REG_EXP);
const paymentDataSchema = Joi.array().items(Joi.object().keys({
  title: Joi.string().required(),
  count: Joi.number().required(),
  price: Joi.number().required(),
}));

export const buyAdvertisementSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    eventId: idSchema,
    eventCategory: Joi.string().required(),
    startDatetime: Joi.date().required(),
    endDatetime: Joi.date().required(),
    position: Joi.string().required(),
    paymenthMethod: Joi.string().required(),
    paymentData: paymentDataSchema,
    currency: Joi.string().required(),
    successRoute: Joi.string().required(),
    cancelRoute: Joi.string().required(),
  });

export const confirmBuyAdvertisementSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    session_id: sessionIdSchema,
    event_id: idSchema,
  });
