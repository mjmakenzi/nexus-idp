import { FastifyRequest } from 'fastify';

export interface IConfiguration {
  version: string;
  isProduction: boolean;
  isTesting: boolean;
  logLevel: string;
  host: string;
  port: number;
  swaggerUrlPrefix: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  cacheTtl: number;
}

interface UserJwtPayload {
  sub: string;
}

export interface OptionalAuthRequest extends FastifyRequest {
  user?: UserJwtPayload;
}

export interface AuthRequest extends FastifyRequest {
  user: UserJwtPayload;
}
