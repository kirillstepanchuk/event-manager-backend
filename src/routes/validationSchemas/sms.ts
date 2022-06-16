const Joi = require('joi');

const { PHONE_REG_EXP } = require('../../constants');

const phoneSchema = Joi.string().pattern(PHONE_REG_EXP).required();

export const sendGreetNotificationSchema = Joi.object()
  .keys({
    phoneNumber: phoneSchema,
  });
