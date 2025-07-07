export interface IConfiguration {
  minio: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    useSsl: boolean;
  };
  imgproxy: {
    baseUrl: string;
    key: string;
    salt: string;
    encode: boolean;
  };
}
