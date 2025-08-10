import Joi from 'joi';
import { appleSchema } from '../apple/apple.schema';
import { avatarSchema } from '../avatar/avatar.schema';
import { discourseSchema } from '../discourse/discourse.schema';
import { jwtSchema } from '../jwt/jwt.schema';
import { kavenegarSchema } from '../kavenegar/kavenegar.schema';
import { nodemailerSchema } from '../nodemailer/nodemailer.schema';
import { rcaptchaSchema } from '../rcaptcha/rcaptcha.schema';
import { sessionSchema } from '../session/session.schema';

// Define all schemas
const schemas = [
  jwtSchema,
  rcaptchaSchema,
  nodemailerSchema,
  avatarSchema,
  discourseSchema,
  kavenegarSchema,
  appleSchema,
  sessionSchema,
];

// Combine all schemas using Joi.concat()
export const combinedValidationSchema = schemas.reduce(
  (acc, schema) => acc.concat(schema),
  Joi.object({}),
);

// Export individual schemas for reference
export {
  jwtSchema,
  rcaptchaSchema,
  nodemailerSchema,
  avatarSchema,
  discourseSchema,
  kavenegarSchema,
  appleSchema,
  sessionSchema,
};
