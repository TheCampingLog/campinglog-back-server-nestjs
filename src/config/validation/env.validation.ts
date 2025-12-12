import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  //서버 설정
  NODE_ENV: Joi.string().valid('dev', 'prod').required(),
  PORT: Joi.number(),
  CAMP_KEY: Joi.string().required(),
  BASE_URL: Joi.string().required(),
  //jwt 설정
  JWT_ISSUER: Joi.string().required(),
  JWT_SECRET_KEY: Joi.string().required(),
  JWT_EXPIRATION: Joi.number().required(),
  REFRESH_SECRET_KEY: Joi.string().required(),
  REFRESH_EXPRIATION: Joi.number().required(),
});
