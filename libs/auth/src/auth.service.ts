import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
  UserEntity,
} from '@app/db';
import { DevicesService } from '@app/devices';
import { CreateDeviceDto } from '@app/devices/device.dto';
import { SecurityService } from '@app/security';
import { FindRateLimitDto } from '@app/security/dto/rate-limit.dto';
import { CreateSecurityEventDto } from '@app/security/dto/security-event.dto';
import { CommonService, JwtService, KavenegarService } from '@app/shared-utils';
import {
  CreateUserDto,
  findUserByPhoneDto,
  ProfileService,
  UserService,
} from '@app/user';
import { FastifyRequest } from 'fastify';
import { CreateSessionDto } from './dto/session.dto';
import { OtpService } from './services/OTP/otp.service';
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
  ) {}

  async sendOtpPhone(req: FastifyRequest, dto: SendOtpPhoneDto) {
    const findUserByPhoneDto: findUserByPhoneDto = {
      countryCode: dto.country_code,
      phoneNumber: dto.phone_no,
    };
    const user: UserEntity | null =
      await this.userService.findUserByPhone(findUserByPhoneDto);

    const findRateLimitDto: FindRateLimitDto = {
      identifier: user?.id.toString() || '',
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
    };

    const otp = await this.otpService.createOtp(createOtpDto);

    const smsResult = await this.kavenegarService.sendOtpBySms(
      dto.phone_no,
      otp,
    );

    if (!smsResult) {
      return { status: 'error', message: 'sms_error' };
    }

    return { status: 'success', message: 'OTP sent successfully.' };
  }

  async loginPhone(req: FastifyRequest, dto: LoginPhoneDto) {
    // 1. Check if OTP exists and is valid
    const findOtpDto: FindOtpDto = {
      identifier: OtpIdentifier.PHONE,
      purpose: OtpPurpose.LOGIN,
    };

    const otp = await this.otpService.findByExpiredOtp(findOtpDto);
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

    // 2. Delete the OTP after use
    // await this.otpService.deleteOtp();

    const findUserByPhoneDto: findUserByPhoneDto = {
      countryCode: dto.country_code,
      phoneNumber: dto.phone_no,
    };

    // 3. Find or register the user
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
        return { status: 'error', message: 'db_error_insert' };
      }

      // await this.profileService.createProfile(user, createProfileDto);

      // Optionally: sync to Discourse, etc.
      // await this.discourseService.syncSsoRecord(user);
    } else {
      // Update phone verified if not set
      if (!user.phoneVerifiedAt) {
        const updateUserDto: Partial<UserEntity> = {
          phoneVerifiedAt: new Date(),
        };
        await this.userService.updateUser(user.id, updateUserDto);
      }
    }

    const createDeviceDto: CreateDeviceDto = {
      user: user,
      deviceFingerprint: req.headers['x-device-fingerprint'] as string,
      deviceType: 'web',
      isTrusted: false,
      userAgent: CommonService.getRequesterUserAgent(req),
      lastIpAddress: CommonService.getRequesterIpAddress(req),
      deviceName: req.headers['x-device-name'] as string,
      osName: req.headers['x-os-name'] as string,
      osVersion: req.headers['x-os-version'] as string,
      browserName: req.headers['x-browser-name'] as string,
      browserVersion: req.headers['x-browser-version'] as string,
    };

    const device = await this.deviceService.createDevice(createDeviceDto);

    const accessTokenHash = this.commonService.hash(
      await this.jwtService.issueAccessToken(user),
    );
    const refreshTokenHash = this.commonService.hash(
      await this.jwtService.issueRefreshToken(user),
    );

    const createSessionDto: CreateSessionDto = {
      user: user,
      device: device,
      ipAddress: CommonService.getRequesterIpAddress(req),
      userAgent: CommonService.getRequesterUserAgent(req),
      accessTokenHash: await accessTokenHash,
      refreshTokenHash: await refreshTokenHash,
    };

    const session = await this.sessionService.createSession(createSessionDto);

    const createSecurityEventDto: CreateSecurityEventDto = {
      user: user,
      device: device,
      session: session,
      eventType: 'login',
      eventCategory: 'auth',
      severity: 'low',
    };

    await this.securityService.createSecurityEvent(createSecurityEventDto);

    // 4. Issue tokens
    const accessToken = await this.jwtService.issueAccessToken(user);
    const refreshToken = await this.jwtService.issueRefreshToken(user);

    return {
      status: 'success',
      data: {
        user_id: String(user.id),
        session_id: String(session.id),
        access_token: accessToken,
        token_type: 'bearer',
        refresh_token: refreshToken,
        action: eventAction,
      },
    };
  }

  async refreshToken(req: FastifyRequest) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid authorization header');
      }
      const refreshToken = authHeader.substring(7);
      const payload = await this.jwtService.verifyToken(refreshToken);
      if (!payload) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      // const user = await this.userService.findUserByPhone(Number(payload.sub));
      const user = null;
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const accessToken = await this.jwtService.issueAccessToken(user);
      const newRefreshToken = await this.jwtService.issueRefreshToken(user);
      return {
        status: 'success',
        data: {
          access_token: accessToken,
          refresh_token: newRefreshToken,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
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
