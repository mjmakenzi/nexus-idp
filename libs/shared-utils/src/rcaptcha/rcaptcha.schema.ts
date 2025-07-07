import Joi from 'joi';

export const rcaptchaSchema = Joi.object({
  // ARCAPTCHA
  ARCAPTCHA_VERIFY_URL: Joi.string().required(),
  ARCAPTCHA_SECRET_KEY: Joi.string().required(),
  ARCAPTCHA_SITE_KEY: Joi.string().required(),
  ARCAPTCHA_BYPASS_SECRET: Joi.string().required(),
});
