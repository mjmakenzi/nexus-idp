import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';
import { AppleTokenInfo } from './apple.interface';

@Injectable()
export class AppleService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Validates Apple identity token and extracts user information
   */
  async validateAppleToken(identityToken: string): Promise<AppleTokenInfo> {
    try {
      // Get Apple configuration
      const config = this.getAppleConfig();

      // Verify the Apple identity token
      const tokenInfo = await appleSignin.verifyIdToken(identityToken, {
        audience: config.clientId, // Your Apple Client ID
        ignoreExpiration: false, // Don't ignore token expiration
      });

      return tokenInfo as unknown as AppleTokenInfo;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException(
        'Failed to validate Apple identity token: ' + errorMessage,
      );
    }
  }

  /**
   * Gets Apple access token using authorization code
   */
  async getAppleAccessToken(authorizationCode: string): Promise<string> {
    try {
      const config = this.getAppleConfig();

      // Generate client secret
      const clientSecret = appleSignin.getClientSecret({
        clientID: config.clientId,
        teamID: config.teamId,
        privateKey: config.privateKey,
        keyIdentifier: config.keyFileId,
      });

      // Exchange authorization code for access token
      const tokenResponse = await appleSignin.getAuthorizationToken(
        authorizationCode,
        {
          clientID: config.clientId,
          redirectUri: config.redirectUri,
          clientSecret: clientSecret,
        },
      );

      return tokenResponse.access_token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException(
        'Failed to get Apple access token: ' + errorMessage,
      );
    }
  }

  /**
   * Revokes Apple access token
   */
  async revokeAppleAccessToken(accessToken: string): Promise<boolean> {
    try {
      const config = this.getAppleConfig();

      // Generate client secret for revocation
      const clientSecret = appleSignin.getClientSecret({
        clientID: config.clientId,
        teamID: config.teamId,
        privateKey: config.privateKey,
        keyIdentifier: config.keyFileId,
      });

      // Revoke the access token
      await appleSignin.revokeAuthorizationToken(accessToken, {
        clientID: config.clientId,
        clientSecret: clientSecret,
        tokenTypeHint: 'access_token',
      });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException(
        'Failed to revoke Apple access token: ' + errorMessage,
      );
    }
  }

  /**
   * Gets Apple configuration from environment variables
   */
  private getAppleConfig() {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
    const teamId = this.configService.get<string>('APPLE_TEAM_ID');
    const keyFileId = this.configService.get<string>('APPLE_KEY_FILE_ID');
    const privateKey = this.configService.get<string>('APPLE_PRIVATE_KEY');
    const redirectUri = this.configService.get<string>('APPLE_REDIRECT_URI');

    if (!clientId || !teamId || !keyFileId || !privateKey || !redirectUri) {
      throw new Error(
        'Missing required Apple configuration environment variables',
      );
    }

    return {
      clientId,
      teamId,
      keyFileId,
      privateKey,
      redirectUri,
    };
  }
}
