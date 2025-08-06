import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateOtpDto,
  FindOtpDto,
  LoginPhoneDto,
  SendOtpPhoneDto,
} from '@app/auth';
import {
  OtpDeliveryMethod,
  OtpIdentifier,
  OtpPurpose,
  Severity,
  UserEntity,
} from '@app/db';
import { DevicesService } from '@app/devices';
import {
  CreateSecurityEventDto,
  FindRateLimitDto,
  SecurityService,
} from '@app/security';
import {
  CommonService,
  JwtService,
  KavenegarService,
  LoggerService,
} from '@app/shared-utils';
import {
  CreateUserDto,
  findUserByPhoneDto,
  ProfileService,
  UserService,
} from '@app/user';
import { EntityManager } from '@mikro-orm/postgresql';
import { FastifyRequest } from 'fastify';
import { OtpService } from './services/OTP/otp.service';
import { RevokedTokenService } from './services/revoked-token/revoked-token.service';
import { SessionService } from './services/session/session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly commonService: CommonService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly kavenegarService: KavenegarService,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly sessionService: SessionService,
    private readonly deviceService: DevicesService,
    private readonly securityService: SecurityService,
    private readonly revokedTokenService: RevokedTokenService,
    private readonly logger: LoggerService,
    private readonly em: EntityManager,
    private readonly config: ConfigService,
  ) {}

  async sendOtpPhone(req: FastifyRequest, dto: SendOtpPhoneDto) {
    const findUserByPhoneDto: findUserByPhoneDto = {
      countryCode: dto.country_code,
      phoneNumber: dto.phone_no,
    };
    const user: UserEntity | null =
      await this.userService.findUserByPhone(findUserByPhoneDto);

    // Use phone number for consistent rate limiting (both existing and non-existing users)
    const findRateLimitDto: FindRateLimitDto = {
      identifier: `${dto.country_code}${dto.phone_no}`,
      limitType: 'otp',
    };

    const rateLimit =
      await this.securityService.findRateLimit(findRateLimitDto);
    if (rateLimit && rateLimit.attempts >= rateLimit.maxAttempts) {
      throw new BadRequestException('Too many requests');
    }

    const createOtpDto: CreateOtpDto = {
      user: user,
      identifier: OtpIdentifier.PHONE,
      purpose: dto.type,
      deliveryMethod: OtpDeliveryMethod.SMS,
      userAgent: CommonService.getRequesterUserAgent(req),
      ipAddress: CommonService.getRequesterIpAddress(req),
      countryCode: dto.country_code,
      phoneNumber: dto.phone_no,
    };

    const otp = await this.otpService.createOtp(createOtpDto);

    this.logger.info('otp', { otp });

    // Use transaction for OTP creation and SMS sending
    return await this.executeOtpTransaction(dto, otp, req);
  }

  private async executeOtpTransaction(
    dto: SendOtpPhoneDto,
    otp: string,
    req: FastifyRequest,
  ) {
    return await this.em.transactional(async (em) => {
      const smsResult = await this.kavenegarService.sendOtpBySms(
        dto.phone_no,
        otp,
      );

      if (!smsResult) {
        // Clean up the created OTP if SMS fails
        try {
          await this.otpService.deleteOtp();
        } catch (error) {
          this.logger.error('Failed to cleanup OTP after SMS failure', {
            error,
          });
        }
        throw new Error('SMS sending failed');
      }

      // 6. Create security event
      try {
        const createSecurityEventDto: CreateSecurityEventDto = {
          user: null,
          req: req,
          session: null,
          eventType: 'otp_sent',
          eventCategory: 'auth',
          severity: Severity.LOW,
        };
        await this.securityService.createSecurityEvent(createSecurityEventDto);
      } catch (error) {
        this.logger.error('Failed to create security event', { error });
      }

      return { status: 'success', message: 'OTP sent successfully.' };
    });
  }

  async loginPhone(req: FastifyRequest, dto: LoginPhoneDto) {
    // Check rate limiting for login attempts
    const findRateLimitDto: FindRateLimitDto = {
      identifier: `${dto.country_code}${dto.phone_no}`,
      limitType: 'login',
    };

    const rateLimit =
      await this.securityService.findRateLimit(findRateLimitDto);
    if (rateLimit && rateLimit.attempts >= rateLimit.maxAttempts) {
      throw new BadRequestException('Too many login attempts');
    }

    //1. Check if OTP exists and is valid
    const findOtpDto: FindOtpDto = {
      identifier: OtpIdentifier.PHONE,
      purpose: OtpPurpose.LOGIN,
      countryCode: dto.country_code,
      phoneNumber: dto.phone_no,
    };

    const otp = await this.otpService.findOtp(findOtpDto);
    if (!otp) {
      return { status: 'error', message: 'invalid_otp' };
    }

    const valid = await this.commonService.compare(dto.otp, otp.otpHash);
    if (!valid) {
      otp.attempts += 1;
      if (otp.attempts >= otp.maxAttempts) {
        otp.expiresAt = new Date(); // immediately expire
      }
      await this.otpService.updateOtp(otp.id, otp);
      throw new BadRequestException('invalid_otp');
    }

    // Mark OTP as used after successful verification
    otp.isUsed = true;
    otp.verifiedAt = new Date();
    await this.otpService.updateOtp(otp.id, otp);

    // Use transaction for all database operations
    return await this.executeLoginTransaction(req, dto);
  }

  private async executeLoginTransaction(
    req: FastifyRequest,
    dto: LoginPhoneDto,
  ) {
    return await this.em.transactional(async (em) => {
      const findUserByPhoneDto: findUserByPhoneDto = {
        countryCode: dto.country_code,
        phoneNumber: dto.phone_no,
      };

      // 2. Find or register the user
      let user: UserEntity | null =
        await this.userService.findUserByPhone(findUserByPhoneDto);
      let eventAction = 'login';

      if (!user) {
        // Register new user
        eventAction = 'register/login';

        const createUserDto: CreateUserDto = {
          countryCode: dto.country_code,
          phoneNumber: dto.phone_no,
        };

        user = await this.userService.createUser(createUserDto);

        if (!user) {
          throw new Error('Failed to create user');
        }

        // Create profile for new user
        try {
          const profile = await this.profileService.createProfile(user);
          if (!profile) {
            this.logger.info('Failed to create profile for user', {
              userId: user.id,
            });
          }
        } catch (error) {
          this.logger.error('Error creating profile for user', {
            userId: user.id,
            error,
          });
          // Continue with login even if profile creation fails
        }
      } else {
        // Update phone verified if not set
        if (!user.phoneVerifiedAt) {
          const updateUserDto: Partial<UserEntity> = {
            phoneVerifiedAt: new Date(),
          };
          await this.userService.updateUser(user.id, updateUserDto);
        }
      }

      // 3. Create device
      const device = await this.deviceService.createDevice(user, req);

      // 4. Check session limits and enforce if necessary
      const maxSessionsPerUser = this.config.getOrThrow<number>(
        'session.maxSessionsPerUser',
      );
      const terminatedCount = await this.sessionService.enforceSessionLimit(
        Number(user.id),
        maxSessionsPerUser,
      );

      if (terminatedCount > 0) {
        this.logger.info('Session limit enforced', {
          userId: user.id,
          terminatedCount,
          maxSessions: maxSessionsPerUser,
        });
      }

      // 5. Create session
      const session = await this.sessionService.createSession(
        user,
        device,
        req,
      );

      // 6. Issue tokens
      const accessToken = await this.jwtService.issueAccessToken(user, session);
      const { refreshToken } = await this.jwtService.issueRefreshToken(
        user,
        session,
      );

      // 7. Update session with refresh token
      session.refreshTokenHash = await this.commonService.hash(refreshToken);
      await this.sessionService.updateSession(session);

      // 8. Create security event
      const createSecurityEventDto: CreateSecurityEventDto = {
        user: user,
        req: req,
        session: session,
        eventType: 'login',
        eventCategory: 'auth',
        severity: Severity.LOW,
      };
      await this.securityService.createSecurityEvent(createSecurityEventDto);

      return {
        status: 'success',
        data: {
          user_id: String(user.id),
          session_id: String(session.sessionId),
          access_token: accessToken,
          token_type: 'bearer',
          refresh_token: refreshToken,
          action: eventAction,
        },
      };
    });
  }

  async refreshToken(req: FastifyRequest) {
    try {
      const session = (req as any).user;

      const accessToken = await this.jwtService.issueAccessToken(
        session.user,
        session,
      );
      const { refreshToken: newRefreshToken, expiresIn } =
        await this.jwtService.issueRefreshToken(session.user, session);
      session.expiresAt = new Date(Date.now() + expiresIn * 1000); // 15 days
      session.lastActivityAt = new Date();
      // session.userAgent = CommonService.getRequesterUserAgent(req);
      // session.ipAddress = CommonService.getRequesterIpAddress(req);
      session.refreshTokenHash = await this.commonService.hash(newRefreshToken);
      await this.sessionService.updateSession(session);
      // const createSecurityEventDto: CreateSecurityEventDto = {
      //   user: session.user,
      //   req: req,
      //   session: session,
      //   eventType: 'refresh',
      //   eventCategory: 'auth',
      //   severity: 'info',
      // };
      // await this.securityService.createSecurityEvent(createSecurityEventDto);

      return {
        status: 'success',
        data: {
          session_id: String(session.id),
          access_token: accessToken,
          refresh_token: newRefreshToken,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(req: FastifyRequest) {
    const session = (req as any).user;
    session.terminatedAt = new Date();
    session.terminationReason = 'logout';
    await this.sessionService.updateSession(session);
    await this.deviceService.updateDevice(session.device);
    await this.revokedTokenService.createRevokedToken(session);
    const createSecurityEventDto: CreateSecurityEventDto = {
      user: session.user,
      req: req,
      session: session,
      eventType: 'logout',
      eventCategory: 'auth',
      severity: Severity.INFO,
    };
    await this.securityService.createSecurityEvent(createSecurityEventDto);
    return {
      status: 'success',
      message: 'You have been successfully logged out!',
    };
  }

  // async googleLogin(dto: GoogleLoginDto) {
  //   try {
  //     // Validate Google token
  //     const tokenInfo = await this.validateGoogleToken(dto.idToken);

  //     const googleId = dto.user.id;
  //     const email = tokenInfo.email;

  //     // Validate that the email matches
  //     if (email !== dto.user.email) {
  //       throw new BadRequestException('Email mismatch');
  //     }

  //     // Check if user exists by Google ID or email
  //     let user = await this.userRepository.getUserByGoogleId(googleId);
  //     if (!user) {
  //       user = await this.userRepository.getUserByEmail(email);
  //     }

  //     let eventAction = 'login';

  //     if (!user) {
  //       // Register new user
  //       eventAction = 'register/login';
  //       const username = await this.commonService.generateRandomUserName();

  //       user = await this.userRepository.createGoogleUser(
  //         email,
  //         username,
  //         googleId,
  //         dto.user.givenName,
  //         dto.user.familyName,
  //         dto.user.name,
  //       );

  //       // Create profile for the user
  //       const profile = await this.profileRepository.createProfile(user, {
  //         firstName: dto.user.givenName,
  //         lastName: dto.user.familyName,
  //         displayName: dto.user.name,
  //       });

  //       await this.em.persistAndFlush(profile);
  //     } else {
  //       // Update existing user's Google ID if not set
  //       // if (
  //       //   !user.federatedIdentities.some(
  //       //     (identity: FederatedIdentityEntity) =>
  //       //       identity.provider === 'google' &&
  //       //       identity.providerUserId === googleId,
  //       //   )
  //       // ) {
  //       //   user.federatedIdentities.add({
  //       //     provider: 'google',
  //       //     providerUserId: googleId,
  //       //   });
  //       //   await this.em.flush();
  //       // }
  //       // // Update email verification if not verified
  //       // if (!user.emailVerifiedAt) {
  //       //   user.emailVerifiedAt = new Date();
  //       //   await this.em.flush();
  //       // }
  //     }

  //     // Generate JWT tokens
  //     // const accessToken = this.jwtService.issueAccessToken(user);
  //     // const refreshToken = this.jwtService.issueRefreshToken(user);

  //     return {
  //       status: 'success',
  //       data: {
  //         user_id: user.id.toString(),
  //         access_token: accessToken,
  //         token_type: 'bearer',
  //         refresh_token: refreshToken,
  //         action: eventAction,
  //       },
  //     };
  //   } catch (error) {
  //     if (
  //       error instanceof BadRequestException ||
  //       error instanceof UnauthorizedException
  //     ) {
  //       throw error;
  //     }
  //     throw new BadRequestException('Google login failed');
  //   }
  // }

  // async appleLogin(dto: AppleLoginDto) {
  //   try {
  //     // Validate Apple identity token
  //     const tokenInfo = await this.appleService.validateAppleToken(
  //       dto.identityToken,
  //     );

  //     // Get Apple access token
  //     const accessToken = await this.appleService.getAppleAccessToken(
  //       dto.authorizationCode,
  //     );

  //     const appleId = tokenInfo.sub;
  //     const email = tokenInfo.email;

  //     // Check if user exists by Apple ID or email
  //     let user = await this.userRepository.getUserByAppleId(appleId);
  //     if (!user && email) {
  //       user = await this.userRepository.getUserByEmail(email);
  //     }

  //     let eventAction = 'login';

  //     if (!user) {
  //       // Register new user
  //       eventAction = 'register/login';
  //       const username = await this.commonService.generateRandomUserName();

  //       user = await this.userRepository.createAppleUser(
  //         email,
  //         username,
  //         appleId,
  //         dto.name,
  //       );

  //       // Create profile for the user
  //       const profile = await this.profileRepository.createProfile(user, {
  //         displayName: dto.name || 'Apple User',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       });

  //       await this.em.persistAndFlush(profile);
  //     } else if (user) {
  //       // Update existing user's Apple ID if not set
  //       // if (
  //       //   !user.federatedIdentities.some(
  //       //     (identity) =>
  //       //       identity.provider === 'apple' &&
  //       //       identity.providerUserId === appleId,
  //       //   )
  //       // ) {
  //       //   user.federatedIdentities.add({
  //       //     provider: 'apple',
  //       //     providerUserId: appleId,
  //       //   });
  //       //   await this.em.flush();
  //       // }

  //       // Update email verification if not verified and email is available
  //       if (email && !user.emailVerifiedAt) {
  //         user.emailVerifiedAt = new Date();
  //         await this.em.flush();
  //       }
  //     }

  //     // Generate JWT tokens
  //     const jwtAccessToken = this.jwtService.issueAccessToken(user);
  //     const jwtRefreshToken = this.jwtService.issueRefreshToken(user);

  //     return {
  //       status: 'success',
  //       data: {
  //         user_id: user.id.toString(),
  //         access_token: jwtAccessToken,
  //         token_type: 'bearer',
  //         refresh_token: jwtRefreshToken,
  //         action: eventAction,
  //         apple_access_token: accessToken,
  //       },
  //     };
  //   } catch (error) {
  //     if (
  //       error instanceof BadRequestException ||
  //       error instanceof UnauthorizedException
  //     ) {
  //       throw error;
  //     }
  //     throw new BadRequestException('Apple login failed');
  //   }
  // }

  // async appleLogout(dto: AppleLogoutDto) {
  //   try {
  //     // Revoke Apple access token using the Apple service
  //     await this.appleService.revokeAppleAccessToken(dto.apple_access_token);

  //     return {
  //       status: 'success',
  //       message: 'Apple access token successfully revoked.',
  //     };
  //   } catch (error) {
  //     if (error instanceof UnauthorizedException) {
  //       throw error;
  //     }
  //     throw new BadRequestException('Apple logout failed');
  //   }
  // }

  // async logout(req: FastifyRequest) {
  //   try {
  //     // Get user ID from JWT token (handled by JWT guard)
  //     const user = (req as any).user;
  //     if (!user || !user.userId) {
  //       throw new UnauthorizedException('User not authenticated');
  //     }

  //     const userId = user.userId;
  //     const refreshToken = this.extractTokenFromRequest(req);

  //     // Check if token is already revoked
  //     // const existingRevokedToken =
  //     //   await this.revokedTokenRepository.getRevokedToken(
  //     //     userId,
  //     //     refreshToken,
  //     //     0, // refresh token type
  //     //   );

  //     // if (existingRevokedToken) {
  //     //   throw new UnauthorizedException('Token already revoked');
  //     // }

  //     // Get token payload to extract expiration
  //     const tokenPayload = this.jwtService.verifyToken(refreshToken, 'refresh');
  //     if (!tokenPayload) {
  //       throw new UnauthorizedException('Invalid refresh token');
  //     }

  //     const userAgent = CommonService.getRequesterUserAgent(req);
  //     const ip = CommonService.getRequesterIpAddress(req);

  //     // Create revoked token record
  //     // const revokedToken = await this.revokedTokenRepository.createRevokedToken(
  //     //   userId,
  //     //   refreshToken,
  //     //   0,
  //     //   userAgent,
  //     //   ip,
  //     //   new Date(tokenPayload.exp * 1000),
  //     //   new Date(),
  //     // );

  //     // await this.em.persistAndFlush(revokedToken);

  //     // Terminate device session
  //     const terminateDate = new Date();
  //     // await this.deviceRepository.nativeUpdate(
  //     //   { refreshToken },
  //     //   { terminatedAt: terminateDate },
  //     // );

  //     // // Delete expired tokens from revoked tokens table
  //     // await this.revokedTokenRepository.nativeDelete({
  //     //   expiredAt: { $lte: new Date() },
  //     // });

  //     // Logout user from Discourse
  //     await this.discourseService.logoutUser(userId);

  //     return {
  //       status: 'success',
  //       message: 'You have been successfully logged out!',
  //     };
  //   } catch (error) {
  //     if (error instanceof UnauthorizedException) {
  //       throw error;
  //     }
  //     throw new BadRequestException('Logout failed');
  //   }
  // }

  // private extractTokenFromRequest(req: FastifyRequest): string {
  //   const authHeader = req.headers.authorization;
  //   if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //     throw new UnauthorizedException('Invalid authorization header');
  //   }
  //   return authHeader.substring(7); // Remove 'Bearer ' prefix
  // }

  // private async validateGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
  //   try {
  //     const response = await fetch(
  //       `https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=${idToken}`,
  //       {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );

  //     if (!response.ok) {
  //       throw new UnauthorizedException('Invalid Google token');
  //     }

  //     const tokenInfo = await response.json();

  //     if (tokenInfo.error) {
  //       throw new UnauthorizedException(
  //         `Google token validation failed: ${tokenInfo.error}`,
  //       );
  //     }

  //     return tokenInfo;
  //   } catch (error) {
  //     if (error instanceof UnauthorizedException) {
  //       throw error;
  //     }
  //     throw new UnauthorizedException('Failed to validate Google token');
  //   }
  // }
}
