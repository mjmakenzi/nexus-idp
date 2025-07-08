import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '@app/db';
import { ProfileRepository } from '@app/db';
import { CommonService, JwtService } from '@app/shared-utils';
import { EntityManager } from '@mikro-orm/postgresql';
import { GoogleTokenInfo } from './auth.interface';
import { AppleLoginDto, GoogleLoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly profileRepository: ProfileRepository,
    private readonly em: EntityManager,
    private readonly commonService: CommonService,
  ) {}

  async googleLogin(dto: GoogleLoginDto) {
    try {
      // Validate Google token
      const tokenInfo = await this.validateGoogleToken(dto.idToken);

      const googleId = dto.user.id;
      const email = tokenInfo.email;

      // Validate that the email matches
      if (email !== dto.user.email) {
        throw new BadRequestException('Email mismatch');
      }

      // Check if user exists by Google ID or email
      let user = await this.userRepository.getUserByGoogleId(googleId);
      if (!user) {
        user = await this.userRepository.getUserByEmail(email);
      }

      let eventAction = 'login';

      if (!user) {
        // Register new user
        eventAction = 'register/login';
        const username = await this.commonService.generateRandomUserName();

        user = await this.userRepository.createGoogleUser(
          email,
          username,
          googleId,
          dto.user.givenName,
          dto.user.familyName,
          dto.user.name,
        );

        // Create profile for the user
        const profile = await this.profileRepository.createProfile(user, {
          firstName: dto.user.givenName,
          lastName: dto.user.familyName,
          displayName:
            dto.user.name ||
            `${dto.user.givenName} ${dto.user.familyName}`.trim(),
        });

        await this.em.persistAndFlush(profile);
      } else {
        // Update existing user's Google ID if not set
        if (!user.googleId) {
          user.googleId = googleId;
          await this.em.flush();
        }

        // Update email verification if not verified
        if (!user.emailVerified) {
          user.emailVerified = true;
          user.emailVerifiedOn = new Date();
          await this.em.flush();
        }
      }

      // Generate JWT tokens
      const accessToken = this.jwtService.issueAccessToken(user);
      const refreshToken = this.jwtService.issueRefreshToken(user);

      return {
        status: 'success',
        data: {
          user_id: user.id.toString(),
          access_token: accessToken,
          token_type: 'bearer',
          refresh_token: refreshToken,
          action: eventAction,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Google login failed');
    }
  }

  async appleLogin(dto: AppleLoginDto) {
    return {
      status: 'success',
      data: {
        message: 'Apple login successful',
      },
    };
  }

  private async validateGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=${idToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const tokenInfo = await response.json();

      if (tokenInfo.error) {
        throw new UnauthorizedException(
          `Google token validation failed: ${tokenInfo.error}`,
        );
      }

      return tokenInfo;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to validate Google token');
    }
  }
}
