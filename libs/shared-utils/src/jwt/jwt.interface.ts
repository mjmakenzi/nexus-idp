export interface IConfiguration {
  jwt: {
    secret: string;
    dataSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    iss: string;
  };
}
