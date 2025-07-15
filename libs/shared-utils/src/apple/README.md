‍# Apple Sign In Authentication

This module provides Apple Sign In authentication functionality using the `apple-signin-auth` package.

## Features

- ✅ Apple ID token validation and verification
- ✅ Authorization code to access token exchange
- ✅ Access token revocation
- ✅ JWT token handling with Apple's public keys
- ✅ TypeScript support with full type definitions

## Setup

### 1. Apple Developer Account Setup

1. Enroll in the Apple Developer Program
2. Create an App ID in your Apple Developer Account
3. Enable "Sign in with Apple" capability
4. Create a Service ID for your application
5. Generate a private key for your Service ID
6. Download the private key file (.p8)

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Apple Sign In Configuration
APPLE_CLIENT_ID=com.yourcompany.yourapp
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_FILE_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----
APPLE_REDIRECT_URI=https://yourdomain.com/auth/apple/callback
```

### 3. Configuration Details

- **APPLE_CLIENT_ID**: Your Apple Client ID (Service ID)
- **APPLE_TEAM_ID**: Your Apple Developer Team ID
- **APPLE_KEY_FILE_ID**: The key identifier from your private key
- **APPLE_PRIVATE_KEY**: The private key content (can be multiline)
- **APPLE_REDIRECT_URI**: Your application's redirect URI

## Usage

### AppleService Methods

```typescript
import { AppleService } from '@app/shared-utils';

@Injectable()
export class AuthService {
  constructor(private readonly appleService: AppleService) {}

  async appleLogin(identityToken: string, authorizationCode: string) {
    // Validate Apple identity token
    const tokenInfo = await this.appleService.validateAppleToken(identityToken);
    
    // Exchange authorization code for access token
    const accessToken = await this.appleService.getAppleAccessToken(authorizationCode);
    
    // Use tokenInfo.sub as Apple user ID
    const appleUserId = tokenInfo.sub;
    
    // Your authentication logic here...
  }

  async appleLogout(accessToken: string) {
    // Revoke Apple access token
    await this.appleService.revokeAppleAccessToken(accessToken);
  }
}
```

### Token Information

The `validateAppleToken` method returns an `AppleTokenInfo` object with:

```typescript
interface AppleTokenInfo {
  iss: string;           // Issuer (always "https://appleid.apple.com")
  aud: string;           // Audience (your client ID)
  exp: number;           // Expiration time
  iat: number;           // Issued at time
  sub: string;           // Subject (Apple user ID)
  nonce?: string;        // Nonce (if provided)
  at_hash?: string;      // Access token hash
  auth_time?: number;    // Authentication time
  nonce_supported?: boolean;
  email?: string;        // User's email (if provided)
  email_verified?: string; // Email verification status
  is_private_email?: string; // Whether email is private relay
}
```

## Security Features

- **JWT Verification**: Uses Apple's public keys for token verification
- **Automatic Key Rotation**: Handles Apple's public key rotation
- **Token Expiration**: Validates token expiration times
- **Audience Validation**: Ensures tokens are intended for your application

## Error Handling

The service throws `UnauthorizedException` for:
- Invalid token format
- Expired tokens
- Invalid audience
- Failed token exchange
- Failed token revocation

## Dependencies

- `apple-signin-auth`: Apple Sign In authentication library
- `@nestjs/common`: NestJS framework
- `@nestjs/config`: Configuration management

## Notes

- The private key should be stored securely (consider using a secrets manager in production)
- Apple's public keys are automatically cached and refreshed when needed
- The service handles Apple's key rotation automatically
- All methods are async and return Promises 