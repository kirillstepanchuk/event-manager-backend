const Joi = require('joi');

const userIdSchema = Joi.string().alphanum().min(1).max(200).required();
const tokenSchema = Joi.string().alphanum().min(3).max(200).required();

export const setCategoriesSchema = Joi.object()
  .keys({
    token: tokenSchema,
    action: Joi.string().required(),
    user_id: userIdSchema,
    data: Joi.array().items(Joi.string())
  });