import Joi from 'joi';

export const apiSchema = Joi.object({
  APP_VERSION: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('error'),
  API_HOST: Joi.string().required(),
  API_PORT: Joi.number().required(),
  API_SWAGGER_URL_PREFIX: Joi.string().allow(''),

  // SESSION
  MAX_SESSIONS_PER_USER: Joi.number().required(),
  SESSION_EXPIRY_HOURS: Joi.number().required(),
  MAX_SESSION_EXPIRY_DAYS: Joi.number().required(),
  ENFORCE_SESSION_LIMITS: Joi.boolean().required(),
  TERMINATE_OLDEST_ON_LIMIT: Joi.boolean().required(),

  // redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string(),
  REDIS_DB: Joi.number().default(0),
  CACHE_TTL: Joi.number().default(5000),
});
