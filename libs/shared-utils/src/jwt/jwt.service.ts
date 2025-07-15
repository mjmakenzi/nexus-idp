import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { DeviceRepository, RevokedTokenRepository, UserEntity } from '@app/db';
import { EntityManager } from '@mikro-orm/postgresql';
import { createHmac, randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';
import { AvatarService } from '../avatar/avatar.service';
import { CommonService } from '../common/common.service';

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly config: ConfigService,
    private readonly deviceRepository: DeviceRepository,
    private readonly revokedTokenRepository: RevokedTokenRepository,
    private readonly em: EntityManager,
    private readonly commonService: CommonService,
    private readonly avatarService: AvatarService,
  ) {}

  // async issueAccessToken(user: UserEntity) {
  //   return await this.issueNewJwtToken(15 * 60, 'access', user); // 15 min
  // }

  // async issueRefreshToken(
  //   user: UserEntity,
  //   currentRefreshToken?: string,
  //   req?: FastifyRequest,
  // ): Promise<string> {
  //   const expirationSeconds = 90 * 24 * 60 * 60; // 90 days

  //   // If no current refresh token, issue new one (equivalent to PHP's first condition)
  //   if (!currentRefreshToken) {
  //     return await this.issueNewJwtToken(
  //       expirationSeconds,
  //       'refresh',
  //       user,
  //       currentRefreshToken,
  //       req,
  //     );
  //   }

  //   // Get current token payload to check expiration
  //   const currentTokenPayload = this.verifyToken(
  //     currentRefreshToken,
  //     'refresh',
  //   );
  //   if (!currentTokenPayload) {
  //     // Invalid token, issue new one
  //     return await this.issueNewJwtToken(
  //       expirationSeconds,
  //       'refresh',
  //       user,
  //       currentRefreshToken,
  //       req,
  //     );
  //   }

  //   // Check if token is within 1 week of expiration (equivalent to PHP logic)
  //   const currentDate = new Date();
  //   const expireDate = new Date(currentTokenPayload.exp * 1000);
  //   const oneWeekBeforeExpireDate = new Date(
  //     expireDate.getTime() - 7 * 24 * 60 * 60 * 1000,
  //   ); // 1 week before

  //   if (currentDate >= oneWeekBeforeExpireDate) {
  //     // Token is within 1 week of expiry, issue new token (rotate)
  //     return await this.issueNewJwtToken(
  //       expirationSeconds,
  //       'refresh',
  //       user,
  //       currentRefreshToken,
  //       req,
  //     );
  //   } else {
  //     // Token is still valid and not close to expiry, just update device activity
  //     if (req) {
  //       await this.updateDeviceActivity(user, currentRefreshToken, req);
  //     }
  //     return currentRefreshToken; // Return the same token
  //   }
  // }

  // private async issueNewJwtToken(
  //   expirationSeconds: number,
  //   type: 'access' | 'refresh',
  //   user: UserEntity,
  //   currentRefreshToken?: string,
  //   req?: FastifyRequest,
  // ): Promise<string> {
  //   if (!user || !user.id) {
  //     throw new Error('User must be defined');
  //   }

  //   const userId = user.id.toString();
  //   const secretKey = this.config.getOrThrow<string>('jwt.secret');
  //   const dataSecretKey = this.config.getOrThrow<string>('jwt.dataSecret');

  //   // Generate user data key (equivalent to PHP's User_Helpers::get_user_data_key)
  //   // TODO: Implement proper user data key logic from user entity or generate/store it
  //   const userDataKey = this.commonService.generateRandomUserDataKey();

  //   // Generate avatar URL (equivalent to PHP's Avatar_Helpers)
  //   // TODO: Check if user has avatar file and use imgproxy URL, otherwise use default
  //   const avatarUrl = this.avatarService.generateDefaultAvatarUrl();

  //   const issuedAt = Math.floor(Date.now() / 1000);
  //   const expirationTime = issuedAt + expirationSeconds;

  //   // Get subscription plan (equivalent to PHP's get_user_meta logic)
  //   // TODO: Add subscription fields to user entity or implement subscription service
  //   // For now, default to 'basic' until subscription fields are added to ProfileEntity
  //   const subscriptionPlan = 'basic';

  //   // Build user payload based on token type
  //   const userAccess = {
  //     id: userId,
  //     username: user.username,
  //     display_name: user.profile?.displayName || user.username,
  //     hk: createHmac('sha256', dataSecretKey)
  //       .update(`${userDataKey}.${userId}`)
  //       .digest('hex')
  //       .substring(0, 32),
  //     email: user.email,
  //     phone: user.phoneNumber,
  //     email_verified: user.emailVerifiedAt,
  //     phone_verified: user.phoneVerifiedAt,
  //     identity_verified: user.identityVerifiedAt,
  //     avatar: encodeURIComponent(avatarUrl),
  //     plan: subscriptionPlan,
  //   };

  //   const userRefresh = {
  //     id: userId,
  //   };

  //   const payload = {
  //     iss: this.config.getOrThrow<string>('jwt.iss'),
  //     iat: issuedAt,
  //     exp: expirationTime,
  //     type: type,
  //     sub: userId,
  //     data: {
  //       user: type === 'access' ? userAccess : userRefresh,
  //     },
  //   };

  //   const token = this.jwtService.sign(payload, {
  //     secret: secretKey,
  //   });

  //   // Handle refresh token device management (equivalent to PHP's device table logic)
  //   if (type === 'refresh' && req) {
  //     await this.handleRefreshTokenDevice(
  //       user,
  //       token,
  //       currentRefreshToken,
  //       req,
  //     );
  //   }

  //   return token;
  // }

  // private async handleRefreshTokenDevice(
  //   user: UserEntity,
  //   newToken: string,
  //   currentRefreshToken?: string,
  //   req?: FastifyRequest,
  // ): Promise<void> {
  //   if (!req) return;

  //   let currentDevice = null;

  //   // If we have a current refresh token, try to find the existing device
  //   // if (currentRefreshToken) {
  //   //   currentDevice = await this.deviceRepository.findDevice(
  //   //     user,
  //   //     currentRefreshToken,
  //   //   );
  //   // }

  //   if (!currentDevice) {
  //     const deviceType = CommonService.getRequesterDeviceType(req);
  //     const deviceInfo = CommonService.getRequesterDeviceInfo(req);
  //     const userAgent = CommonService.getRequesterUserAgent(req);
  //     const ip = CommonService.getRequesterIpAddress(req);
  //     const deviceId = randomUUID();
  //     const expiredOn = new Date(this.getTokenExpiration(newToken));

  //     // Create new device record
  //     const device = await this.deviceRepository.createDevice(
  //       user,
  //       newToken,
  //       deviceType,
  //       deviceInfo,
  //       deviceId,
  //       userAgent,
  //       ip,
  //       expiredOn,
  //     );

  //     await this.em.persistAndFlush(device);
  //   } else {
  //     // First, insert the old refresh token into revoked_tokens table
  //     if (currentDevice.deviceFingerprint) {
  //       const oldTokenPayload = this.verifyToken(
  //         currentDevice.deviceFingerprint,
  //         'refresh',
  //       );
  //       if (oldTokenPayload) {
  //         const userAgent = CommonService.getRequesterUserAgent(req);
  //         const ip = CommonService.getRequesterIpAddress(req);

  //         const revokedToken =
  //           await this.revokedTokenRepository.createRevokedToken(
  //             user,
  //             currentDevice.deviceFingerprint,
  //             0,
  //             userAgent,
  //             ip,
  //             new Date(oldTokenPayload.exp * 1000),
  //             new Date(),
  //           );

  //         await this.em.persist(revokedToken);
  //       }
  //     }

  //     // Then update the device record with the new refresh token
  //     currentDevice.deviceFingerprint = newToken;
  //     currentDevice.userAgent = CommonService.getRequesterUserAgent(req);
  //     currentDevice.lastIpAddress = CommonService.getRequesterIpAddress(req);
  //     currentDevice.lastSeenAt = new Date(this.getTokenExpiration(newToken));

  //     await this.em.flush();
  //   }
  // }

  // private async updateDeviceActivity(
  //   user: UserEntity,
  //   currentRefreshToken: string,
  //   req: FastifyRequest,
  // ): Promise<void> {
  //   // Equivalent to PHP's device update logic when not rotating token
  //   const device = await this.deviceRepository.findOne({
  //     user: { id: user.id },
  //     deviceFingerprint: currentRefreshToken,
  //     blockedAt: null,
  //   });

  //   if (device) {
  //     device.userAgent = CommonService.getRequesterUserAgent(req);
  //     device.lastIpAddress = CommonService.getRequesterIpAddress(req);
  //     device.lastSeenAt = new Date();

  //     await this.em.flush();
  //   }
  // }

  // private getTokenExpiration(token: string): number {
  //   try {
  //     const payload = this.jwtService.verify(token, {
  //       secret: this.config.getOrThrow<string>('jwt.secret'),
  //     });
  //     return payload.exp * 1000; // Convert to milliseconds
  //   } catch {
  //     return Date.now() + 90 * 24 * 60 * 60 * 1000; // Default 90 days
  //   }
  // }

  // verifyToken(token: string, type?: string): any | null {
  //   try {
  //     const payload = this.jwtService.verify(token, {
  //       secret: this.config.getOrThrow<string>('jwt.secret'),
  //     });
  //     if (type && payload.type !== type) return null;
  //     if (payload.exp * 1000 < Date.now()) return null;
  //     return payload;
  //   } catch {
  //     return null;
  //   }
  // }

  // getUserIdFromToken(token: string, type?: string): number | null {
  //   const payload = this.verifyToken(token, type);
  //   return payload?.data?.user?.id ?? null;
  // }

  // private buildUserPayload(user: UserEntity, type: 'access' | 'refresh') {
  //   if (type === 'refresh') {
  //     return { id: user.id };
  //   }
  //   // Add more fields as needed for access tokens
  //   return {
  //     id: user.id,
  //     username: user.username,
  //     display_name: user.profile?.displayName || user.username,
  //     email: user.email,
  //     phone: user.phoneNumber,
  //     email_verified: user.emailVerifiedAt,
  //     phone_verified: user.phoneVerifiedAt,
  //     identity_verified: user.identityVerifiedAt,
  //     avatar: this.avatarService.generateDefaultAvatarUrl(),
  //     plan: 'basic',
  //   };
  // }

  // extractTokenFromRequest(token: string | undefined): string | null {
  //   if (!token || !token.startsWith('Bearer ')) {
  //     return null;
  //   }
  //   return token.substring(7);
  // }
}
