/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './discourse.interface';

export function discourseConfig(): IConfiguration {
  return {
    discourse: {
      url: process.env.DISCOURSE_URL!,
      userName: process.env.DISCOURSE_USER_NAME!,
      apiKey: process.env.DISCOURSE_API_KEY!,
      ssoSecret: process.env.DISCOURSE_SSO_SECRET!,
    },
  };
}
