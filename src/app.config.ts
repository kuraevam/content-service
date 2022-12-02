import Joi from 'joi';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  riakUrl: string;
  siteUrl: string;
}

export default (): AppConfig => ({
  port: Number.parseInt(process.env.PORT || '3100'),
  nodeEnv: process.env.NODE_ENV || '',
  riakUrl: process.env.RIAK_URL || '',
  siteUrl: process.env.SITE_URL || '',
});

export function getConfigValidationSchema() {
  return Joi.object({
    PORT: Joi.number().required(),
    NODE_ENV: Joi.string().required(),
    RIAK_URL: Joi.string().required(),
    SITE_URL: Joi.string().required(),
  });
}
