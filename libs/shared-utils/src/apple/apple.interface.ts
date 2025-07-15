export interface IConfiguration {
  apple: {
    clientId: string;
    teamId: string;
    keyFileId: string;
    keyFilePath: string;
    redirectUri: string;
  };
}

export interface AppleTokenInfo {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  nonce?: string;
  at_hash?: string;
  auth_time?: number;
  nonce_supported?: boolean;
  email?: string;
  email_verified?: string;
  is_private_email?: string;
}
