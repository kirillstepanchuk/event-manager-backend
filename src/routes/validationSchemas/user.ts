const Joi = require('joi');

const { NAME_REG_EXP, TOKEN_REG_EXP } = require('../../constants');

const nameSchema = Joi.string().min(3).trim().required().pattern(NAME_REG_EXP);
const tokenSchema = Joi.string().pattern(TOKEN_REG_EXP);
const descriprionSchema = Joi.string().trim().allow('');
const passwordSchema = Joi.string().min(6).max(15).required();

export const editUserSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    firstName: nameSchema,
    lastName: nameSchema,
    description: descriprionSchema,
    role: Joi.string(),
    clientId: Joi.string(),
  });

export const changePasswordSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    newPassword: passwordSchema,
    currentPassword: passwordSchema,
  });
