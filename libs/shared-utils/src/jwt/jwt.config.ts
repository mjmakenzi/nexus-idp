/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './jwt.interface';

export function jwtConfig(): IConfiguration {
  return {
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN!,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,
      iss: process.env.JWT_ISS!,
    },
  };
}
