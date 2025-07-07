/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './kavenegar.interface';

export function kavenegarConfig(): IConfiguration {
  return {
    kavenegar: {
      apiKey: process.env.KAVENEGAR_API_KEY!,
      sender: process.env.KAVENEGAR_SENDER!,
      verifyTemplate: process.env.KAVENEGAR_VERIFY_TEMPLATE!,
      receptor: process.env.KAVENEGAR_RECEPTOR!,
    },
  };
}
