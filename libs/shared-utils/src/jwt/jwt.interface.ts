export interface IConfiguration {
  jwt: {
    secret: string;
    refreshSecret: string;
    dataSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    iss: string;
  };
}

export interface IAccessPayload {
  sub: string; // User ID
  iss: string; // Issuer
  iat: number; // Issued at
  exp?: number; // Expiration
  type: string; // Type
  sessionId: string; // Session ID
  data: {
    user: {
      id: bigint;
      username: string;
      display_name?: string;
      email?: string;
      emailVerifiedAt?: Date;
      phoneVerifiedAt?: Date;
      // status: string;
      createdAt?: Date;
    };
  };
}

export interface IRefreshPayload {
  iss: string;
  iat: number;
  exp?: number;
  type: string;
  sub: string;
  sessionId: string;
  data: {
    user: {
      id: bigint;
    };
  };
}
