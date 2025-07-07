import Joi from 'joi';

export const jwtSchema = Joi.object({
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
  JWT_ISS: Joi.string().required(),
});
