import Joi from 'joi';

export const appleSchema = Joi.object({
  APPLE_LIB_PATH: Joi.string().required(),
  APPLE_CLIENT_ID: Joi.string().required(),
  APPLE_TEAM_ID: Joi.string().required(),
  APPLE_KEY_FILE_ID: Joi.string().required(),
  APPLE_PRIVATE_KEY: Joi.string().required(),
  APPLE_REDIRECT_URI: Joi.string().required(),
});
