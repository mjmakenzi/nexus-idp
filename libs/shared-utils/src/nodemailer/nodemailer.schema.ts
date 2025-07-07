import Joi from 'joi';

export const nodemailerSchema = Joi.object({
  // EMAIL
  EMAIL_BODY_COPYRIGHT: Joi.string().required(),
  EMAIL_BODY_SOCIAL: Joi.string().required(),
  EMAIL_BODY_LOGO: Joi.string().required(),
  EMAIL_BODY_BOX_OTP: Joi.string().required(),
  EMAIL_BASE: Joi.string().required(),
  EMAIL_BODY: Joi.string().required(),
  EMAIL_SUBJECT: Joi.string().required(),
});
