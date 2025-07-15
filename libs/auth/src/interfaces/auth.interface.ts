export interface GoogleTokenInfo {
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  sub: string;
}

export interface AppleTokenInfo {
  sub: string;
  email: string;
  email_verified: string;
  is_private_email: string;
}

export interface AppleAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
}
