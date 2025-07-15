/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './apple.interface';

export function appleConfig(): IConfiguration {
  return {
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      teamId: process.env.APPLE_TEAM_ID!,
      keyFileId: process.env.APPLE_KEY_FILE_ID!,
      keyFilePath: process.env.APPLE_KEY_FILE_PATH!,
      redirectUri: process.env.APPLE_REDIRECT_URI!,
    },
  };
}
