import {
  BadRequestException,
  Injectable,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '@app/db';
import { ProfileRepository } from '@app/db';
import { DeviceRepository, RevokedTokenRepository } from '@app/db';
import { FederatedIdentityEntity } from '@app/db/entities/federated-identity.entity';
import { AuditLogRepository } from '@app/db/repositories/audit-log.repository';
import {
  AppleService,
  CommonService,
  DiscourseService,
  JwtService,
} from '@app/shared-utils';
import { EntityManager } from '@mikro-orm/postgresql';
import { FastifyRequest } from 'fastify';
import { AppleLoginDto, AppleLogoutDto, GoogleLoginDto } from '../dto/auth.dto';
import { GoogleTokenInfo } from '../interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor() // private readonly userRepository: UserRepository,
  // private readonly jwtService: JwtService,
  // private readonly profileRepository: ProfileRepository,
  // private readonly revokedTokenRepository: RevokedTokenRepository,
  // private readonly deviceRepository: DeviceRepository,
  // private readonly em: EntityManager,
  // private readonly commonService: CommonService,
  // private readonly appleService: AppleService,
  // private readonly discourseService: DiscourseService,
  // private readonly auditLogRepository: AuditLogRepository,
  {}

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
