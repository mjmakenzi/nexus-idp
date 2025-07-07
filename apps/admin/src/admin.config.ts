/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './admin.interface';

export function adminConfig(): IConfiguration {
  return {
    version: process.env.APP_VERSION!,
    isProduction: process.env.NODE_ENV === 'production',
    isTesting: process.env.NODE_ENV === 'test',
    logLevel: process.env.LOG_LEVEL!,
    host: process.env.ADMIN_HOST!,
    port: parseInt(process.env.ADMIN_PORT!, 10),
    swaggerUrlPrefix: process.env.ADMIN_SWAGGER_URL_PREFIX || '',
    adminApiKey: process.env.ADMIN_API_KEY!,
  };
}
