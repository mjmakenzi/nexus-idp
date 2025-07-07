/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './avatar.interface';

export function avatarConfig(): IConfiguration {
  return {
    minio: {
      endpoint: process.env.MINIO_ENDPOINT!,
      port: parseInt(process.env.MINIO_PORT!, 10),
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
      useSsl: process.env.MINIO_USE_SSL === 'true',
    },
    imgproxy: {
      baseUrl: process.env.IMGPROXY_BASE_URL!,
      key: process.env.IMGPROXY_KEY!,
      salt: process.env.IMGPROXY_SALT!,
      encode: process.env.IMGPROXY_ENCODE === 'true',
    },
  };
}
