import { Injectable } from '@nestjs/common';
import { SendOtpPhoneDto } from '@app/auth';
import { OtpRepository, UserRepository } from '@app/db';
import { CommonService, KavenegarService } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';

@Injectable()
export class OtpService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly otpRepo: OtpRepository,
    private readonly kavenegarService: KavenegarService,
  ) {}

  async sendOtpPhone(
    req: FastifyRequest,
    dto: SendOtpPhoneDto,
  ): Promise<{ status: string; message: string }> {
    // 1. Find user by phone
    const user = await this.userRepo.getUserByPhone(dto);

    // 2. Check for recent OTP (limit)
    const validOtp = await this.otpRepo.getRecentOtp(dto);
    if (validOtp) {
      return { status: 'error', message: 'otp_limit' };
    }

    // 3. Delete expired OTPs (older than 1 day)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.otpRepo.nativeDelete({ expiresAt: { $lte: yesterday } });

    // 4. Generate OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // 5. Insert OTP
    const userAgent = CommonService.getRequesterUserAgent(req);
    const ip = CommonService.getRequesterIpAddress(req);
    await this.otpRepo.createOtp(dto, userAgent, ip, otp, user);

    // 6. Send OTP by SMS
    const smsResult = await this.kavenegarService.sendOtpBySms(
      dto.phone_no,
      otp,
    );
    if (!smsResult) {
      return { status: 'error', message: 'sms_error' };
    }

    return { status: 'success', message: 'OTP sent successfully.' };
  }

  // async oneClickPhone(dto: OneClickPhoneDto): Promise<any> {
  //   // 3. Check if OTP exists and is valid
  //   const validOtp = await this.otpRepo.getOtp(dto);
  //   if (!validOtp) {
  //     return { status: 'error', message: 'invalid_otp' };
  //   }

  //   // 4. Delete the OTP after use
  //   await this.otpRepo.deleteOtp(dto);

  //   // 5. Find or register the user
  //   let user = await this.userRepo.getUserByPhone(dto);

  //   let eventAction = 'login';
  //   if (!user) {
  //     // Register new user
  //     eventAction = 'register/login';
  //     const username = this.commonService.generateRandomUserName();
  //     const { passwordHash, passwordSalt } =
  //       await this.commonService.generateRandomPassword();

  //     user = await this.userRepo.createUser(
  //       dto,
  //       username,
  //       passwordHash,
  //       passwordSalt,
  //     );

  //     if (!user) {
  //       return { status: 'error', message: 'db_error_insert' };
  //     }

  //     await this.profileRepo.createProfile(user);

  //     // Optionally: sync to Discourse, etc.
  //     // await this.discourseService.syncSsoRecord(user);
  //   } else {
  //     // Update phone verified if not set
  //     if (!user.phoneVerifiedAt) {
  //       await this.userRepo.updateUser(user.id, {
  //         phoneVerifiedAt: new Date(),
  //       });
  //     }
  //   }

  //   // 6. Publish event (not implemented here)
  //   // ...

  //   // 7. Issue tokens
  //   const accessToken = await this.jwtService.issueAccessToken(user);
  //   const refreshToken = await this.jwtService.issueRefreshToken(user);

  //   return {
  //     status: 'success',
  //     data: {
  //       user_id: String(user.id),
  //       access_token: accessToken,
  //       token_type: 'bearer',
  //       refresh_token: refreshToken,
  //       action: eventAction,
  //     },
  //   };
  // }

  // async sendOptEmail(
  //   req: FastifyRequest,
  //   dto: SendOptEmailDto,
  // ): Promise<{ status: string; message: string }> {
  //   // 1. Find user by email
  //   const user = await this.userRepo.getUserByEmail(dto.email);

  //   // 2. Check for recent OTP (limit - within 4 minutes)
  //   const recentOtp = await this.otpRepo.getRecentEmailOtp(dto);
  //   if (recentOtp) {
  //     return { status: 'error', message: 'otp_limit' };
  //   }

  //   // 3. Delete expired OTPs (older than 1 day)
  //   const now = new Date();
  //   const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  //   await this.otpRepo.nativeDelete({ expiresAt: { $lte: yesterday } });

  //   // 4. Generate OTP
  //   const otp = Math.floor(10000 + Math.random() * 90000).toString();

  //   // 5. Insert OTP
  //   const userAgent = CommonService.getRequesterUserAgent(req);
  //   const ip = CommonService.getRequesterIpAddress(req);
  //   const otpEntity = await this.otpRepo.createEmailOtp(
  //     dto,
  //     userAgent,
  //     ip,
  //     now,
  //     otp,
  //     user,
  //   );

  //   await this.em.persistAndFlush(otpEntity);

  //   // 6. Send OTP by email
  //   const emailResult = await this.nodemailerService.sendOtpByEmail(
  //     dto.email,
  //     otp,
  //   );
  //   if (!emailResult) {
  //     return { status: 'error', message: 'mail_error' };
  //   }

  //   return { status: 'success', message: 'OTP sent successfully.' };
  // }

  // async oneClickEmail(dto: OneClickEmailDto): Promise<any> {
  //   // 1. Check if OTP exists and is valid
  //   const validOtp = await this.otpRepo.getEmailOtp(dto);
  //   if (!validOtp) {
  //     return { status: 'error', message: 'invalid_otp' };
  //   }

  //   // 2. Delete the OTP after use
  //   await this.otpRepo.deleteEmailOtp(dto);

  //   // 3. Find or register the user
  //   let user = await this.userRepo.getUserByEmail(dto.email);

  //   let eventAction = 'login';
  //   if (!user) {
  //     // Register new user
  //     eventAction = 'register/login';
  //     const username = this.commonService.generateRandomUserName();
  //     const { passwordHash, passwordSalt } =
  //       await this.commonService.generateRandomPassword();

  //     user = await this.userRepo.createEmailUser(
  //       dto.email,
  //       username,
  //       passwordHash,
  //       passwordSalt,
  //     );

  //     if (!user) {
  //       return { status: 'error', message: 'db_error_insert' };
  //     }

  //     const profile = await this.profileRepo.createProfile(user);
  //     await this.em.persistAndFlush(user);
  //     await this.em.persistAndFlush(profile);

  //     // Sync to Discourse
  //     await this.discourseService.syncSsoRecord(user);
  //   } else {
  //     // Update email verified if not set
  //     if (!user.emailVerifiedAt) {
  //       user.emailVerifiedAt = new Date();
  //       await this.em.persistAndFlush(user);
  //     }
  //   }

  //   // 4. Issue tokens
  //   const accessToken = this.jwtService.issueAccessToken(user);
  //   const refreshToken = this.jwtService.issueRefreshToken(user);

  //   return {
  //     status: 'success',
  //     data: {
  //       user_id: String(user.id),
  //       access_token: accessToken,
  //       token_type: 'bearer',
  //       refresh_token: refreshToken,
  //       action: eventAction,
  //     },
  //   };
  // }
}
