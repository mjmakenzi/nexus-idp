import Joi from 'joi';

export const sessionSchema = Joi.object({
  // SESSION
  MAX_SESSIONS_PER_USER: Joi.number().required(),
  SESSION_EXPIRY_HOURS: Joi.number().required(),
  MAX_SESSION_EXPIRY_DAYS: Joi.number().required(),
  ENFORCE_SESSION_LIMITS: Joi.boolean().required(),
  TERMINATE_OLDEST_ON_LIMIT: Joi.boolean().required(),
});
