export interface IConfiguration {
  jwt: {
    secret: string;
    dataSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    iss: string;
  };
}

export interface JwtPayload {
  sub: string; // User ID
  // iss: string; // Issuer
  iat: number; // Issued at
  exp?: number; // Expiration
  type: string; // Type
  data: {
    user: {
      id: number;
      username: string;
      display_name?: string;
      email?: string;
      emailVerifiedAt?: Date;
      phoneVerifiedAt?: Date;
      status: string;
      createdAt?: Date;
    };
  };
}

export interface JwtRefreshPayload {
  // iss: string;
  iat: number;
  exp?: number;
  type: string;
  sub: string;
  data: {
    user: {
      id: number;
    };
  };
}
