import Joi from 'joi';

export const discourseSchema = Joi.object({
  // DISCOURSE
  DISCOURSE_URL: Joi.string().required(),
  DISCOURSE_USER_NAME: Joi.string().required(),
  DISCOURSE_API_KEY: Joi.string().required(),
  DISCOURSE_SSO_SECRET: Joi.string().required(),
});
