import Joi from 'joi';

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export default (): AppConfig => ({
  port: Number.parseInt(process.env.PORT || '3100'),
  nodeEnv: process.env.NODE_ENV || '',
});

export function getConfigValidationSchema() {
  return Joi.object({
    PORT: Joi.number().required(),
    NODE_ENV: Joi.string().required(),
  });
}
