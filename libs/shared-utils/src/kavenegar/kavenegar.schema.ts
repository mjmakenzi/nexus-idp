import Joi from 'joi';

export const kavenegarSchema = Joi.object({
  // KAVENEGAR
  KAVENEGAR_API_KEY: Joi.string().required(),
  KAVENEGAR_SENDER: Joi.string().required(),
  KAVENEGAR_VERIFY_TEMPLATE: Joi.string().required(),
  KAVENEGAR_RECEPTOR: Joi.string().required(),
});
