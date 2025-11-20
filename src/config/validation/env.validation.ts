import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  //서버 설정
  NODE_ENV: Joi.string().valid('dev', 'prod').required(),
  PORT: Joi.number(),
});
