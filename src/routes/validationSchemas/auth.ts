const Joi = require('joi');

const { NAME_REG_EXP, TOKEN_REG_EXP } = require('../../constants');

const emailSchema = Joi.string().email({ tlds: { allow: false } }).trim().required();
const tokenSchema = Joi.string().pattern(TOKEN_REG_EXP);
const passwordSchema = Joi.string().min(6).max(15).required();
const nameSchema = Joi.string().min(3).trim().required().pattern(NAME_REG_EXP);

export const registerSchema = Joi.object()
  .keys({
    email: emailSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    password: passwordSchema,
  });

export const loginSchema = Joi.object()
  .keys({
    email: emailSchema,
    password: passwordSchema,
  });

export const confirmRegistrationSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
  });

export const forgotPasswordSchema = Joi.object()
  .keys({
    email: emailSchema,
  });

export const resetPasswordSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    newPassword: passwordSchema,
  });
