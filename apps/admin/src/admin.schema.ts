import Joi from 'joi';

export const adminSchema = Joi.object({
  APP_VERSION: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('error'),
  ADMIN_HOST: Joi.string().required(),
  ADMIN_PORT: Joi.number().required(),
  ADMIN_SWAGGER_URL_PREFIX: Joi.string().allow(''),
});
