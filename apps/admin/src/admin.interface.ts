export interface IConfiguration {
  version: string;
  isProduction: boolean;
  isTesting: boolean;
  logLevel: string;
  host: string;
  port: number;
  swaggerUrlPrefix: string;
  adminApiKey: string;
}
