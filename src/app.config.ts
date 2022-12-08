import Joi from 'joi';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  siteUrl: string;
  storageFolder: string;
}

export default (): AppConfig => ({
  port: Number.parseInt(process.env.PORT || '3100'),
  nodeEnv: process.env.NODE_ENV || '',
  siteUrl: process.env.SITE_URL || '',
  storageFolder: process.env.STORAGE_FOLDER || '',
});

export function getConfigValidationSchema() {
  return Joi.object({
    PORT: Joi.number().required(),
    NODE_ENV: Joi.string().required(),
    SITE_URL: Joi.string().required(),
    STORAGE_FOLDER: Joi.string().required(),
  });
}
