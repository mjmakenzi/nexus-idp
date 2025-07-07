/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './api.interface';

export function apiConfig(): IConfiguration {
  return {
    version: process.env.APP_VERSION!,
    isProduction: process.env.NODE_ENV === 'production',
    isTesting: process.env.NODE_ENV === 'test',
    logLevel: process.env.LOG_LEVEL!,
    host: process.env.API_HOST!,
    port: parseInt(process.env.API_PORT!, 10),
    swaggerUrlPrefix: process.env.API_SWAGGER_URL_PREFIX || '',
    redis: {
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT!, 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB!, 10),
    },
    cacheTtl: parseInt(process.env.CACHE_TTL!, 10),
  };
}
