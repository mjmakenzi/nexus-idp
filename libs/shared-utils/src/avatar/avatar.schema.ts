import Joi from 'joi';

export const avatarSchema = Joi.object({
  // MINIO
  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.number().required(),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),
  MINIO_USE_SSL: Joi.boolean().required(),

  // IMGPROXY
  IMGPROXY_BASE_URL: Joi.string().required(),
  IMGPROXY_KEY: Joi.string().required(),
  IMGPROXY_SALT: Joi.string().required(),
  IMGPROXY_ENCODE: Joi.boolean().required(),
});
