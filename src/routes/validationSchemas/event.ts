const Joi = require('joi');

const { TOKEN_REG_EXP, PAYMENT_SESSION_ID_REG_EXP } = require('../../constants');

const idSchema = Joi.string().alphanum().min(1).max(200).required();
const tokenSchema = Joi.string().pattern(TOKEN_REG_EXP);
const sessionIdSchema = Joi.string().pattern(PAYMENT_SESSION_ID_REG_EXP);
const titleSchema = Joi.string().min(5).max(30).required();
const coordSchema = Joi.number().required();
const descriptionSchema = Joi.string().required().min(30).max(999);
const priceSchema = Joi.number().required().min(1).max(999);
const paymentDataSchema = Joi.array().items(Joi.object().keys({
  title: Joi.string().required(),
  count: Joi.number().required(),
  price: Joi.number().required(),
}));

export const eventSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    data: Joi.object().keys({
      preview: Joi.string().required(),
      price: priceSchema,
      vipPrice: priceSchema,
      title: titleSchema,
      address: Joi.string().required(),
      longtitude: coordSchema,
      latitude: coordSchema,
      category: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
      description: descriptionSchema,
      contactPerson: Joi.string().required(),
      contactOption: Joi.string().required(),
      currnecy: Joi.string().required(),
    }),
  });

export const addEventInCalSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    user_id: idSchema,
  });

export const bookEventSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    event_id: idSchema,
    paymenthMethod: Joi.string().required(),
    paymentData: paymentDataSchema,
    currency: Joi.string().required(),
    successRoute: Joi.string().required(),
    cancelRoute: Joi.string().required(),
  });

export const confirnBookingSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    session_id: sessionIdSchema,
    event_id: idSchema,
  });

export const approveEventSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    event_id: idSchema,
  });

export const blockEventSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    event_id: idSchema,
  });
