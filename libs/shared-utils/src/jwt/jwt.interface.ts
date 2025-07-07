export interface IConfiguration {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    iss: string;
  };
}
